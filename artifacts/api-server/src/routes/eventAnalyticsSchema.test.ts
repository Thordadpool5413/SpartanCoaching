/**
 * Contract test for eventAnalyticsSchema.
 *
 * This file has NO mocks — it imports the real schema from @workspace/db so
 * that removing or renaming a field in schema.ts breaks this test immediately
 * rather than silently serving an incomplete API response.
 */
import { describe, it, expect } from "vitest";
import { eventAnalyticsSchema } from "@workspace/db/schema";

const VALID_ANALYTICS = {
  aiToolUsage: [{ eventName: "playbook", count: 3 }],
  resourceDownloads: [{ eventName: "guide.pdf", count: 1 }],
  contactSubmissions: 5,
  mobileAiToolUsage: [{ eventName: "chat", count: 7 }],
  mobileToolViews: [{ eventName: "tools_home", count: 12 }],
  mobileAppOpens: { day: 4, week: 18, month: 42 },
};

describe("eventAnalyticsSchema — shape contract", () => {
  it("accepts a fully-populated analytics object", () => {
    expect(() => eventAnalyticsSchema.parse(VALID_ANALYTICS)).not.toThrow();
  });

  it("parses and returns all required fields", () => {
    const result = eventAnalyticsSchema.parse(VALID_ANALYTICS);
    expect(result).toHaveProperty("aiToolUsage");
    expect(result).toHaveProperty("resourceDownloads");
    expect(result).toHaveProperty("contactSubmissions");
    expect(result).toHaveProperty("mobileAiToolUsage");
    expect(result).toHaveProperty("mobileToolViews");
    expect(result).toHaveProperty("mobileAppOpens");
    expect(result.mobileAppOpens).toEqual({ day: 4, week: 18, month: 42 });
  });

  it.each([
    "aiToolUsage",
    "resourceDownloads",
    "contactSubmissions",
    "mobileAiToolUsage",
    "mobileToolViews",
    "mobileAppOpens",
  ] as const)("rejects an object missing the '%s' field", (field) => {
    const incomplete = { ...VALID_ANALYTICS };
    delete (incomplete as Record<string, unknown>)[field];
    expect(() => eventAnalyticsSchema.parse(incomplete)).toThrow();
  });

  it("rejects an eventCount item missing the count field", () => {
    const bad = {
      ...VALID_ANALYTICS,
      mobileAiToolUsage: [{ eventName: "chat" }], // missing count
    };
    expect(() => eventAnalyticsSchema.parse(bad)).toThrow();
  });

  it("rejects an eventCount item missing the eventName field", () => {
    const bad = {
      ...VALID_ANALYTICS,
      mobileToolViews: [{ count: 5 }], // missing eventName
    };
    expect(() => eventAnalyticsSchema.parse(bad)).toThrow();
  });
});
