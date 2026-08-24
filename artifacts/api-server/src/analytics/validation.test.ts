import { describe, expect, it } from "vitest";
import {
  isAcceptedClientAnalyticsEvent,
  isSafeAnalyticsLabel,
  isSafeAnalyticsPagePath,
} from "./validation";

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

  it("accepts only the fixed public-funnel vocabulary and rejects server-only contact success", () => {
    expect(isAcceptedClientAnalyticsEvent("public_funnel", "cta_click")).toBe(true);
    expect(isAcceptedClientAnalyticsEvent("public_funnel", "campaign_click")).toBe(true);
    expect(isAcceptedClientAnalyticsEvent("public_funnel", "tool_preview_start")).toBe(true);
    expect(isAcceptedClientAnalyticsEvent("public_funnel", "contact_success")).toBe(false);
    expect(isAcceptedClientAnalyticsEvent("contact_form_submission", "inquiry")).toBe(false);
    expect(isAcceptedClientAnalyticsEvent("mobile_tool_view", "tools_home")).toBe(true);
  });
});