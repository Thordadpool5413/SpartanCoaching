/** Approved K1B storage only. SQL-owned invariants are maintained independently in schema-contract. */
import { sql } from "drizzle-orm";
import {
  pgTable,
  primaryKey,
  customType,
  text,
  integer,
  bigint,
  timestamp,
  date,
  boolean,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
const safeText = customType<{ data: string }>({
  dataType: () => 'text COLLATE "C"',
});

export const knowledgeScopes = pgTable(
  "knowledge_scopes",
  {
    scopeId: safeText("scope_id").notNull(),
    scopeKind: text("scope_kind").notNull(),
    organizationId: integer("organization_id"),
    revision: bigint("revision", { mode: "number" }).notNull().default(0),
    supportedPayers: text("supported_payers").array().notNull(),
    supportedJurisdictions: text("supported_jurisdictions").array().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [primaryKey({ name: "pk_scopes", columns: [t.scopeId] })],
);

export const knowledgeScopeMembers = pgTable(
  "knowledge_scope_members",
  {
    scopeId: safeText("scope_id").notNull(),
    memberId: integer("member_id").notNull(),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [
    primaryKey({ name: "pk_scope_members", columns: [t.scopeId, t.memberId] }),
  ],
);

export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    scopeId: safeText("scope_id").notNull(),
    sourceId: safeText("source_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [primaryKey({ name: "pk_sources", columns: [t.scopeId, t.sourceId] })],
);

export const knowledgeSourceRevisions = pgTable(
  "knowledge_source_revisions",
  {
    scopeId: safeText("scope_id").notNull(),
    sourceId: safeText("source_id").notNull(),
    metadataRevision: bigint("metadata_revision", { mode: "number" }).notNull(),
    publisher: text("publisher").notNull(),
    title: text("title").notNull(),
    domain: text("domain").notNull(),
    claimTypes: text("claim_types").array().notNull(),
    officialUrl: text("official_url").notNull(),
    educationalOnly: boolean("educational_only").notNull(),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_source_revisions",
      columns: [t.scopeId, t.sourceId, t.metadataRevision],
    }),
  ],
);

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    scopeId: safeText("scope_id").notNull(),
    sourceId: safeText("source_id").notNull(),
    documentId: safeText("document_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_documents",
      columns: [t.scopeId, t.sourceId, t.documentId],
    }),
  ],
);

export const knowledgeRightsTerms = pgTable(
  "knowledge_rights_terms",
  {
    scopeId: safeText("scope_id").notNull(),
    rightsRevisionId: safeText("rights_revision_id").notNull(),
    logicalRightsId: safeText("logical_rights_id").notNull(),
    termsRevision: bigint("terms_revision", { mode: "number" }).notNull(),
    ownerRef: safeText("owner_ref").notNull(),
    referenceRef: safeText("reference_ref").notNull(),
    status: text("status").notNull(),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    commercialUse: boolean("commercial_use").notNull(),
    permittedUses: text("permitted_uses").array().notNull(),
    verifiedByMemberId: integer("verified_by_member_id"),
    verificationGrantId: safeText("verification_grant_id"),
    verificationQualificationId: safeText("verification_qualification_id"),
    verificationRef: safeText("verification_ref"),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_rights_terms",
      columns: [t.scopeId, t.rightsRevisionId],
    }),
  ],
);

export const knowledgeRightsState = pgTable(
  "knowledge_rights_state",
  {
    scopeId: safeText("scope_id").notNull(),
    rightsRevisionId: safeText("rights_revision_id").notNull(),
    revision: bigint("revision", { mode: "number" }).notNull().default(1),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
  },
  (t) => [
    primaryKey({
      name: "pk_rights_state",
      columns: [t.scopeId, t.rightsRevisionId],
    }),
  ],
);

export const knowledgeVersions = pgTable(
  "knowledge_versions",
  {
    scopeId: safeText("scope_id").notNull(),
    versionId: safeText("version_id").notNull(),
    sourceId: safeText("source_id").notNull(),
    sourceMetadataRevision: bigint("source_metadata_revision", {
      mode: "number",
    }).notNull(),
    documentId: safeText("document_id").notNull(),
    upstreamEdition: safeText("upstream_edition").notNull(),
    artifactRevision: bigint("artifact_revision", { mode: "number" }).notNull(),
    rawHash: safeText("raw_hash").notNull(),
    normalizedHash: safeText("normalized_hash").notNull(),
    parserId: safeText("parser_id").notNull(),
    parserVersion: safeText("parser_version").notNull(),
    sourceUrl: text("source_url").notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    retrievedAt: timestamp("retrieved_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveTo: date("effective_to", { mode: "string" }),
    payers: text("payers").array().notNull(),
    jurisdictions: text("jurisdictions").array().notNull(),
    macs: text("macs").array(),
    providerTypes: text("provider_types").array(),
    settings: text("settings").array(),
    benefitPeriods: text("benefit_periods").array(),
    codeEditions: text("code_editions").array(),
    products: text("products").array(),
    populations: text("populations").array(),
    rightsRevisionId: safeText("rights_revision_id").notNull(),
    legacyCoverageSnapshotId: uuid("legacy_coverage_snapshot_id"),
    registeredByMemberId: integer("registered_by_member_id").notNull(),
    submittedByMemberId: integer("submitted_by_member_id"),
    conflictsWith: text("conflicts_with")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    state: text("state").notNull(),
    revision: bigint("revision", { mode: "number" }).notNull().default(1),
    activatedAt: timestamp("activated_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    revocationReason: text("revocation_reason"),
    currentHealthRevision: bigint("current_health_revision", {
      mode: "number",
    }).notNull(),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [
    primaryKey({ name: "pk_versions", columns: [t.scopeId, t.versionId] }),
  ],
);

export const knowledgeGrants = pgTable(
  "knowledge_grants",
  {
    scopeId: safeText("scope_id").notNull(),
    grantId: safeText("grant_id").notNull(),
    subjectMemberId: integer("subject_member_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    issuanceKind: text("issuance_kind").notNull(),
    parentGrantId: safeText("parent_grant_id"),
    parentGrantRevision: bigint("parent_grant_revision", { mode: "number" }),
    issuanceRequestId: safeText("issuance_request_id"),
    issuanceReference: safeText("issuance_reference"),
    domains: text("domains").array().notNull(),
    capabilities: text("capabilities").array().notNull(),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    grantedByMemberId: integer("granted_by_member_id").notNull(),
    verifiedByMemberId: integer("verified_by_member_id").notNull(),
    verificationRef: safeText("verification_ref").notNull(),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    revision: bigint("revision", { mode: "number" }).notNull().default(1),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
  },
  (t) => [primaryKey({ name: "pk_grants", columns: [t.scopeId, t.grantId] })],
);

export const knowledgeQualifications = pgTable(
  "knowledge_qualifications",
  {
    scopeId: safeText("scope_id").notNull(),
    qualificationId: safeText("qualification_id").notNull(),
    subjectMemberId: integer("subject_member_id").notNull(),
    qualificationClass: text("qualification_class").notNull(),
    domains: text("domains").array().notNull(),
    jurisdictions: text("jurisdictions").array().notNull(),
    verifiedByMemberId: integer("verified_by_member_id").notNull(),
    verificationMethod: text("verification_method").notNull(),
    verificationRef: safeText("verification_ref").notNull(),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    reviewDueAt: timestamp("review_due_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    revision: bigint("revision", { mode: "number" }).notNull().default(1),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
  },
  (t) => [
    primaryKey({
      name: "pk_qualifications",
      columns: [t.scopeId, t.qualificationId],
    }),
  ],
);

export const knowledgeApprovals = pgTable(
  "knowledge_approvals",
  {
    scopeId: safeText("scope_id").notNull(),
    versionId: safeText("version_id").notNull(),
    approvalId: safeText("approval_id").notNull(),
    reviewManifestDigest: safeText("review_manifest_digest").notNull(),
    reviewerMemberId: integer("reviewer_member_id").notNull(),
    reviewGrantId: safeText("review_grant_id").notNull(),
    qualificationId: safeText("qualification_id").notNull(),
    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    reviewDueAt: timestamp("review_due_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    eventId: safeText("event_id").notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_approvals",
      columns: [t.scopeId, t.versionId, t.approvalId],
    }),
  ],
);

export const knowledgeLkgAttestations = pgTable(
  "knowledge_lkg_attestations",
  {
    scopeId: safeText("scope_id").notNull(),
    versionId: safeText("version_id").notNull(),
    lkgId: safeText("lkg_id").notNull(),
    reviewManifestDigest: safeText("review_manifest_digest").notNull(),
    reviewerMemberId: integer("reviewer_member_id").notNull(),
    healthGrantId: safeText("health_grant_id").notNull(),
    reviewGrantId: safeText("review_grant_id").notNull(),
    qualificationId: safeText("qualification_id").notNull(),
    supportingApprovalId: safeText("supporting_approval_id").notNull(),
    approvedAt: timestamp("approved_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    untilAt: timestamp("until_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    eventId: safeText("event_id").notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_lkg_attestations",
      columns: [t.scopeId, t.versionId, t.lkgId],
    }),
  ],
);

export const knowledgeHealthObservations = pgTable(
  "knowledge_health_observations",
  {
    scopeId: safeText("scope_id").notNull(),
    versionId: safeText("version_id").notNull(),
    versionRevision: bigint("version_revision", { mode: "number" }).notNull(),
    state: text("state").notNull(),
    checkedAt: timestamp("checked_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    lastValidatedAt: timestamp("last_validated_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    warningAt: timestamp("warning_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    hardExpiresAt: timestamp("hard_expires_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    lkgId: safeText("lkg_id"),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    eventId: safeText("event_id").notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_health_observations",
      columns: [t.scopeId, t.versionId, t.versionRevision],
    }),
  ],
);

export const knowledgePublicationAssignments = pgTable(
  "knowledge_publication_assignments",
  {
    scopeId: safeText("scope_id").notNull(),
    assignmentId: safeText("assignment_id").notNull(),
    sourceId: safeText("source_id").notNull(),
    documentId: safeText("document_id").notNull(),
    versionId: safeText("version_id").notNull(),
    reviewManifestDigest: safeText("review_manifest_digest").notNull(),
    approvalId: safeText("approval_id").notNull(),
    serviceFrom: date("service_from", { mode: "string" }).notNull(),
    serviceTo: date("service_to", { mode: "string" }),
    payers: text("payers").array().notNull(),
    jurisdictions: text("jurisdictions").array().notNull(),
    macs: text("macs").array(),
    providerTypes: text("provider_types").array(),
    settings: text("settings").array(),
    benefitPeriods: text("benefit_periods").array(),
    codeEditions: text("code_editions").array(),
    products: text("products").array(),
    populations: text("populations").array(),
    enabledUses: text("enabled_uses").array().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    createdByMemberId: integer("created_by_member_id").notNull(),
    eventId: safeText("event_id").notNull(),
    predecessorAssignmentId: safeText("predecessor_assignment_id"),
    revision: bigint("revision", { mode: "number" }).notNull().default(1),
    retiredAt: timestamp("retired_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    retirementEventId: safeText("retirement_event_id"),
  },
  (t) => [
    primaryKey({
      name: "pk_publication_assignments",
      columns: [t.scopeId, t.assignmentId],
    }),
  ],
);

export const knowledgeCommandReceipts = pgTable(
  "knowledge_command_receipts",
  {
    scopeId: safeText("scope_id").notNull(),
    actorMemberId: integer("actor_member_id").notNull(),
    operation: text("operation").notNull(),
    keyHash: safeText("key_hash").notNull(),
    receiptRef: safeText("receipt_ref").notNull(),
    fingerprint: safeText("fingerprint").notNull(),
    committedAt: timestamp("committed_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    scopeRevision: bigint("scope_revision", { mode: "number" }).notNull(),
    versionIds: text("version_ids").array().notNull(),
    assignmentIds: text("assignment_ids").array().notNull(),
    eventId: safeText("event_id"),
  },
  (t) => [
    primaryKey({
      name: "pk_command_receipts",
      columns: [t.scopeId, t.actorMemberId, t.operation, t.keyHash],
    }),
  ],
);

export const knowledgeAuditEvents = pgTable(
  "knowledge_audit_events",
  {
    eventId: safeText("event_id").notNull(),
    scopeId: safeText("scope_id").notNull(),
    schemaVersion: text("schema_version")
      .notNull()
      .default("knowledge-event-v3"),
    requestId: safeText("request_id").notNull(),
    operation: text("operation").notNull(),
    actorKind: text("actor_kind").notNull(),
    actorMemberId: integer("actor_member_id"),
    systemActorId: safeText("system_actor_id"),
    evidenceRef: safeText("evidence_ref"),
    aggregateKind: text("aggregate_kind").notNull(),
    aggregateId: safeText("aggregate_id").notNull(),
    sourceId: safeText("source_id"),
    versionId: safeText("version_id"),
    assignmentId: safeText("assignment_id"),
    previousAssignmentId: safeText("previous_assignment_id"),
    approvalId: safeText("approval_id"),
    previousApprovalId: safeText("previous_approval_id"),
    logicalRightsId: safeText("logical_rights_id"),
    rightsTermsRevision: bigint("rights_terms_revision", { mode: "number" }),
    previousRevision: bigint("previous_revision", { mode: "number" }).notNull(),
    newRevision: bigint("new_revision", { mode: "number" }).notNull(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    receiptRef: safeText("receipt_ref"),
    reviewManifestDigest: safeText("review_manifest_digest"),
    reasonCode: text("reason_code").notNull(),
    invalidation: text("invalidation").notNull(),
    contentRemoval: boolean("content_removal").notNull(),
    authorizationWitnesses: jsonb("authorization_witnesses").notNull(),
    expiryKind: text("expiry_kind"),
    expiryReferenceId: safeText("expiry_reference_id"),
    expiryDeadline: timestamp("expiry_deadline", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    canonicalBody: text("canonical_body").notNull(),
    bodyHash: safeText("body_hash").notNull(),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [primaryKey({ name: "pk_audit_events", columns: [t.eventId] })],
);

export const knowledgeOutbox = pgTable(
  "knowledge_outbox",
  {
    eventId: safeText("event_id").notNull(),
    scopeId: safeText("scope_id").notNull(),
    aggregateKind: text("aggregate_kind").notNull(),
    aggregateId: safeText("aggregate_id").notNull(),
    aggregateRevision: bigint("aggregate_revision", {
      mode: "number",
    }).notNull(),
    availableAt: timestamp("available_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    leaseToken: safeText("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    deliveredAt: timestamp("delivered_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    deadLetteredAt: timestamp("dead_lettered_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }),
    lastErrorCode: text("last_error_code"),
  },
  (t) => [primaryKey({ name: "pk_outbox", columns: [t.eventId] })],
);

export const knowledgeConsumerReceipts = pgTable(
  "knowledge_consumer_receipts",
  {
    consumerId: safeText("consumer_id").notNull(),
    eventId: safeText("event_id").notNull(),
    scopeId: safeText("scope_id").notNull(),
    bodyHash: safeText("body_hash").notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "pk_consumer_receipts",
      columns: [t.consumerId, t.eventId],
    }),
  ],
);
