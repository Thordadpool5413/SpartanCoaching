import pg from "pg";
import {
  day,
  stamp,
  rightsSchema,
  rightsRevisionIdentity,
  partitionSchema,
  type Partition,
  type KnowledgeVersion,
  type KnowledgeSource,
  type Assignment,
  type Grant,
  type Qualification,
} from "../foundation/contracts";
import { parseContract } from "../foundation/canonical";

export type Row = Record<string, unknown>;
export const text = (v: unknown): string => {
  if (typeof v !== "string") throw new Error("KNOWLEDGE_STORAGE_INVALID");
  return v;
};
export const number = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("KNOWLEDGE_STORAGE_INVALID");
  return n;
};
export const timestamp = (v: unknown): string => {
  if (v instanceof Date) return parseContract(stamp, v.toISOString());
  let input = text(v);
  if (input.endsWith(" BC")) {
    if (!input.startsWith("0001-"))
      throw new Error("KNOWLEDGE_STORAGE_INVALID");
    input = `0000-${input.slice(5, -3)}`;
  }
  // PostgreSQL emits a space and short UTC offset. V8's legacy parser maps
  // years 0000–0099 into 1900/2000; always use the ISO parser instead.
  input = input
    .replace(/^(\d{4}-\d{2}-\d{2}) /, "$1T")
    .replace(/([+-]\d{2})$/, "$1:00");
  return parseContract(stamp, new Date(input).toISOString());
};
export const date = (v: unknown): string =>
  parseContract(day, text(v).replace(/^0001-(.*) BC$/, "0000-$1"));
export const sqlTimestamp = (v: string): string =>
  v.startsWith("0000-") ? `0001-${v.slice(5, -1).replace("T", " ")}+00 BC` : v;
export const sqlDate = (v: string): string =>
  v.startsWith("0000-") ? `0001-${v.slice(5)} BC` : v;
export const optional = <T>(
  v: unknown,
  convert: (v: unknown) => T,
): T | null => (v == null ? null : convert(v));
export const stringArray = (v: unknown): string[] => {
  if (!Array.isArray(v)) throw new Error("KNOWLEDGE_STORAGE_INVALID");
  return v.map(text);
};
export const boolean = (v: unknown): boolean => {
  if (typeof v !== "boolean") throw new Error("KNOWLEDGE_STORAGE_INVALID");
  return v;
};
// Query-local parsers keep DATE and timestamptz out of host-local timezone conversion.
export const storageTypes = {
  getTypeParser(oid: number, format?: string) {
    return [1082, 1114, 1184].includes(oid)
      ? (value: string) => value
      : pg.types.getTypeParser(oid, format as "text" | "binary");
  },
};
export const applicability = (r: Row) => ({
  payers: stringArray(r.payers),
  jurisdictions: stringArray(r.jurisdictions),
  macs: optional(r.macs, stringArray),
  providerTypes: optional(r.provider_types, stringArray),
  settings: optional(r.settings, stringArray),
  benefitPeriods: optional(r.benefit_periods, stringArray),
  codeEditions: optional(r.code_editions, stringArray),
  products: optional(r.products, stringArray),
  populations: optional(r.populations, stringArray),
});
export const scopeFromRow = (r: Row) =>
  parseContract(partitionSchema.shape.scope, {
    id: text(r.scope_id),
    kind: text(r.scope_kind),
    organizationId: optional(r.organization_id, number),
  });
export function sourceFromRow(
  r: Row,
  scope: Partition["scope"],
): KnowledgeSource {
  return parseContract(partitionSchema.shape.sources.element, {
    id: text(r.source_id),
    metadataRevision: number(r.metadata_revision),
    publisher: text(r.publisher),
    title: text(r.title),
    domain: text(r.domain),
    claimTypes: stringArray(r.claim_types),
    officialUrl: text(r.official_url),
    scope,
    educationalOnly: boolean(r.educational_only),
  });
}
export function rightsFromRow(r: Row): KnowledgeVersion["rights"] {
  return parseContract(rightsSchema, {
    id: text(r.logical_rights_id),
    revision: number(r.terms_revision),
    owner: text(r.owner_ref),
    reference: text(r.reference_ref),
    status: text(r.status),
    effectiveFrom: optional(r.effective_from, timestamp),
    expiresAt: optional(r.expires_at, timestamp),
    commercialUse: boolean(r.commercial_use),
    permittedUses: stringArray(r.permitted_uses),
    verifiedByMemberId: optional(r.verified_by_member_id, number),
    verificationGrantId: optional(r.verification_grant_id, text),
    verificationQualificationId: optional(
      r.verification_qualification_id,
      text,
    ),
    verificationRef: optional(r.verification_ref, text),
    verifiedAt: optional(r.verified_at, timestamp),
  });
}
export function grantFromRow(r: Row): Grant {
  return parseContract(partitionSchema.shape.grants.element, {
    id: text(r.grant_id),
    scopeId: text(r.scope_id),
    subjectMemberId: number(r.subject_member_id),
    createdAt: timestamp(r.created_at),
    issuance:
      r.issuance_kind === "DELEGATED"
        ? {
            kind: "DELEGATED",
            parentGrantId: text(r.parent_grant_id),
            parentGrantRevision: number(r.parent_grant_revision),
            requestId: text(r.issuance_request_id),
          }
        : {
            kind: text(r.issuance_kind),
            reference: text(r.issuance_reference),
          },
    domains: stringArray(r.domains),
    capabilities: stringArray(r.capabilities),
    effectiveFrom: timestamp(r.effective_from),
    expiresAt: timestamp(r.expires_at),
    grantedByMemberId: number(r.granted_by_member_id),
    verifiedByMemberId: number(r.verified_by_member_id),
    verificationRef: text(r.verification_ref),
    verifiedAt: timestamp(r.verified_at),
    revision: number(r.revision),
    revokedAt: optional(r.revoked_at, timestamp),
  });
}
export function qualificationFromRow(r: Row): Qualification {
  return parseContract(partitionSchema.shape.qualifications.element, {
    id: text(r.qualification_id),
    scopeId: text(r.scope_id),
    subjectMemberId: number(r.subject_member_id),
    class: text(r.qualification_class),
    domains: stringArray(r.domains),
    jurisdictions: stringArray(r.jurisdictions),
    verifiedByMemberId: number(r.verified_by_member_id),
    verificationMethod: text(r.verification_method),
    verificationRef: text(r.verification_ref),
    verifiedAt: timestamp(r.verified_at),
    effectiveFrom: timestamp(r.effective_from),
    expiresAt: timestamp(r.expires_at),
    reviewDueAt: timestamp(r.review_due_at),
    revision: number(r.revision),
    revokedAt: optional(r.revoked_at, timestamp),
  });
}
export function assignmentFromRow(r: Row): Assignment {
  return parseContract(partitionSchema.shape.assignments.element, {
    id: text(r.assignment_id),
    scopeId: text(r.scope_id),
    sourceId: text(r.source_id),
    documentId: text(r.document_id),
    versionId: text(r.version_id),
    reviewManifestDigest: text(r.review_manifest_digest),
    approvalId: text(r.approval_id),
    serviceFrom: date(r.service_from),
    serviceTo: optional(r.service_to, date),
    applicability: applicability(r),
    enabledUses: stringArray(r.enabled_uses),
    createdAt: timestamp(r.created_at),
    createdByMemberId: number(r.created_by_member_id),
    eventId: text(r.event_id),
    predecessorAssignmentId: optional(r.predecessor_assignment_id, text),
    revision: number(r.revision),
    retiredAt: optional(r.retired_at, timestamp),
    retirementEventId: optional(r.retirement_event_id, text),
  });
}
export function versionFromRows(
  r: Row,
  rights: Row,
  overlay: Row,
  health: Row,
  approvals: Row[],
  lkg?: Row,
): KnowledgeVersion {
  const terms = rightsFromRow(rights);
  if (
    text(r.rights_revision_id) !==
    rightsRevisionIdentity(text(r.scope_id), terms.id, terms.revision)
  )
    throw new Error("KNOWLEDGE_STORAGE_INVALID");
  return parseContract(partitionSchema.shape.versions.element, {
    id: text(r.version_id),
    sourceId: text(r.source_id),
    sourceMetadataRevision: number(r.source_metadata_revision),
    scopeId: text(r.scope_id),
    documentId: text(r.document_id),
    upstreamEdition: text(r.upstream_edition),
    artifactRevision: number(r.artifact_revision),
    rawHash: text(r.raw_hash),
    normalizedHash: text(r.normalized_hash),
    parserId: text(r.parser_id),
    parserVersion: text(r.parser_version),
    sourceUrl: text(r.source_url),
    publishedAt: timestamp(r.published_at),
    retrievedAt: timestamp(r.retrieved_at),
    effectiveFrom: date(r.effective_from),
    effectiveTo: optional(r.effective_to, date),
    applicability: applicability(r),
    rights: terms,
    legacyCoverageSnapshotId: optional(r.legacy_coverage_snapshot_id, text),
    registeredByMemberId: number(r.registered_by_member_id),
    submittedByMemberId: optional(r.submitted_by_member_id, number),
    state: text(r.state),
    revision: number(r.revision),
    activatedAt: optional(r.activated_at, timestamp),
    revokedAt: optional(r.revoked_at, timestamp),
    revocationReason: optional(r.revocation_reason, text),
    conflictsWith: stringArray(r.conflicts_with),
    rightsOverlay: {
      rightsId: terms.id,
      rightsRevision: terms.revision,
      rightsRevisionId: text(r.rights_revision_id),
      revision: number(overlay.revision),
      revokedAt: optional(overlay.revoked_at, timestamp),
    },
    approvals: approvals.map((a) => ({
      id: text(a.approval_id),
      versionId: text(a.version_id),
      scopeId: text(a.scope_id),
      reviewManifestDigest: text(a.review_manifest_digest),
      reviewerMemberId: number(a.reviewer_member_id),
      reviewGrantId: text(a.review_grant_id),
      qualificationId: text(a.qualification_id),
      reviewedAt: timestamp(a.reviewed_at),
      reviewDueAt: timestamp(a.review_due_at),
    })),
    health: {
      state: text(health.state),
      checkedAt: optional(health.checked_at, timestamp),
      lastValidatedAt: optional(health.last_validated_at, timestamp),
      warningAt: optional(health.warning_at, timestamp),
      hardExpiresAt: optional(health.hard_expires_at, timestamp),
      lkg: lkg
        ? {
            id: text(lkg.lkg_id),
            reviewManifestDigest: text(lkg.review_manifest_digest),
            reviewerMemberId: number(lkg.reviewer_member_id),
            healthGrantId: text(lkg.health_grant_id),
            reviewGrantId: text(lkg.review_grant_id),
            qualificationId: text(lkg.qualification_id),
            approvedAt: timestamp(lkg.approved_at),
            until: timestamp(lkg.until_at),
          }
        : null,
    },
  });
}
