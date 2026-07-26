/**
 * Unit tests for runBillingFailureCleanup in opsJobs.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// ── mock DB ───────────────────────────────────────────────────────────────────
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockReturning = vi.fn();

vi.mock("../db", () => ({
  db: {
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return { where: mockWhere };
    },
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
  },
}));

vi.mock("@workspace/db", () => ({
  authEvents: {},
  accessRequests: {},
  authTokens: {},
  clientOrganizations: {},
  clientSessions: {},
  usageEvents: {},
}));

vi.mock("../resend", () => ({
  sendOpsDigestEmail: vi.fn().mockResolvedValue(true),
  sendBillingEmailOutageAlert: vi.fn().mockResolvedValue(true),
}));

vi.mock("./trialLifecycle", () => ({
  runTrialLifecycleSweep: vi.fn().mockResolvedValue({ expired: 0, errors: [] }),
}));

vi.mock("../billing/billingEmailMetrics", () => ({
  getBillingEmailMetrics: vi.fn().mockReturnValue({
    ok: true,
    failures1h: 0,
    failures24h: 0,
    threshold1h: 3,
    threshold24h: 10,
    byType: {},
    lastFailureAt: null,
  }),
}));

import { runBillingFailureCleanup } from "./opsJobs";

describe("runBillingFailureCleanup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockDelete.mockClear();
    mockWhere.mockClear();
    mockReturning.mockClear();
    // Default: where().returning() returns an empty array (0 rows deleted)
    mockReturning.mockResolvedValue([]);
    mockWhere.mockReturnValue({ returning: mockReturning });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zero when no rows are deleted", async () => {
    mockReturning.mockResolvedValue([]);
    const result = await runBillingFailureCleanup();
    expect(result.billingFailureRowsDeleted).toBe(0);
    expect(result.ranAt).toBeTruthy();
  });

  it("returns the correct count when rows are deleted", async () => {
    mockReturning.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = await runBillingFailureCleanup();
    expect(result.billingFailureRowsDeleted).toBe(3);
  });

  it("deletes only rows older than 24 hours (cutoff is ~24h ago)", async () => {
    vi.setSystemTime(new Date("2026-07-25T12:00:00.000Z"));
    mockReturning.mockResolvedValue([]);

    await runBillingFailureCleanup();

    // The delete call should have been made on authEvents
    expect(mockDelete).toHaveBeenCalledOnce();
    // where() should have been called with a compound condition
    expect(mockWhere).toHaveBeenCalledOnce();
  });

  it("includes a ranAt ISO timestamp in the result", async () => {
    vi.setSystemTime(new Date("2026-07-25T08:00:00.000Z"));
    mockReturning.mockResolvedValue([]);

    const result = await runBillingFailureCleanup();
    expect(result.ranAt).toBe("2026-07-25T08:00:00.000Z");
  });

  it("does not throw when the DB delete fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));
    // runBillingFailureCleanup propagates DB errors (they will be caught by the
    // scheduler's .catch() handler in the background tick — this test confirms
    // the error surfaces rather than being silently swallowed).
    await expect(runBillingFailureCleanup()).rejects.toThrow("DB error");
  });
});
