/**
 * Sales Command Center — context assembly engine (HSP-12 Slice A).
 *
 * Builds a single reviewable context view from workflow entities so satellite
 * tools receive only allowlisted fields. User corrections merge on top and
 * are persisted as workflow activities (type context_correction).
 *
 * Does not invent parallel account storage — facts stay on sales_workflow_*.
 */

export type PriorityLevel = "high" | "medium" | "low" | "unset";

export type ContextContact = {
  id: string;
  name: string;
  title: string | null;
  isPrimary: boolean;
};

export type ContextLastInteraction = {
  occurredAt: string;
  type: string;
  summary: string;
};

export type ContextUpcomingMeeting = {
  callId: string;
  startsAt: string | null;
  purpose: string;
  status: string;
};

export type ContextNextAction = {
  id: string;
  title: string;
  type: string;
  status: string;
  dueAt: string | null;
};

/** Material fields users can review / correct. */
export type UserContextCorrections = {
  currentObjective?: string;
  knownObjections?: string[];
  relationshipStage?: string;
  priority?: Exclude<PriorityLevel, "unset">;
  notes?: string;
  updatedAt?: string;
};

export type CommandCenterContextView = {
  accountId: string;
  accountName: string;
  accountType: string | null;
  contacts: ContextContact[];
  primaryContact: ContextContact | null;
  relationshipStage: string;
  lastInteraction: ContextLastInteraction | null;
  currentObjective: string | null;
  knownObjections: string[];
  upcomingMeeting: ContextUpcomingMeeting | null;
  nextActions: ContextNextAction[];
  commitments: string[];
  priority: PriorityLevel;
  relevantTools: { id: string; reason: string }[];
  relevantResources: { label: string; hint: string }[];
  /** Fields the user should verify before relying on AI tools. */
  reviewChecklist: string[];
  corrections: UserContextCorrections;
  capturedAt: string;
  sourceIds: string[];
};

export type AssembleContextInput = {
  account: {
    id: string;
    name: string;
    accountType?: string | null;
  };
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    isPrimary: boolean;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    summary: string;
    occurredAt: string;
  }>;
  cycles: Array<{
    id: string;
    purpose: string;
    diseaseFocus?: string | null;
    status: string;
    updatedAt: string;
  }>;
  calls: Array<{
    id: string;
    accountId: string;
    purpose: string;
    status: string;
    schedule?: { startsAt?: string | null } | null;
    updatedAt: string;
  }>;
  plans: Array<{
    id: string;
    callId: string;
    status: string;
    content?: unknown;
  }>;
  outcomes: Array<{
    callId: string;
    commitments?: string[];
    summary?: string | null;
    notes?: string | null;
    updatedAt: string;
  }>;
  nextActions: Array<{
    id: string;
    callId: string;
    title: string;
    type: string;
    status: string;
    dueAt?: string | null;
  }>;
  /** Latest user corrections (from activity or PATCH). */
  corrections?: UserContextCorrections | null;
  nowIso?: string;
};

/** Which context fields a satellite tool may receive. */
export const TOOL_CONTEXT_ALLOWLIST: Record<string, readonly string[]> = {
  "pre-call-planner": [
    "accountName",
    "accountType",
    "primaryContact",
    "currentObjective",
    "upcomingMeeting",
    "lastInteraction",
    "relationshipStage",
  ],
  "objection-coach": [
    "accountName",
    "accountType",
    "primaryContact",
    "knownObjections",
    "currentObjective",
    "relationshipStage",
  ],
  "discovery-coach": [
    "accountName",
    "accountType",
    "primaryContact",
    "currentObjective",
    "relationshipStage",
    "lastInteraction",
  ],
  "email-optimizer": [
    "accountName",
    "primaryContact",
    "currentObjective",
    "lastInteraction",
    "nextActions",
    "commitments",
  ],
  "roleplay-scenario-coach": [
    "accountName",
    "accountType",
    "primaryContact",
    "currentObjective",
    "knownObjections",
  ],
  "call-performance-coach": [
    "accountName",
    "currentObjective",
    "commitments",
    "knownObjections",
  ],
  generic: [
    "accountName",
    "primaryContact",
    "currentObjective",
    "nextActions",
    "priority",
  ],
};

const CORRECTION_ACTIVITY_TYPE = "context_correction";

export function isContextCorrectionActivity(type: string): boolean {
  return type === CORRECTION_ACTIVITY_TYPE;
}

export function parseCorrectionsFromActivitySummary(
  summary: string,
): UserContextCorrections | null {
  try {
    const parsed = JSON.parse(summary) as UserContextCorrections;
    if (!parsed || typeof parsed !== "object") return null;
    return sanitizeCorrections(parsed);
  } catch {
    return null;
  }
}

export function sanitizeCorrections(
  raw: UserContextCorrections,
): UserContextCorrections {
  const out: UserContextCorrections = {};
  if (typeof raw.currentObjective === "string" && raw.currentObjective.trim()) {
    out.currentObjective = raw.currentObjective.trim().slice(0, 500);
  }
  if (Array.isArray(raw.knownObjections)) {
    out.knownObjections = raw.knownObjections
      .filter((o) => typeof o === "string" && o.trim())
      .map((o) => o.trim().slice(0, 300))
      .slice(0, 20);
  }
  if (typeof raw.relationshipStage === "string" && raw.relationshipStage.trim()) {
    out.relationshipStage = raw.relationshipStage.trim().slice(0, 120);
  }
  if (raw.priority === "high" || raw.priority === "medium" || raw.priority === "low") {
    out.priority = raw.priority;
  }
  if (typeof raw.notes === "string" && raw.notes.trim()) {
    out.notes = raw.notes.trim().slice(0, 2000);
  }
  if (typeof raw.updatedAt === "string") out.updatedAt = raw.updatedAt;
  return out;
}

function contactName(c: AssembleContextInput["contacts"][0]): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

function extractObjectionsFromPlan(content: unknown): string[] {
  if (!content || typeof content !== "object") return [];
  const o = content as Record<string, unknown>;
  const candidates = [
    o.objections,
    o.knownObjections,
    o.anticipatedObjections,
    (o.output as Record<string, unknown> | undefined)?.objections,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c
        .filter((x) => typeof x === "string")
        .map((x) => x.slice(0, 300))
        .slice(0, 20);
    }
  }
  return [];
}

function inferPriority(
  nextActions: ContextNextAction[],
  upcoming: ContextUpcomingMeeting | null,
): PriorityLevel {
  if (upcoming?.startsAt) {
    const t = Date.parse(upcoming.startsAt);
    if (!Number.isNaN(t) && t - Date.now() < 24 * 3_600_000) return "high";
  }
  if (nextActions.some((a) => a.status === "accepted" || a.status === "proposed")) {
    return "medium";
  }
  return "unset";
}

function pickRelevantTools(input: {
  hasUpcoming: boolean;
  hasObjections: boolean;
  hasCommitments: boolean;
  hasNextActions: boolean;
}): { id: string; reason: string }[] {
  const tools: { id: string; reason: string }[] = [];
  if (input.hasUpcoming) {
    tools.push({
      id: "pre-call-planner",
      reason: "Upcoming meeting needs a plan",
    });
    tools.push({
      id: "discovery-coach",
      reason: "Prep discovery questions for the visit",
    });
  }
  if (input.hasObjections) {
    tools.push({
      id: "objection-coach",
      reason: "Known objections to rehearse",
    });
  }
  if (input.hasNextActions) {
    tools.push({
      id: "email-optimizer",
      reason: "Follow-up communication on next actions",
    });
  }
  if (input.hasCommitments) {
    tools.push({
      id: "call-performance-coach",
      reason: "Review commitments from last call",
    });
  }
  if (tools.length === 0) {
    tools.push({
      id: "pre-call-planner",
      reason: "Default prep when no active cycle signals",
    });
  }
  return tools;
}

/**
 * Assemble full Command Center context from workflow entities + optional corrections.
 */
export function assembleCommandCenterContext(
  input: AssembleContextInput,
): CommandCenterContextView {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const corrections = sanitizeCorrections(input.corrections ?? {});

  const contacts: ContextContact[] = input.contacts.map((c) => ({
    id: c.id,
    name: contactName(c),
    title: c.title ?? null,
    isPrimary: Boolean(c.isPrimary),
  }));
  const primaryContact =
    contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;

  const activeCycle =
    input.cycles
      .filter((c) => c.status === "active")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
    input.cycles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
    null;

  const accountCalls = input.calls
    .filter((c) => c.accountId === input.account.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const upcomingCall =
    accountCalls.find(
      (c) =>
        c.status === "scheduled" ||
        c.status === "planned" ||
        c.status === "in_progress",
    ) ?? null;

  const upcomingMeeting: ContextUpcomingMeeting | null = upcomingCall
    ? {
        callId: upcomingCall.id,
        startsAt: upcomingCall.schedule?.startsAt ?? null,
        purpose: upcomingCall.purpose,
        status: upcomingCall.status,
      }
    : null;

  const nonCorrectionActivities = input.recentActivities
    .filter((a) => !isContextCorrectionActivity(a.type))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const lastActivity = nonCorrectionActivities[0];
  const lastInteraction: ContextLastInteraction | null = lastActivity
    ? {
        occurredAt: lastActivity.occurredAt,
        type: lastActivity.type,
        summary: lastActivity.summary.slice(0, 500),
      }
    : null;

  const planForUpcoming = upcomingCall
    ? input.plans.find((p) => p.callId === upcomingCall.id)
    : input.plans[0];
  const planObjections = extractObjectionsFromPlan(planForUpcoming?.content);

  const callIds = new Set(accountCalls.map((c) => c.id));
  const nextActions: ContextNextAction[] = input.nextActions
    .filter((a) => callIds.has(a.callId))
    .filter((a) => !["completed", "dismissed"].includes(a.status))
    .map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      status: a.status,
      dueAt: a.dueAt ?? null,
    }));

  const latestOutcome = input.outcomes
    .filter((o) => callIds.has(o.callId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const commitments = (latestOutcome?.commitments ?? []).map((c) =>
    String(c).slice(0, 300),
  );

  let relationshipStage =
    corrections.relationshipStage ||
    (activeCycle
      ? `${activeCycle.status}: ${activeCycle.purpose}`.slice(0, 200)
      : "no_active_cycle");

  let currentObjective =
    corrections.currentObjective ||
    upcomingCall?.purpose ||
    activeCycle?.purpose ||
    null;

  let knownObjections =
    corrections.knownObjections && corrections.knownObjections.length > 0
      ? corrections.knownObjections
      : planObjections;

  const priority: PriorityLevel =
    corrections.priority ??
    inferPriority(nextActions, upcomingMeeting);

  const relevantTools = pickRelevantTools({
    hasUpcoming: Boolean(upcomingMeeting),
    hasObjections: knownObjections.length > 0,
    hasCommitments: commitments.length > 0,
    hasNextActions: nextActions.length > 0,
  });

  const relevantResources = [
    {
      label: "Pre-call plan",
      hint: "Build or refresh plan before the next visit",
    },
    {
      label: "Objection coach",
      hint: knownObjections.length
        ? "Rehearse listed objections"
        : "Capture objections after the call",
    },
  ];

  const reviewChecklist: string[] = [];
  if (!primaryContact) reviewChecklist.push("primaryContact");
  if (!currentObjective) reviewChecklist.push("currentObjective");
  if (!upcomingMeeting) reviewChecklist.push("upcomingMeeting");
  if (knownObjections.length === 0) reviewChecklist.push("knownObjections");
  if (priority === "unset") reviewChecklist.push("priority");

  const sourceIds = [
    input.account.id,
    ...contacts.map((c) => c.id),
    ...nonCorrectionActivities.slice(0, 10).map((a) => a.id),
    ...accountCalls.slice(0, 10).map((c) => c.id),
  ];

  return {
    accountId: input.account.id,
    accountName: input.account.name,
    accountType: input.account.accountType ?? null,
    contacts,
    primaryContact,
    relationshipStage,
    lastInteraction,
    currentObjective,
    knownObjections,
    upcomingMeeting,
    nextActions,
    commitments,
    priority,
    relevantTools,
    relevantResources,
    reviewChecklist,
    corrections,
    capturedAt: nowIso,
    sourceIds,
  };
}

/**
 * Project context for a satellite tool — only allowlisted keys.
 */
export function projectContextForTool(
  context: CommandCenterContextView,
  toolId: string,
): Record<string, unknown> {
  const allow =
    TOOL_CONTEXT_ALLOWLIST[toolId] ?? TOOL_CONTEXT_ALLOWLIST.generic;
  const full: Record<string, unknown> = {
    accountName: context.accountName,
    accountType: context.accountType,
    primaryContact: context.primaryContact,
    contacts: context.contacts,
    relationshipStage: context.relationshipStage,
    lastInteraction: context.lastInteraction,
    currentObjective: context.currentObjective,
    knownObjections: context.knownObjections,
    upcomingMeeting: context.upcomingMeeting,
    nextActions: context.nextActions,
    commitments: context.commitments,
    priority: context.priority,
    corrections: context.corrections,
    capturedAt: context.capturedAt,
  };
  const projected: Record<string, unknown> = {
    toolId,
    accountId: context.accountId,
  };
  for (const key of allow) {
    if (key in full) projected[key] = full[key];
  }
  return projected;
}

/** Merge sequential user correction patches (later wins). */
export function mergeCorrections(
  base: UserContextCorrections | null | undefined,
  patch: UserContextCorrections,
): UserContextCorrections {
  const clean = sanitizeCorrections(patch);
  return {
    ...sanitizeCorrections(base ?? {}),
    ...clean,
    updatedAt: clean.updatedAt ?? new Date().toISOString(),
  };
}
