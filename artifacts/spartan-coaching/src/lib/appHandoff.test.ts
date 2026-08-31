import { describe, expect, it } from "vitest";
import {
  APP_STORE_URL,
  buildAppHandoffUrl,
  buildNativeAppOpenUrl,
  getWebAppFallbackPath,
  normalizeAppHandoffDestination,
} from "./appHandoff";

describe("app handoff contract", () => {
  it("uses the canonical production Universal Link host", () => {
    expect(buildAppHandoffUrl("command")).toBe(
      "https://spartanhospicecoaching.com/app?open=command",
    );
  });

  it("uses the registered custom scheme for on-page iPhone launch", () => {
    expect(buildNativeAppOpenUrl("command")).toBe(
      "spartan-coaching-mobile://app?open=command",
    );
  });

  it("only accepts intended in-app destinations", () => {
    expect(normalizeAppHandoffDestination("coach")).toBe("coach");
    expect(normalizeAppHandoffDestination("unknown")).toBe("home");
    expect(normalizeAppHandoffDestination(null)).toBe("home");
  });

  it("keeps browser fallbacks in the matching field-system area", () => {
    expect(getWebAppFallbackPath("command")).toBe("/tools/sales-workflow");
    expect(getWebAppFallbackPath("account")).toBe("/account");
  });

  it("has a real App Store fallback", () => {
    expect(APP_STORE_URL).toBe("https://apps.apple.com/app/id6795266551");
  });
});