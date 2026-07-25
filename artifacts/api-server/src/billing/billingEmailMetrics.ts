/**
 * In-process sliding-window counter for billing email send failures.
 *
 * Each failed Resend call writes one entry here.  The `/api/admin/billing-email-health`
 * endpoint reads these counts so an operator (or smoke-health script) can detect a
 * Resend outage before it silently affects many members.
 *
 * Design notes:
 *  - Purely in-memory; resets on server restart.  That is intentional — we want to
 *    detect *ongoing* outages, not replay history.
 *  - Entries older than MAX_AGE_MS are dropped on every write and on every read, so
 *    memory stays bounded even under a sustained outage.
 *  - Thread-safety: Node.js is single-threaded; no locking needed.
 */

/** Maximum age of entries kept in memory (24 hours). */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Failure threshold for the 1-hour window that flips `ok` to false. */
export const FAILURE_THRESHOLD_1H = 3;

/** Failure threshold for the 24-hour window that flips `ok` to false. */
export const FAILURE_THRESHOLD_24H = 10;

export interface FailureEntry {
  /** Unix timestamp (ms) when the failure occurred. */
  ts: number;
  /** Email type that failed (e.g. "payment_failed", "canceled", "active"). */
  type: string;
  /** Organization ID that triggered the send attempt. */
  orgId: number;
}

/** Internal ring-buffer.  Exported only for tests. */
export const _failures: FailureEntry[] = [];

/** Prune entries older than MAX_AGE_MS.  Called automatically on write and read. */
function prune(now: number): void {
  const cutoff = now - MAX_AGE_MS;
  while (_failures.length > 0 && _failures[0]!.ts < cutoff) {
    _failures.shift();
  }
}

/**
 * Record a single billing-email failure.
 * Call this from every `catch` block in billingNotifications.ts.
 */
export function recordBillingEmailFailure(type: string, orgId: number): void {
  const now = Date.now();
  prune(now);
  _failures.push({ ts: now, type, orgId });
}

export interface BillingEmailMetrics {
  /** True when both window counts are below their respective thresholds. */
  ok: boolean;
  /** Number of failures in the last 60 minutes. */
  failures1h: number;
  /** Number of failures in the last 24 hours. */
  failures24h: number;
  /** Threshold at which ok flips to false for the 1-hour window. */
  threshold1h: number;
  /** Threshold at which ok flips to false for the 24-hour window. */
  threshold24h: number;
  /** Breakdown by email type for the last 24-hour window. */
  byType: Record<string, number>;
  /** ISO timestamp of the most recent failure, or null if none recorded. */
  lastFailureAt: string | null;
}

/**
 * Compute and return current billing-email failure metrics.
 * Does not throw.
 */
export function getBillingEmailMetrics(): BillingEmailMetrics {
  const now = Date.now();
  prune(now);

  const cutoff1h = now - 60 * 60 * 1000;

  let failures1h = 0;
  const byType: Record<string, number> = {};

  for (const entry of _failures) {
    // All entries are within 24h after prune()
    byType[entry.type] = (byType[entry.type] ?? 0) + 1;
    if (entry.ts >= cutoff1h) {
      failures1h++;
    }
  }

  const failures24h = _failures.length;
  const lastEntry = _failures[_failures.length - 1] ?? null;

  return {
    ok: failures1h < FAILURE_THRESHOLD_1H && failures24h < FAILURE_THRESHOLD_24H,
    failures1h,
    failures24h,
    threshold1h: FAILURE_THRESHOLD_1H,
    threshold24h: FAILURE_THRESHOLD_24H,
    byType,
    lastFailureAt: lastEntry ? new Date(lastEntry.ts).toISOString() : null,
  };
}

/** Reset the counter.  Only used in tests. */
export function _resetMetrics(): void {
  _failures.length = 0;
}
