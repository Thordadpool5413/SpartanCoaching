/**
 * Load / mutate account intelligence via PostgresWorkflowStorage (HSP-13 Slice A).
 * Reuses sales_workflow_entities — no parallel CRM table.
 */
import { randomUUID } from "node:crypto";
import type {
  Actor,
  WorkflowStorage,
} from "@workspace/hospice-sales-runtime/sales-workflow";
import { WorkflowError } from "@workspace/hospice-sales-runtime/sales-workflow";
import {
  assembleAccountIntelligence,
  filterAccountIntelligence,
  findDuplicateCandidates,
  mergeIntelligenceFields,
  projectAccountForConsumer,
  sanitizeIntelligencePatch,
  type AccountIntelligenceFields,
  type AccountIntelligenceView,
  type AccountSearchFilters,
  type DuplicatePair,
} from "./accountIntelligence";

/** Account JSON may carry intelligence keys beyond core Account type. */
type AccountRow = {
  id: string;
  organizationId: string;
  name: string;
  accountType?: string;
  address?: string;
  territoryId?: string;
  ownerUserId: string;
  externalId?: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  deletedAt?: string;
  branch?: string | null;
  relationshipStage?: string | null;
  priority?: "high" | "medium" | "low" | null;
  referralPotential?: "high" | "medium" | "low" | null;
  notes?: string | null;
  archivedAt?: string | null;
};

function assertAccountAccess(actor: Actor, account: AccountRow): void {
  if (actor.role === "rep" && account.ownerUserId !== actor.userId) {
    throw new WorkflowError("FORBIDDEN", 403, "You do not own this account");
  }
}

function parseFilters(query: Record<string, unknown>): AccountSearchFilters {
  const str = (k: string) =>
    typeof query[k] === "string" ? String(query[k]).trim() : undefined;
  const priority = str("priority");
  return {
    q: str("q"),
    territoryId: str("territoryId"),
    branch: str("branch"),
    accountType: str("accountType"),
    relationshipStage: str("relationshipStage"),
    ownerUserId: str("ownerUserId"),
    includeArchived: query.includeArchived === "true" || query.includeArchived === true,
    priority:
      priority === "high" ||
      priority === "medium" ||
      priority === "low" ||
      priority === "unset" ||
      priority === "any"
        ? priority
        : undefined,
  };
}

export async function listAccountIntelligence(
  storage: WorkflowStorage,
  actor: Actor,
  rawQuery: Record<string, unknown> = {},
  consumer?: string | null,
): Promise<{
  accounts: AccountIntelligenceView[] | Record<string, unknown>[];
  total: number;
  filters: AccountSearchFilters;
}> {
  const filters = parseFilters(rawQuery);

  const assembled = await storage.transact(actor.organizationId, async (tx) => {
    const accounts = (await tx.list("account", (item) => {
      if (actor.role === "rep" && item.ownerUserId !== actor.userId) return false;
      return true;
    })) as AccountRow[];

    const contacts = await tx.list("contact");
    const activities = await tx.list("activity");
    const calls = await tx.list("call");
    const nextActions = await tx.list("nextAction");
    const outcomes = await tx.list("outcome");
    const cycles = await tx.list("cycle");

    return accounts.map((account) => {
      const accountCalls = calls.filter((c) => c.accountId === account.id);
      const callIds = accountCalls.map((c) => c.id);
      const activeCycle = cycles
        .filter((c) => c.accountId === account.id && c.status === "active")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

      return assembleAccountIntelligence({
        account: {
          ...account,
          archivedAt: account.archivedAt ?? account.deletedAt ?? null,
        },
        contacts: contacts.map((c) => ({
          id: c.id,
          accountId: c.accountId,
          firstName: c.firstName,
          lastName: c.lastName,
          title: c.title ?? null,
          isPrimary: Boolean(c.isPrimary),
        })),
        activities: activities.map((a) => ({
          id: a.id,
          accountId: a.accountId,
          type: a.type,
          summary: a.summary,
          occurredAt: a.occurredAt,
        })),
        nextActions: nextActions.map((a) => ({
          id: a.id,
          callId: a.callId,
          title: a.title,
          status: a.status,
          dueAt: a.dueAt ?? null,
        })),
        accountCallIds: callIds,
        outcomes: outcomes.map((o) => ({
          callId: o.callId,
          commitments: o.commitments ?? [],
          updatedAt: o.updatedAt,
        })),
        activeCyclePurpose: activeCycle?.purpose ?? null,
      });
    });
  });

  const filtered = filterAccountIntelligence(assembled, filters);
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  const consumerId =
    typeof consumer === "string" && consumer.trim() ? consumer.trim() : null;
  const accounts = consumerId
    ? filtered.map((row) =>
        projectAccountForConsumer(
          row,
          consumerId as Parameters<typeof projectAccountForConsumer>[1],
        ),
      )
    : filtered;

  return { accounts, total: filtered.length, filters };
}

export async function updateAccountIntelligence(
  storage: WorkflowStorage,
  actor: Actor,
  accountId: string,
  expectedVersion: number,
  patch: AccountIntelligenceFields & {
    name?: string;
    accountType?: string;
    address?: string;
    territoryId?: string;
  },
): Promise<AccountIntelligenceView> {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new WorkflowError(
      "EXPECTED_VERSION_REQUIRED",
      400,
      "A positive expectedVersion is required",
    );
  }

  let sanitized;
  try {
    sanitized = sanitizeIntelligencePatch(patch);
  } catch (error) {
    const err = error as Error & { code?: string; status?: number };
    throw new WorkflowError(
      (err.code as "INVALID_INPUT") || "INVALID_INPUT",
      err.status === 400 ? 400 : 400,
      err.message || "Invalid intelligence patch",
    );
  }

  if (Object.keys(sanitized).length === 0) {
    throw new WorkflowError(
      "INVALID_INPUT",
      400,
      "Provide at least one intelligence field to update",
    );
  }

  await storage.transact(actor.organizationId, async (tx) => {
    const account = (await tx.get("account", accountId)) as AccountRow | undefined;
    if (!account) throw new WorkflowError("NOT_FOUND", 404, "Account not found");
    assertAccountAccess(actor, account);

    const now = new Date().toISOString();
    // Archive uses account.archivedAt only (JSON). Storage list/get still
    // returns the row; intelligence filters archivedAt. Merge uses deletedAt.
    const next = {
      ...account,
      ...sanitized,
      accountType:
        sanitized.accountType === null
          ? undefined
          : (sanitized.accountType ?? account.accountType),
      address:
        sanitized.address === null
          ? undefined
          : (sanitized.address ?? account.address),
      territoryId:
        sanitized.territoryId === null
          ? undefined
          : (sanitized.territoryId ?? account.territoryId),
      updatedAt: now,
    } as AccountRow;

    await tx.update("account", next as never, expectedVersion);
    await tx.insert("activity", {
      id: randomUUID(),
      organizationId: actor.organizationId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      accountId,
      type: "account_intelligence_updated",
      summary: JSON.stringify({
        fields: Object.keys(sanitized),
        at: now,
      }),
      occurredAt: now,
      actorUserId: actor.userId,
    });
    await tx.appendAudit({
      id: randomUUID(),
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "account.intelligence.updated",
      aggregateId: accountId,
      occurredAt: now,
      metadata: { fields: Object.keys(sanitized) },
    });
  });

  return getAccountIntelligence(storage, actor, accountId);
}

export async function getAccountIntelligence(
  storage: WorkflowStorage,
  actor: Actor,
  accountId: string,
): Promise<AccountIntelligenceView> {
  const result = await storage.transact(actor.organizationId, async (tx) => {
    const account = (await tx.get("account", accountId)) as AccountRow | undefined;
    if (!account) throw new WorkflowError("NOT_FOUND", 404, "Account not found");
    assertAccountAccess(actor, account);

    const contacts = await tx.list(
      "contact",
      (c) => c.accountId === accountId,
    );
    const activities = await tx.list(
      "activity",
      (a) => a.accountId === accountId,
    );
    const calls = await tx.list("call", (c) => c.accountId === accountId);
    const callIds = new Set(calls.map((c) => c.id));
    const nextActions = await tx.list("nextAction", (a) => callIds.has(a.callId));
    const outcomes = await tx.list("outcome", (o) => callIds.has(o.callId));
    const cycles = await tx.list("cycle", (c) => c.accountId === accountId);
    const activeCycle = cycles
      .filter((c) => c.status === "active")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

    return assembleAccountIntelligence({
      account: {
        ...account,
        archivedAt: account.archivedAt ?? account.deletedAt ?? null,
      },
      contacts: contacts.map((c) => ({
        id: c.id,
        accountId: c.accountId,
        firstName: c.firstName,
        lastName: c.lastName,
        title: c.title ?? null,
        isPrimary: Boolean(c.isPrimary),
      })),
      activities: activities.map((a) => ({
        id: a.id,
        accountId: a.accountId,
        type: a.type,
        summary: a.summary,
        occurredAt: a.occurredAt,
      })),
      nextActions: nextActions.map((a) => ({
        id: a.id,
        callId: a.callId,
        title: a.title,
        status: a.status,
        dueAt: a.dueAt ?? null,
      })),
      accountCallIds: [...callIds],
      outcomes: outcomes.map((o) => ({
        callId: o.callId,
        commitments: o.commitments ?? [],
        updatedAt: o.updatedAt,
      })),
      activeCyclePurpose: activeCycle?.purpose ?? null,
    });
  });
  return result;
}

export async function detectAccountDuplicates(
  storage: WorkflowStorage,
  actor: Actor,
): Promise<{ pairs: DuplicatePair[] }> {
  const pairs = await storage.transact(actor.organizationId, async (tx) => {
    const accounts = (await tx.list("account", (item) => {
      if (actor.role === "rep" && item.ownerUserId !== actor.userId) return false;
      return true;
    })) as AccountRow[];

    return findDuplicateCandidates(
      accounts.map((a) => ({
        id: a.id,
        name: a.name,
        address: a.address ?? null,
        externalId: a.externalId ?? null,
        archivedAt: a.archivedAt ?? a.deletedAt ?? null,
      })),
    );
  });
  return { pairs };
}

/**
 * Merge loser into keeper: fill blank intelligence, reassign contacts, soft-delete loser.
 * Manager-only recommended at route layer for cross-owner merges; rep may merge own.
 */
export async function mergeAccounts(
  storage: WorkflowStorage,
  actor: Actor,
  keepAccountId: string,
  absorbAccountId: string,
  keepExpectedVersion: number,
): Promise<{ kept: AccountIntelligenceView; absorbedId: string }> {
  if (keepAccountId === absorbAccountId) {
    throw new WorkflowError(
      "INVALID_INPUT",
      400,
      "Cannot merge an account into itself",
    );
  }
  if (!Number.isInteger(keepExpectedVersion) || keepExpectedVersion < 1) {
    throw new WorkflowError(
      "EXPECTED_VERSION_REQUIRED",
      400,
      "A positive keepExpectedVersion is required",
    );
  }

  await storage.transact(actor.organizationId, async (tx) => {
    const keep = (await tx.get("account", keepAccountId)) as AccountRow | undefined;
    const absorb = (await tx.get(
      "account",
      absorbAccountId,
    )) as AccountRow | undefined;
    if (!keep || !absorb) {
      throw new WorkflowError("NOT_FOUND", 404, "Account not found");
    }
    assertAccountAccess(actor, keep);
    assertAccountAccess(actor, absorb);

    const now = new Date().toISOString();
    const mergedFields = mergeIntelligenceFields(
      {
        name: keep.name,
        accountType: keep.accountType,
        address: keep.address,
        territoryId: keep.territoryId,
        branch: keep.branch,
        relationshipStage: keep.relationshipStage,
        priority: keep.priority,
        referralPotential: keep.referralPotential,
        notes: keep.notes,
      },
      {
        name: absorb.name,
        accountType: absorb.accountType,
        address: absorb.address,
        territoryId: absorb.territoryId,
        branch: absorb.branch,
        relationshipStage: absorb.relationshipStage,
        priority: absorb.priority,
        referralPotential: absorb.referralPotential,
        notes: absorb.notes,
      },
    );

    const nextKeep = {
      ...keep,
      name: mergedFields.name,
      accountType: mergedFields.accountType ?? undefined,
      address: mergedFields.address ?? undefined,
      territoryId: mergedFields.territoryId ?? undefined,
      branch: mergedFields.branch ?? null,
      relationshipStage: mergedFields.relationshipStage ?? null,
      priority: mergedFields.priority ?? null,
      referralPotential: mergedFields.referralPotential ?? null,
      notes: mergedFields.notes ?? null,
      updatedAt: now,
      archivedAt: null,
      deletedAt: undefined,
    } as AccountRow;
    await tx.update("account", nextKeep as never, keepExpectedVersion);

    const absorbContacts = await tx.list(
      "contact",
      (c) => c.accountId === absorbAccountId,
    );
    for (const contact of absorbContacts) {
      await tx.update(
        "contact",
        {
          ...contact,
          accountId: keepAccountId,
          updatedAt: now,
        } as never,
        contact.version,
      );
    }

    // Re-home cycles/calls that still point at absorb (keeps history under keeper).
    const absorbCycles = await tx.list(
      "cycle",
      (c) => c.accountId === absorbAccountId,
    );
    for (const cycle of absorbCycles) {
      await tx.update(
        "cycle",
        { ...cycle, accountId: keepAccountId, updatedAt: now } as never,
        cycle.version,
      );
    }
    const absorbCalls = await tx.list(
      "call",
      (c) => c.accountId === absorbAccountId,
    );
    for (const call of absorbCalls) {
      await tx.update(
        "call",
        { ...call, accountId: keepAccountId, updatedAt: now } as never,
        call.version,
      );
    }

    await tx.update(
      "account",
      {
        ...absorb,
        deletedAt: now,
        archivedAt: now,
        updatedAt: now,
      } as never,
      absorb.version,
    );

    await tx.insert("activity", {
      id: randomUUID(),
      organizationId: actor.organizationId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      accountId: keepAccountId,
      type: "account_merged",
      summary: JSON.stringify({
        absorbedAccountId: absorbAccountId,
        absorbedName: absorb.name,
      }),
      occurredAt: now,
      actorUserId: actor.userId,
    });
    await tx.appendAudit({
      id: randomUUID(),
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "account.merged",
      aggregateId: keepAccountId,
      occurredAt: now,
      metadata: { absorbedAccountId: absorbAccountId },
    });
  });

  const kept = await getAccountIntelligence(storage, actor, keepAccountId);
  return { kept, absorbedId: absorbAccountId };
}

export { parseFilters };
