export type TimestampedContinuityValue = { updatedAt: string };

export function mergeTimestampedRecords<T extends TimestampedContinuityValue>(
  left: Record<string, T>,
  right: Record<string, T>,
): Record<string, T> {
  const merged: Record<string, T> = {};
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const local = left[key];
    const remote = right[key];
    if (!local) merged[key] = remote;
    else if (!remote) merged[key] = local;
    else merged[key] = Date.parse(local.updatedAt) >= Date.parse(remote.updatedAt) ? local : remote;
  }
  return merged;
}