import {
  canonicalBytes,
  canonicalDigest,
  parseContract,
  sortedSet,
} from "../foundation/canonical";
import {
  eventSchema,
  type KnowledgeEvent,
  type Partition,
  type KnowledgeVersion,
  type Assignment,
} from "../foundation/contracts";
import { CommandConnection } from "./deadline";
import { sqlDate, sqlTimestamp, type Row } from "./codec";

const tables = new Set([
  "scope_members",
  "sources",
  "source_revisions",
  "documents",
  "versions",
  "approvals",
  "lkg_attestations",
  "health_observations",
  "publication_assignments",
  "audit_events",
  "outbox",
  "command_receipts",
  "consumer_receipts",
]);
export async function insert(
  c: CommandConnection,
  table: string,
  row: Row,
  ignore = false,
) {
  if (!tables.has(table)) throw new Error("KNOWLEDGE_STORAGE_INVALID");
  const prepared = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === "string" &&
      (key.endsWith("_at") ||
        [
          "warning_at",
          "hard_expires_at",
          "expires_at",
          "effective_from",
          "expiry_deadline",
        ].includes(key)) &&
      /^\d{4}-\d{2}-\d{2}T/.test(value)
        ? sqlTimestamp(value)
        : typeof value === "string" &&
            [
              "effective_from",
              "effective_to",
              "service_from",
              "service_to",
            ].includes(key)
          ? sqlDate(value)
          : value,
    ]),
  );
  await c.query(
    `INSERT INTO knowledge_${table} SELECT (jsonb_populate_record(NULL::knowledge_${table},$1::jsonb)).*${ignore ? " ON CONFLICT DO NOTHING" : ""}`,
    [JSON.stringify(prepared)],
  );
}
const app = (a: KnowledgeVersion["applicability"]) => ({
  payers: a.payers,
  jurisdictions: a.jurisdictions,
  macs: a.macs,
  provider_types: a.providerTypes,
  settings: a.settings,
  benefit_periods: a.benefitPeriods,
  code_editions: a.codeEditions,
  products: a.products,
  populations: a.populations,
});
const changed = (a: unknown, b: unknown) =>
  canonicalDigest(a) !== canonicalDigest(b);
export const versionRow = (
  v: KnowledgeVersion,
  healthRevision: number,
  recordedAt: string,
): Row => ({
  scope_id: v.scopeId,
  version_id: v.id,
  source_id: v.sourceId,
  source_metadata_revision: v.sourceMetadataRevision,
  document_id: v.documentId,
  upstream_edition: v.upstreamEdition,
  artifact_revision: v.artifactRevision,
  raw_hash: v.rawHash,
  normalized_hash: v.normalizedHash,
  parser_id: v.parserId,
  parser_version: v.parserVersion,
  source_url: v.sourceUrl,
  published_at: v.publishedAt,
  retrieved_at: v.retrievedAt,
  effective_from: v.effectiveFrom,
  effective_to: v.effectiveTo,
  ...app(v.applicability),
  rights_revision_id: v.rightsOverlay.rightsRevisionId,
  legacy_coverage_snapshot_id: v.legacyCoverageSnapshotId,
  registered_by_member_id: v.registeredByMemberId,
  submitted_by_member_id: v.submittedByMemberId,
  conflicts_with: v.conflictsWith,
  state: v.state,
  revision: v.revision,
  activated_at: v.activatedAt,
  revoked_at: v.revokedAt,
  revocation_reason: v.revocationReason,
  current_health_revision: healthRevision,
  recorded_at: recordedAt,
});
export const assignmentRow = (a: Assignment): Row => ({
  scope_id: a.scopeId,
  assignment_id: a.id,
  source_id: a.sourceId,
  document_id: a.documentId,
  version_id: a.versionId,
  review_manifest_digest: a.reviewManifestDigest,
  approval_id: a.approvalId,
  service_from: a.serviceFrom,
  service_to: a.serviceTo,
  ...app(a.applicability),
  enabled_uses: a.enabledUses,
  created_at: a.createdAt,
  created_by_member_id: a.createdByMemberId,
  event_id: a.eventId,
  predecessor_assignment_id: a.predecessorAssignmentId,
  revision: a.revision,
  retired_at: a.retiredAt,
  retirement_event_id: a.retirementEventId,
});
export async function persistEvent(
  c: CommandConnection,
  input: KnowledgeEvent,
  recordedAt: string,
) {
  const e = parseContract(eventSchema, input),
    body = canonicalBytes(e);
  await insert(c, "audit_events", {
    event_id: e.id,
    scope_id: e.scopeId,
    schema_version: e.schemaVersion,
    request_id: e.requestId,
    operation: e.operation,
    actor_kind: e.actorKind,
    actor_member_id: e.actorMemberId,
    system_actor_id: e.systemActorId,
    evidence_ref: e.evidenceRef,
    aggregate_kind: e.aggregateKind,
    aggregate_id: e.aggregateId,
    source_id: e.sourceId,
    version_id: e.versionId,
    assignment_id: e.assignmentId,
    previous_assignment_id: e.previousAssignmentId,
    approval_id: e.approvalId,
    previous_approval_id: e.previousApprovalId,
    logical_rights_id: e.logicalRightsId,
    rights_terms_revision: e.rightsTermsRevision,
    previous_revision: e.previousRevision,
    new_revision: e.newRevision,
    occurred_at: e.occurredAt,
    receipt_ref: e.receiptRef,
    review_manifest_digest: e.reviewManifestDigest,
    reason_code: e.reasonCode,
    invalidation: e.invalidation,
    content_removal: e.contentRemoval,
    authorization_witnesses: e.authorizationWitnesses,
    expiry_kind: e.expiryCondition?.kind ?? null,
    expiry_reference_id: e.expiryCondition?.referenceId ?? null,
    expiry_deadline: e.expiryCondition?.deadline ?? null,
    canonical_body: body,
    body_hash: canonicalDigest(e),
    recorded_at: recordedAt,
  });
  await insert(c, "outbox", {
    event_id: e.id,
    scope_id: e.scopeId,
    aggregate_kind: e.aggregateKind,
    aggregate_id: e.aggregateId,
    aggregate_revision: e.newRevision,
    available_at: recordedAt,
    attempts: 0,
    lease_token: null,
    lease_expires_at: null,
    delivered_at: null,
    dead_lettered_at: null,
    last_error_code: null,
  });
}
export async function persistDelta(
  c: CommandConnection,
  before: Partition,
  after: Partition,
  event: KnowledgeEvent | null,
  now: string,
) {
  if (!event)
    return { versionIds: [] as string[], assignmentIds: [] as string[] };
  for (const member of after.members)
    await insert(
      c,
      "scope_members",
      {
        scope_id: before.scope.id,
        member_id: member.memberId,
        recorded_at: now,
      },
      true,
    );
  for (const s of after.sources.filter(
    (s) =>
      !before.sources.some(
        (old) => old.id === s.id && old.metadataRevision === s.metadataRevision,
      ),
  )) {
    await insert(
      c,
      "sources",
      { scope_id: s.scope.id, source_id: s.id, created_at: now },
      true,
    );
    await insert(c, "source_revisions", {
      scope_id: s.scope.id,
      source_id: s.id,
      metadata_revision: s.metadataRevision,
      publisher: s.publisher,
      title: s.title,
      domain: s.domain,
      claim_types: s.claimTypes,
      official_url: s.officialUrl,
      educational_only: s.educationalOnly,
      recorded_at: now,
    });
  }
  const versionIds: string[] = [],
    assignmentIds: string[] = [],
    updatedRights = new Set<string>();
  for (const v of after.versions) {
    const old = before.versions.find((x) => x.id === v.id);
    if (old && !changed(old, v)) continue;
    versionIds.push(v.id);
    const healthChanged = !old || changed(old.health, v.health);
    if (!old) {
      await insert(
        c,
        "documents",
        {
          scope_id: v.scopeId,
          source_id: v.sourceId,
          document_id: v.documentId,
          created_at: now,
        },
        true,
      );
      await insert(c, "versions", versionRow(v, v.revision, now));
    } else {
      const update = await c.query(
        `UPDATE knowledge_versions SET state=$3,revision=$4,activated_at=$5,revoked_at=$6,
        revocation_reason=$7,submitted_by_member_id=$8,current_health_revision=CASE WHEN $9 THEN $4 ELSE current_health_revision END
        WHERE scope_id=$1 AND version_id=$2 AND revision=$10 RETURNING version_id`,
        [
          v.scopeId,
          v.id,
          v.state,
          v.revision,
          v.activatedAt,
          v.revokedAt,
          v.revocationReason,
          v.submittedByMemberId,
          healthChanged,
          old.revision,
        ],
      );
      if (update.rowCount !== 1) throw new Error("KNOWLEDGE_REVISION_CONFLICT");
    }
    if (
      old &&
      changed(old.rightsOverlay, v.rightsOverlay) &&
      !updatedRights.has(v.rightsOverlay.rightsRevisionId)
    ) {
      const update = await c.query(
        "UPDATE knowledge_rights_state SET revision=$3,revoked_at=$4 WHERE scope_id=$1 AND rights_revision_id=$2 AND revision=$5 RETURNING rights_revision_id",
        [
          v.scopeId,
          v.rightsOverlay.rightsRevisionId,
          v.rightsOverlay.revision,
          v.rightsOverlay.revokedAt,
          old.rightsOverlay.revision,
        ],
      );
      if (update.rowCount !== 1) throw new Error("KNOWLEDGE_REVISION_CONFLICT");
      updatedRights.add(v.rightsOverlay.rightsRevisionId);
    }
    for (const a of v.approvals.filter(
      (a) => !old?.approvals.some((x) => x.id === a.id),
    ))
      await insert(c, "approvals", {
        scope_id: a.scopeId,
        version_id: a.versionId,
        approval_id: a.id,
        review_manifest_digest: a.reviewManifestDigest,
        reviewer_member_id: a.reviewerMemberId,
        review_grant_id: a.reviewGrantId,
        qualification_id: a.qualificationId,
        reviewed_at: a.reviewedAt,
        review_due_at: a.reviewDueAt,
        event_id: event.id,
      });
    if (healthChanged) {
      const h = v.health;
      if (h.lkg && (!old?.health.lkg || h.lkg.id !== old.health.lkg.id)) {
        const l = h.lkg;
        const supporting = event.authorizationWitnesses.find(
          (w) => w.witnessType === "REVIEW_ATTESTATION",
        );
        if (!supporting?.attestationId)
          throw new Error("KNOWLEDGE_STORAGE_INVALID");
        await insert(c, "lkg_attestations", {
          scope_id: v.scopeId,
          version_id: v.id,
          lkg_id: l.id,
          review_manifest_digest: l.reviewManifestDigest,
          reviewer_member_id: l.reviewerMemberId,
          health_grant_id: l.healthGrantId,
          review_grant_id: l.reviewGrantId,
          qualification_id: l.qualificationId,
          supporting_approval_id: supporting.attestationId,
          approved_at: l.approvedAt,
          until_at: l.until,
          event_id: event.id,
        });
      }
      await insert(c, "health_observations", {
        scope_id: v.scopeId,
        version_id: v.id,
        version_revision: v.revision,
        state: h.state,
        checked_at: h.checkedAt,
        last_validated_at: h.lastValidatedAt,
        warning_at: h.warningAt,
        hard_expires_at: h.hardExpiresAt,
        lkg_id: h.lkg?.id ?? null,
        recorded_at: now,
        event_id: event.id,
      });
    }
  }
  for (const [items, oldItems, table, idColumn] of [
    [after.grants, before.grants, "grants", "grant_id"],
    [
      after.qualifications,
      before.qualifications,
      "qualifications",
      "qualification_id",
    ],
  ] as const) {
    for (const item of items) {
      const old = oldItems.find((x) => x.id === item.id);
      if (old && changed(old, item)) {
        const result = await c.query(
          `UPDATE knowledge_${table} SET revision=$3,revoked_at=$4 WHERE scope_id=$1 AND ${idColumn}=$2 AND revision=$5 RETURNING ${idColumn}`,
          [
            before.scope.id,
            item.id,
            item.revision,
            item.revokedAt,
            old.revision,
          ],
        );
        if (result.rowCount !== 1)
          throw new Error("KNOWLEDGE_REVISION_CONFLICT");
      }
    }
  }
  for (const a of after.assignments) {
    const old = before.assignments.find((x) => x.id === a.id);
    if (old && !changed(old, a)) continue;
    assignmentIds.push(a.id);
    if (!old) await insert(c, "publication_assignments", assignmentRow(a));
    else {
      const result = await c.query(
        "UPDATE knowledge_publication_assignments SET revision=$3,retired_at=$4,retirement_event_id=$5 WHERE scope_id=$1 AND assignment_id=$2 AND revision=$6 RETURNING assignment_id",
        [
          a.scopeId,
          a.id,
          a.revision,
          a.retiredAt,
          a.retirementEventId,
          old.revision,
        ],
      );
      if (result.rowCount !== 1) throw new Error("KNOWLEDGE_REVISION_CONFLICT");
    }
  }
  const result = await c.query(
    "UPDATE knowledge_scopes SET revision=$2 WHERE scope_id=$1 AND revision=$3 RETURNING scope_id",
    [before.scope.id, after.revision, before.revision],
  );
  if (result.rowCount !== 1) throw new Error("KNOWLEDGE_REVISION_CONFLICT");
  await persistEvent(c, event, now);
  return {
    versionIds: sortedSet(versionIds),
    assignmentIds: sortedSet(assignmentIds),
  };
}
