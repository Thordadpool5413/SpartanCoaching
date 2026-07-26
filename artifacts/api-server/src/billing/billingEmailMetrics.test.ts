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
import { db } from "../db";

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

  describe("hydrateBillingEmailMetrics", () => {
    it("normal path: buffer starts empty and count equals the number of DB rows", async () => {
      // buffer is empty (reset in beforeEach)
      vi.setSystemTime(new Date("2026-07-25T12:00:00.000Z"));
      const now = Date.now();

      const mockRows = [
        {
          createdAt: new Date(now - 10_000),
          type: "billing_email_failed",
          meta: { emailType: "payment_failed", orgId: 1 },
        },
        {
          createdAt: new Date(now - 20_000),
          type: "billing_email_failed",
          meta: { emailType: "canceled", orgId: 2 },
        },
        {
          createdAt: new Date(now - 30_000),
          type: "billing_email_failed",
          meta: { emailType: "active", orgId: 3 },
        },
      ];

      vi.spyOn(db, "select").mockReturnValue({
        from: () => ({ where: () => Promise.resolve(mockRows) }),
      } as ReturnType<typeof db.select>);

      await hydrateBillingEmailMetrics();

      expect(_failures).toHaveLength(3);
      expect(getBillingEmailMetrics().failures24h).toBe(3);
    });

    it("restart-during-outage: count equals N after _resetMetrics + hydrate", async () => {
      // Simulate an active Resend outage: record N failures before the restart
      const N = 5;
      const baseTime = new Date("2026-07-25T11:00:00.000Z");

      const mockDbRows: Array<{
        createdAt: Date;
        type: string;
        meta: { emailType: string; orgId: number };
      }> = [];

      for (let i = 0; i < N; i++) {
        const t = new Date(baseTime.getTime() + i * 60_000); // 1 minute apart
        vi.setSystemTime(t);
        recordBillingEmailFailure("payment_failed", i + 1);
        // Capture what the DB row would look like for this failure
        mockDbRows.push({
          createdAt: t,
          type: "billing_email_failed",
          meta: { emailType: "payment_failed", orgId: i + 1 },
        });
      }

      expect(_failures).toHaveLength(N); // sanity-check before restart

      // ── Simulate server restart ───────────────────────────────────────────
      // _resetMetrics clears the in-memory buffer (equivalent to process restart).
      // The DB still holds the N persisted rows.
      _resetMetrics();
      expect(_failures).toHaveLength(0);

      // hydrateBillingEmailMetrics reads the DB rows back into memory.
      vi.spyOn(db, "select").mockReturnValue({
        from: () => ({ where: () => Promise.resolve(mockDbRows) }),
      } as ReturnType<typeof db.select>);

      vi.setSystemTime(new Date(baseTime.getTime() + N * 60_000)); // "now" is after last failure
      await hydrateBillingEmailMetrics();

      // Post-restart count must equal the pre-restart count
      expect(_failures).toHaveLength(N);
      expect(getBillingEmailMetrics().failures24h).toBe(N);
      expect(getBillingEmailMetrics().ok).toBe(false); // N=5 ≥ FAILURE_THRESHOLD_1H=3
    });

    it("deduplication: timestamps already in buffer are not double-counted", async () => {
      // Record two failures so they live in the buffer with known timestamps
      vi.setSystemTime(new Date("2026-07-25T10:00:00.000Z"));
      recordBillingEmailFailure("payment_failed", 1);
      vi.setSystemTime(new Date("2026-07-25T10:01:00.000Z"));
      recordBillingEmailFailure("canceled", 2);

      expect(_failures).toHaveLength(2);

      // DB returns those same two rows PLUS one new one
      const existingTs1 = new Date("2026-07-25T10:00:00.000Z");
      const existingTs2 = new Date("2026-07-25T10:01:00.000Z");
      const newTs = new Date("2026-07-25T10:02:00.000Z");

      const mockRows = [
        {
          createdAt: existingTs1,
          type: "billing_email_failed",
          meta: { emailType: "payment_failed", orgId: 1 },
        },
        {
          createdAt: existingTs2,
          type: "billing_email_failed",
          meta: { emailType: "canceled", orgId: 2 },
        },
        {
          createdAt: newTs,
          type: "billing_email_failed",
          meta: { emailType: "active", orgId: 3 },
        },
      ];

      vi.spyOn(db, "select").mockReturnValue({
        from: () => ({ where: () => Promise.resolve(mockRows) }),
      } as ReturnType<typeof db.select>);

      vi.setSystemTime(new Date("2026-07-25T10:03:00.000Z"));
      await hydrateBillingEmailMetrics();

      // Should be 3 total (2 already in buffer + 1 new from DB), not 5 (doubled)
      expect(_failures).toHaveLength(3);
      expect(getBillingEmailMetrics().failures24h).toBe(3);
    });
  });
});
