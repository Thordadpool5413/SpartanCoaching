import { z } from "zod/v4";

export const FIELD_WORK_HEALTH_EVENT_NAMES = [
  "workspace_handoff",
  "field_work_handoff",
  "handoff",
  "save_retry_failure",
  "save_retry_failed",
  "retry_failure",
  "sync_unavailable",
  "sync_unavailable_failure",
  "completion",
  "field_work_completion",
  "workflow_completion",
  "tool_completion",
  "consultation_booking_fallback",
  "consultation_fallback",
] as const;

export type FieldWorkHealthMetric =
  | "handoffs"
  | "saveRetryFailures"
  | "syncUnavailable"
  | "completions"
  | "consultationFallbacks";

export type FieldWorkHealthEventRow = {
  createdAt: number;
  eventType: string;
  eventName: string;
  metadata: string | null;
  organizationId: number | null;
};

export type FieldWorkHealthBucket = {
  day: string;
  platform: string;
  eventCount: number;
  handoffs: number;
  saveRetryFailures: number;
  syncUnavailable: number;
  completions: number;
  consultationFallbacks: number;
  handoffRate: number;
  saveRetryFailureRate: number;
  syncUnavailableRate: number;
  completionRate: number;
  consultationFallbackRate: number;
};

type FieldWorkHealthCounts = {
  eventCount: number;
  handoffs: number;
  saveRetryFailures: number;
  syncUnavailable: number;
  completions: number;
  consultationFallbacks: number;
};

type FieldWorkHealthRates = {
  handoffRate: number;
  saveRetryFailureRate: number;
  syncUnavailableRate: number;
  completionRate: number;
  consultationFallbackRate: number;
};

export const fieldWorkHealthResponseSchema = z.object({
  enabled: z.boolean(),
  retentionDays: z.number().int().positive(),
  generatedAt: z.string().datetime({ offset: true }),
  tenantScope: z.object({
    type: z.enum(["all", "organization"]),
    organizationId: z.number().int().positive().nullable(),
  }),
  rows: z.array(z.object({
    day: z.string(),
    platform: z.string(),
    eventCount: z.number().int().nonnegative(),
    handoffs: z.number().int().nonnegative(),
    saveRetryFailures: z.number().int().nonnegative(),
    syncUnavailable: z.number().int().nonnegative(),
    completions: z.number().int().nonnegative(),
    consultationFallbacks: z.number().int().nonnegative(),
    handoffRate: z.number().nonnegative(),
    saveRetryFailureRate: z.number().nonnegative(),
    syncUnavailableRate: z.number().nonnegative(),
    completionRate: z.number().nonnegative(),
    consultationFallbackRate: z.number().nonnegative(),
  })),
  totals: z.object({
    eventCount: z.number().int().nonnegative(),
    handoffs: z.number().int().nonnegative(),
    saveRetryFailures: z.number().int().nonnegative(),
    syncUnavailable: z.number().int().nonnegative(),
    completions: z.number().int().nonnegative(),
    consultationFallbacks: z.number().int().nonnegative(),
    handoffRate: z.number().nonnegative(),
    saveRetryFailureRate: z.number().nonnegative(),
    syncUnavailableRate: z.number().nonnegative(),
    completionRate: z.number().nonnegative(),
    consultationFallbackRate: z.number().nonnegative(),
  }),
});

export type FieldWorkHealthResponse = z.infer<typeof fieldWorkHealthResponseSchema>;

const EVENT_TYPE_NAMES: Record<FieldWorkHealthMetric, Set<string>> = {
  handoffs: new Set(["workspace_handoff", "field_work_handoff", "handoff"]),
  saveRetryFailures: new Set(["save_retry_failure", "save_retry_failed", "retry_failure"]),
  syncUnavailable: new Set(["sync_unavailable", "sync_unavailable_failure"]),
  completions: new Set([
    "completion",
    "field_work_completion",
    "workflow_completion",
    "tool_completion",
  ]),
  consultationFallbacks: new Set(["consultation_booking_fallback", "consultation_fallback"]),
};

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

function platformFromMetadata(row: FieldWorkHealthEventRow): string {
  let metadata: Record<string, unknown> = {};
  if (row.metadata) {
    try {
      const parsed = JSON.parse(row.metadata) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      }
    } catch {
      // Metadata is already sanitized at ingestion; an old malformed row is
      // still safe to aggregate as unknown rather than failing the dashboard.
    }
  }
  const raw = typeof metadata.platform === "string"
    ? metadata.platform
    : typeof metadata.surface === "string"
      ? metadata.surface
      : row.eventType === "public_funnel"
        ? "web"
        : "unknown";
  const normalized = raw.toLowerCase();
  if (normalized === "ios" || normalized === "mobile") return "ios";
  if (normalized === "web" || normalized === "browser") return "web";
  if (normalized === "android") return "android";
  return "unknown";
}

function metricForEvent(row: FieldWorkHealthEventRow): FieldWorkHealthMetric | null {
  for (const [metric, names] of Object.entries(EVENT_TYPE_NAMES) as Array<
    [FieldWorkHealthMetric, Set<string>]
  >) {
    if (!names.has(row.eventName)) continue;
    if (
      row.eventType === "field_work" ||
      row.eventType === "product_outcome" ||
      row.eventType === "public_funnel"
    ) {
      return metric;
    }
  }
  return null;
}

function withRates(
  counts: FieldWorkHealthCounts,
): FieldWorkHealthCounts & FieldWorkHealthRates {
  const denominator = counts.eventCount;
  const rate = (value: number) => denominator ? roundRate((value / denominator) * 100) : 0;
  return {
    ...counts,
    handoffRate: rate(counts.handoffs),
    saveRetryFailureRate: rate(counts.saveRetryFailures),
    syncUnavailableRate: rate(counts.syncUnavailable),
    completionRate: rate(counts.completions),
    consultationFallbackRate: rate(counts.consultationFallbacks),
  };
}

function emptyCounts(): FieldWorkHealthCounts {
  return {
    eventCount: 0,
    handoffs: 0,
    saveRetryFailures: 0,
    syncUnavailable: 0,
    completions: 0,
    consultationFallbacks: 0,
  };
}

export function fieldWorkHealthEventNames(): string[] {
  return [...FIELD_WORK_HEALTH_EVENT_NAMES];
}

export function isFieldWorkHealthEnabled(): boolean {
  const value = process.env.FIELD_WORK_HEALTH_ANALYTICS_ENABLED?.trim().toLowerCase();
  return value !== "false" && value !== "0" && value !== "off";
}

export function aggregateFieldWorkHealth(
  rows: FieldWorkHealthEventRow[],
  tenantScope: FieldWorkHealthResponse["tenantScope"],
  retentionDays: number,
  generatedAt = new Date().toISOString(),
): FieldWorkHealthResponse {
  const buckets = new Map<string, FieldWorkHealthCounts>();

  for (const row of rows) {
    const metric = metricForEvent(row);
    if (!metric) continue;
    const day = new Date(row.createdAt).toISOString().slice(0, 10);
    const platform = platformFromMetadata(row);
    const key = `${day}:${platform}`;
    const current = buckets.get(key) ?? emptyCounts();
    current.eventCount += 1;
    current[metric] += 1;
    buckets.set(key, current);
  }

  const rowsWithRates = [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, counts]) => {
      const separator = key.indexOf(":");
      const day = key.slice(0, separator);
      const platform = key.slice(separator + 1);
      return { day, platform, ...withRates(counts) };
    });

  const totalCounts = rowsWithRates.reduce((totals, row) => {
    totals.eventCount += row.eventCount;
    totals.handoffs += row.handoffs;
    totals.saveRetryFailures += row.saveRetryFailures;
    totals.syncUnavailable += row.syncUnavailable;
    totals.completions += row.completions;
    totals.consultationFallbacks += row.consultationFallbacks;
    return totals;
  }, emptyCounts());

  return fieldWorkHealthResponseSchema.parse({
    enabled: true,
    retentionDays,
    generatedAt,
    tenantScope,
    rows: rowsWithRates,
    totals: withRates(totalCounts),
  });
}

export function disabledFieldWorkHealth(
  tenantScope: FieldWorkHealthResponse["tenantScope"],
  retentionDays: number,
  generatedAt = new Date().toISOString(),
): FieldWorkHealthResponse {
  const counts = emptyCounts();
  return fieldWorkHealthResponseSchema.parse({
    enabled: false,
    retentionDays,
    generatedAt,
    tenantScope,
    rows: [],
    totals: withRates(counts),
  });
}