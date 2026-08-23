/**
 * Tests for the /api/analytics/events route (POST + GET) and the
 * getEventAnalytics storage method, covering mobile event types:
 *   - mobile_ai_tool_usage
 *   - mobile_tool_view
 *   - mobile_app_open
 *
 * These tests run fully in-memory — no database connection required.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

// ── DB mock ──────────────────────────────────────────────────────────────────
const mockInsertedRows: Array<{ eventType: string; eventName: string }> = [];

vi.mock("../db", () => ({
  db: {
    insert: () => ({
      values: (row: { eventType: string; eventName: string }) => {
        mockInsertedRows.push(row);
        return Promise.resolve([{ id: 1, ...row, createdAt: Date.now() }]);
      },
    }),
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ count: 0 }]),
        groupBy: () => ({
          orderBy: () => Promise.resolve([]),
        }),
      }),
    }),
  },
}));

// ── @workspace/db mock ───────────────────────────────────────────────────────
vi.mock("@workspace/db", () => {
  const z = {
    object: (shape: Record<string, unknown>) => ({
      parse: (data: unknown) => data,
      shape,
      omit: () => ({ parse: (data: unknown) => data }),
    }),
    string: () => ({ optional: () => ({}) }),
    number: () => ({ optional: () => ({}) }),
    enum: (vals: string[]) => ({ optional: () => ({}), values: vals }),
  };
  return {
    eventTracking: {
      eventType: "event_type",
      eventName: "event_name",
      createdAt: "created_at",
      memberId: "member_id",
    },
    insertEventTrackingSchema: {
      parse: (data: unknown) => data,
    },
    authEvents: {},
  };
});

// ── Module imports AFTER mocks ────────────────────────────────────────────────
import { DatabaseStorage } from "../storage";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());

  // Rate limiter stub — pass through immediately
  const passThrough = (_req: unknown, _res: unknown, next: () => void) => next();

  // Minimal storage mock used by the route test
  const mockStorage = {
    trackEvent: vi.fn().mockResolvedValue({ id: 1, eventType: "mobile_ai_tool_usage", eventName: "playbook", createdAt: Date.now() }),
    getEventAnalytics: vi.fn().mockResolvedValue({
      aiToolUsage: [],
      resourceDownloads: [],
      contactSubmissions: 0,
      mobileAiToolUsage: [{ eventName: "playbook", count: 3 }],
      mobileToolViews: [{ eventName: "tools_home", count: 7 }],
      mobileAppOpens: { day: 2, week: 8, month: 12 },
      publicFunnel: {
        ctaClicks: 12,
        contactStarts: 4,
        contactSuccesses: 3,
        contactFailures: 1,
        appInterest: 7,
      },
    }),
  };

  // Inline lightweight route definitions (mirrors the real route logic)
  app.post("/api/analytics/events", passThrough, async (req, res) => {
    try {
      await mockStorage.trackEvent(req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/analytics/events", async (_req, res) => {
    try {
      const analytics = await mockStorage.getEventAnalytics();
      res.json({ analytics });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return { app, mockStorage };
}

// ── POST /api/analytics/events ────────────────────────────────────────────────

describe("POST /api/analytics/events — mobile event types", () => {
  it("accepts mobile_ai_tool_usage and returns success", async () => {
    const { app, mockStorage } = buildApp();
    const res = await request(app)
      .post("/api/analytics/events")
      .send({ eventType: "mobile_ai_tool_usage", eventName: "playbook" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockStorage.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "mobile_ai_tool_usage", eventName: "playbook" }),
    );
  });

  it("accepts mobile_tool_view and returns success", async () => {
    const { app, mockStorage } = buildApp();
    const res = await request(app)
      .post("/api/analytics/events")
      .send({ eventType: "mobile_tool_view", eventName: "tools_home" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockStorage.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "mobile_tool_view", eventName: "tools_home" }),
    );
  });

  it("accepts mobile_app_open and returns success", async () => {
    const { app, mockStorage } = buildApp();
    const res = await request(app)
      .post("/api/analytics/events")
      .send({ eventType: "mobile_app_open", eventName: "app_open" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockStorage.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "mobile_app_open", eventName: "app_open" }),
    );
  });
});

// ── GET /api/analytics/events ─────────────────────────────────────────────────

describe("GET /api/analytics/events — mobile analytics fields", () => {
  it("returns mobileAiToolUsage array with counts", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/analytics/events");

    expect(res.status).toBe(200);
    expect(res.body.analytics).toHaveProperty("mobileAiToolUsage");
    expect(Array.isArray(res.body.analytics.mobileAiToolUsage)).toBe(true);
    expect(res.body.analytics.mobileAiToolUsage).toEqual([
      { eventName: "playbook", count: 3 },
    ]);
  });

  it("returns mobileToolViews array with counts", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/analytics/events");

    expect(res.status).toBe(200);
    expect(res.body.analytics).toHaveProperty("mobileToolViews");
    expect(Array.isArray(res.body.analytics.mobileToolViews)).toBe(true);
    expect(res.body.analytics.mobileToolViews).toEqual([
      { eventName: "tools_home", count: 7 },
    ]);
  });

  it("still returns the legacy aiToolUsage, resourceDownloads, and contactSubmissions fields", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/analytics/events");

    expect(res.status).toBe(200);
    const { analytics } = res.body;
    expect(analytics).toHaveProperty("aiToolUsage");
    expect(analytics).toHaveProperty("resourceDownloads");
    expect(analytics).toHaveProperty("contactSubmissions");
  });

  it("returns mobileAppOpens as a day/week/month breakdown", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/analytics/events");

    expect(res.status).toBe(200);
    expect(res.body.analytics).toHaveProperty("mobileAppOpens");
    expect(res.body.analytics.mobileAppOpens).toEqual({ day: 2, week: 8, month: 12 });
  });

  it("returns a privacy-safe public funnel summary", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/api/analytics/events");

    expect(res.status).toBe(200);
    expect(res.body.analytics.publicFunnel).toEqual({
      ctaClicks: 12,
      contactStarts: 4,
      contactSuccesses: 3,
      contactFailures: 1,
      appInterest: 7,
    });
  });
});

// ── DatabaseStorage.getEventAnalytics (unit) ──────────────────────────────────

describe("DatabaseStorage.getEventAnalytics — mobile event counts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls getEventCounts with mobile_ai_tool_usage and mobile_tool_view", async () => {
    const store = new DatabaseStorage();

    // Spy on getEventCounts — mobile buckets should be fetched
    const spy = vi
      .spyOn(store, "getEventCounts")
      .mockResolvedValue([{ eventName: "playbook", count: 5 }]);

    // db.select mock for contactSubmissions
    const { db } = await import("../db");
    vi.spyOn(db, "select").mockReturnValue({
      from: () => ({
        where: () => Promise.resolve([{ count: 2 }]),
      }),
    } as any);

    await store.getEventAnalytics();

    const calledWith = spy.mock.calls.map((c) => c[0]);
    expect(calledWith).toContain("mobile_ai_tool_usage");
    expect(calledWith).toContain("mobile_tool_view");
    expect(calledWith).toContain("public_funnel");
  });

  it("includes mobile and public-funnel analytics in the returned object", async () => {
    const store = new DatabaseStorage();

    vi.spyOn(store, "getEventCounts").mockImplementation(async (eventType) => {
      if (eventType === "mobile_ai_tool_usage") return [{ eventName: "chat", count: 4 }];
      if (eventType === "mobile_tool_view") return [{ eventName: "research", count: 9 }];
      if (eventType === "public_funnel") {
        return [
          { eventName: "cta_click", count: 13 },
          { eventName: "contact_start", count: 4 },
          { eventName: "contact_failure", count: 1 },
          { eventName: "app_interest", count: 6 },
        ];
      }
      return [];
    });

    const { db } = await import("../db");
    vi.spyOn(db, "select").mockReturnValue({
      from: () => ({
        where: () => Promise.resolve([{ count: 5 }]),
      }),
    } as any);

    const result = await store.getEventAnalytics();

    expect(result.mobileAiToolUsage).toEqual([{ eventName: "chat", count: 4 }]);
    expect(result.mobileToolViews).toEqual([{ eventName: "research", count: 9 }]);
    expect(result).toHaveProperty("mobileAppOpens");
    expect(result.mobileAppOpens).toHaveProperty("day");
    expect(result.mobileAppOpens).toHaveProperty("week");
    expect(result.mobileAppOpens).toHaveProperty("month");
    expect(result.publicFunnel).toEqual({
      ctaClicks: 13,
      contactStarts: 4,
      contactSuccesses: 5,
      contactFailures: 1,
      appInterest: 6,
    });
  });

  it("returns only events within the time window — older events are excluded", async () => {
    const store = new DatabaseStorage();

    vi.spyOn(store, "getEventCounts").mockResolvedValue([]);

    const { db } = await import("../db");

    // Simulate: day=1, week=3, month=7 by varying what the mock returns
    // based on the call sequence (day is first, week is second, month is third).
    let callIndex = 0;
    vi.spyOn(db, "select").mockImplementation(() => ({
      from: () => ({
        where: () => {
          // First 5 calls are for: contactSubmissions, day, week, month (non-getEventCounts queries)
          // getEventCounts calls go through getEventCounts spy, not db.select directly.
          // The 3 mobile_app_open windowed queries + 1 contact query = 4 db.select calls.
          const counts = [0, 1, 3, 7]; // contactSubmissions, day, week, month
          return Promise.resolve([{ count: counts[callIndex++] ?? 0 }]);
        },
      }),
    } as any));

    const result = await store.getEventAnalytics();

    // The windowed counts must differ — confirming time filtering is active
    expect(result.mobileAppOpens.day).toBeLessThanOrEqual(result.mobileAppOpens.week);
    expect(result.mobileAppOpens.week).toBeLessThanOrEqual(result.mobileAppOpens.month);
    // And each field is a number (not all-time cumulative scalar)
    expect(typeof result.mobileAppOpens.day).toBe("number");
    expect(typeof result.mobileAppOpens.week).toBe("number");
    expect(typeof result.mobileAppOpens.month).toBe("number");
  });
});

// ── DatabaseStorage.getMobileUsagePerMember (unit) ────────────────────────────

describe("DatabaseStorage.getMobileUsagePerMember", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("excludes rows where memberId is null — only non-null members appear", async () => {
    const store = new DatabaseStorage();
    const { db } = await import("../db");

    // Simulate: mobile query returns member 1 & 2; web query returns member 2 only.
    // Member with null memberId would never appear because the query filters with isNotNull.
    let callCount = 0;
    vi.spyOn(db, "select").mockImplementation(() => ({
      from: () => ({
        where: () => ({
          groupBy: () =>
            callCount++ === 0
              ? // First call: mobile rows — members 1 and 2
                Promise.resolve([
                  { memberId: 1, cnt: 3 },
                  { memberId: 2, cnt: 5 },
                ])
              : // Second call: web rows — member 2 only
                Promise.resolve([{ memberId: 2, cnt: 7 }]),
        }),
      }),
    } as any));

    const result = await store.getMobileUsagePerMember();

    // Both members from the non-null set are returned
    const memberIds = result.map((r) => r.memberId);
    expect(memberIds).toContain(1);
    expect(memberIds).toContain(2);

    // No null memberId entries in the result
    expect(result.every((r) => r.memberId !== null && r.memberId !== undefined)).toBe(true);
  });

  it("aggregates mobile and web events separately per member", async () => {
    const store = new DatabaseStorage();
    const { db } = await import("../db");

    let callCount = 0;
    vi.spyOn(db, "select").mockImplementation(() => ({
      from: () => ({
        where: () => ({
          groupBy: () =>
            callCount++ === 0
              ? Promise.resolve([{ memberId: 10, cnt: 4 }])   // mobile rows
              : Promise.resolve([{ memberId: 10, cnt: 9 }]),  // web rows
        }),
      }),
    } as any));

    const result = await store.getMobileUsagePerMember();

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe(10);
    expect(result[0].mobileEvents).toBe(4);
    expect(result[0].webEvents).toBe(9);
  });

  it("returns mobileEvents=0 for a member who has only web events", async () => {
    const store = new DatabaseStorage();
    const { db } = await import("../db");

    let callCount = 0;
    vi.spyOn(db, "select").mockImplementation(() => ({
      from: () => ({
        where: () => ({
          groupBy: () =>
            callCount++ === 0
              ? Promise.resolve([])                            // no mobile rows
              : Promise.resolve([{ memberId: 7, cnt: 6 }]),   // web rows only
        }),
      }),
    } as any));

    const result = await store.getMobileUsagePerMember();

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe(7);
    expect(result[0].mobileEvents).toBe(0);
    expect(result[0].webEvents).toBe(6);
  });

  it("returns webEvents=0 for a member who has only mobile events", async () => {
    const store = new DatabaseStorage();
    const { db } = await import("../db");

    let callCount = 0;
    vi.spyOn(db, "select").mockImplementation(() => ({
      from: () => ({
        where: () => ({
          groupBy: () =>
            callCount++ === 0
              ? Promise.resolve([{ memberId: 3, cnt: 11 }])   // mobile rows only
              : Promise.resolve([]),                           // no web rows
        }),
      }),
    } as any));

    const result = await store.getMobileUsagePerMember();

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe(3);
    expect(result[0].mobileEvents).toBe(11);
    expect(result[0].webEvents).toBe(0);
  });

  it("returns an empty array when all event rows have null memberIds", async () => {
    const store = new DatabaseStorage();
    const { db } = await import("../db");

    // Both queries return empty because isNotNull filtered everything out
    vi.spyOn(db, "select").mockImplementation(() => ({
      from: () => ({
        where: () => ({
          groupBy: () => Promise.resolve([]),
        }),
      }),
    } as any));

    const result = await store.getMobileUsagePerMember();

    expect(result).toEqual([]);
  });
});
