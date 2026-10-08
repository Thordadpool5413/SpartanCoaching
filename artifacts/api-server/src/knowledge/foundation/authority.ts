import {
  validateGrantAncestry,
  grantEligible,
  qualificationEligible,
  reviewManifestDigest,
} from "./stateValidation";
export {
  validateGrantAncestry,
  grantEligible,
  qualificationEligible,
  buildReviewManifest,
  reviewManifestDigest,
} from "./stateValidation";
import { z } from "zod";
import {
  actorSchema,
  authorizationWitnessSchema,
  authorizationWitnessesSchema,
  compareWitnesses,
  partitionSchema,
  id,
  revision,
  type AuthorizationWitness,
  grantSchema,
  scopeSchema,
  stamp,
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
import { canonicalBytes, fail, ordinal, parseContract } from "./canonical";
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
/** Ancestry must first pass validateGrantAncestry; this adds the server-context root restriction. */
export function grantContextEligible(
  p: Pick<Partition, "scope" | "grants">,
  grant: Grant,
  synthetic: boolean,
): boolean {
  if (synthetic) return true;
  let current = grant;
  const seen = new Set<string>();
  while (current.issuance.kind === "DELEGATED") {
    if (seen.has(current.id)) return false;
    seen.add(current.id);
    const parentId = current.issuance.parentGrantId;
    const parent = p.grants.find(
      (g) => g.id === parentId && g.scopeId === p.scope.id,
    );
    if (!parent) return false;
    current = parent;
  }
  return current.issuance.kind !== "SYNTHETIC_SEED";
}
export function requireCapability(
  p: Partition,
  actorInput: unknown,
  domain: AuthorityDomain,
  capability: Capability,
  now: string,
): Grant {
  const actor = parseContract(actorSchema, actorInput);
  if (!actorInScope(actor, p.scope) || !memberCurrent(p, actor.memberId))
    fail("KNOWLEDGE_SCOPE_DENIED");
  const grant = [...p.grants]
    .sort((a, b) => ordinal(a.id, b.id))
    .find(
      (g) =>
        g.subjectMemberId === actor.memberId &&
        grantContextEligible(p, g, actor.synthetic) &&
        grantEligible(g, p.scope, domain, capability, now, actor.synthetic),
    );
  if (!grant) fail("KNOWLEDGE_PERMISSION_DENIED");
  return grant;
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
    a.reviewedAt < v.retrievedAt ||
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
    grantContextEligible(p, g, synthetic) &&
    grantEligible(
      g,
      p.scope,
      source.domain,
      "knowledge.review",
      now,
      synthetic,
    ) &&
    grantEligible(
      g,
      p.scope,
      source.domain,
      "knowledge.review",
      a.reviewedAt,
      synthetic,
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
    qualificationEligible(
      q,
      p,
      a.reviewerMemberId,
      source.domain,
      v.applicability.jurisdictions,
      a.reviewedAt,
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
    grantContextEligible(p, g, synthetic) &&
    grantEligible(g, p.scope, s.domain, "knowledge.license", now, synthetic) &&
    grantEligible(
      g,
      p.scope,
      s.domain,
      "knowledge.license",
      r.verifiedAt!,
      synthetic,
    ) &&
    qualificationEligible(
      q,
      p,
      r.verifiedByMemberId,
      s.domain,
      v.applicability.jurisdictions,
      now,
      synthetic,
      "COMPLIANCE_REVIEWER",
    ) &&
    qualificationEligible(
      q,
      p,
      r.verifiedByMemberId,
      s.domain,
      v.applicability.jurisdictions,
      r.verifiedAt,
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
  const hgrant = p.grants.find(
    (g) => g.id === a.healthGrantId && g.subjectMemberId === a.reviewerMemberId,
  );
  const q = p.qualifications.find((q) => q.id === a.qualificationId);
  return g &&
    hgrant &&
    q &&
    grantContextEligible(p, g, synthetic) &&
    grantContextEligible(p, hgrant, synthetic) &&
    [now, a.approvedAt].every(
      (at) =>
        grantEligible(
          g,
          p.scope,
          s.domain,
          "knowledge.review",
          at,
          synthetic,
        ) &&
        grantEligible(
          hgrant,
          p.scope,
          s.domain,
          "knowledge.health",
          at,
          synthetic,
        ) &&
        qualificationEligible(
          q,
          p,
          a.reviewerMemberId,
          s.domain,
          v.applicability.jurisdictions,
          at,
          synthetic,
        ),
    ) &&
    a.until <= g.expiresAt &&
    a.until <= hgrant.expiresAt &&
    a.until <= q.expiresAt &&
    a.until <= q.reviewDueAt
    ? "APPLICABLE"
    : "SOURCE_UNAVAILABLE";
}

export function normalizeWitnesses(
  input: readonly AuthorizationWitness[],
): AuthorizationWitness[] {
  const unique = [
    ...new Map(input.map((w) => [canonicalBytes(w), w])).values(),
  ];
  unique.sort(compareWitnesses);
  return parseContract(authorizationWitnessesSchema, unique);
}
/** Call only after the corresponding predicate succeeded; returns an owned snapshot. */
export function authorizationWitness(
  p: Partition,
  memberId: number,
  domain: AuthorityDomain,
  capability: Capability,
  grantId: string,
  qualificationId: string | null = null,
  witnessType: AuthorizationWitness["witnessType"] = "ACTOR_CAPABILITY",
  attestationId: string | null = null,
  attestedAt: string | null = null,
): AuthorizationWitness {
  const g = p.grants.find(
    (g) =>
      g.id === grantId &&
      g.subjectMemberId === memberId &&
      g.scopeId === p.scope.id,
  );
  const q =
    qualificationId === null
      ? null
      : p.qualifications.find(
          (q) =>
            q.id === qualificationId &&
            q.subjectMemberId === memberId &&
            q.scopeId === p.scope.id,
        );
  if (!g || (qualificationId !== null && !q))
    fail("KNOWLEDGE_REFERENCE_INVALID");
  return parseContract(authorizationWitnessSchema, {
    witnessType,
    actorMemberId: memberId,
    scopeId: p.scope.id,
    domain,
    capability,
    grantId: g.id,
    grantRevision: g.revision,
    qualificationId,
    qualificationRevision: q?.revision ?? null,
    attestationId,
    attestedAt,
  });
}
export const trustedIssuanceContextSchema = z
  .object({
    actor: actorSchema,
    now: stamp,
    parentGrantId: id,
    expectedParentRevision: revision,
    newGrantId: id,
    requestId: id,
  })
  .strict();
export const grantIssuanceResultSchema = z
  .object({
    grant: grantSchema,
    authorizationWitnesses: authorizationWitnessesSchema,
  })
  .strict();
/** Trusted server input only; no API, authentication, persistence or bootstrap is performed. */
export function validateGrantDelegation(
  partitionInput: unknown,
  childInput: unknown,
  trustedIssuanceContextInput: unknown,
) {
  const ctx = parseContract(
    trustedIssuanceContextSchema,
    trustedIssuanceContextInput,
  );
  const descriptor =
    partitionInput && typeof partitionInput === "object"
      ? Object.getOwnPropertyDescriptor(partitionInput, "scope")
      : undefined;
  const scope = parseContract(
    scopeSchema,
    descriptor && "value" in descriptor ? descriptor.value : null,
  );
  if (!actorInScope(ctx.actor, scope)) fail("KNOWLEDGE_SCOPE_DENIED");
  const p = parseContract(partitionSchema, partitionInput);
  const member = p.members.find((m) => m.memberId === ctx.actor.memberId);
  if (
    !memberCurrent(p, ctx.actor.memberId) ||
    member?.organizationId !== ctx.actor.organizationId
  )
    fail("KNOWLEDGE_SCOPE_DENIED");
  const child = parseContract(grantSchema, childInput);
  validateGrantAncestry(p);
  const parent = p.grants.find(
    (g) =>
      g.id === ctx.parentGrantId && g.subjectMemberId === ctx.actor.memberId,
  );
  if (!parent) fail("KNOWLEDGE_DELEGATION_DENIED");
  if (!grantContextEligible(p, parent, ctx.actor.synthetic))
    fail("KNOWLEDGE_DELEGATION_DENIED");
  if (parent.revision !== ctx.expectedParentRevision)
    fail("KNOWLEDGE_REVISION_CONFLICT");
  if (!memberCurrent(p, child.subjectMemberId)) fail("KNOWLEDGE_SCOPE_DENIED");
  if (
    child.scopeId !== p.scope.id ||
    child.id !== ctx.newGrantId ||
    p.grants.some((g) => g.id === child.id) ||
    child.grantedByMemberId !== ctx.actor.memberId ||
    child.verifiedByMemberId !== ctx.actor.memberId ||
    child.createdAt !== ctx.now ||
    child.verifiedAt !== ctx.now ||
    child.effectiveFrom < ctx.now ||
    child.effectiveFrom < parent.effectiveFrom ||
    child.effectiveFrom < parent.verifiedAt ||
    child.expiresAt > parent.expiresAt ||
    child.revision !== 1 ||
    child.revokedAt !== null ||
    child.issuance.kind !== "DELEGATED" ||
    child.issuance.parentGrantId !== parent.id ||
    child.issuance.parentGrantRevision !== parent.revision ||
    child.issuance.requestId !== ctx.requestId
  )
    fail("KNOWLEDGE_DELEGATION_DENIED");
  const witnesses: AuthorizationWitness[] = [];
  for (const domain of child.domains)
    for (const capability of new Set([
      ...child.capabilities,
      "knowledge.grants" as const,
    ])) {
      if (
        !grantEligible(
          parent,
          p.scope,
          domain,
          capability,
          ctx.now,
          ctx.actor.synthetic,
        )
      )
        fail("KNOWLEDGE_DELEGATION_DENIED");
      witnesses.push(
        authorizationWitness(
          p,
          ctx.actor.memberId,
          domain,
          capability,
          parent.id,
        ),
      );
    }
  if (p.grants.length >= 2000) fail("KNOWLEDGE_CAPACITY_EXCEEDED");
  validateGrantAncestry({ scope: p.scope, grants: [...p.grants, child] });
  return parseContract(grantIssuanceResultSchema, {
    grant: child,
    authorizationWitnesses: normalizeWitnesses(witnesses),
  });
}
