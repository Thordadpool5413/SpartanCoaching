import { parseContract, sortedSet } from "../foundation/canonical";
import { partitionSchema, type Partition } from "../foundation/contracts";
import { commandSchema } from "../foundation/lifecycle";
import type { z } from "zod";
import { CommandConnection } from "./deadline";
import {
  type Row,
  text,
  number,
  scopeFromRow,
  sourceFromRow,
  versionFromRows,
  grantFromRow,
  qualificationFromRow,
  assignmentFromRow,
  timestamp,
} from "./codec";
import {
  lockIdentity,
  lockReferences,
  type SessionIdentity,
} from "../control/auth";
export type Command = z.infer<typeof commandSchema>;
export interface Projection {
  state: Partition;
  actor: Awaited<ReturnType<typeof lockIdentity>>["actor"] | null;
  now: string;
  counts: {
    sources: number;
    versions: number;
    assignments: number;
    grants: number;
    qualifications: number;
    members: number;
  };
}

/** Scope lock serializes missing children. Discovery is bounded and never spans tenants. */
export async function projectCommand(
  c: CommandConnection,
  identity: SessionIdentity | null,
  scopeId: string,
  command: Command,
  synthetic: boolean,
  additionalVersionIds: string[] = [],
): Promise<Projection> {
  const scopeRow = (
    await c.query<Row>(
      "SELECT * FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
      [scopeId],
    )
  ).rows[0];
  if (!scopeRow) throw new Error("KNOWLEDGE_SCOPE_DENIED");
  const scope = scopeFromRow(scopeRow);
  const targetId =
    "versionId" in command
      ? command.versionId
      : command.operation === "REGISTER"
        ? command.version.id
        : null;
  const seed = targetId
    ? (
        await c.query<Row>(
          "SELECT * FROM knowledge_versions WHERE scope_id=$1 AND version_id=$2",
          [scopeId, targetId],
        )
      ).rows[0]
    : undefined;
  if ("versionId" in command && !seed)
    throw new Error("KNOWLEDGE_REFERENCE_INVALID");
  const sourceId =
    seed?.source_id ??
    (command.operation === "REGISTER" ? command.source.id : null);
  const documentId =
    seed?.document_id ??
    (command.operation === "REGISTER" ? command.version.documentId : null);
  const rightsId = seed?.rights_revision_id ?? null;
  const credentialOnly = ["REVOKE_GRANT", "REVOKE_QUALIFICATION"].includes(
    command.operation,
  );
  const versions = credentialOnly
    ? []
    : (
        await c.query<Row>(
          `WITH RECURSIVE selected AS (
    SELECT v.* FROM knowledge_versions v WHERE v.scope_id=$1 AND
      (v.version_id=$2 OR v.version_id=ANY($7::text[]) OR (v.source_id=$3 AND v.document_id=$4) OR ($5::boolean AND v.rights_revision_id=$6))
    UNION SELECT v.* FROM knowledge_versions v JOIN selected p ON v.scope_id=p.scope_id AND v.version_id=ANY(p.conflicts_with)
    ) SELECT * FROM selected ORDER BY version_id COLLATE "C"`,
          [
            scopeId,
            targetId,
            sourceId,
            documentId,
            command.operation === "REVOKE_RIGHTS",
            rightsId,
            additionalVersionIds,
          ],
        )
      ).rows;
  const versionIds = versions.map((v) => text(v.version_id));
  const assignments = credentialOnly
    ? []
    : (
        await c.query<Row>(
          `WITH RECURSIVE selected AS (
    SELECT p.* FROM knowledge_publication_assignments p WHERE p.scope_id=$1 AND (p.version_id=ANY($2::text[]) OR (p.source_id=$3 AND p.document_id=$4))
    UNION SELECT p.* FROM knowledge_publication_assignments p JOIN selected s ON p.scope_id=s.scope_id AND p.assignment_id=s.predecessor_assignment_id
    ) SELECT * FROM selected ORDER BY assignment_id COLLATE "C"`,
          [scopeId, versionIds, sourceId, documentId],
        )
      ).rows;
  const extraIds = sortedSet(
    assignments
      .map((a) => text(a.version_id))
      .filter((id) => !versionIds.includes(id)),
  );
  if (extraIds.length) {
    versions.push(
      ...(
        await c.query<Row>(
          'SELECT * FROM knowledge_versions WHERE scope_id=$1 AND version_id=ANY($2::text[]) ORDER BY version_id COLLATE "C"',
          [scopeId, extraIds],
        )
      ).rows,
    );
    versionIds.push(...extraIds);
  }
  const approvals = (
    await c.query<Row>(
      'SELECT * FROM knowledge_approvals WHERE scope_id=$1 AND version_id=ANY($2::text[]) ORDER BY version_id COLLATE "C",approval_id COLLATE "C"',
      [scopeId, versionIds],
    )
  ).rows;
  const health = (
    await c.query<Row>(
      'SELECT h.* FROM knowledge_health_observations h JOIN knowledge_versions v ON v.scope_id=h.scope_id AND v.version_id=h.version_id AND v.current_health_revision=h.version_revision WHERE h.scope_id=$1 AND h.version_id=ANY($2::text[]) ORDER BY h.version_id COLLATE "C"',
      [scopeId, versionIds],
    )
  ).rows;
  const lkg = (
    await c.query<Row>(
      "SELECT l.* FROM knowledge_lkg_attestations l JOIN knowledge_health_observations h ON h.scope_id=l.scope_id AND h.version_id=l.version_id AND h.lkg_id=l.lkg_id JOIN knowledge_versions v ON v.scope_id=h.scope_id AND v.version_id=h.version_id AND v.current_health_revision=h.version_revision WHERE l.scope_id=$1 AND l.version_id=ANY($2::text[])",
      [scopeId, versionIds],
    )
  ).rows;
  const rightIds = sortedSet(
    versions
      .map((v) => text(v.rights_revision_id))
      .concat(
        command.operation === "REGISTER"
          ? [command.version.rightsOverlay.rightsRevisionId]
          : [],
      ),
  );
  const terms = (
    await c.query<Row>(
      'SELECT * FROM knowledge_rights_terms WHERE scope_id=$1 AND rights_revision_id=ANY($2::text[]) ORDER BY rights_revision_id COLLATE "C"',
      [scopeId, rightIds],
    )
  ).rows;
  const credentialIds = sortedSet([
    ...approvals.map((a) => text(a.review_grant_id)),
    ...lkg.flatMap((l) => [text(l.health_grant_id), text(l.review_grant_id)]),
    ...terms.flatMap((r) =>
      r.verification_grant_id ? [text(r.verification_grant_id)] : [],
    ),
    ...(command.operation === "REVOKE_GRANT" ? [command.credentialId] : []),
  ]);
  const grants = (
    await c.query<Row>(
      `WITH RECURSIVE selected AS (
    SELECT g.* FROM knowledge_grants g WHERE g.scope_id=$1 AND (g.subject_member_id=$2 OR g.grant_id=ANY($3::text[]))
    UNION SELECT g.* FROM knowledge_grants g JOIN selected s ON g.scope_id=s.scope_id AND g.grant_id=s.parent_grant_id
    ) SELECT * FROM selected ORDER BY grant_id COLLATE "C"`,
      [scopeId, identity?.memberId ?? 0, credentialIds],
    )
  ).rows;
  const qualificationIds = sortedSet([
    ...approvals.map((a) => text(a.qualification_id)),
    ...lkg.map((l) => text(l.qualification_id)),
    ...terms.flatMap((r) =>
      r.verification_qualification_id
        ? [text(r.verification_qualification_id)]
        : [],
    ),
    ...(command.operation === "REVOKE_QUALIFICATION"
      ? [command.credentialId]
      : []),
  ]);
  const qualifications = (
    await c.query<Row>(
      'SELECT * FROM knowledge_qualifications WHERE scope_id=$1 AND (subject_member_id=$2 OR qualification_id=ANY($3::text[])) ORDER BY qualification_id COLLATE "C"',
      [scopeId, identity?.memberId ?? 0, qualificationIds],
    )
  ).rows;
  const memberIds = [
    ...new Set([
      ...(identity ? [identity.memberId] : []),
      ...versions.flatMap((v) => [
        number(v.registered_by_member_id),
        ...(v.submitted_by_member_id ? [number(v.submitted_by_member_id)] : []),
      ]),
      ...grants.flatMap((g) => [
        number(g.subject_member_id),
        number(g.granted_by_member_id),
        number(g.verified_by_member_id),
      ]),
      ...qualifications.flatMap((q) => [
        number(q.subject_member_id),
        number(q.verified_by_member_id),
      ]),
      ...terms.flatMap((r) =>
        r.verified_by_member_id ? [number(r.verified_by_member_id)] : [],
      ),
      ...assignments.map((a) => number(a.created_by_member_id)),
    ]),
  ];
  const identityState = identity
    ? await lockIdentity(c, identity, memberIds, scope, synthetic)
    : await lockReferences(c, memberIds, scope);
  // Every subsequent group uses ordinal IDs and cannot acquire a missing earlier dependency.
  if (sourceId) {
    await c.query(
      'SELECT source_id FROM knowledge_sources WHERE scope_id=$1 AND source_id=ANY($2::text[]) ORDER BY source_id COLLATE "C" FOR UPDATE',
      [
        scopeId,
        sortedSet(
          versions.map((v) => text(v.source_id)).concat(text(sourceId)),
        ),
      ],
    );
    await c.query(
      'SELECT source_id FROM knowledge_source_revisions WHERE scope_id=$1 AND source_id=ANY($2::text[]) ORDER BY source_id COLLATE "C",metadata_revision FOR UPDATE',
      [
        scopeId,
        sortedSet(
          versions.map((v) => text(v.source_id)).concat(text(sourceId)),
        ),
      ],
    );
    await c.query(
      'SELECT document_id FROM knowledge_documents WHERE scope_id=$1 AND source_id=ANY($2::text[]) ORDER BY source_id COLLATE "C",document_id COLLATE "C" FOR UPDATE',
      [
        scopeId,
        sortedSet(
          versions.map((v) => text(v.source_id)).concat(text(sourceId)),
        ),
      ],
    );
  }
  const lockedVersions = (
    await c.query<Row>(
      'SELECT * FROM knowledge_versions WHERE scope_id=$1 AND version_id=ANY($2::text[]) ORDER BY version_id COLLATE "C" FOR UPDATE',
      [scopeId, versionIds],
    )
  ).rows;
  const lockedGrants = (
    await c.query<Row>(
      'SELECT * FROM knowledge_grants WHERE scope_id=$1 AND grant_id=ANY($2::text[]) ORDER BY grant_id COLLATE "C" FOR UPDATE',
      [scopeId, grants.map((g) => text(g.grant_id))],
    )
  ).rows;
  const lockedQualifications = (
    await c.query<Row>(
      'SELECT * FROM knowledge_qualifications WHERE scope_id=$1 AND qualification_id=ANY($2::text[]) ORDER BY qualification_id COLLATE "C" FOR UPDATE',
      [scopeId, qualifications.map((q) => text(q.qualification_id))],
    )
  ).rows;
  const lockedTerms = (
    await c.query<Row>(
      'SELECT * FROM knowledge_rights_terms WHERE scope_id=$1 AND rights_revision_id=ANY($2::text[]) ORDER BY rights_revision_id COLLATE "C" FOR UPDATE',
      [scopeId, rightIds],
    )
  ).rows;
  const overlays = (
    await c.query<Row>(
      'SELECT * FROM knowledge_rights_state WHERE scope_id=$1 AND rights_revision_id=ANY($2::text[]) ORDER BY rights_revision_id COLLATE "C" FOR UPDATE',
      [scopeId, rightIds],
    )
  ).rows;
  if (
    command.operation === "REGISTER" &&
    !seed &&
    overlays.some(
      (r) =>
        r.rights_revision_id ===
          command.version.rightsOverlay.rightsRevisionId &&
        r.revoked_at !== null,
    )
  )
    throw new Error("KNOWLEDGE_LICENSE_DENIED");
  const lockedHealth = (
    await c.query<Row>(
      'SELECT h.* FROM knowledge_health_observations h JOIN knowledge_versions v ON v.scope_id=h.scope_id AND v.version_id=h.version_id AND v.current_health_revision=h.version_revision WHERE h.scope_id=$1 AND h.version_id=ANY($2::text[]) ORDER BY h.version_id COLLATE "C" FOR UPDATE OF h',
      [scopeId, versionIds],
    )
  ).rows;
  const sources = (
    await c.query<Row>(
      'SELECT s.* FROM knowledge_source_revisions s WHERE s.scope_id=$1 AND EXISTS(SELECT 1 FROM knowledge_versions v WHERE v.scope_id=s.scope_id AND v.source_id=s.source_id AND v.source_metadata_revision=s.metadata_revision AND v.version_id=ANY($2::text[])) OR (s.scope_id=$1 AND s.source_id=$3 AND s.metadata_revision=$4) ORDER BY source_id COLLATE "C",metadata_revision',
      [
        scopeId,
        versionIds,
        command.operation === "REGISTER" ? command.source.id : null,
        command.operation === "REGISTER"
          ? command.source.metadataRevision
          : null,
      ],
    )
  ).rows;
  const counts = (
    await c.query<Row>(
      `SELECT (SELECT count(*) FROM knowledge_source_revisions WHERE scope_id=$1) AS sources,
    (SELECT count(*) FROM knowledge_versions WHERE scope_id=$1) AS versions,(SELECT count(*) FROM knowledge_publication_assignments WHERE scope_id=$1) AS assignments,
    (SELECT count(*) FROM knowledge_grants WHERE scope_id=$1) AS grants,(SELECT count(*) FROM knowledge_qualifications WHERE scope_id=$1) AS qualifications,
    (SELECT count(*) FROM knowledge_scope_members WHERE scope_id=$1) AS members`,
      [scopeId],
    )
  ).rows[0];
  const state = parseContract(partitionSchema, {
    scope,
    revision: number(scopeRow.revision),
    sources: sources.map((s) => sourceFromRow(s, scope)),
    versions: lockedVersions.map((v) =>
      versionFromRows(
        v,
        lockedTerms.find((r) => r.rights_revision_id === v.rights_revision_id)!,
        overlays.find((r) => r.rights_revision_id === v.rights_revision_id)!,
        lockedHealth.find((h) => h.version_id === v.version_id)!,
        approvals.filter((a) => a.version_id === v.version_id),
        lkg.find((l) => l.version_id === v.version_id),
      ),
    ),
    assignments: assignments.map(assignmentFromRow),
    grants: lockedGrants.map(grantFromRow),
    qualifications: lockedQualifications.map(qualificationFromRow),
    members: identityState.members,
    configuration: {
      supportedPayers: scopeRow.supported_payers,
      supportedJurisdictions: scopeRow.supported_jurisdictions,
    },
  });
  return {
    state,
    actor: identityState.actor,
    now: timestamp(
      (await c.query<Row>("SELECT clock_timestamp() AS now")).rows[0].now,
    ),
    counts: {
      sources: number(counts.sources),
      versions: number(counts.versions),
      assignments: number(counts.assignments),
      grants: number(counts.grants),
      qualifications: number(counts.qualifications),
      members: number(counts.members),
    },
  };
}
