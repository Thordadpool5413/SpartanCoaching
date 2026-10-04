import type { Partition } from "./contracts";
import { canonicalDigest, fail } from "./canonical";
import {
  assertNoOverlaps,
  validateAssignment,
  validateLineage,
} from "./publication";

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
  const rightsRecords = new Map<string, string>();
  for (const version of p.versions) {
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
    const v = p.versions.find((v) => v.id === a.versionId);
    if (!v) fail("KNOWLEDGE_REFERENCE_INVALID");
    validateAssignment(p, a, v, now);
  }
  validateLineage(p);
  assertNoOverlaps(p);
}
