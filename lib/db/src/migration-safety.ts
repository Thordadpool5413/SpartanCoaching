/**
 * Production-safe migration system for Hospice Sales Pro / SpartanCoaching.
 *
 * Enforces that every schema change is documented as a MigrationPlan with:
 * forward SQL, optional data migration, validation queries, rollback/recovery,
 * pre-deploy backup expectation, and client compatibility gates.
 *
 * Numbered SQL under lib/db/migrations/ (+ sales_workflow external) is the
 * migrate-primary apply path. drizzle-kit push is local-only via push-guard
 * (see docs/schema-ops.md). Stream C / pass (3) deprecates prod push.
 */

/** How destructive a change is for production scheduling and backup depth. */
export type MigrationRisk = "additive" | "data_backfill" | "destructive" | "index_heavy";

/** Expected pre-deploy backup before applying the plan. */
export type BackupExpectation =
  | "none_dev_only"
  | "logical_dump"
  | "logical_dump_plus_point_in_time";

export type ClientCompatibilityGate =
  | "none_additive"
  /** New columns/tables may ship; old clients ignore them. */
  | "expand_contract_expand"
  /** Must not drop/rename until all clients read/write the new shape in prod. */
  | "block_until_clients_compatible";

export interface MigrationPlan {
  id: string;
  title: string;
  /** Repo-relative path to forward SQL (or "drizzle-push" for push-only). */
  forwardPath: string;
  /** Optional data migration notes / SQL path. */
  dataMigration: string | null;
  /** Post-apply validation queries (must return zero problem rows unless noted). */
  validationQueries: readonly string[];
  /** Rollback SQL path or recovery strategy description. */
  rollbackOrRecovery: string;
  backupExpectation: BackupExpectation;
  risk: MigrationRisk;
  clientCompatibility: ClientCompatibilityGate;
  /** Tables touched; used for lock-risk and integrity scope. */
  tables: readonly string[];
  /** Explicit ban: do not DROP legacy columns/tables in this plan. */
  dropsLegacyObjects: boolean;
}

export interface IntegrityCheck {
  id: string;
  category: "tenant_ownership" | "foreign_key" | "unique" | "index" | "row_count_sanity";
  description: string;
  /** SQL returning rows that violate the rule. Empty result set = pass. */
  sql: string;
  /** Tables this check depends on (skip if missing in partial envs). */
  requiredTables: readonly string[];
}

export interface LockRiskTable {
  table: string;
  reason: string;
  guidance: string;
}

export interface ChecklistItem {
  id: string;
  phase: "author" | "predeploy" | "apply" | "postdeploy" | "cleanup";
  requirement: string;
  /** When true, failing this item blocks production apply. */
  blocking: boolean;
}

// ── Checklist (operational gate for every schema change) ─────────────

export const MIGRATION_VERIFICATION_CHECKLIST: readonly ChecklistItem[] = [
  {
    id: "plan-complete",
    phase: "author",
    requirement:
      "MigrationPlan recorded: forward path, validation queries, rollback/recovery, backup expectation, client gate",
    blocking: true,
  },
  {
    id: "no-silent-drops",
    phase: "author",
    requirement:
      "No DROP COLUMN / DROP TABLE / RENAME of production objects until expand-contract dual-read is proven",
    blocking: true,
  },
  {
    id: "forward-reviewed",
    phase: "author",
    requirement: "Forward SQL uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS when additive",
    blocking: true,
  },
  {
    id: "validation-queries",
    phase: "author",
    requirement: "At least one validation query proves the intended schema or data state",
    blocking: true,
  },
  {
    id: "lock-risk-reviewed",
    phase: "author",
    requirement: "Large tables / index builds reviewed against LOCK_RISK_TABLES; avoid long exclusive locks",
    blocking: true,
  },
  {
    id: "client-compatible",
    phase: "predeploy",
    requirement:
      "Dependent web/iOS/API clients tolerate the change (or gate = block_until_clients_compatible and blocked)",
    blocking: true,
  },
  {
    id: "backup-taken",
    phase: "predeploy",
    requirement:
      "Pre-deploy backup matches plan.backupExpectation (logical dump minimum for data_backfill/destructive)",
    blocking: true,
  },
  {
    id: "apply-ordered",
    phase: "apply",
    requirement:
      "Apply numbered SQL in order OR push after pull; never apply destructive SQL before client deploy",
    blocking: true,
  },
  {
    id: "post-integrity",
    phase: "postdeploy",
    requirement: "Run INTEGRITY_CHECKS (verify-integrity script) and plan.validationQueries; zero unexpected violations",
    blocking: true,
  },
  {
    id: "smoke-tenant",
    phase: "postdeploy",
    requirement: "Smoke login + one tenant-scoped write/read path for affected domain",
    blocking: true,
  },
  {
    id: "legacy-cleanup-deferred",
    phase: "cleanup",
    requirement:
      "Legacy column/table drop only after production dual-write period and explicit follow-up plan",
    blocking: true,
  },
] as const;

// ── Known lock / production-risk tables ──────────────────────────────

export const LOCK_RISK_TABLES: readonly LockRiskTable[] = [
  {
    table: "sales_workflow_entities",
    reason: "Tenant workflow store with jsonb + GIN; grows with every Command Center entity",
    guidance:
      "Prefer ADD COLUMN / CREATE INDEX CONCURRENTLY offline; avoid full-table rewrites; batch data backfills",
  },
  {
    table: "sales_workflow_audit",
    reason: "Append-heavy audit log",
    guidance: "Indexes on (organization_id, occurred_at) only; never rewrite history in-place",
  },
  {
    table: "ai_tool_runs",
    reason: "High-volume tool run log with idempotency unique index",
    guidance: "Backfill in batches; CREATE INDEX CONCURRENTLY for new indexes",
  },
  {
    table: "clinical_audit_events",
    reason: "Append-heavy clinical audit",
    guidance: "No exclusive locks during business hours; partition later if needed",
  },
  {
    table: "client_sessions",
    reason: "Hot auth path; token lookups",
    guidance: "Avoid table rewrites; column adds are usually safe with IF NOT EXISTS",
  },
  {
    table: "auth_events",
    reason: "High write auth telemetry",
    guidance: "Additive only; no bulk UPDATEs without batching",
  },
  {
    table: "roleplay_sessions",
    reason: "Large jsonb session payloads",
    guidance: "Schema changes must not force full-row rewrites without maintenance window",
  },
] as const;

// ── Integrity checks (run against live DB post-migrate) ──────────────

export const INTEGRITY_CHECKS: readonly IntegrityCheck[] = [
  {
    id: "member-offboarding-lifecycle-owner",
    category: "tenant_ownership",
    description: "Member offboarding lifecycle rows must reference the member and source organization",
    requiredTables: ["member_offboarding_lifecycle", "client_members", "client_organizations"],
    sql: `
SELECT l.id
FROM member_offboarding_lifecycle l
LEFT JOIN client_members m ON m.id = l.member_id
LEFT JOIN client_organizations o ON o.id = l.source_organization_id
WHERE m.id IS NULL OR o.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "coach-conversation-owner",
    category: "tenant_ownership",
    description: "Coach conversations must belong to a member in the same organization",
    requiredTables: ["coach_conversations", "client_members", "client_organizations"],
    sql: `
SELECT c.id
FROM coach_conversations c
LEFT JOIN client_members m ON m.id = c.member_id AND m.organization_id = c.organization_id
LEFT JOIN client_organizations o ON o.id = c.organization_id
WHERE m.id IS NULL OR o.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "coach-message-owner",
    category: "tenant_ownership",
    description: "Coach messages must match their conversation owner",
    requiredTables: ["coach_messages", "coach_conversations"],
    sql: `
SELECT m.id
FROM coach_messages m
LEFT JOIN coach_conversations c ON c.id = m.conversation_id
WHERE c.id IS NULL OR c.organization_id <> m.organization_id OR c.member_id <> m.member_id
LIMIT 100
`.trim(),
  },
  {
    id: "coach-shared-summary-tenant",
    category: "tenant_ownership",
    description: "Shared Coach summaries must remain within one organization",
    requiredTables: ["coach_shared_summaries", "client_members"],
    sql: `
SELECT s.id
FROM coach_shared_summaries s
LEFT JOIN client_members owner ON owner.id = s.owner_member_id AND owner.organization_id = s.organization_id
LEFT JOIN client_members recipient ON recipient.id = s.shared_with_member_id AND recipient.organization_id = s.organization_id
WHERE owner.id IS NULL OR recipient.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "members-org-ownership",
    category: "tenant_ownership",
    description: "client_members.organization_id must reference an existing client_organizations row",
    requiredTables: ["client_members", "client_organizations"],
    sql: `
SELECT m.id AS member_id, m.organization_id
FROM client_members m
LEFT JOIN client_organizations o ON o.id = m.organization_id
WHERE o.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "timeline-org-ownership",
    category: "tenant_ownership",
    description: "org_timeline_events.organization_id must reference client_organizations",
    requiredTables: ["org_timeline_events", "client_organizations"],
    sql: `
SELECT e.id AS event_id, e.organization_id
FROM org_timeline_events e
LEFT JOIN client_organizations o ON o.id = e.organization_id
WHERE o.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "invites-org-ownership",
    category: "tenant_ownership",
    description: "org_invites.organization_id must reference client_organizations",
    requiredTables: ["org_invites", "client_organizations"],
    sql: `
SELECT i.id AS invite_id, i.organization_id
FROM org_invites i
LEFT JOIN client_organizations o ON o.id = i.organization_id
WHERE o.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "sessions-member-fk",
    category: "foreign_key",
    description: "client_sessions.member_id must reference client_members",
    requiredTables: ["client_sessions", "client_members"],
    sql: `
SELECT s.id AS session_id, s.member_id
FROM client_sessions s
LEFT JOIN client_members m ON m.id = s.member_id
WHERE m.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "auth-tokens-member-fk",
    category: "foreign_key",
    description: "auth_tokens.member_id must reference client_members",
    requiredTables: ["auth_tokens", "client_members"],
    sql: `
SELECT t.id AS token_id, t.member_id
FROM auth_tokens t
LEFT JOIN client_members m ON m.id = t.member_id
WHERE m.id IS NULL
LIMIT 100
`.trim(),
  },
  {
    id: "members-email-unique",
    category: "unique",
    description: "client_members.email must be unique (duplicate groups only)",
    requiredTables: ["client_members"],
    sql: `
SELECT lower(email) AS email_key, count(*) AS dup_count
FROM client_members
GROUP BY lower(email)
HAVING count(*) > 1
LIMIT 100
`.trim(),
  },
  {
    id: "members-apple-account-token-unique",
    category: "unique",
    description: "Every member Apple account token must be present and unique",
    requiredTables: ["client_members"],
    sql: `
SELECT apple_account_token, count(*) AS violation_count
FROM client_members
GROUP BY apple_account_token
HAVING apple_account_token IS NULL OR count(*) > 1
LIMIT 100
`.trim(),
  },
  {
    id: "organizations-apple-transaction-unique",
    category: "unique",
    description: "An Apple original transaction may belong to only one organization",
    requiredTables: ["client_organizations"],
    sql: `
SELECT apple_original_transaction_id, count(*) AS duplicate_count
FROM client_organizations
WHERE apple_original_transaction_id IS NOT NULL
GROUP BY apple_original_transaction_id
HAVING count(*) > 1
LIMIT 100
`.trim(),
  },
  {
    id: "index-apple-subscription-ownership",
    category: "index",
    description: "Apple member and organization ownership indexes must exist",
    requiredTables: ["client_members", "client_organizations"],
    sql: `
SELECT 1 AS missing
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname = 'uq_client_members_apple_account'
)
OR NOT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname = 'uq_client_org_apple_original_transaction'
)
`.trim(),
  },
  {
    id: "sessions-token-unique",
    category: "unique",
    description: "client_sessions.token_hash must be unique",
    requiredTables: ["client_sessions"],
    sql: `
SELECT token_hash, count(*) AS dup_count
FROM client_sessions
GROUP BY token_hash
HAVING count(*) > 1
LIMIT 100
`.trim(),
  },
  {
    id: "index-client-members-org",
    category: "index",
    description: "IDX_client_members_org must exist",
    requiredTables: ["client_members"],
    sql: `
SELECT 1 AS missing
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'client_members'
    AND indexname = 'IDX_client_members_org'
)
`.trim(),
  },
  {
    id: "index-sales-workflow-tenant-kind",
    category: "index",
    description: "sales_workflow_entities tenant kind index must exist",
    requiredTables: ["sales_workflow_entities"],
    sql: `
SELECT 1 AS missing
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'sales_workflow_entities'
    AND indexname = 'sales_workflow_entities_tenant_kind'
)
`.trim(),
  },
  {
    id: "sales-workflow-version-positive",
    category: "row_count_sanity",
    description: "sales_workflow_entities.version must be > 0",
    requiredTables: ["sales_workflow_entities"],
    sql: `
SELECT id, organization_id, version
FROM sales_workflow_entities
WHERE version <= 0
LIMIT 100
`.trim(),
  },
] as const;

// ── Catalog of reviewed numbered migrations ──────────────────────────

export const MIGRATION_CATALOG: readonly MigrationPlan[] = [
  {
    id: "0001_spartan_ai_tools",
    title: "Spartan AI tools + clinical permission baseline",
    forwardPath: "lib/db/migrations/0001_spartan_ai_tools.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.ai_tool_runs') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.clinical_permissions') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore from pre-apply logical dump. Tables are CREATE IF NOT EXISTS; do not DROP in prod — leave unused tables until dual-path retired.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: [
      "ai_tool_organization_flags",
      "clinical_permissions",
      "ai_tool_runs",
      "clinical_audit_events",
    ],
    dropsLegacyObjects: false,
  },
  {
    id: "0002_ephemeral_clinical_tools",
    title: "Ephemeral clinical sessions/objects",
    forwardPath: "lib/db/migrations/0002_ephemeral_clinical_tools.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.clinical_ephemeral_sessions') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.clinical_ephemeral_objects') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Objects are additive; reverse only by leaving tables unused (no DROP until clients stop reading).",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["clinical_ephemeral_sessions", "clinical_ephemeral_objects"],
    dropsLegacyObjects: false,
  },
  {
    id: "0003_client_auth_billing",
    title: "Product auth + org billing columns",
    forwardPath: "lib/db/migrations/0003_client_auth_billing.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.client_organizations') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.client_members') IS NOT NULL AS ok`,
      `SELECT count(*) = 0 AS ok FROM (
         SELECT lower(email) e FROM client_members GROUP BY 1 HAVING count(*) > 1
       ) d`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump for structural failure. Columns added with IF NOT EXISTS — do not DROP billing/auth columns while API still reads them.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "expand_contract_expand",
    tables: [
      "client_organizations",
      "client_members",
      "client_sessions",
      "org_timeline_events",
      "access_requests",
      "auth_tokens",
      "org_invites",
      "auth_events",
    ],
    dropsLegacyObjects: false,
  },
  {
    id: "0004_cms_content",
    title: "CMS marketing content tables",
    forwardPath: "lib/db/migrations/0004_cms_content.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.articles') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.resources') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Pure additive public CMS tables; leave in place if unused.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: [
      "articles",
      "resources",
      "podcasts",
      "testimonials",
      "case_studies",
      "inquiries",
      "newsletter_subscribers",
    ],
    dropsLegacyObjects: false,
  },
  {
    id: "0005_resource_content_architecture",
    title: "Resource content architecture JSONB column",
    forwardPath: "lib/db/migrations/0005_resource_content_architecture.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT count(*) > 0 AS ok FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'content_architecture'`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive column; leave in place (API may still read JSONB).",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["resources"],
    dropsLegacyObjects: false,
  },
  {
    id: "0006_resource_work",
    title: "Executable resource saved work",
    forwardPath: "lib/db/migrations/0006_resource_work.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.resource_work') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive tenant table; do not DROP while clients save work.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["resource_work"],
    dropsLegacyObjects: false,
  },
  {
    id: "0007_resource_lifecycle",
    title: "Resource lifecycle columns + events",
    forwardPath: "lib/db/migrations/0007_resource_lifecycle.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.resource_lifecycle_events') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive columns/table; leave unused if rolling back code.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "expand_contract_expand",
    tables: ["resources", "resource_lifecycle_events"],
    dropsLegacyObjects: false,
  },
  {
    id: "0008_provider_resources",
    title: "Provider / company knowledge resources",
    forwardPath: "lib/db/migrations/0008_provider_resources.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.provider_resources') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive org-scoped table.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["provider_resources"],
    dropsLegacyObjects: false,
  },
  {
    id: "0009_member_personalization",
    title: "Member personalization payload",
    forwardPath: "lib/db/migrations/0009_member_personalization.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.member_personalization') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive member table.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["member_personalization"],
    dropsLegacyObjects: false,
  },
  {
    id: "0010_member_notifications",
    title: "Member notifications + prefs",
    forwardPath: "lib/db/migrations/0010_member_notifications.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.member_notifications') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.member_notification_prefs') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive notification tables.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["member_notification_prefs", "member_notifications"],
    dropsLegacyObjects: false,
  },
  {
    id: "0011_org_admin_audit",
    title: "Org admin audit events",
    forwardPath: "lib/db/migrations/0011_org_admin_audit.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.org_admin_audit_events') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive audit table; do not DROP while org admin UI reads it.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["org_admin_audit_events"],
    dropsLegacyObjects: false,
  },
  {
    id: "0012_roleplay_assessments_analytics",
    title: "Roleplay, assessments, analytics, usage, agreements, chat",
    forwardPath: "lib/db/migrations/0012_roleplay_assessments_analytics.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.roleplay_sessions') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.assessments') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.event_tracking') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.usage_events') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Pure additive product tables previously push-only; leave unused tables in place if rolling back code.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: [
      "sessions",
      "users",
      "usage_events",
      "ai_usage_daily",
      "email_usage_daily",
      "object_upload_tokens",
      "signed_agreements",
      "agreement_requests",
      "visitors",
      "event_tracking",
      "roleplay_sessions",
      "roleplay_messages",
      "drill_completions",
      "assessments",
      "assessment_questions",
      "assessment_clients",
      "assessment_submissions",
      "assessment_invites",
      "site_settings",
      "conversations",
      "messages",
    ],
    dropsLegacyObjects: false,
  },
  {
    id: "0014_org_structure",
    title: "Org branches, teams, member assignment",
    forwardPath: "lib/db/migrations/0014_org_structure.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.org_branches') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.org_teams') IS NOT NULL AS ok`,
      `SELECT count(*) > 0 AS ok FROM information_schema.columns WHERE table_name = 'client_members' AND column_name = 'branch_id'`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive structure tables/columns; leave unused if rolling back code.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["org_branches", "org_teams", "client_members"],
    dropsLegacyObjects: false,
  },
  {
    id: "0015_org_contacts_offboard",
    title: "Org billing/security contacts + retention note",
    forwardPath: "lib/db/migrations/0015_org_contacts_offboard.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT count(*) > 0 AS ok FROM information_schema.columns WHERE table_name = 'client_organizations' AND column_name = 'billing_contact_email'`,
      `SELECT count(*) > 0 AS ok FROM information_schema.columns WHERE table_name = 'client_organizations' AND column_name = 'security_contact_email'`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Additive contact columns; leave unused if rolling back code.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["client_organizations"],
    dropsLegacyObjects: false,
  },
  {
    id: "0016_spartan_coach",
    title: "Private Spartan Coach conversations, preferences, memory, and explicit shares",
    forwardPath: "lib/db/migrations/0016_spartan_coach.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.coach_conversations') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.coach_messages') IS NOT NULL AS ok`,
      `SELECT count(*) = 0 AS ok FROM coach_messages m LEFT JOIN coach_conversations c ON c.id = m.conversation_id WHERE c.id IS NULL`,
    ],
    rollbackOrRecovery:
      "Recovery: restore the pre-apply logical dump. The tables are additive and should remain unused rather than dropped while clients may reference them.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: [
      "coach_conversations",
      "coach_messages",
      "coach_preferences",
      "coach_memory_items",
      "coach_shared_summaries",
    ],
    dropsLegacyObjects: false,
  },
  {
    id: "0017_apple_subscriptions",
    title: "StoreKit account binding and verified Apple subscription state",
    forwardPath: "lib/db/migrations/0017_apple_subscriptions.sql",
    dataMigration: "Backfill a random, unique StoreKit app account token for every existing member.",
    validationQueries: [
      `SELECT count(*) = 0 AS ok FROM client_members WHERE apple_account_token IS NULL`,
      `SELECT count(*) = count(DISTINCT apple_account_token) AS ok FROM client_members`,
      `SELECT count(*) = count(DISTINCT apple_original_transaction_id) AS ok FROM client_organizations WHERE apple_original_transaction_id IS NOT NULL`,
    ],
    rollbackOrRecovery:
      "Recovery: restore the pre-apply logical dump. The columns and indexes are additive and should remain unused rather than dropped while released clients may reference them.",
    backupExpectation: "logical_dump",
    risk: "data_backfill",
    clientCompatibility: "none_additive",
    tables: ["client_members", "client_organizations"],
    dropsLegacyObjects: false,
  },
  {
    id: "0018_member_offboarding_lifecycle",
    title: "Member offboarding retention, private Coach deletion, and personal commitment recovery",
    forwardPath: "lib/db/migrations/0018_member_offboarding_lifecycle.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.member_offboarding_lifecycle') IS NOT NULL AS ok`,
      `SELECT count(*) = 0 AS ok FROM member_offboarding_lifecycle l LEFT JOIN client_members m ON m.id = l.member_id LEFT JOIN client_organizations o ON o.id = l.source_organization_id WHERE m.id IS NULL OR o.id IS NULL`,
      `SELECT count(*) > 0 AS ok FROM pg_trigger WHERE tgname = 'trg_member_offboarding_guard' AND NOT tgisinternal`,
    ],
    rollbackOrRecovery:
      "Recovery: restore the pre-apply logical dump. Disable the additive triggers and functions if application rollback is required; preserve lifecycle records for audit and recovery.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: [
      "member_offboarding_lifecycle",
      "client_members",
      "coach_conversations",
      "coach_preferences",
      "coach_memory_items",
      "coach_shared_summaries",
      "auth_events",
    ],
    dropsLegacyObjects: false,
  },
  {
    id: "0019_native_article_content",
    title: "First party article content for native reading",
    forwardPath: "lib/db/migrations/0019_native_article_content.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT count(*) > 0 AS ok FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'content'`,
    ],
    rollbackOrRecovery:
      "Recovery: restore the pre-apply logical dump. The nullable column is additive and should remain unused rather than dropped while released clients may reference it.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["articles"],
    dropsLegacyObjects: false,
  },
  {
    id: "0020_member_leadership_context",
    title: "Optional member team leadership context",
    forwardPath: "lib/db/migrations/0020_member_leadership_context.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT count(*) > 0 AS ok FROM information_schema.columns WHERE table_name = 'client_members' AND column_name = 'also_leads_team'`,
      `SELECT count(*) = 0 AS ok FROM client_members WHERE also_leads_team IS NULL`,
    ],
    rollbackOrRecovery:
      "Recovery: restore the pre-apply logical dump. The additive column should remain unused rather than dropped while released clients may reference it.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["client_members"],
    dropsLegacyObjects: false,
  },
  {
    id: "0021_stripe_webhook_analytics_retention",
    title: "Stripe webhook replay ledger and bounded analytics indexes",
    forwardPath: "lib/db/migrations/0021_stripe_webhook_analytics_retention.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.stripe_webhook_events') IS NOT NULL AS ok`,
      `SELECT count(*) = count(DISTINCT id) AS ok FROM stripe_webhook_events`,
      `SELECT to_regclass('public.visitors_visited_at_idx') IS NOT NULL AS ok`,
      `SELECT to_regclass('public.event_tracking_created_at_idx') IS NOT NULL AS ok`,
    ],
    rollbackOrRecovery:
      "Recovery: leave this additive replay ledger and indexes in place while rolling application code back; restore from backup only if removal is required after confirmed data-retention review.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["stripe_webhook_events", "visitors", "event_tracking"],
    dropsLegacyObjects: false,
  },
  {
    id: "0022_stripe_webhook_notification_dedup",
    title: "At-most-once billing notification ledger",
    forwardPath: "lib/db/migrations/0022_stripe_webhook_notification_dedup.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.stripe_webhook_notifications') IS NOT NULL AS ok`,
      `SELECT count(*) = count(DISTINCT (stripe_event_id, notification_type)) AS ok FROM stripe_webhook_notifications`,
    ],
    rollbackOrRecovery:
      "Recovery: retain the additive notification ledger during an application rollback so webhook retries cannot re-send prior customer or administrator messages.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["stripe_webhook_notifications"],
    dropsLegacyObjects: false,
  },
  {
    id: "sales_workflow_001",
    title: "Sales Command Center workflow store (RLS)",
    forwardPath: "lib/hospice-sales-runtime/migrations/001_sales_workflow.sql",
    dataMigration: null,
    validationQueries: [
      `SELECT to_regclass('public.sales_workflow_entities') IS NOT NULL AS ok`,
      `SELECT count(*) = 0 AS ok FROM sales_workflow_entities WHERE version <= 0`,
    ],
    rollbackOrRecovery:
      "Recovery: restore dump. Applied via pnpm db:migrate (tracking id 0013_sales_workflow.sql). Legacy: apply-sales-workflow-migration.mjs. Do not DROP tables; disable writes in app if rolling back code.",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: [
      "sales_workflow_entities",
      "sales_workflow_outbox",
      "sales_workflow_audit",
      "sales_workflow_idempotency",
    ],
    dropsLegacyObjects: false,
  },
] as const;

/**
 * Every Drizzle product table under lib/db that must be creatable via numbered
 * SQL alone (migrate-only path). Sales workflow lives in hospice-sales-runtime.
 * When adding a pgTable in lib/db/src/schema, add it here + a migration.
 */
export const MIGRATE_ONLY_LIB_DB_TABLES = [
  // 0001 / 0002 AI + clinical
  "ai_tool_organization_flags",
  "clinical_permissions",
  "clinical_mfa_challenges",
  "coverage_snapshots",
  "ai_tool_runs",
  "clinical_cases",
  "clinical_documents",
  "clinical_reviews",
  "clinical_audit_events",
  "clinical_ephemeral_sessions",
  "clinical_ephemeral_objects",
  // 0003 auth
  "client_organizations",
  "org_timeline_events",
  "client_members",
  "client_sessions",
  "access_requests",
  "auth_tokens",
  "org_invites",
  "auth_events",
  // 0011
  "org_admin_audit_events",
  // 0014 structure
  "org_branches",
  "org_teams",
  // 0004 CMS
  "articles",
  "resources",
  "podcasts",
  "testimonials",
  "case_studies",
  "inquiries",
  "newsletter_subscribers",
  "resource_leads",
  // 0006–0010
  "resource_work",
  "resource_lifecycle_events",
  "provider_resources",
  "member_personalization",
  "member_notification_prefs",
  "member_notifications",
  "member_offboarding_lifecycle",
  "stripe_webhook_events",
  "stripe_webhook_notifications",
  // 0012
  "sessions",
  "users",
  "usage_events",
  "ai_usage_daily",
  "email_usage_daily",
  "object_upload_tokens",
  "signed_agreements",
  "agreement_requests",
  "visitors",
  "event_tracking",
  "roleplay_sessions",
  "roleplay_messages",
  "drill_completions",
  "assessments",
  "assessment_questions",
  "assessment_clients",
  "assessment_submissions",
  "assessment_invites",
  "site_settings",
  "conversations",
  "messages",
] as const;

// ── Destructive SQL patterns (forbid without expand-contract proof) ──

const DESTRUCTIVE_SQL_PATTERNS: readonly RegExp[] = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bALTER\s+TABLE\b[^;]*\bDROP\b/i,
  /\bRENAME\s+(TO|COLUMN)\b/i,
  /\bTRUNCATE\b/i,
];

export function findDestructiveSql(sql: string): string[] {
  const hits: string[] = [];
  for (const pattern of DESTRUCTIVE_SQL_PATTERNS) {
    if (pattern.test(sql)) {
      hits.push(pattern.source);
    }
  }
  return hits;
}

export function assertMigrationPlanComplete(plan: MigrationPlan): string[] {
  const errors: string[] = [];
  if (!plan.id?.trim()) errors.push("id is required");
  if (!plan.title?.trim()) errors.push("title is required");
  if (!plan.forwardPath?.trim()) errors.push("forwardPath is required");
  if (!plan.validationQueries?.length) {
    errors.push("at least one validationQuery is required");
  }
  if (!plan.rollbackOrRecovery?.trim()) {
    errors.push("rollbackOrRecovery is required");
  }
  if (!plan.backupExpectation) errors.push("backupExpectation is required");
  if (!plan.tables?.length) errors.push("tables list is required");
  if (plan.dropsLegacyObjects) {
    if (plan.clientCompatibility !== "block_until_clients_compatible") {
      errors.push(
        "dropsLegacyObjects requires clientCompatibility=block_until_clients_compatible",
      );
    }
    // Prefer PITR for destructive drops of legacy objects
    if (
      plan.risk === "destructive" &&
      plan.backupExpectation !== "logical_dump_plus_point_in_time"
    ) {
      errors.push(
        "destructive plans that drop legacy objects require logical_dump_plus_point_in_time backup",
      );
    }
  }
  if (plan.risk === "destructive" && plan.clientCompatibility === "none_additive") {
    errors.push("destructive risk cannot use clientCompatibility=none_additive");
  }
  if (
    (plan.risk === "data_backfill" || plan.risk === "destructive") &&
    plan.backupExpectation === "none_dev_only"
  ) {
    errors.push("data_backfill/destructive risk forbids backupExpectation=none_dev_only");
  }
  return errors;
}

/** True when a destructive plan is allowed to apply in production. */
export function isDestructiveApplyAllowed(
  plan: MigrationPlan,
  opts: { clientsCompatible: boolean; backupCompleted: boolean },
): boolean {
  if (!plan.dropsLegacyObjects && plan.risk !== "destructive") {
    return true;
  }
  if (plan.clientCompatibility === "block_until_clients_compatible" && !opts.clientsCompatible) {
    return false;
  }
  if (!opts.backupCompleted && plan.backupExpectation !== "none_dev_only") {
    return false;
  }
  return opts.clientsCompatible && opts.backupCompleted;
}

export function getLockRiskForTables(tables: readonly string[]): LockRiskTable[] {
  const set = new Set(tables);
  return LOCK_RISK_TABLES.filter((row) => set.has(row.table));
}

export function getChecklistForPhase(
  phase: ChecklistItem["phase"],
): ChecklistItem[] {
  return MIGRATION_VERIFICATION_CHECKLIST.filter((item) => item.phase === phase);
}

export function catalogById(id: string): MigrationPlan | undefined {
  return MIGRATION_CATALOG.find((plan) => plan.id === id);
}

/** Ordered forward paths for recover/migrate-only deploys. */
export function orderedForwardPaths(): string[] {
  return MIGRATION_CATALOG.map((plan) => plan.forwardPath);
}

/**
 * Minimal representative dataset shapes used to reason about migration safety
 * in unit tests (not PHI; synthetic only).
 */
export const REPRESENTATIVE_TEST_FIXTURES = {
  organizations: [
    { id: 1, name: "Acme Hospice", type: "company", status: "active" },
    { id: 2, name: "Solo Rep", type: "personal", status: "trial" },
  ],
  members: [
    {
      id: 10,
      email: "admin@acme.example",
      organization_id: 1,
      role: "org_admin",
      status: "active",
    },
    {
      id: 11,
      email: "rep@acme.example",
      organization_id: 1,
      role: "member",
      status: "active",
    },
    {
      id: 12,
      email: "solo@example.com",
      organization_id: 2,
      role: "member",
      status: "active",
    },
  ],
  /** Orphan row that integrity checks must detect. */
  orphanMember: {
    id: 99,
    email: "orphan@example.com",
    organization_id: 99999,
    role: "member",
    status: "active",
  },
  salesWorkflowEntities: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      organization_id: "22222222-2222-4222-8222-222222222222",
      kind: "account",
      version: 1,
    },
  ],
} as const;

/**
 * In-memory integrity simulation for representative fixtures (no DB required).
 * Mirrors members-org-ownership and version checks.
 */
export function simulateTenantOwnershipViolations(input: {
  organizations: readonly { id: number }[];
  members: readonly { id: number; organization_id: number }[];
}): { member_id: number; organization_id: number }[] {
  const orgIds = new Set(input.organizations.map((o) => o.id));
  return input.members
    .filter((m) => !orgIds.has(m.organization_id))
    .map((m) => ({ member_id: m.id, organization_id: m.organization_id }));
}

export function simulateVersionViolations(
  entities: readonly { id: string; version: number }[],
): { id: string; version: number }[] {
  return entities.filter((e) => e.version <= 0).map((e) => ({ id: e.id, version: e.version }));
}
