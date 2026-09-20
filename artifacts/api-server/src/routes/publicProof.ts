const INTERNAL_PROOF_FIELDS = new Set([
  "approvalStatus",
  "approvalReference",
  "approvalScope",
  "approvedAt",
  "createdAt",
]);

export function serializePublicProofRecord<T extends Record<string, unknown>>(
  record: T,
): Omit<T, "approvalStatus" | "approvalReference" | "approvalScope" | "approvedAt" | "createdAt"> {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !INTERNAL_PROOF_FIELDS.has(key)),
  ) as Omit<T, "approvalStatus" | "approvalReference" | "approvalScope" | "approvedAt" | "createdAt">;
}
