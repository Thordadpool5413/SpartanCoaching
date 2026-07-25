/**
 * Unit tests for the billingEmailMetrics sliding-window counter.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// ── mock the DB module so no real connection is required ─────────────────────
vi.mock("../db", () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
  },
}));

// ── mock the @workspace/db schema import ─────────────────────────────────────
vi.mock("@workspace/db", () => ({
  authEvents: {},
}));

import {
  recordBillingEmailFailure,
  getBillingEmailMetrics,
  hydrateBillingEmailMetrics,
  _resetMetrics,
  _failures,
  FAILURE_THRESHOLD_1H,
  FAILURE_THRESHOLD_24H,
} from "./billingEmailMetrics";

describe("billingEmailMetrics", () => {
  beforeEach(() => {
    _resetMetrics();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getBillingEmailMetrics — empty state", () => {
    it("returns ok:true with zero counts when no failures recorded", () => {
      const m = getBillingEmailMetrics();
      expect(m.ok).toBe(true);
      expect(m.failures1h).toBe(0);
      expect(m.failures24h).toBe(0);
      expect(m.lastFailureAt).toBeNull();
      expect(m.byType).toEqual({});
    });

    it("exposes the configured thresholds", () => {
      const m = getBillingEmailMetrics();
      expect(m.threshold1h).toBe(FAILURE_THRESHOLD_1H);
      expect(m.threshold24h).toBe(FAILURE_THRESHOLD_24H);
    });
  });

  describe("recordBillingEmailFailure", () => {
    it("increments failures1h and failures24h", () => {
      recordBillingEmailFailure("payment_failed", 1);
      const m = getBillingEmailMetrics();
      expect(m.failures1h).toBe(1);
      expect(m.failures24h).toBe(1);
    });

    it("tracks byType breakdown", () => {
      recordBillingEmailFailure("payment_failed", 1);
      recordBillingEmailFailure("payment_failed", 2);
      recordBillingEmailFailure("canceled", 3);
      const m = getBillingEmailMetrics();
      expect(m.byType).toEqual({ payment_failed: 2, canceled: 1 });
    });

    it("sets lastFailureAt to the most recent failure timestamp", () => {
      vi.setSystemTime(new Date("2026-07-25T10:00:00.000Z"));
      recordBillingEmailFailure("active", 1);
      vi.setSystemTime(new Date("2026-07-25T10:05:00.000Z"));
      recordBillingEmailFailure("canceled", 2);
      const m = getBillingEmailMetrics();
      expect(m.lastFailureAt).toBe("2026-07-25T10:05:00.000Z");
    });
  });

  describe("threshold / ok flag", () => {
    it("flips ok to false when 1h failures reach FAILURE_THRESHOLD_1H", () => {
      for (let i = 0; i < FAILURE_THRESHOLD_1H; i++) {
        recordBillingEmailFailure("payment_failed", i);
      }
      expect(getBillingEmailMetrics().ok).toBe(false);
    });

    it("flips ok to false when 24h failures reach FAILURE_THRESHOLD_24H", () => {
      // Record failures spread over 2 hours so they don't all count in 1h
      vi.setSystemTime(new Date("2026-07-25T08:00:00.000Z"));
      // First batch: 2 failures (below 1h threshold individually)
      for (let i = 0; i < FAILURE_THRESHOLD_1H - 1; i++) {
        recordBillingEmailFailure("payment_failed", i);
      }
      // Advance past 1h window
      vi.setSystemTime(new Date("2026-07-25T09:30:00.000Z"));
      // Second batch: enough total to breach 24h threshold
      const remaining = FAILURE_THRESHOLD_24H - (FAILURE_THRESHOLD_1H - 1);
      for (let i = 0; i < remaining; i++) {
        recordBillingEmailFailure("canceled", i);
      }
      const m = getBillingEmailMetrics();
      expect(m.failures24h).toBeGreaterThanOrEqual(FAILURE_THRESHOLD_24H);
      expect(m.ok).toBe(false);
    });

    it("stays ok when failures are below both thresholds", () => {
      for (let i = 0; i < FAILURE_THRESHOLD_1H - 1; i++) {
        recordBillingEmailFailure("active", i);
      }
      expect(getBillingEmailMetrics().ok).toBe(true);
    });
  });

  describe("sliding window pruning", () => {
    it("excludes failures older than 24h from failures24h", () => {
      vi.setSystemTime(new Date("2026-07-24T00:00:00.000Z"));
      recordBillingEmailFailure("payment_failed", 1);

      // Advance 25 hours — entry should be pruned
      vi.setSystemTime(new Date("2026-07-25T01:00:00.000Z"));
      const m = getBillingEmailMetrics();
      expect(m.failures24h).toBe(0);
      expect(m.lastFailureAt).toBeNull();
    });

    it("excludes failures older than 1h from failures1h but keeps them in failures24h", () => {
      vi.setSystemTime(new Date("2026-07-25T08:00:00.000Z"));
      recordBillingEmailFailure("payment_failed", 1);

      // Advance 90 minutes — entry is outside 1h window but inside 24h window
      vi.setSystemTime(new Date("2026-07-25T09:30:00.000Z"));
      const m = getBillingEmailMetrics();
      expect(m.failures1h).toBe(0);
      expect(m.failures24h).toBe(1);
    });

    it("entries are purged from the internal buffer after 24h", () => {
      vi.setSystemTime(new Date("2026-07-24T00:00:00.000Z"));
      recordBillingEmailFailure("payment_failed", 1);
      expect(_failures).toHaveLength(1);

      vi.setSystemTime(new Date("2026-07-25T01:00:00.000Z"));
      // Trigger prune by writing a new entry
      recordBillingEmailFailure("active", 2);
      expect(_failures).toHaveLength(1);
      expect(_failures[0]!.type).toBe("active");
    });
  });
});
