import { describe, expect, it } from "vitest";
import { isSafeAnalyticsLabel, isSafeAnalyticsPagePath } from "./validation";

describe("public analytics input validation", () => {
  it("accepts bounded, normalized analytics labels", () => {
    expect(isSafeAnalyticsLabel("mobile_ai_tool_usage")).toBe(true);
    expect(isSafeAnalyticsLabel("tool:view-1")).toBe(true);
  });

  it("rejects labels that could create unbounded or malformed dimensions", () => {
    expect(isSafeAnalyticsLabel("")).toBe(false);
    expect(isSafeAnalyticsLabel("contains spaces")).toBe(false);
    expect(isSafeAnalyticsLabel("x".repeat(97))).toBe(false);
    expect(isSafeAnalyticsLabel({ event: "tool" })).toBe(false);
  });

  it("accepts only bounded local page paths", () => {
    expect(isSafeAnalyticsPagePath("/portal")).toBe(true);
    expect(isSafeAnalyticsPagePath("/resources/article?ref=app")).toBe(true);
    expect(isSafeAnalyticsPagePath("https://evil.example/portal")).toBe(false);
    expect(isSafeAnalyticsPagePath("portal")).toBe(false);
    expect(isSafeAnalyticsPagePath(`/portal${"\0"}`)).toBe(false);
    expect(isSafeAnalyticsPagePath(`/${"x".repeat(512)}`)).toBe(false);
  });
});