/** Bounded process-local measurements. No actor, scope ID, key, token, URL or content labels. */
const names = [
  "command_ms",
  "pool_wait_ms",
  "lock_wait_ms",
  "replay",
  "conflict",
  "deadline",
  "outcome_unknown",
  "unavailable",
  "outbox_lag_ms",
  "outbox_claim",
  "outbox_retry",
  "outbox_dead_letter",
  "outbox_stale_lease",
] as const;
type Name = (typeof names)[number];
const values = new Map<
  Name,
  { count: number; total: number; max: number; samples: number[] }
>();
export function recordKnowledgeMetric(name: Name, value = 1): void {
  if (!names.includes(name) || !Number.isFinite(value) || value < 0) return;
  const row = values.get(name) ?? { count: 0, total: 0, max: 0, samples: [] };
  row.count++;
  row.total += value;
  row.max = Math.max(row.max, value);
  row.samples.push(value);
  if (row.samples.length > 500) row.samples.shift();
  values.set(name, row);
}
export function knowledgeMetricsSnapshot() {
  return Object.fromEntries(
    [...values].map(([name, row]) => {
      const sorted = [...row.samples].sort((a, b) => a - b);
      return [
        name,
        {
          count: row.count,
          total: row.total,
          max: row.max,
          sampleCount: sorted.length,
          p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null,
        },
      ];
    }),
  );
}
