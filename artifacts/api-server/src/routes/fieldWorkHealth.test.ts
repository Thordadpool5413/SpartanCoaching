import { describe, expect, it, afterEach } from "vitest";
import {
  aggregateFieldWorkHealth,
  disabledFieldWorkHealth,
  isFieldWorkHealthEnabled,
} from "../analytics/fieldWorkHealth";

describe("field-work health aggregation", () => {
  it("groups only allow-listed outcomes by UTC day and platform", () => {
    const result = aggregateFieldWorkHealth(
      [
        {
          createdAt: Date.parse("2026-09-14T09:00:00.000Z"),
          eventType: "public_funnel",
          eventName: "workspace_handoff",
          metadata: JSON.stringify({ source: "workspace", platform: "web" }),
          organizationId: null,
        },
        {
          createdAt: Date.parse("2026-09-14T10:00:00.000Z"),
          eventType: "field_work",
          eventName: "sync_unavailable",
          metadata: JSON.stringify({ platform: "ios" }),
          organizationId: 7,
        },
        {
          createdAt: Date.parse("2026-09-14T11:00:00.000Z"),
          eventType: "field_work",
          eventName: "field_work_completion",
          metadata: JSON.stringify({ surface: "web" }),
          organizationId: 7,
        },
        {
          createdAt: Date.parse("2026-09-14T12:00:00.000Z"),
          eventType: "field_work",
          eventName: "prompt_contains_phi",
          metadata: JSON.stringify({ platform: "ios", prompt: "never return this" }),
          organizationId: 7,
        },
      ],
      { type: "all", organizationId: null },
      400,
      "2026-09-14T12:00:00.000Z",
    );

    expect(result.rows).toHaveLength(2);
    expect(result.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        day: "2026-09-14",
        platform: "ios",
        eventCount: 1,
        syncUnavailable: 1,
        syncUnavailableRate: 100,
      }),
      expect.objectContaining({
        day: "2026-09-14",
        platform: "web",
        eventCount: 2,
        handoffs: 1,
        completions: 1,
        handoffRate: 50,
        completionRate: 50,
      }),
    ]));
    expect(result.totals.eventCount).toBe(3);
    expect(JSON.stringify(result)).not.toContain("prompt_contains_phi");
    expect(JSON.stringify(result)).not.toContain("never return this");
  });

  it("returns an explicit empty response when the feature is disabled", () => {
    const result = disabledFieldWorkHealth(
      { type: "organization", organizationId: 7 },
      400,
      "2026-09-14T12:00:00.000Z",
    );
    expect(result.enabled).toBe(false);
    expect(result.tenantScope).toEqual({ type: "organization", organizationId: 7 });
    expect(result.rows).toEqual([]);
    expect(result.totals.eventCount).toBe(0);
  });
});

describe("field-work health feature flag", () => {
  const original = process.env.FIELD_WORK_HEALTH_ANALYTICS_ENABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.FIELD_WORK_HEALTH_ANALYTICS_ENABLED;
    else process.env.FIELD_WORK_HEALTH_ANALYTICS_ENABLED = original;
  });

  it("fails closed only for an explicit off value", () => {
    delete process.env.FIELD_WORK_HEALTH_ANALYTICS_ENABLED;
    expect(isFieldWorkHealthEnabled()).toBe(true);
    process.env.FIELD_WORK_HEALTH_ANALYTICS_ENABLED = "off";
    expect(isFieldWorkHealthEnabled()).toBe(false);
  });
});