/**
 * Unit tests for the billing-email outage monitor in opsJobs.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// ── mock DB ──────────────────────────────────────────────────────────────────
vi.mock("../db", () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: () => Promise.resolve([]),
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

// ── mock resend ───────────────────────────────────────────────────────────────
const mockSendAlert = vi.fn().mockResolvedValue(true);
vi.mock("../resend", () => ({
  sendOpsDigestEmail: vi.fn().mockResolvedValue(true),
  sendBillingEmailOutageAlert: (...args: unknown[]) => mockSendAlert(...args),
}));

// ── mock trialLifecycle ──────────────────────────────────────────────────────
vi.mock("./trialLifecycle", () => ({
  runTrialLifecycleSweep: vi.fn().mockResolvedValue({ expired: 0, errors: [] }),
}));

// ── mock billingEmailMetrics ─────────────────────────────────────────────────
import { vi as _vi } from "vitest";
const mockGetMetrics = vi.fn();
vi.mock("../billing/billingEmailMetrics", () => ({
  getBillingEmailMetrics: (...args: unknown[]) => mockGetMetrics(...args),
}));

import { runBillingEmailOutageCheck, _resetOutageMonitorState } from "./opsJobs";

const OK_METRICS = {
  ok: true,
  failures1h: 0,
  failures24h: 0,
  threshold1h: 3,
  threshold24h: 10,
  byType: {},
  lastFailureAt: null,
};

const FAILING_METRICS = {
  ok: false,
  failures1h: 4,
  failures24h: 4,
  threshold1h: 3,
  threshold24h: 10,
  byType: { payment_failed: 4 },
  lastFailureAt: "2026-07-25T10:00:00.000Z",
};

describe("runBillingEmailOutageCheck", () => {
  beforeEach(() => {
    _resetOutageMonitorState();
    mockSendAlert.mockClear();
    mockSendAlert.mockResolvedValue(true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("seeds state on first call without sending an alert (ok=true)", async () => {
    mockGetMetrics.mockReturnValue(OK_METRICS);
    const result = await runBillingEmailOutageCheck();
    expect(result.skippedNoChange).toBe(true);
    expect(result.alertSent).toBe(false);
    expect(mockSendAlert).not.toHaveBeenCalled();
  });

  it("seeds state on first call without sending an alert even when ok=false", async () => {
    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    const result = await runBillingEmailOutageCheck();
    expect(result.skippedNoChange).toBe(true);
    expect(result.alertSent).toBe(false);
    expect(mockSendAlert).not.toHaveBeenCalled();
  });

  it("does not alert when ok stays true across ticks", async () => {
    mockGetMetrics.mockReturnValue(OK_METRICS);
    await runBillingEmailOutageCheck(); // seed
    const result = await runBillingEmailOutageCheck();
    expect(result.ok).toBe(true);
    expect(result.alertSent).toBe(false);
    expect(result.skippedNoChange).toBe(true);
    expect(mockSendAlert).not.toHaveBeenCalled();
  });

  it("sends an alert when ok flips to false after being true", async () => {
    mockGetMetrics.mockReturnValue(OK_METRICS);
    await runBillingEmailOutageCheck(); // seed with ok=true

    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    const result = await runBillingEmailOutageCheck();
    expect(result.alertSent).toBe(true);
    expect(result.ok).toBe(false);
    expect(mockSendAlert).toHaveBeenCalledOnce();
  });

  it("rate-limits subsequent alerts within the 2-hour window", async () => {
    mockGetMetrics.mockReturnValue(OK_METRICS);
    await runBillingEmailOutageCheck(); // seed

    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    const first = await runBillingEmailOutageCheck(); // triggers alert
    expect(first.alertSent).toBe(true);

    // Second tick while still failing — should be rate-limited
    const second = await runBillingEmailOutageCheck();
    expect(second.rateLimited).toBe(true);
    expect(second.alertSent).toBe(false);
    expect(mockSendAlert).toHaveBeenCalledOnce(); // only once total
  });

  it("sends another alert after the 2-hour cooldown expires", async () => {
    mockGetMetrics.mockReturnValue(OK_METRICS);
    await runBillingEmailOutageCheck(); // seed

    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    await runBillingEmailOutageCheck(); // first alert

    // Advance time past the 2-hour cooldown
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000);

    const result = await runBillingEmailOutageCheck();
    expect(result.alertSent).toBe(true);
    expect(mockSendAlert).toHaveBeenCalledTimes(2);
  });

  it("passes the correct metrics to sendBillingEmailOutageAlert", async () => {
    mockGetMetrics.mockReturnValue(OK_METRICS);
    await runBillingEmailOutageCheck(); // seed

    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    await runBillingEmailOutageCheck();

    expect(mockSendAlert).toHaveBeenCalledWith(
      expect.any(String), // to address
      expect.objectContaining({
        failures1h: 4,
        failures24h: 4,
        threshold1h: 3,
        threshold24h: 10,
        byType: { payment_failed: 4 },
      }),
    );
  });

  it("does not set alertSent=true if sendBillingEmailOutageAlert returns false", async () => {
    mockSendAlert.mockResolvedValue(false);
    mockGetMetrics.mockReturnValue(OK_METRICS);
    await runBillingEmailOutageCheck(); // seed

    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    const result = await runBillingEmailOutageCheck();
    expect(result.alertSent).toBe(false);
  });

  it("exposes snapshot metrics in the result", async () => {
    mockGetMetrics.mockReturnValue(FAILING_METRICS);
    const result = await runBillingEmailOutageCheck();
    expect(result.metrics.failures1h).toBe(4);
    expect(result.metrics.failures24h).toBe(4);
    expect(result.metrics.threshold1h).toBe(3);
    expect(result.metrics.threshold24h).toBe(10);
  });
});
