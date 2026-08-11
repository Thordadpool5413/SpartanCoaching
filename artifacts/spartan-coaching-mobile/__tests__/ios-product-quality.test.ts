jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

import {
  IOS_PRODUCT_QUALITY_VERSION,
  IOS_QUALITY_CHECKLIST,
  MAX_FONT_SIZE_MULTIPLIER,
  MIN_TOUCH_TARGET,
  assertQualityChecklistComplete,
  pressScale,
  tabBarBlurIntensity,
  tabBarBlurTint,
  DEFAULT_ACCESSIBILITY_PREFS,
} from "@/lib/iosProductQuality";

describe("iOS product quality (HSP-33)", () => {
  it("is versioned and lists quality dimensions", () => {
    expect(IOS_PRODUCT_QUALITY_VERSION).toMatch(/^ios-product-quality-v\d+/);
    expect(IOS_QUALITY_CHECKLIST.length).toBeGreaterThanOrEqual(10);
    expect(MAX_FONT_SIZE_MULTIPLIER).toBeGreaterThan(1);
    expect(MAX_FONT_SIZE_MULTIPLIER).toBeLessThanOrEqual(2);
    expect(MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(44);
  });

  it("pressScale respects Reduce Motion", () => {
    expect(pressScale(true, false, 0.97).scale).toBe(0.97);
    expect(pressScale(true, true, 0.97).scale).toBe(1);
    expect(pressScale(false, false, 0.97).scale).toBe(1);
  });

  it("tab bar blur follows transparency and color scheme", () => {
    expect(tabBarBlurIntensity(false, 80)).toBe(80);
    expect(tabBarBlurIntensity(true, 80)).toBeLessThan(40);
    expect(tabBarBlurTint("light")).toBe("light");
    expect(tabBarBlurTint("dark")).toBe("dark");
    expect(tabBarBlurTint(null)).toBe("default");
  });

  it("default prefs are conservative", () => {
    expect(DEFAULT_ACCESSIBILITY_PREFS.reduceMotion).toBe(false);
    expect(DEFAULT_ACCESSIBILITY_PREFS.screenReaderEnabled).toBe(false);
  });

  it("assertQualityChecklistComplete requires full set", () => {
    expect(assertQualityChecklistComplete(IOS_QUALITY_CHECKLIST)).toBe(true);
    expect(assertQualityChecklistComplete(["safe_areas"] as any)).toBe(false);
  });
});
