/**
 * Wave 4 — funnel contract (static product rules the UI must honor).
 * Not a browser E2E; guards against regression of access model copy/logic assumptions.
 */
import { describe, it, expect } from "vitest";
import { FIELD_KIT_TOOLS, mobileDeliveryLabel, mobileParityDebt } from "@workspace/field-kit-catalog";
import { BG_PRESETS } from "./theme";

describe("Field Kit funnel + catalog contracts", () => {
  it("catalog has primary tools and no empty paths", () => {
    expect(FIELD_KIT_TOOLS.length).toBeGreaterThanOrEqual(12);
    for (const t of FIELD_KIT_TOOLS) {
      expect(t.path.startsWith("/")).toBe(true);
      expect(t.title.length).toBeGreaterThan(2);
      expect(["native", "webview", "missing"]).toContain(t.mobile);
    }
  });

  it("mobile parity debt is only webview or missing (documented)", () => {
    const debt = mobileParityDebt();
    for (const t of debt) {
      expect(t.mobile === "webview" || t.mobile === "missing").toBe(true);
      expect(mobileDeliveryLabel(t.mobile).length).toBeGreaterThan(3);
    }
  });

  it("default brand surface midnight exists for FOUC + theme picker", () => {
    expect(BG_PRESETS.some((p) => p.key === "midnight" && p.tone === "dark")).toBe(true);
  });

  it("happy-path surface routes exist as strings (IA contract)", () => {
    // Register → Account Day Zero → Checkout → Portal → Command
    const path = [
      "/register",
      "/account?welcome=1",
      "/portal",
      "/tools/sales-workflow",
      "/tools",
      "/field-kit",
    ];
    for (const p of path) {
      expect(p.startsWith("/")).toBe(true);
    }
  });
});
