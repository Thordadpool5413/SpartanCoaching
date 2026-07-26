/**
 * Contract test for visitorAnalyticsSchema.
 *
 * This file has NO mocks — it imports the real schema from @workspace/db so
 * that removing or renaming a field in schema.ts breaks this test immediately
 * rather than silently serving an incomplete API response.
 */
import { describe, it, expect } from "vitest";
import { visitorAnalyticsSchema } from "@workspace/db";

const VALID_ANALYTICS = {
  day: 10,
  week: 52,
  month: 180,
  quarter: 540,
  year: 2100,
};

describe("visitorAnalyticsSchema — shape contract", () => {
  it("accepts a fully-populated analytics object", () => {
    expect(() => visitorAnalyticsSchema.parse(VALID_ANALYTICS)).not.toThrow();
  });

  it("parses and returns all five required time-window fields", () => {
    const result = visitorAnalyticsSchema.parse(VALID_ANALYTICS);
    expect(result).toHaveProperty("day", 10);
    expect(result).toHaveProperty("week", 52);
    expect(result).toHaveProperty("month", 180);
    expect(result).toHaveProperty("quarter", 540);
    expect(result).toHaveProperty("year", 2100);
  });

  it.each(["day", "week", "month", "quarter", "year"] as const)(
    "rejects an object missing the '%s' field",
    (field) => {
      const incomplete = { ...VALID_ANALYTICS };
      delete (incomplete as Record<string, unknown>)[field];
      expect(() => visitorAnalyticsSchema.parse(incomplete)).toThrow();
    },
  );

  it("rejects an object where a field is a string instead of a number", () => {
    const bad = { ...VALID_ANALYTICS, month: "many" };
    expect(() => visitorAnalyticsSchema.parse(bad)).toThrow();
  });
});
