/**
 * Account / contact / territory relationship intelligence (HSP-13 Slice A).
 *
 * Pure assembly + search/filter/duplicate/archive helpers over workflow account
 * JSON entities. Extra intelligence fields live on the account document
 * (sales_workflow_entities data JSON) — no parallel table, no SQL migration.
 *
 * Product notes only: reject common PHI-looking patterns; never store patient IDs.
 */

export type PriorityLevel = "high" | "medium" | "low" | "unset";
export type ReferralPotential = "high" | "medium" | "low" | "unknown";

/** Material intelligence fields stored on account JSON (optional keys). */
export type AccountIntelligenceFields = {
  branch?: string | null;
  relationshipStage?: string | null;
  priority?: Exclude<PriorityLevel, "unset"> | null;
  referralPotential?: Exclude<ReferralPotential, "unknown"> | null;
  notes?: string | null;
  archivedAt?: string | null;
};

export type AccountIntelligenceView = {
  accountId: string;
  name: string;
  accountType: string | null;
  territoryId: string | null;
  branch: string | null;
  address: string | null;
  relationshipStage: string | null;
  priority: PriorityLevel;
  referralPotential: ReferralPotential;
  lastInteraction: {
    occurredAt: string;
    type: string;
    summary: string;
  } | null;
  nextAction: {
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
  } | null;
  commitments: string[];
  notes: string | null;
  primaryContact: {
    id: string;
    name: string;
    title: string | null;
  } | null;
  contactCount: number;
  ownerUserId: string;
  externalId: string | null;
  archivedAt: string | null;
  version: number;
  updatedAt: string;
  organizationContext: {
    organizationId: string;
    territoryId: string | null;
    branch: string | null;
  };
};

export type AssembleAccountIntelligenceInput = {
  account: {
    id: string;
    organizationId: string;
    name: string;
    accountType?: string | null;
    address?: string | null;
    territoryId?: string | null;
    ownerUserId: string;
    externalId?: string | null;
    version: number;
    updatedAt: string;
    deletedAt?: string | null;
  } & AccountIntelligenceFields;
  contacts: Array<{
    id: string;
    accountId: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    isPrimary: boolean;
  }>;
  activities: Array<{
    id: string;
    accountId: string;
    type: string;
    summary: string;
    occurredAt: string;
  }>;
  nextActions: Array<{
    id: string;
    callId: string;
    title: string;
    status: string;
    dueAt?: string | null;
  }>;
  /** Call ids belonging to this account (for next-action linkage). */
  accountCallIds: string[];
  outcomes: Array<{
    callId: string;
    commitments?: string[];
    updatedAt: string;
  }>;
  /** Inferred stage from active cycle purpose when field unset. */
  activeCyclePurpose?: string | null;
};

export type AccountSearchFilters = {
  q?: string;
  territoryId?: string;
  branch?: string;
  accountType?: string;
  priority?: PriorityLevel | "any";
  relationshipStage?: string;
  includeArchived?: boolean;
  ownerUserId?: string;
};

export type DuplicatePair = {
  accountIdA: string;
  accountIdB: string;
  nameA: string;
  nameB: string;
  score: number;
  reasons: string[];
};

/** Control chars + common patient-identifier shapes (product-safe notes). */
const PHI_NOTE_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
  /\bMRN\s*[:#]?\s*\d{4,}\b/i,
  /\bpatient\s+(?:name|id|dob|ssn)\b/i,
  /\bDOB\s*[:#]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i,
];

export function sanitizeSafeNotes(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) {
    return trimmed.slice(0, 2000);
  }
  for (const re of PHI_NOTE_PATTERNS) {
    if (re.test(trimmed)) {
      throw Object.assign(new Error("Notes appear to contain patient-identifying information"), {
        code: "UNSAFE_NOTES",
        status: 400,
      });
    }
  }
  return trimmed;
}

export function sanitizeIntelligencePatch(
  raw: AccountIntelligenceFields & { name?: string; accountType?: string; address?: string; territoryId?: string },
): AccountIntelligenceFields & {
  name?: string;
  accountType?: string | null;
  address?: string | null;
  territoryId?: string | null;
} {
  const out: AccountIntelligenceFields & {
    name?: string;
    accountType?: string | null;
    address?: string | null;
    territoryId?: string | null;
  } = {};

  if (typeof raw.name === "string" && raw.name.trim()) {
    out.name = raw.name.trim().slice(0, 200);
  }
  if (raw.accountType !== undefined) {
    out.accountType =
      typeof raw.accountType === "string" && raw.accountType.trim()
        ? raw.accountType.trim().slice(0, 80)
        : null;
  }
  if (raw.address !== undefined) {
    out.address =
      typeof raw.address === "string" && raw.address.trim()
        ? raw.address.trim().slice(0, 500)
        : null;
  }
  if (raw.territoryId !== undefined) {
    out.territoryId =
      typeof raw.territoryId === "string" && raw.territoryId.trim()
        ? raw.territoryId.trim().slice(0, 120)
        : null;
  }
  if (raw.branch !== undefined) {
    out.branch =
      typeof raw.branch === "string" && raw.branch.trim()
        ? raw.branch.trim().slice(0, 120)
        : null;
  }
  if (raw.relationshipStage !== undefined) {
    out.relationshipStage =
      typeof raw.relationshipStage === "string" && raw.relationshipStage.trim()
        ? raw.relationshipStage.trim().slice(0, 120)
        : null;
  }
  if (raw.priority === "high" || raw.priority === "medium" || raw.priority === "low") {
    out.priority = raw.priority;
  } else if (raw.priority === null) {
    out.priority = null;
  }
  if (
    raw.referralPotential === "high" ||
    raw.referralPotential === "medium" ||
    raw.referralPotential === "low"
  ) {
    out.referralPotential = raw.referralPotential;
  } else if (raw.referralPotential === null) {
    out.referralPotential = null;
  }
  if (raw.notes !== undefined) {
    out.notes = sanitizeSafeNotes(raw.notes);
  }
  if (raw.archivedAt !== undefined) {
    out.archivedAt =
      typeof raw.archivedAt === "string" && raw.archivedAt.trim()
        ? raw.archivedAt
        : null;
  }
  return out;
}

export function normalizeAccountName(name: string): string {
  return name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function intelligenceFieldsFromAccount(
  account: AssembleAccountIntelligenceInput["account"],
): AccountIntelligenceFields {
  return {
    branch: account.branch ?? null,
    relationshipStage: account.relationshipStage ?? null,
    priority: account.priority ?? null,
    referralPotential: account.referralPotential ?? null,
    notes: account.notes ?? null,
    archivedAt: account.archivedAt ?? account.deletedAt ?? null,
  };
}

/**
 * Assemble one account intelligence card from workflow entities.
 */
export function assembleAccountIntelligence(
  input: AssembleAccountIntelligenceInput,
): AccountIntelligenceView {
  const fields = intelligenceFieldsFromAccount(input.account);
  const accountContacts = input.contacts.filter(
    (c) => c.accountId === input.account.id,
  );
  const primary =
    accountContacts.find((c) => c.isPrimary) ?? accountContacts[0] ?? null;

  const nonMeta = input.activities
    .filter(
      (a) =>
        a.accountId === input.account.id &&
        a.type !== "account_intelligence_updated" &&
        a.type !== "context_correction",
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const last = nonMeta[0];

  const callIds = new Set(input.accountCallIds);
  const openActions = input.nextActions
    .filter(
      (a) =>
        callIds.has(a.callId) &&
        !["completed", "dismissed"].includes(a.status),
    )
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
  const next = openActions[0] ?? null;

  const latestOutcome = input.outcomes
    .filter((o) => callIds.has(o.callId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const commitments = (latestOutcome?.commitments ?? []).map((c) =>
    String(c).slice(0, 300),
  );

  const relationshipStage =
    fields.relationshipStage ||
    (input.activeCyclePurpose
      ? `active: ${input.activeCyclePurpose}`.slice(0, 120)
      : null);

  const priority: PriorityLevel =
    fields.priority ??
    (next?.dueAt && Date.parse(next.dueAt) - Date.now() < 48 * 3_600_000
      ? "high"
      : next
        ? "medium"
        : "unset");

  const referralPotential: ReferralPotential =
    fields.referralPotential ?? "unknown";

  return {
    accountId: input.account.id,
    name: input.account.name,
    accountType: input.account.accountType ?? null,
    territoryId: input.account.territoryId ?? null,
    branch: fields.branch ?? null,
    address: input.account.address ?? null,
    relationshipStage,
    priority,
    referralPotential,
    lastInteraction: last
      ? {
          occurredAt: last.occurredAt,
          type: last.type,
          summary: last.summary.slice(0, 500),
        }
      : null,
    nextAction: next
      ? {
          id: next.id,
          title: next.title,
          status: next.status,
          dueAt: next.dueAt ?? null,
        }
      : null,
    commitments,
    notes: fields.notes ?? null,
    primaryContact: primary
      ? {
          id: primary.id,
          name: `${primary.firstName} ${primary.lastName}`.trim(),
          title: primary.title ?? null,
        }
      : null,
    contactCount: accountContacts.length,
    ownerUserId: input.account.ownerUserId,
    externalId: input.account.externalId ?? null,
    archivedAt: fields.archivedAt ?? null,
    version: input.account.version,
    updatedAt: input.account.updatedAt,
    organizationContext: {
      organizationId: input.account.organizationId,
      territoryId: input.account.territoryId ?? null,
      branch: fields.branch ?? null,
    },
  };
}

/**
 * Filter / search intelligence views (in-memory; org already scoped by storage).
 */
export function filterAccountIntelligence(
  rows: AccountIntelligenceView[],
  filters: AccountSearchFilters,
): AccountIntelligenceView[] {
  const q = filters.q?.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (!filters.includeArchived && row.archivedAt) return false;
    if (filters.territoryId && row.territoryId !== filters.territoryId) {
      return false;
    }
    if (filters.branch && (row.branch ?? "") !== filters.branch) return false;
    if (filters.accountType && (row.accountType ?? "") !== filters.accountType) {
      return false;
    }
    if (
      filters.priority &&
      filters.priority !== "any" &&
      row.priority !== filters.priority
    ) {
      return false;
    }
    if (
      filters.relationshipStage &&
      !(row.relationshipStage ?? "")
        .toLocaleLowerCase()
        .includes(filters.relationshipStage.toLocaleLowerCase())
    ) {
      return false;
    }
    if (filters.ownerUserId && row.ownerUserId !== filters.ownerUserId) {
      return false;
    }
    if (q) {
      const hay = [
        row.name,
        row.accountType,
        row.address,
        row.branch,
        row.territoryId,
        row.primaryContact?.name,
        row.notes,
        row.relationshipStage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Duplicate candidates for territory hygiene (same org list only).
 */
export function findDuplicateCandidates(
  accounts: Array<{
    id: string;
    name: string;
    address?: string | null;
    externalId?: string | null;
    archivedAt?: string | null;
  }>,
  minScore = 0.85,
): DuplicatePair[] {
  const active = accounts.filter((a) => !a.archivedAt);
  const pairs: DuplicatePair[] = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const reasons: string[] = [];
      let score = 0;

      const extA = a.externalId?.trim().toLocaleLowerCase();
      const extB = b.externalId?.trim().toLocaleLowerCase();
      if (extA && extB && extA === extB) {
        score = Math.max(score, 1);
        reasons.push("externalId");
      }

      const nameA = normalizeAccountName(a.name);
      const nameB = normalizeAccountName(b.name);
      if (nameA && nameB && nameA === nameB) {
        score = Math.max(score, 0.9);
        reasons.push("exact_name");
      } else if (nameA && nameB && (nameA.includes(nameB) || nameB.includes(nameA))) {
        score = Math.max(score, 0.75);
        reasons.push("partial_name");
      }

      const addrA = (a.address ?? "").trim().toLocaleLowerCase();
      const addrB = (b.address ?? "").trim().toLocaleLowerCase();
      if (addrA && addrB && addrA === addrB && nameA === nameB) {
        score = Math.max(score, 0.98);
        reasons.push("name_and_address");
      } else if (addrA && addrB && addrA === addrB) {
        score = Math.max(score, 0.7);
        reasons.push("exact_address");
      }

      if (score >= minScore && reasons.length > 0) {
        pairs.push({
          accountIdA: a.id,
          accountIdB: b.id,
          nameA: a.name,
          nameB: b.name,
          score,
          reasons,
        });
      }
    }
  }

  return pairs.sort((x, y) => y.score - x.score);
}

/**
 * Resolve merge: keep winner fields, fill blanks from loser (intelligence only).
 * Contact reassignment / soft-delete of loser is handled by the load service.
 */
export function mergeIntelligenceFields(
  keep: AccountIntelligenceFields & {
    name: string;
    accountType?: string | null;
    address?: string | null;
    territoryId?: string | null;
  },
  absorb: AccountIntelligenceFields & {
    name?: string;
    accountType?: string | null;
    address?: string | null;
    territoryId?: string | null;
  },
): AccountIntelligenceFields & {
  name: string;
  accountType?: string | null;
  address?: string | null;
  territoryId?: string | null;
} {
  return {
    name: keep.name || absorb.name || "",
    accountType: keep.accountType || absorb.accountType || null,
    address: keep.address || absorb.address || null,
    territoryId: keep.territoryId || absorb.territoryId || null,
    branch: keep.branch || absorb.branch || null,
    relationshipStage: keep.relationshipStage || absorb.relationshipStage || null,
    priority: keep.priority || absorb.priority || null,
    referralPotential: keep.referralPotential || absorb.referralPotential || null,
    notes: keep.notes || absorb.notes || null,
    archivedAt: null,
  };
}

/** Compact projection for Command Center / tools / analytics consumers. */
export function projectAccountForConsumer(
  view: AccountIntelligenceView,
  consumer:
    | "command-center"
    | "planning"
    | "email"
    | "playbook"
    | "roleplay"
    | "analytics"
    | "coaching"
    | "generic" = "generic",
): Record<string, unknown> {
  const full: Record<string, unknown> = {
    accountId: view.accountId,
    name: view.name,
    accountType: view.accountType,
    territoryId: view.territoryId,
    branch: view.branch,
    relationshipStage: view.relationshipStage,
    priority: view.priority,
    referralPotential: view.referralPotential,
    lastInteraction: view.lastInteraction,
    nextAction: view.nextAction,
    commitments: view.commitments,
    primaryContact: view.primaryContact,
    notes: view.notes,
    organizationContext: view.organizationContext,
  };
  const allow: Record<string, readonly string[]> = {
    "command-center": [
      "accountId",
      "name",
      "accountType",
      "territoryId",
      "branch",
      "relationshipStage",
      "priority",
      "referralPotential",
      "lastInteraction",
      "nextAction",
      "commitments",
      "primaryContact",
      "notes",
      "organizationContext",
    ],
    planning: [
      "accountId",
      "name",
      "accountType",
      "primaryContact",
      "relationshipStage",
      "lastInteraction",
      "nextAction",
      "notes",
    ],
    email: [
      "accountId",
      "name",
      "primaryContact",
      "lastInteraction",
      "nextAction",
      "commitments",
    ],
    playbook: [
      "accountId",
      "name",
      "accountType",
      "relationshipStage",
      "referralPotential",
      "priority",
    ],
    roleplay: [
      "accountId",
      "name",
      "accountType",
      "primaryContact",
      "relationshipStage",
      "notes",
    ],
    analytics: [
      "accountId",
      "accountType",
      "territoryId",
      "branch",
      "priority",
      "referralPotential",
      "relationshipStage",
    ],
    coaching: [
      "accountId",
      "name",
      "commitments",
      "lastInteraction",
      "nextAction",
      "relationshipStage",
    ],
    generic: [
      "accountId",
      "name",
      "accountType",
      "primaryContact",
      "priority",
      "nextAction",
    ],
  };
  const keys = allow[consumer] ?? allow.generic;
  const out: Record<string, unknown> = { consumer };
  for (const k of keys) {
    if (k in full) out[k] = full[k];
  }
  return out;
}
