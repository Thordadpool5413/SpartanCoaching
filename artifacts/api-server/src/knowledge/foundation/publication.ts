import {
  type Applicability,
  type Assignment,
  type KnowledgeVersion,
  type Partition,
} from "./contracts";
import { fail } from "./canonical";
export const dimensions = [
  "payers",
  "jurisdictions",
  "macs",
  "providerTypes",
  "settings",
  "benefitPeriods",
  "codeEditions",
  "products",
  "populations",
] as const;
export function applicabilitySubset(
  child: Applicability,
  parent: Applicability,
): boolean {
  return dimensions.every(
    (key) =>
      parent[key] === null ||
      (child[key] !== null &&
        child[key]!.every((value) => parent[key]!.includes(value as never))),
  );
}
export function applicabilityIntersects(
  a: Applicability,
  b: Applicability,
): boolean {
  return dimensions.every(
    (key) =>
      a[key] === null ||
      b[key] === null ||
      a[key]!.some((value) => b[key]!.includes(value as never)),
  );
}
export const intervalSubset = (
  from: string,
  to: string | null,
  parentFrom: string,
  parentTo: string | null,
) =>
  from >= parentFrom && (parentTo === null || (to !== null && to <= parentTo));
export const intervalIntersects = (a: Assignment, b: Assignment) =>
  (a.serviceTo === null || b.serviceFrom < a.serviceTo) &&
  (b.serviceTo === null || a.serviceFrom < b.serviceTo);
export const assignmentsConflict = (a: Assignment, b: Assignment) =>
  a.scopeId === b.scopeId &&
  a.sourceId === b.sourceId &&
  a.documentId === b.documentId &&
  intervalIntersects(a, b) &&
  applicabilityIntersects(a.applicability, b.applicability);
export function validateAssignment(
  p: Partition,
  a: Assignment,
  v: KnowledgeVersion,
  now?: string,
): void {
  const approval = v.approvals.find((review) => review.id === a.approvalId);
  if (!approval) fail("KNOWLEDGE_REFERENCE_INVALID");
  if (
    v.publishedAt > v.retrievedAt ||
    v.retrievedAt > approval.reviewedAt ||
    approval.reviewedAt > a.createdAt ||
    (now !== undefined && a.createdAt > now)
  )
    fail("KNOWLEDGE_PUBLICATION_CHRONOLOGY_INVALID");
  if (
    a.scopeId !== p.scope.id ||
    v.scopeId !== p.scope.id ||
    a.sourceId !== v.sourceId ||
    a.documentId !== v.documentId ||
    a.versionId !== v.id ||
    !intervalSubset(
      a.serviceFrom,
      a.serviceTo,
      v.effectiveFrom,
      v.effectiveTo,
    ) ||
    !applicabilitySubset(a.applicability, v.applicability) ||
    !a.enabledUses.every((u) => v.rights.permittedUses.includes(u)) ||
    !["ACTIVE", "SUPERSEDED", "REVOKED"].includes(v.state)
  )
    fail("KNOWLEDGE_REFERENCE_INVALID");
}
export function validateLineage(
  p: Pick<Partition, "scope" | "assignments">,
): void {
  const map = new Map(p.assignments.map((a) => [a.id, a]));
  if (map.size !== p.assignments.length) fail("KNOWLEDGE_REFERENCE_INVALID");
  for (const a of p.assignments) {
    const seen = new Set([a.id]);
    let current = a;
    if (a.scopeId !== p.scope.id) fail("KNOWLEDGE_REFERENCE_INVALID");
    while (current.predecessorAssignmentId !== null) {
      const previous = map.get(current.predecessorAssignmentId);
      if (
        !previous ||
        seen.has(previous.id) ||
        previous.scopeId !== a.scopeId ||
        previous.sourceId !== a.sourceId ||
        previous.documentId !== a.documentId ||
        !previous.retiredAt ||
        previous.createdAt > current.createdAt ||
        previous.retiredAt > current.createdAt
      )
        fail("KNOWLEDGE_LINEAGE_INVALID");
      seen.add(previous.id);
      current = previous;
    }
  }
}
export function assertNoOverlaps(p: Partition): void {
  const current = p.assignments.filter((a) => !a.retiredAt);
  for (let i = 0; i < current.length; i++)
    for (let j = i + 1; j < current.length; j++)
      if (assignmentsConflict(current[i], current[j]))
        fail("KNOWLEDGE_PUBLICATION_CONFLICT");
}
