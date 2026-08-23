import type { MemberSyncMutation } from "@workspace/db";

type ExistingSyncVersion = Pick<MemberSyncMutation, "mutationId" | "clientUpdatedAt">;

/**
 * Last-write-wins on client timestamp; mutation ID breaks equal timestamps.
 * The deterministic tie-breaker means two devices converge even when their
 * clocks produce the same ISO timestamp. Server timestamps are audit-only.
 */
export function shouldApplyMemberSyncMutation(
  existing: ExistingSyncVersion | null,
  incoming: ExistingSyncVersion,
): boolean {
  if (!existing) return true;
  const previous = Date.parse(existing.clientUpdatedAt);
  const next = Date.parse(incoming.clientUpdatedAt);
  if (next !== previous) return next > previous;
  return incoming.mutationId.localeCompare(existing.mutationId) > 0;
}