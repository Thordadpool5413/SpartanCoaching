import {
  requiredReviewer,
  reviewManifestSchema,
  sourceSchema,
  versionSchema,
  type AuthorityDomain,
  type Capability,
  type Grant,
  type KnowledgeSource,
  type KnowledgeVersion,
  type Partition,
  type Qualification,
  type Scope,
} from "./contracts";
import { canonicalDigest, fail, parseContract } from "./canonical";
import {
  assertNoOverlaps,
  validateAssignment,
  validateLineage,
} from "./publication";

export function grantEligible(
  g: Grant,
  scope: Scope,
  domain: AuthorityDomain,
  capability: Capability,
  now: string,
  synthetic = false,
): boolean {
  return (
    (synthetic || g.issuance.kind !== "SYNTHETIC_SEED") &&
    g.createdAt <= now &&
    g.scopeId === scope.id &&
    g.domains.includes(domain) &&
    g.capabilities.includes(capability) &&
    !g.revokedAt &&
    g.verifiedAt <= now &&
    g.effectiveFrom <= now &&
    now < g.expiresAt
  );
}
export function qualificationEligible(
  q: Qualification,
  p: Partition,
  subject: number,
  domain: AuthorityDomain,
  jurisdictions: readonly string[],
  now: string,
  synthetic: boolean,
  requiredClass = requiredReviewer(domain),
): boolean {
  return (
    q.subjectMemberId === subject &&
    q.scopeId === p.scope.id &&
    q.class === requiredClass &&
    q.domains.includes(domain) &&
    jurisdictions.every((j) => q.jurisdictions.includes(j)) &&
    !q.revokedAt &&
    q.verifiedAt <= now &&
    q.effectiveFrom <= now &&
    now < q.expiresAt &&
    now < q.reviewDueAt &&
    (synthetic || q.verificationMethod !== "SYNTHETIC_TEST")
  );
}
export function buildReviewManifest(
  sourceInput: unknown,
  versionInput: unknown,
) {
  const source = parseContract(sourceSchema, sourceInput);
  const v = parseContract(versionSchema, versionInput);
  if (
    source.id !== v.sourceId ||
    source.metadataRevision !== v.sourceMetadataRevision ||
    source.scope.id !== v.scopeId ||
    (source.domain === "MAC_COVERAGE" && v.applicability.macs === null)
  )
    fail("KNOWLEDGE_REFERENCE_INVALID");
  const {
    id,
    documentId,
    upstreamEdition,
    artifactRevision,
    rawHash,
    normalizedHash,
    parserId,
    parserVersion,
    sourceUrl,
    publishedAt,
    retrievedAt,
    effectiveFrom,
    effectiveTo,
    legacyCoverageSnapshotId,
    registeredByMemberId,
    submittedByMemberId,
  } = v;
  const { scope, ...sourceFields } = source;
  return parseContract(reviewManifestSchema, {
    schemaVersion: "knowledge-review-manifest-v2",
    canonicalizationVersion: "k1a-c14n-v1",
    scope,
    source: sourceFields,
    artifact: {
      id,
      documentId,
      upstreamEdition,
      artifactRevision,
      rawHash,
      normalizedHash,
      parserId,
      parserVersion,
      sourceUrl,
      publishedAt,
      retrievedAt,
      effectiveFrom,
      effectiveTo,
      legacyCoverageSnapshotId,
      registeredByMemberId,
      submittedByMemberId,
    },
    applicability: v.applicability,
    rights: v.rights,
  });
}
export const reviewManifestDigest = (
  source: KnowledgeSource,
  version: KnowledgeVersion,
) => canonicalDigest(buildReviewManifest(source, version));
// Shared semantic checks for the reducer and serialized no-op results.
/** Immutable provenance checks. Later parent revocation/departure is NOT child revocation. */
export function validateGrantAncestry(
  p: Pick<Partition, "scope" | "grants">,
): void {
  const map = new Map(p.grants.map((g) => [g.id, g]));
  if (map.size !== p.grants.length || map.size > 2000)
    fail("KNOWLEDGE_REFERENCE_INVALID");
  const checked = new Set<string>();
  for (const origin of p.grants) {
    let child = origin;
    const path = new Set<string>();
    while (!checked.has(child.id)) {
      if (path.has(child.id) || child.scopeId !== p.scope.id)
        fail("KNOWLEDGE_DELEGATION_DENIED");
      path.add(child.id);
      if (child.issuance.kind !== "DELEGATED") break;
      const parent = map.get(child.issuance.parentGrantId);
      if (
        !parent ||
        parent.scopeId !== child.scopeId ||
        parent.subjectMemberId !== child.grantedByMemberId ||
        child.verifiedByMemberId !== child.grantedByMemberId ||
        child.createdAt !== child.verifiedAt ||
        parent.createdAt > child.createdAt ||
        parent.effectiveFrom > child.createdAt ||
        parent.verifiedAt > child.createdAt ||
        child.expiresAt > parent.expiresAt ||
        child.createdAt >= parent.expiresAt ||
        (parent.revokedAt !== null && parent.revokedAt <= child.createdAt) ||
        // Revocation is the only mutable grant overlay change. A later
        // revocation advances it exactly once; other lower revisions never existed.
        child.issuance.parentGrantRevision !==
          parent.revision - (parent.revokedAt === null ? 0 : 1) ||
        !parent.capabilities.includes("knowledge.grants") ||
        !child.domains.every((d) => parent.domains.includes(d)) ||
        !child.capabilities.every((c) => parent.capabilities.includes(c))
      )
        fail("KNOWLEDGE_DELEGATION_DENIED");
      child = parent;
    }
    for (const entry of path) checked.add(entry);
  }
}
export function validateState(p: Partition, now?: string): void {
  validateGrantAncestry(p);
  const unique = (values: readonly unknown[]) =>
    new Set(values).size === values.length;
  if (
    !unique(p.sources.map((s) => `${s.id}/${s.metadataRevision}`)) ||
    !unique(p.versions.map((v) => v.id)) ||
    !unique(p.grants.map((g) => g.id)) ||
    !unique(p.qualifications.map((q) => q.id)) ||
    !unique(p.members.map((m) => m.memberId))
  )
    fail("KNOWLEDGE_REFERENCE_INVALID");
  if (
    p.sources.some((s) => s.scope.id !== p.scope.id) ||
    p.versions.some(
      (v) =>
        v.scopeId !== p.scope.id ||
        !p.sources.some(
          (s) =>
            s.id === v.sourceId &&
            s.metadataRevision === v.sourceMetadataRevision,
        ),
    ) ||
    p.grants.some((g) => g.scopeId !== p.scope.id) ||
    p.qualifications.some((q) => q.scopeId !== p.scope.id)
  )
    fail("KNOWLEDGE_REFERENCE_INVALID");
  const members = new Map(p.members.map((m) => [m.memberId, m]));
  const grants = new Map(p.grants.map((g) => [g.id, g]));
  const qualifications = new Map(p.qualifications.map((q) => [q.id, q]));
  const sources = new Map(
    p.sources.map((s) => [`${s.id}/${s.metadataRevision}`, s]),
  );
  const memberReference = (memberId: number | null) => {
    if (memberId === null) return;
    const member = members.get(memberId);
    if (
      !member ||
      (p.scope.kind === "TENANT" &&
        member.organizationId !== p.scope.organizationId)
    )
      fail("KNOWLEDGE_REFERENCE_INVALID");
  };
  // Attestations retain historical authority. Validate identity/provenance,
  // without requiring those credentials or memberships to remain active.
  const authorityReferences = (
    memberId: number | null,
    grantIds: readonly (string | null)[],
    qualificationId: string | null,
  ) => {
    memberReference(memberId);
    for (const grantId of grantIds) {
      if (grantId === null) continue;
      const grant = grants.get(grantId);
      if (!grant || grant.subjectMemberId !== memberId)
        fail("KNOWLEDGE_REFERENCE_INVALID");
    }
    if (qualificationId !== null) {
      const qualification = qualifications.get(qualificationId);
      if (!qualification || qualification.subjectMemberId !== memberId)
        fail("KNOWLEDGE_REFERENCE_INVALID");
    }
  };
  const historicalAttestation = (
    version: KnowledgeVersion,
    memberId: number,
    predicates: readonly (readonly [string, Capability])[],
    qualificationId: string,
    at: string,
    requiredClass?: Qualification["class"],
    until?: string,
  ) => {
    const source = sources.get(
      `${version.sourceId}/${version.sourceMetadataRevision}`,
    )!;
    authorityReferences(
      memberId,
      predicates.map(([id]) => id),
      qualificationId,
    );
    // Reuse current credential predicates at T, retaining later revocation as
    // historical metadata. This does not authorize current use or assert past membership.
    // Equal timestamps can be distinct serialized commands at clock precision;
    // current non-null revocation still denies all runtime use.
    for (const [id, capability] of predicates) {
      const grant = grants.get(id)!;
      if (
        (grant.revokedAt !== null && grant.revokedAt < at) ||
        !grantEligible(
          { ...grant, revokedAt: null },
          p.scope,
          source.domain,
          capability,
          at,
          true,
        ) ||
        (until !== undefined && until > grant.expiresAt)
      )
        fail("KNOWLEDGE_REFERENCE_INVALID");
    }
    const q = qualifications.get(qualificationId)!;
    if (
      (q.revokedAt !== null && q.revokedAt < at) ||
      !qualificationEligible(
        { ...q, revokedAt: null },
        p,
        memberId,
        source.domain,
        version.applicability.jurisdictions,
        at,
        true,
        requiredClass ?? requiredReviewer(source.domain),
      ) ||
      (until !== undefined && (until > q.expiresAt || until > q.reviewDueAt))
    )
      fail("KNOWLEDGE_REFERENCE_INVALID");
  };
  const rightsRecords = new Map<string, string>();
  const manifestDigests = new Map<string, string>();
  for (const version of p.versions) {
    memberReference(version.registeredByMemberId);
    memberReference(version.submittedByMemberId);
    const source = sources.get(
      `${version.sourceId}/${version.sourceMetadataRevision}`,
    )!;
    const manifest =
      version.approvals.length || version.health.lkg
        ? reviewManifestDigest(source, version)
        : null;
    if (manifest !== null) manifestDigests.set(version.id, manifest);
    for (const approval of version.approvals) {
      if (approval.reviewManifestDigest !== manifest)
        fail("KNOWLEDGE_REFERENCE_INVALID");
      historicalAttestation(
        version,
        approval.reviewerMemberId,
        [[approval.reviewGrantId, "knowledge.review"]],
        approval.qualificationId,
        approval.reviewedAt,
        undefined,
        approval.reviewDueAt,
      );
    }
    authorityReferences(
      version.rights.verifiedByMemberId,
      [version.rights.verificationGrantId],
      version.rights.verificationQualificationId,
    );
    if (version.rights.status === "APPROVED")
      historicalAttestation(
        version,
        version.rights.verifiedByMemberId!,
        [[version.rights.verificationGrantId!, "knowledge.license"]],
        version.rights.verificationQualificationId!,
        version.rights.verifiedAt!,
        "COMPLIANCE_REVIEWER",
      );
    if (version.health.lkg) {
      const lkg = version.health.lkg;
      if (lkg.reviewManifestDigest !== manifest)
        fail("KNOWLEDGE_REFERENCE_INVALID");
      historicalAttestation(
        version,
        lkg.reviewerMemberId,
        [
          [lkg.healthGrantId, "knowledge.health"],
          [lkg.reviewGrantId, "knowledge.review"],
        ],
        lkg.qualificationId,
        lkg.approvedAt,
        undefined,
        lkg.until,
      );
    }
    const key = `${version.rights.id}/${version.rights.revision}`;
    const digest = canonicalDigest({
      terms: version.rights,
      overlay: version.rightsOverlay,
    });
    if (rightsRecords.has(key) && rightsRecords.get(key) !== digest)
      fail("KNOWLEDGE_IDENTITY_CONFLICT");
    rightsRecords.set(key, digest);
  }
  for (const a of p.assignments) {
    memberReference(a.createdByMemberId);
    const v = p.versions.find((v) => v.id === a.versionId);
    if (!v) fail("KNOWLEDGE_REFERENCE_INVALID");
    validateAssignment(p, a, v, now);
    if (a.reviewManifestDigest !== manifestDigests.get(v.id))
      fail("KNOWLEDGE_REFERENCE_INVALID");
  }
  validateLineage(p);
  assertNoOverlaps(p);
}
