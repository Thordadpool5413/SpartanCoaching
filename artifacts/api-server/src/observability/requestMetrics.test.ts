import { describe, expect, it, beforeEach } from "vitest";
import {
  _resetRequestMetrics,
  getRequestMetricsSnapshot,
  recordHttpRequest,
} from "./requestMetrics";
import { redactLogValue, safeLogFields } from "./safeLog";

describe("request metrics", () => {
  beforeEach(() => {
    _resetRequestMetrics();
  });

  it("records latency percentiles without storing paths with query", () => {
    for (let i = 1; i <= 20; i++) {
      recordHttpRequest({
        path: `/api/auth/me?token=secret`,
        method: "GET",
        statusCode: 200,
        durationMs: i * 10,
      });
    }
    const snap = getRequestMetricsSnapshot();
    expect(snap.sampleCount).toBe(20);
    expect(snap.p50Ms).toBeGreaterThan(0);
    expect(snap.p95Ms).toBeGreaterThanOrEqual(snap.p50Ms!);
    expect(snap.memory.rssMb).toBeGreaterThan(0);
  });

  it("tracks 5xx error rate", () => {
    recordHttpRequest({ path: "/api/a", method: "GET", statusCode: 200, durationMs: 10 });
    recordHttpRequest({ path: "/api/b", method: "GET", statusCode: 500, durationMs: 10 });
    const snap = getRequestMetricsSnapshot();
    expect(snap.errorRate).toBe(0.5);
    expect(snap.total5xx).toBe(1);
  });
});

describe("safe log", () => {
  it("redacts emails and long free text", () => {
    expect(redactLogValue("user@example.com")).toBe("[redacted:email]");
    expect(
      redactLogValue(
        "Patient not ready for hospice discussion with family and medicare questions about diagnosis",
      ),
    ).toBe("[redacted:text]");
  });

  it("drops sensitive keys", () => {
    const safe = safeLogFields({
      path: "/api/x",
      password: "secret",
      authorization: "Bearer x",
      durationMs: 12,
    });
    expect(safe.password).toBeUndefined();
    expect(safe.authorization).toBeUndefined();
    expect(safe.path).toBe("/api/x");
    expect(safe.durationMs).toBe(12);
  });
});
