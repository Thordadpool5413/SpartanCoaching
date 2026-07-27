/**
 * Web ↔ mobile Field Kit inventory contract.
 * Fails if any tool is marked missing or lacks a delivery path.
 */
import { describe, it, expect } from "vitest";
import {
  FIELD_KIT_TOOLS,
  mobileParityDebt,
  getToolById,
  mobileDeliveryLabel,
} from "./index";

describe("Field Kit mobile parity", () => {
  it("ships at least 12 catalog tools", () => {
    expect(FIELD_KIT_TOOLS.length).toBeGreaterThanOrEqual(12);
  });

  it("has no tool with mobile delivery 'missing'", () => {
    const missing = FIELD_KIT_TOOLS.filter((t) => t.mobile === "missing");
    expect(missing).toEqual([]);
  });

  it("every tool has a web path and mobile delivery", () => {
    for (const t of FIELD_KIT_TOOLS) {
      expect(t.path.startsWith("/")).toBe(true);
      expect(["native", "webview"]).toContain(t.mobile);
      expect(mobileDeliveryLabel(t.mobile).length).toBeGreaterThan(3);
    }
  });

  it("native tools have a route or tool tab", () => {
    for (const t of FIELD_KIT_TOOLS.filter((x) => x.mobile === "native")) {
      expect(Boolean(t.mobileRoute || t.mobileToolTab)).toBe(true);
    }
  });

  it("webview tools open via catalog path (tool-web)", () => {
    for (const t of FIELD_KIT_TOOLS.filter((x) => x.mobile === "webview")) {
      expect(t.path.length).toBeGreaterThan(2);
      expect(getToolById(t.id)?.id).toBe(t.id);
    }
  });

  it("parity debt is only documented webview tools (not missing)", () => {
    const debt = mobileParityDebt();
    for (const t of debt) {
      expect(t.mobile).toBe("webview");
    }
  });

  it("core tools exist for Command / Objections / Weekly Plan", () => {
    expect(getToolById("sales-workflow")?.mobile).toBe("native");
    expect(getToolById("objections")?.mobile).toBe("native");
    expect(getToolById("weekly-plan")?.mobile).toBe("native");
    expect(getToolById("role-play")?.mobile).toBe("native");
  });
});
