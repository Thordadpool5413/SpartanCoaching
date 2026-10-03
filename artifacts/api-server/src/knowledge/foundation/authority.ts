import {
  actorSchema,
  grantSchema,
  reviewManifestSchema,
  requiredReviewer,
  scopeSchema,
  sourceSchema,
  stamp,
  versionSchema,
  type Actor,
  type Approval,
  type AuthorityDomain,
  type Capability,
  type Grant,
  type KnowledgeSource,
  type KnowledgeVersion,
  type Partition,
  type Purpose,
  type Qualification,
  type Scope,
} from "./contracts";
import { canonicalDigest, fail, ordinal, parseContract } from "./canonical";
export function actorInScope(actor: Actor, scope: Scope): boolean {
  return (
    actor.sessionVerified &&
    actor.membershipActive &&
    actor.organizationActive &&
    (scope.kind === "GLOBAL" || scope.organizationId === actor.organizationId)
  );
}
export function memberCurrent(p: Partition, memberId: number): boolean {
  const member = p.members.find((m) => m.memberId === memberId);
  return (
    !!member &&
    member.membershipActive &&
    member.organizationActive &&
    (p.scope.kind === "GLOBAL" ||
      member.organizationId === p.scope.organizationId)
  );
}
export function grantEligible(
  g: Grant,
  scope: Scope,
  domain: AuthorityDomain,
  capability: Capability,
  now: string,
): boolean {
  return (
    g.scopeId === scope.id &&
    g.domains.includes(domain) &&
    g.capabilities.includes(capability) &&
    !g.revokedAt &&
    g.verifiedAt <= now &&
    g.effectiveFrom <= now &&
    now < g.expiresAt
  );
}
export function requireCapability(
  p: Partition,
  actorInput: unknown,
  domain: AuthorityDomain,
  capability: Capability,
  now: string,
): Grant {
  const actor = parseContract(actorSchema, actorInput);
  if (!actorInScope(actor, p.scope)) fail("KNOWLEDGE_SCOPE_DENIED");
  const grant = [...p.grants]
    .sort((a, b) => ordinal(a.id, b.id))
    .find(
      (g) =>
        g.subjectMemberId === actor.memberId &&
        grantEligible(g, p.scope, domain, capability, now),
    );
  if (!grant) fail("KNOWLEDGE_PERMISSION_DENIED");
  return grant;
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
export function requireQualification(
  p: Partition,
  actor: Actor,
  source: KnowledgeSource,
  version: KnowledgeVersion,
  now: string,
): Qualification {
  const q = [...p.qualifications]
    .sort((a, b) => ordinal(a.id, b.id))
    .find((q) =>
      qualificationEligible(
        q,
        p,
        actor.memberId,
        source.domain,
        version.applicability.jurisdictions,
        now,
        actor.synthetic,
      ),
    );
  if (!q) fail("QUALIFIED_REVIEW_REQUIRED");
  return q;
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
export function hasCurrentApproval(
  p: Partition,
  source: KnowledgeSource,
  v: KnowledgeVersion,
  a: Approval | undefined,
  now: string,
  synthetic: boolean,
): boolean {
  if (
    !a ||
    a.versionId !== v.id ||
    a.scopeId !== p.scope.id ||
    a.reviewedAt > now ||
    a.reviewDueAt <= now ||
    v.submittedByMemberId === null ||
    a.reviewerMemberId === v.registeredByMemberId ||
    a.reviewerMemberId === v.submittedByMemberId ||
    !memberCurrent(p, a.reviewerMemberId)
  )
    return false;
  if (a.reviewManifestDigest !== reviewManifestDigest(source, v)) return false;
  const g = p.grants.find(
    (g) => g.id === a.reviewGrantId && g.subjectMemberId === a.reviewerMemberId,
  );
  const q = p.qualifications.find((q) => q.id === a.qualificationId);
  return (
    !!g &&
    !!q &&
    grantEligible(g, p.scope, source.domain, "knowledge.review", now) &&
    grantEligible(
      g,
      p.scope,
      source.domain,
      "knowledge.review",
      a.reviewedAt,
    ) &&
    qualificationEligible(
      q,
      p,
      a.reviewerMemberId,
      source.domain,
      v.applicability.jurisdictions,
      now,
      synthetic,
    ) &&
    a.reviewDueAt <= g.expiresAt &&
    a.reviewDueAt <= q.expiresAt &&
    a.reviewDueAt <= q.reviewDueAt
  );
}
export function licenseAllows(
  p: Partition,
  s: KnowledgeSource,
  v: KnowledgeVersion,
  now: string,
  purpose: Purpose,
  synthetic: boolean,
): boolean {
  const r = v.rights;
  if (
    r.status !== "APPROVED" ||
    v.rightsOverlay.revokedAt ||
    !r.commercialUse ||
    !r.permittedUses.includes(purpose) ||
    !r.effectiveFrom ||
    r.effectiveFrom > now ||
    (r.expiresAt && r.expiresAt <= now) ||
    !r.verifiedAt ||
    r.verifiedAt > now ||
    !r.verifiedByMemberId ||
    !memberCurrent(p, r.verifiedByMemberId)
  )
    return false;
  const g = p.grants.find(
    (g) =>
      g.id === r.verificationGrantId &&
      g.subjectMemberId === r.verifiedByMemberId,
  );
  const q = p.qualifications.find(
    (q) => q.id === r.verificationQualificationId,
  );
  return (
    !!g &&
    !!q &&
    grantEligible(g, p.scope, s.domain, "knowledge.license", now) &&
    grantEligible(g, p.scope, s.domain, "knowledge.license", r.verifiedAt!) &&
    qualificationEligible(
      q,
      p,
      r.verifiedByMemberId,
      s.domain,
      v.applicability.jurisdictions,
      now,
      synthetic,
      "COMPLIANCE_REVIEWER",
    )
  );
}
export function healthState(
  p: Partition,
  s: KnowledgeSource,
  v: KnowledgeVersion,
  now: string,
  synthetic: boolean,
  activation = false,
): "APPLICABLE" | "SOURCE_REVOKED" | "SOURCE_EXPIRED" | "SOURCE_UNAVAILABLE" {
  const h = v.health;
  if (v.state === "REVOKED" || v.revokedAt) return "SOURCE_REVOKED";
  if (h.state === "REVOKED") return "SOURCE_UNAVAILABLE"; // Invalid imported assertion cannot manufacture a terminal artifact.
  if (
    (h.checkedAt && h.checkedAt > now) ||
    (h.lastValidatedAt && h.lastValidatedAt > now)
  )
    return "SOURCE_UNAVAILABLE";
  if (
    h.state === "STALE_BLOCKED" ||
    (h.hardExpiresAt && h.hardExpiresAt <= now)
  )
    return "SOURCE_EXPIRED";
  if (
    h.state === "NOT_CHECKED" ||
    !h.lastValidatedAt ||
    !h.warningAt ||
    !h.hardExpiresAt
  )
    return "SOURCE_UNAVAILABLE";
  if (h.state === "CURRENT" && h.warningAt > now) return "APPLICABLE";
  if (activation) return "SOURCE_UNAVAILABLE";
  const a = h.lkg;
  if (
    !a ||
    a.approvedAt > now ||
    a.until <= now ||
    a.until > h.hardExpiresAt ||
    a.reviewManifestDigest !== reviewManifestDigest(s, v) ||
    !memberCurrent(p, a.reviewerMemberId)
  )
    return "SOURCE_UNAVAILABLE";
  const g = p.grants.find(
    (g) => g.id === a.reviewGrantId && g.subjectMemberId === a.reviewerMemberId,
  );
  const q = p.qualifications.find((q) => q.id === a.qualificationId);
  return g &&
    q &&
    grantEligible(g, p.scope, s.domain, "knowledge.review", now) &&
    qualificationEligible(
      q,
      p,
      a.reviewerMemberId,
      s.domain,
      v.applicability.jurisdictions,
      now,
      synthetic,
    )
    ? "APPLICABLE"
    : "SOURCE_UNAVAILABLE";
}
/** Issuance validation only; there is no management API or production bootstrap. */
export function validateGrantDelegation(
  parentInput: unknown,
  childInput: unknown,
  scopeInput: unknown,
  nowInput: unknown,
): void {
  const parent = parseContract(grantSchema, parentInput),
    child = parseContract(grantSchema, childInput),
    scope = parseContract(scopeSchema, scopeInput),
    now = parseContract(stamp, nowInput);
  if (
    parent.subjectMemberId !== child.grantedByMemberId ||
    child.scopeId !== scope.id ||
    parent.scopeId !== scope.id ||
    parent.revokedAt ||
    parent.effectiveFrom > now ||
    parent.verifiedAt > now ||
    now >= parent.expiresAt ||
    child.expiresAt > parent.expiresAt ||
    !child.domains.every((d) => parent.domains.includes(d)) ||
    !child.capabilities.every((c) => parent.capabilities.includes(c)) ||
    !parent.capabilities.includes("knowledge.grants")
  )
    fail("KNOWLEDGE_DELEGATION_DENIED");
}
