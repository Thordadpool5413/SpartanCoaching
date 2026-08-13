/**
 * Measurable nonfunctional targets (HSP-43).
 * Code-defined SLOs — not aspirational marketing numbers.
 * Live API metrics compare against these; client targets are contracts for Lighthouse/TestFlight measurement.
 */

export type TargetOwner = "platform_ops" | "web" | "ios" | "api";

export type ReliabilityTarget = {
  id: string;
  surface: "api" | "web" | "ios" | "shared";
  metric: string;
  /** Primary threshold (ms unless unit says otherwise) */
  target: number;
  /** Alert when worse than this */
  alert: number;
  unit: "ms" | "ratio" | "score" | "mb" | "count";
  owner: TargetOwner;
  notes: string;
};

/**
 * Reliability / performance targets used for health, alerts, and ops reviews.
 * Ownership: platform_ops owns API health + paging; web/ios own client measurements.
 */
export const RELIABILITY_TARGETS: ReliabilityTarget[] = [
  {
    id: "api.healthz_latency",
    surface: "api",
    metric: "healthz_response_ms",
    target: 200,
    alert: 500,
    unit: "ms",
    owner: "platform_ops",
    notes: "Liveness should stay fast under load.",
  },
  {
    id: "api.request_p95",
    surface: "api",
    metric: "http_request_duration_p95_ms",
    target: 800,
    alert: 2000,
    unit: "ms",
    owner: "api",
    notes: "Non-AI authenticated API routes (excludes long AI generations).",
  },
  {
    id: "api.ai_p95",
    surface: "api",
    metric: "ai_request_duration_p95_ms",
    target: 15_000,
    alert: 45_000,
    unit: "ms",
    owner: "api",
    notes: "AI tool generations are slower by design; still bounded.",
  },
  {
    id: "api.error_rate",
    surface: "api",
    metric: "http_5xx_ratio_5m",
    target: 0.01,
    alert: 0.05,
    unit: "ratio",
    owner: "platform_ops",
    notes: "5xx / total requests rolling window.",
  },
  {
    id: "web.lcp",
    surface: "web",
    metric: "largest_contentful_paint_ms",
    target: 2500,
    alert: 4000,
    unit: "ms",
    owner: "web",
    notes: "Core Web Vital — measure with Lighthouse/field data on key landers + portal.",
  },
  {
    id: "web.cls",
    surface: "web",
    metric: "cumulative_layout_shift",
    target: 0.1,
    alert: 0.25,
    unit: "score",
    owner: "web",
    notes: "Core Web Vital CLS.",
  },
  {
    id: "web.inp",
    surface: "web",
    metric: "interaction_to_next_paint_ms",
    target: 200,
    alert: 500,
    unit: "ms",
    owner: "web",
    notes: "Core Web Vital INP (interaction responsiveness).",
  },
  {
    id: "web.bundle_main",
    surface: "web",
    metric: "main_js_transfer_kb",
    target: 400,
    alert: 700,
    unit: "count",
    owner: "web",
    notes: "Approximate main-chunk transfer size budget (gzipped); verify on build report.",
  },
  {
    id: "ios.cold_start",
    surface: "ios",
    metric: "cold_launch_to_interactive_ms",
    target: 3000,
    alert: 6000,
    unit: "ms",
    owner: "ios",
    notes: "Time from process start to first interactive screen (TestFlight instruments).",
  },
  {
    id: "ios.memory_steady",
    surface: "ios",
    metric: "steady_state_memory_mb",
    target: 250,
    alert: 400,
    unit: "mb",
    owner: "ios",
    notes: "Steady-state after portal + one tool; investigate leaks above alert.",
  },
];

export function getTarget(id: string): ReliabilityTarget | undefined {
  return RELIABILITY_TARGETS.find((t) => t.id === id);
}

/** Paths classified as AI (longer latency budget). */
export function isAiPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return (
    p.includes("/api/ai") ||
    p.includes("/api/tools/") ||
    p.includes("roleplay") ||
    p.includes("openai") ||
    p.includes("/api/v1/ai")
  );
}

export type AlertEvaluation = {
  targetId: string;
  observed: number;
  target: number;
  alert: number;
  status: "ok" | "watch" | "alert";
  owner: TargetOwner;
};

/**
 * Compare an observed sample to target/alert bands.
 * For ratio/score metrics where lower is better (all current targets), higher observed is worse.
 */
export function evaluateAgainstTarget(
  targetId: string,
  observed: number,
): AlertEvaluation | null {
  const t = getTarget(targetId);
  if (!t) return null;
  let status: AlertEvaluation["status"] = "ok";
  if (observed >= t.alert) status = "alert";
  else if (observed > t.target) status = "watch";
  return {
    targetId,
    observed,
    target: t.target,
    alert: t.alert,
    status,
    owner: t.owner,
  };
}
