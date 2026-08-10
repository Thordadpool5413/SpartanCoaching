/**
 * Load workflow entities and assemble Command Center context (HSP-12).
 * Uses PostgresWorkflowStorage only — no parallel account store.
 */
import { randomUUID } from "node:crypto";
import type {
  Actor,
  WorkflowStorage,
} from "@workspace/hospice-sales-runtime/sales-workflow";
import {
  assembleCommandCenterContext,
  isContextCorrectionActivity,
  mergeCorrections,
  parseCorrectionsFromActivitySummary,
  projectContextForTool,
  sanitizeCorrections,
  type CommandCenterContextView,
  type UserContextCorrections,
} from "./commandCenterContext";

export type LoadedCommandCenterContext = {
  context: CommandCenterContextView;
  toolProjection: Record<string, unknown> | null;
};

function latestCorrections(
  activities: Array<{ type: string; summary: string; occurredAt: string }>,
): UserContextCorrections | null {
  const corrections = activities
    .filter((a) => isContextCorrectionActivity(a.type))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  if (corrections.length === 0) return null;
  return parseCorrectionsFromActivitySummary(corrections[0].summary);
}

export async function loadCommandCenterContext(
  storage: WorkflowStorage,
  actor: Actor,
  accountId: string,
  toolId?: string | null,
): Promise<LoadedCommandCenterContext> {
  // Higher limit so context_correction activities are not truncated away.
  const snapshot = await storage.snapshot(accountId, actor, 50);

  const related = await storage.transact(actor.organizationId, async (tx) => {
    const cycles = await tx.list(
      "cycle",
      (item) => item.accountId === accountId,
    );
    const calls = await tx.list(
      "call",
      (item) => item.accountId === accountId,
    );
    const callIds = new Set(calls.map((c) => c.id));
    const plans = await tx.list("plan", (item) => callIds.has(item.callId));
    const outcomes = await tx.list(
      "outcome",
      (item) => callIds.has(item.callId),
    );
    const nextActions = await tx.list(
      "nextAction",
      (item) => callIds.has(item.callId),
    );
    return { cycles, calls, plans, outcomes, nextActions };
  });

  const corrections = latestCorrections(snapshot.recentActivities);

  const context = assembleCommandCenterContext({
    account: {
      id: snapshot.account.id,
      name: snapshot.account.name,
      accountType: snapshot.account.accountType ?? null,
    },
    contacts: snapshot.contacts.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      title: c.title ?? null,
      isPrimary: Boolean(c.isPrimary),
    })),
    recentActivities: snapshot.recentActivities.map((a) => ({
      id: a.id,
      type: a.type,
      summary: a.summary,
      occurredAt: a.occurredAt,
    })),
    cycles: related.cycles.map((c) => ({
      id: c.id,
      purpose: c.purpose,
      diseaseFocus: c.diseaseFocus ?? null,
      status: c.status,
      updatedAt: c.updatedAt,
    })),
    calls: related.calls.map((c) => ({
      id: c.id,
      accountId: c.accountId,
      purpose: c.purpose,
      status: c.status,
      schedule: c.schedule
        ? { startsAt: c.schedule.startsAt ?? null }
        : null,
      updatedAt: c.updatedAt,
    })),
    plans: related.plans.map((p) => ({
      id: p.id,
      callId: p.callId,
      status: p.status,
      content: p.content,
    })),
    outcomes: related.outcomes.map((o) => ({
      callId: o.callId,
      commitments: o.commitments ?? [],
      summary: o.summary ?? null,
      notes: o.notes ?? null,
      updatedAt: o.updatedAt,
    })),
    nextActions: related.nextActions.map((a) => ({
      id: a.id,
      callId: a.callId,
      title: a.title,
      type: a.type,
      status: a.status,
      dueAt: a.dueAt ?? null,
    })),
    corrections,
  });

  const toolProjection =
    toolId && toolId.trim()
      ? projectContextForTool(context, toolId.trim())
      : null;

  return { context, toolProjection };
}

/**
 * Persist user context corrections as a workflow activity (type context_correction).
 * Merges with the previous correction payload. Ownership checked via snapshot.
 */
export async function saveContextCorrections(
  storage: WorkflowStorage,
  actor: Actor,
  accountId: string,
  patch: UserContextCorrections,
): Promise<LoadedCommandCenterContext> {
  // Ownership / tenant check (throws WorkflowError NOT_FOUND / FORBIDDEN).
  const snapshot = await storage.snapshot(accountId, actor, 50);
  const existing = latestCorrections(snapshot.recentActivities);
  const merged = mergeCorrections(existing, sanitizeCorrections(patch));
  const now = new Date().toISOString();
  merged.updatedAt = now;

  await storage.transact(actor.organizationId, async (tx) => {
    await tx.insert("activity", {
      id: randomUUID(),
      organizationId: actor.organizationId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      accountId,
      type: "context_correction",
      summary: JSON.stringify(merged),
      occurredAt: now,
      actorUserId: actor.userId,
    });
    await tx.appendAudit({
      id: randomUUID(),
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "context.corrected",
      aggregateId: accountId,
      occurredAt: now,
      metadata: {
        fields: Object.keys(merged).filter((k) => k !== "updatedAt"),
      },
    });
  });

  return loadCommandCenterContext(storage, actor, accountId);
}
