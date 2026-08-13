/**
 * HSP domain object inventory (Slice A — types only).
 *
 * Maps product concepts → **existing** persistence. Does not create tables.
 * Forbidden: inventing parallel SQL for accounts/contacts/calls while
 * Command Center already stores them as workflow entities.
 *
 * Tenant key legend:
 * - organization_id_int  → client_organizations.id (auth, billing, AI tools)
 * - organization_id_uuid → sales_workflow_* (via @workspace/tenant-ids mapping)
 * - member_id_int        → client_members.id
 * - member_id_uuid       → workflow actor userId (mapped from member)
 * - none                 → global/public or not tenant-scoped
 */

export type TenantKeyStyle =
  | "organization_id_int"
  | "organization_id_uuid"
  | "member_id_int"
  | "member_id_uuid"
  | "none";

export type DomainStorageKind =
  | "sql_table"
  | "workflow_entity"
  | "json_column"
  | "derived"
  | "not_modeled";

export type DomainObjectId =
  | "organization"
  | "user"
  | "session"
  | "entitlement"
  | "branch"
  | "team"
  | "territory"
  | "account"
  | "contact"
  | "relationship_stage"
  | "interaction"
  | "commitment"
  | "next_action"
  | "plan"
  | "sales_call"
  | "coaching"
  | "tool_result"
  | "resource_work"
  | "goal"
  | "activity"
  | "provider_knowledge"
  | "user_preferences"
  | "audit_history";

export type DomainObjectSpec = {
  id: DomainObjectId;
  /** Product label */
  title: string;
  storage: DomainStorageKind;
  /** Concrete location (table, workflow kind, or column path) */
  location: string;
  /** How tenant isolation is expressed at rest */
  tenantKey: TenantKeyStyle;
  /** Optional owner / actor field name in stored shape */
  ownerField?: string;
  /**
   * If true, implementers must not create a second SQL table for this concept
   * until a verified migration off the current storage.
   */
  forbidParallelTable: boolean;
  /** Notes for Slice B+ (read APIs, additive tables) */
  notes?: string;
};

/**
 * Canonical inventory. Extend only when a concept is product-required and
 * storage is known. Prefer reusing rows over new tables.
 */
export const HSP_DOMAIN_OBJECTS: readonly DomainObjectSpec[] = [
  {
    id: "organization",
    title: "Hospice organization (tenant)",
    storage: "sql_table",
    location: "client_organizations",
    tenantKey: "organization_id_int",
    forbidParallelTable: true,
    notes: "Product org id is serial integer. Workflow UUID is derived only.",
  },
  {
    id: "user",
    title: "Member / user",
    storage: "sql_table",
    location: "client_members",
    tenantKey: "organization_id_int",
    ownerField: "id",
    forbidParallelTable: true,
    notes: "Not Replit users table. Roles: member | org_admin | platform_admin.",
  },
  {
    id: "session",
    title: "Auth session",
    storage: "sql_table",
    location: "client_sessions",
    tenantKey: "member_id_int",
    ownerField: "member_id",
    forbidParallelTable: true,
  },
  {
    id: "entitlement",
    title: "Seat / tool access",
    storage: "derived",
    location: "evaluateFieldKitAccess(member, org) + org.status/billing",
    tenantKey: "organization_id_int",
    forbidParallelTable: true,
    notes: "Server pure function; never client-only entitlement.",
  },
  {
    id: "branch",
    title: "Branch (operating unit)",
    storage: "sql_table",
    location: "org_branches + client_members.branch_id",
    tenantKey: "organization_id_int",
    forbidParallelTable: false,
    notes: "HSP-41 Slice C (pass 9). Distinct from branch-engine calculator presets.",
  },
  {
    id: "team",
    title: "Team",
    storage: "sql_table",
    location: "org_teams + client_members.team_id",
    tenantKey: "organization_id_int",
    forbidParallelTable: false,
    notes: "HSP-41 Slice C (pass 9). Optional branch_id on team.",
  },
  {
    id: "territory",
    title: "Territory",
    storage: "json_column",
    location: "client_members.territory_note (free text)",
    tenantKey: "organization_id_int",
    ownerField: "id",
    forbidParallelTable: false,
    notes: "Not a structured territory graph yet.",
  },
  {
    id: "account",
    title: "Referral account / facility",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=account",
    tenantKey: "organization_id_uuid",
    ownerField: "ownerUserId",
    forbidParallelTable: true,
    notes: "Command Center SoT. No parallel accounts SQL table.",
  },
  {
    id: "contact",
    title: "Account contact",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=contact",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
  },
  {
    id: "relationship_stage",
    title: "Relationship stage",
    storage: "not_modeled",
    location: "may appear inside account/call JSON only",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: false,
    notes: "No first-class stage enum table today.",
  },
  {
    id: "interaction",
    title: "Interaction / activity",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=activity (+ call lifecycle)",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
  },
  {
    id: "commitment",
    title: "Commitment",
    storage: "json_column",
    location: "sales_workflow_entities salesCall.data.commitments[]",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
    notes: "Stored on call entity; not a separate workflow kind.",
  },
  {
    id: "next_action",
    title: "Next action",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=nextAction (status draft until approve)",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
  },
  {
    id: "plan",
    title: "Pre-call plan",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=callPlan",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
  },
  {
    id: "sales_call",
    title: "Sales call",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=salesCall",
    tenantKey: "organization_id_uuid",
    ownerField: "ownerUserId",
    forbidParallelTable: true,
  },
  {
    id: "coaching",
    title: "Coaching session / artifact",
    storage: "workflow_entity",
    location: "sales_workflow_entities kind=coachingSession",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
    notes: "Approve via POST /coaching/:id/approve before next actions owned.",
  },
  {
    id: "tool_result",
    title: "AI / classic tool result",
    storage: "sql_table",
    location: "ai_tool_runs (+ classic roleplay_sessions for Stack A roleplay)",
    tenantKey: "organization_id_int",
    ownerField: "member_id",
    forbidParallelTable: true,
    notes: "Clinical runs separate; no PHI offline queue.",
  },
  {
    id: "resource_work",
    title: "Resource / Learn content use",
    storage: "sql_table",
    location: "resources + resource_leads (public/CMS)",
    tenantKey: "none",
    forbidParallelTable: true,
  },
  {
    id: "goal",
    title: "Goal",
    storage: "not_modeled",
    location: "activity/ROI calculator client inputs; checklist_progress partial",
    tenantKey: "member_id_int",
    forbidParallelTable: false,
  },
  {
    id: "activity",
    title: "Activity metrics",
    storage: "derived",
    location: "usage_events + workflow activity entities",
    tenantKey: "organization_id_int",
    forbidParallelTable: false,
  },
  {
    id: "provider_knowledge",
    title: "Provider / coverage knowledge",
    storage: "sql_table",
    location: "coverage_snapshots (+ NPI external lookup)",
    tenantKey: "none",
    forbidParallelTable: true,
  },
  {
    id: "user_preferences",
    title: "User preferences",
    storage: "not_modeled",
    location: "client local only (ceremony flags, etc.)",
    tenantKey: "member_id_int",
    forbidParallelTable: false,
    notes: "Slice C: additive user_preferences table if server sync required.",
  },
  {
    id: "audit_history",
    title: "Audit history",
    storage: "sql_table",
    location: "sales_workflow_audit + auth_events + clinical_audit_events",
    tenantKey: "organization_id_uuid",
    forbidParallelTable: true,
    notes: "Auth events may use member_id only; workflow audit uses UUID org.",
  },
] as const;

const byId = new Map(
  HSP_DOMAIN_OBJECTS.map((o) => [o.id, o] as const),
);

export function getDomainObject(id: DomainObjectId): DomainObjectSpec | undefined {
  return byId.get(id);
}

/** Objects that must not gain a second SQL table without migration. */
export function forbiddenParallelTableObjects(): DomainObjectSpec[] {
  return HSP_DOMAIN_OBJECTS.filter((o) => o.forbidParallelTable);
}

/** Concepts not yet first-class (Slice C candidates). */
export function notModeledDomainObjects(): DomainObjectSpec[] {
  return HSP_DOMAIN_OBJECTS.filter((o) => o.storage === "not_modeled");
}

/** Workflow-entity concepts (Command Center SoT). */
export function workflowEntityDomainObjects(): DomainObjectSpec[] {
  return HSP_DOMAIN_OBJECTS.filter((o) => o.storage === "workflow_entity");
}

/**
 * Assert a proposed new table name does not collide with protected concepts.
 * Throws if name looks like a parallel account/contact/call table.
 */
export function assertNoForbiddenParallelTable(proposedTable: string): void {
  const n = proposedTable.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const blocked = [
    "accounts",
    "account",
    "contacts",
    "contact",
    "sales_calls",
    "sales_call",
    "call_plans",
    "next_actions",
    "coaching_sessions",
  ];
  if (blocked.includes(n)) {
    throw new Error(
      `Forbidden parallel table "${proposedTable}": use sales_workflow_entities (workflow SoT). See HSP_DOMAIN_OBJECTS.`,
    );
  }
}

/** Tenant key style for a domain object id. */
export function tenantKeyFor(id: DomainObjectId): TenantKeyStyle {
  const o = getDomainObject(id);
  if (!o) throw new Error(`Unknown domain object: ${id}`);
  return o.tenantKey;
}
