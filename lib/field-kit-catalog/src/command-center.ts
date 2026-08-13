/**
 * Sales Command Center — shared API contracts vs platform UI subsets.
 *
 * Business facts (accounts, calls, plans, coaching approvals) live on the API.
 * Web and iOS may render different UI depths, but they must not invent alternate
 * write paths for the same fact.
 *
 * See docs/command-center-parity.md
 */

/** Capability support level for a client surface */
export type CommandCenterSupport = "full" | "supported" | "partial" | "none";

export type CommandCenterCapability = {
  id: string;
  /** Human label */
  title: string;
  /** API path(s) under /api/v1/sales-workflow */
  api: string[];
  /** Both clients must honor this for product truth */
  sharedFact: boolean;
  web: CommandCenterSupport;
  mobile: CommandCenterSupport;
  notes?: string;
};

/**
 * Intentional product matrix. Update this when shipping a mobile feature
 * that closes a "partial" or "none" gap — then adjust platform UI.
 */
export const COMMAND_CENTER_CAPABILITIES: CommandCenterCapability[] = [
  {
    id: "today",
    title: "Day agenda (calls, plans, actions)",
    api: ["GET /today"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
    notes: "Both load the same today payload; mobile list is denser/less chrome.",
  },
  {
    id: "accounts",
    title: "Account ledger",
    api: ["GET /accounts"],
    sharedFact: true,
    web: "full",
    mobile: "none",
    notes: "Mobile can schedule with inline account create; no accounts grid yet.",
  },
  {
    id: "schedule-cycle",
    title: "Schedule call / start cycle",
    api: ["POST /cycles"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
  },
  {
    id: "build-plan",
    title: "Build pre-call plan",
    api: ["POST /plans/:id/build"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
  },
  {
    id: "roleplay",
    title: "Connected roleplay practice",
    api: ["POST /plans/:id/roleplay", "POST /roleplay/:id/continue"],
    sharedFact: true,
    web: "full",
    mobile: "none",
    notes: "Mobile uses classic /tools role-play; not workflow-session roleplay yet.",
  },
  {
    id: "debrief-draft",
    title: "AI post-call debrief draft",
    api: ["POST /debrief/draft"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
    notes: "Draft only — never auto-saves. Both platforms must keep human review.",
  },
  {
    id: "complete-call",
    title: "Complete call + coaching run",
    api: ["POST /calls/:id/complete"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
    notes: "Mobile sends outcome/summary/commitments; web has richer coaching review UI after complete.",
  },
  {
    id: "approve-coaching",
    title: "Approve next actions",
    api: ["POST /coaching/:id/approve"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
    notes: "Both surfaces: complete call then human-select accepted next actions before they are owned.",
  },
  {
    id: "schedule-next",
    title: "Schedule next call from action",
    api: ["POST /cycles/:id/next-call"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
    notes: "Mobile: accepted next_call actions on day workflow; same next-call API as web.",
  },
  {
    id: "email-draft",
    title: "Email draft from next action",
    api: ["POST /next-actions/:id/email-draft"],
    sharedFact: true,
    web: "full",
    mobile: "supported",
    notes: "Mobile: accepted email actions; draft preview only — never auto-sends mail.",
  },
  {
    id: "csv-import",
    title: "CSV account import",
    api: ["POST /imports/csv/preview", "POST /imports/csv/commit"],
    sharedFact: true,
    web: "full",
    mobile: "none",
    notes: "Org admin; manager role in workflow.",
  },
  {
    id: "calendar-connect",
    title: "Calendar OAuth connect",
    api: ["POST /integrations/calendar/:provider/connect"],
    sharedFact: true,
    web: "partial",
    mobile: "none",
    notes: "Buttons present when adapters configured; often disabled in prod.",
  },
];

/** Capabilities both surfaces claim as shared product facts (must stay API-first). */
export function sharedCommandCenterFacts(): CommandCenterCapability[] {
  return COMMAND_CENTER_CAPABILITIES.filter((c) => c.sharedFact);
}

/** Mobile intentionally supports these today (supported or full). */
export function mobileCommandCenterSupported(): CommandCenterCapability[] {
  return COMMAND_CENTER_CAPABILITIES.filter(
    (c) => c.mobile === "supported" || c.mobile === "full",
  );
}

/** Documented mobile gaps (partial or none) for roadmap honesty. */
export function mobileCommandCenterGaps(): CommandCenterCapability[] {
  return COMMAND_CENTER_CAPABILITIES.filter(
    (c) => c.mobile === "none" || c.mobile === "partial",
  );
}

/** Ungated smoke paths that must 401/403 without a session (relative to mount). */
export const COMMAND_CENTER_GATED_SMOKE_PATHS = [
  {
    method: "GET" as const,
    path: "/api/v1/sales-workflow/today",
    query: true,
  },
  {
    method: "POST" as const,
    path: "/api/v1/sales-workflow/debrief/draft",
    body: {
      notes: "Saw DON, wants education follow-up next week about referral path.",
    },
  },
];
