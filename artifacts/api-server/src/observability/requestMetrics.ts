/**
 * In-process HTTP latency + error counters (HSP-43).
 * No request bodies or query strings stored — path templates only.
 */

import { isAiPath } from "./reliabilityTargets";

const MAX_SAMPLES = 500;
const startedAt = Date.now();

type Sample = { ms: number; status: number; ai: boolean; at: number };

const samples: Sample[] = [];
let totalRequests = 0;
let total5xx = 0;

function pushSample(s: Sample): void {
  samples.push(s);
  while (samples.length > MAX_SAMPLES) samples.shift();
  totalRequests += 1;
  if (s.status >= 500) total5xx += 1;
}

/** Record one completed HTTP request (path without query). */
export function recordHttpRequest(opts: {
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
}): void {
  const pathOnly = (opts.path || "/").split("?")[0] || "/";
  pushSample({
    ms: Math.max(0, Math.round(opts.durationMs)),
    status: opts.statusCode,
    ai: isAiPath(pathOnly),
    at: Date.now(),
  });
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx]!;
}

function windowSamples(windowMs: number): Sample[] {
  const cut = Date.now() - windowMs;
  return samples.filter((s) => s.at >= cut);
}

export type RequestMetricsSnapshot = {
  uptimeSec: number;
  sampleCount: number;
  totalRequests: number;
  total5xx: number;
  errorRate: number | null;
  /** Last ~5 minutes of samples in buffer */
  windowMs: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p95AiMs: number | null;
  p95NonAiMs: number | null;
  memory: {
    rssMb: number;
    heapUsedMb: number;
  };
};

export function getRequestMetricsSnapshot(windowMs = 5 * 60 * 1000): RequestMetricsSnapshot {
  const win = windowSamples(windowMs);
  const allMs = win.map((s) => s.ms).sort((a, b) => a - b);
  const aiMs = win.filter((s) => s.ai).map((s) => s.ms).sort((a, b) => a - b);
  const nonAiMs = win.filter((s) => !s.ai).map((s) => s.ms).sort((a, b) => a - b);
  const errInWindow = win.filter((s) => s.status >= 500).length;
  const mem = process.memoryUsage();

  return {
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    sampleCount: win.length,
    totalRequests,
    total5xx,
    errorRate: win.length ? errInWindow / win.length : null,
    windowMs,
    p50Ms: percentile(allMs, 50),
    p95Ms: percentile(allMs, 95),
    p95AiMs: percentile(aiMs, 95),
    p95NonAiMs: percentile(nonAiMs, 95),
    memory: {
      rssMb: Math.round((mem.rss / (1024 * 1024)) * 10) / 10,
      heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10,
    },
  };
}

/** Test helper — clear in-memory counters. */
export function _resetRequestMetrics(): void {
  samples.length = 0;
  totalRequests = 0;
  total5xx = 0;
}
