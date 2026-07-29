import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const clinicalPermissions = pgTable(
  "clinical_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    canUse: boolean("can_use").notNull().default(false),
    canReview: boolean("can_review").notNull().default(false),
    canAdmin: boolean("can_admin").notNull().default(false),
    grantedByMemberId: integer("granted_by_member_id").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("clinical_permissions_tenant_member").on(
      table.organizationId,
      table.memberId,
    ),
  ],
);

export const aiToolOrganizationFlags = pgTable(
  "ai_tool_organization_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    toolId: varchar("tool_id", { length: 96 }).notNull(),
    enabled: boolean("enabled").notNull().default(false),
    updatedByMemberId: integer("updated_by_member_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_tool_org_flag_tenant_tool").on(
      table.organizationId,
      table.toolId,
    ),
    index("ai_tool_org_flag_enabled").on(table.organizationId, table.enabled),
  ],
);

export const clinicalMfaChallenges = pgTable(
  "clinical_mfa_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    challengeHash: varchar("challenge_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clinical_mfa_member_expiry").on(table.memberId, table.expiresAt),
    check("clinical_mfa_attempts", sql`${table.attempts} between 0 and 5`),
  ],
);

export const aiToolRuns = pgTable(
  "ai_tool_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    toolId: varchar("tool_id", { length: 96 }).notNull(),
    toolVersion: varchar("tool_version", { length: 32 }).notNull(),
    model: varchar("model", { length: 128 }).notNull(),
    promptVersion: varchar("prompt_version", { length: 128 }).notNull(),
    inputHash: varchar("input_hash", { length: 64 }).notNull(),
    idempotencyKeyHash: varchar("idempotency_key_hash", {
      length: 64,
    }).notNull(),
    containsPhi: boolean("contains_phi").notNull().default(false),
    status: varchar("status", { length: 32 }).notNull().default("processing"),
    output: jsonb("output"),
    encryptedPayload: text("encrypted_payload"),
    errorCode: varchar("error_code", { length: 64 }),
    reviewStatus: varchar("review_status", { length: 32 })
      .notNull()
      .default("not_required"),
    clinicalCaseId: uuid("clinical_case_id"),
    coverageSnapshotId: uuid("coverage_snapshot_id"),
    coverageDocumentId: varchar("coverage_document_id", { length: 96 }),
    coverageVersion: varchar("coverage_version", { length: 64 }),
    coverageContentHash: varchar("coverage_content_hash", { length: 64 }),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ai_tool_runs_idempotency").on(
      table.organizationId,
      table.memberId,
      table.toolId,
      table.idempotencyKeyHash,
    ),
    index("ai_tool_runs_tenant_member_time").on(
      table.organizationId,
      table.memberId,
      table.createdAt,
    ),
    index("ai_tool_runs_clinical_case").on(
      table.organizationId,
      table.clinicalCaseId,
    ),
    check(
      "ai_tool_runs_status",
      sql`${table.status} in ('processing', 'completed', 'failed', 'deleted')`,
    ),
    check(
      "ai_tool_runs_review_status",
      sql`${table.reviewStatus} in ('not_required', 'pending', 'approved', 'changes_requested')`,
    ),
  ],
);

export const clinicalCases = pgTable(
  "clinical_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    createdByMemberId: integer("created_by_member_id").notNull(),
    encryptedLabel: text("encrypted_label").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("open"),
    retentionDays: integer("retention_days").notNull().default(30),
    retentionUntil: timestamp("retention_until", {
      withTimezone: true,
    }).notNull(),
    legalHold: boolean("legal_hold").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    purgeCompletedAt: timestamp("purge_completed_at", { withTimezone: true }),
  },
  (table) => [
    index("clinical_cases_tenant_status").on(
      table.organizationId,
      table.status,
    ),
    check(
      "clinical_cases_retention_range",
      sql`${table.retentionDays} between 1 and 365`,
    ),
    check(
      "clinical_cases_status",
      sql`${table.status} in ('open', 'review', 'closed', 'deleting', 'deleted')`,
    ),
  ],
);

export const clinicalEphemeralSessions = pgTable(
  "clinical_ephemeral_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    createdByMemberId: integer("created_by_member_id").notNull(),
    coverageSnapshotId: uuid("coverage_snapshot_id").references(
      () => coverageSnapshots.id,
    ),
    status: varchar("status", { length: 32 }).notNull().default("open"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clinical_ephemeral_sessions_tenant_expiry").on(
      table.organizationId,
      table.expiresAt,
    ),
    check(
      "clinical_ephemeral_sessions_status",
      sql`${table.status} in ('open', 'processing', 'purging')`,
    ),
  ],
);

export const clinicalEphemeralObjects = pgTable(
  "clinical_ephemeral_objects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => clinicalEphemeralSessions.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id").notNull(),
    objectKey: varchar("object_key", { length: 255 }).notNull().unique(),
    contentType: varchar("content_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    scanStatus: varchar("scan_status", { length: 32 })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("clinical_ephemeral_objects_session").on(
      table.organizationId,
      table.sessionId,
    ),
    check(
      "clinical_ephemeral_objects_scan_status",
      sql`${table.scanStatus} in ('pending', 'scanning', 'safe')`,
    ),
    check(
      "clinical_ephemeral_objects_size",
      sql`${table.sizeBytes} > 0 and ${table.sizeBytes} <= 26214400`,
    ),
  ],
);

export const clinicalDocuments = pgTable(
  "clinical_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").notNull(),
    organizationId: integer("organization_id").notNull(),
    uploadedByMemberId: integer("uploaded_by_member_id").notNull(),
    objectKey: varchar("object_key", { length: 255 }).notNull().unique(),
    encryptedMetadata: text("encrypted_metadata").notNull(),
    contentType: varchar("content_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: varchar("sha256", { length: 64 }),
    scanStatus: varchar("scan_status", { length: 32 })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("clinical_documents_case").on(table.organizationId, table.caseId),
    check(
      "clinical_documents_scan_status",
      sql`${table.scanStatus} in ('pending', 'scanning', 'safe', 'rejected', 'deleted')`,
    ),
    check(
      "clinical_documents_size",
      sql`${table.sizeBytes} > 0 and ${table.sizeBytes} <= 26214400`,
    ),
  ],
);

export const clinicalReviews = pgTable(
  "clinical_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    runId: uuid("run_id").notNull(),
    reviewerMemberId: integer("reviewer_member_id").notNull(),
    decision: varchar("decision", { length: 32 }).notNull(),
    encryptedNotes: text("encrypted_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clinical_reviews_run").on(table.organizationId, table.runId),
    check(
      "clinical_reviews_decision",
      sql`${table.decision} in ('approved', 'changes_requested')`,
    ),
  ],
);

export const coverageSnapshots = pgTable(
  "coverage_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: varchar("source", { length: 32 }).notNull().default("CMS_MCD"),
    documentType: varchar("document_type", { length: 32 }).notNull(),
    documentId: varchar("document_id", { length: 96 }).notNull(),
    version: varchar("version", { length: 64 }).notNull(),
    jurisdiction: varchar("jurisdiction", { length: 128 }),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("coverage_snapshots_document_version").on(
      table.source,
      table.documentType,
      table.documentId,
      table.version,
    ),
    index("coverage_snapshots_effective").on(
      table.documentType,
      table.jurisdiction,
      table.effectiveAt,
    ),
  ],
);

export const clinicalAuditEvents = pgTable(
  "clinical_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    actorMemberId: integer("actor_member_id").notNull(),
    action: varchar("action", { length: 96 }).notNull(),
    targetType: varchar("target_type", { length: 64 }).notNull(),
    targetId: uuid("target_id"),
    requestId: varchar("request_id", { length: 128 }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clinical_audit_tenant_time").on(
      table.organizationId,
      table.occurredAt,
    ),
  ],
);

export type AiToolRun = typeof aiToolRuns.$inferSelect;
export type AiToolOrganizationFlag =
  typeof aiToolOrganizationFlags.$inferSelect;
export type ClinicalCase = typeof clinicalCases.$inferSelect;
export type ClinicalEphemeralSession =
  typeof clinicalEphemeralSessions.$inferSelect;
export type ClinicalEphemeralObject =
  typeof clinicalEphemeralObjects.$inferSelect;
export type ClinicalDocument = typeof clinicalDocuments.$inferSelect;
export type ClinicalPermission = typeof clinicalPermissions.$inferSelect;
export type ClinicalMfaChallenge = typeof clinicalMfaChallenges.$inferSelect;
export type ClinicalReview = typeof clinicalReviews.$inferSelect;
export type CoverageSnapshot = typeof coverageSnapshots.$inferSelect;
export type ClinicalAuditEvent = typeof clinicalAuditEvents.$inferSelect;
