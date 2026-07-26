/**
 * Sliding-window counter for billing email send failures.
 *
 * Each failed Resend call writes one entry here AND persists it to the
 * `authEvents` table (type = "billing_email_failed") so counts survive a
 * server restart or redeploy that occurs during an active Resend outage.
 *
 * On startup call `hydrateBillingEmailMetrics()` to backfill the in-memory
 * buffer from the last 24 hours of persisted events.
 *
 * Design notes:
 *  - In-memory buffer is the hot-path for reads (getBillingEmailMetrics is
 *    synchronous and never touches the DB).
 *  - DB writes are fire-and-forget: a write failure only produces a warning
 *    log; the in-memory counter is always updated first.
 *  - Hydration deduplicates by timestamp so calling it multiple times is safe.
 *  - Thread-safety: Node.js is single-threaded; no locking needed.
 */

import { eq, and, gte } from "drizzle-orm";
import { db } from "../db";
import { authEvents } from "@workspace/db";

/** Maximum age of entries kept in memory (24 hours). */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Event type stored in auth_events for billing email failures. */
const DB_EVENT_TYPE = "billing_email_failed";

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

/**
 * Whether `hydrateBillingEmailMetrics` has completed its first run.
 *
 * There is a short window after the server starts listening where this is
 * `false` and `getBillingEmailMetrics()` may therefore return zero counts even
 * if failures exist in the database.  The health route exposes this flag so
 * callers can distinguish "no failures" from "not yet hydrated".
 */
let _hydrationComplete = false;

/** Returns true once the startup hydration pass has finished (or failed). */
export function isHydrationComplete(): boolean {
  return _hydrationComplete;
}

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
 *
 * The in-memory buffer is updated synchronously; the DB write is
 * fire-and-forget (never throws).
 */
export function recordBillingEmailFailure(type: string, orgId: number): void {
  const now = Date.now();
  prune(now);
  _failures.push({ ts: now, type, orgId });

  // Persist to DB so counts survive a server restart.
  db.insert(authEvents)
    .values({
      memberId: null,
      type: DB_EVENT_TYPE,
      meta: { emailType: type, orgId },
    })
    .catch((err: unknown) => {
      console.warn(
        "[billingEmailMetrics] Failed to persist failure to DB:",
        (err as Error)?.message ?? err,
      );
    });
}

/**
 * Backfill the in-memory buffer from the last 24 hours of persisted
 * billing_email_failed events in the authEvents table.
 *
 * Call once at server startup (after the DB connection is ready).
 * Safe to call multiple times — deduplicates by createdAt timestamp.
 * Never throws; logs a warning if the DB query fails.
 */
export async function hydrateBillingEmailMetrics(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - MAX_AGE_MS);
    const rows = await db
      .select()
      .from(authEvents)
      .where(and(eq(authEvents.type, DB_EVENT_TYPE), gte(authEvents.createdAt, cutoff)));

    if (rows.length === 0) return;

    // Build a set of timestamps already in the buffer to avoid duplicates
    // (e.g. if hydrate is called more than once, or a failure was recorded
    // in-memory and then persisted before hydration ran — unlikely in practice
    // but safe to handle).
    const existingTs = new Set(_failures.map((f) => f.ts));

    for (const row of rows) {
      const ts = row.createdAt.getTime();
      if (!existingTs.has(ts)) {
        const meta = row.meta as { emailType?: string; orgId?: number } | null;
        _failures.push({
          ts,
          type: meta?.emailType ?? "unknown",
          orgId: meta?.orgId ?? 0,
        });
      }
    }

    // Keep the buffer sorted oldest-first (prune() assumes this ordering).
    _failures.sort((a, b) => a.ts - b.ts);

    // Drop anything now older than the window.
    prune(Date.now());

    console.info(
      `[billingEmailMetrics] Hydrated ${rows.length} failure(s) from DB (buffer size: ${_failures.length})`,
    );
  } catch (err: unknown) {
    console.warn(
      "[billingEmailMetrics] Hydration from DB failed (in-memory counter starts at zero):",
      (err as Error)?.message ?? err,
    );
  } finally {
    // Always mark hydration complete — even on failure — so the health route
    // can distinguish "no failures" from "not yet checked the DB".
    _hydrationComplete = true;
  }
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

/** Reset the counter and hydration state.  Only used in tests. */
export function _resetMetrics(): void {
  _failures.length = 0;
  _hydrationComplete = false;
}
