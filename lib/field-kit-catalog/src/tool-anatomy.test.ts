import { describe, it, expect } from "vitest";
import { FIELD_KIT_TOOLS, getToolById } from "./index";
import {
  TOOL_ANATOMY_VERSION,
  TOOL_ANATOMY_SECTIONS,
  TOOL_ANATOMY_META,
  anatomySectionsForTool,
  toolUsesSection,
  normalizeSectionAlias,
  TOOL_ANATOMY_BY_ID,
} from "./tool-anatomy";

describe("tool anatomy (HSP-30)", () => {
  it("is versioned and defines all contract sections", () => {
    expect(TOOL_ANATOMY_VERSION).toMatch(/^tool-anatomy-v\d+/);
    expect(TOOL_ANATOMY_SECTIONS).toEqual(
      expect.arrayContaining([
        "context",
        "guidance",
        "input",
        "result",
        "why",
        "next_move",
        "save",
        "related",
        "evidence",
        "feedback",
      ]),
    );
    for (const id of TOOL_ANATOMY_SECTIONS) {
      expect(TOOL_ANATOMY_META[id].label.length).toBeGreaterThan(2);
      expect(TOOL_ANATOMY_META[id].preferredComponents.web.length).toBeGreaterThan(0);
      expect(TOOL_ANATOMY_META[id].preferredComponents.ios.length).toBeGreaterThan(0);
    }
  });

  it("audits every catalog tool for a non-empty anatomy", () => {
    for (const tool of FIELD_KIT_TOOLS) {
      const sections = anatomySectionsForTool(tool.id);
      expect(sections.length).toBeGreaterThanOrEqual(3);
      expect(sections).toContain("context");
      expect(sections).toContain("result");
      expect(sections).toContain("feedback");
    }
  });

  it("keeps unique profiles (calculators skip save; objections keep evidence)", () => {
    expect(toolUsesSection("activity-calculator", "save")).toBe(false);
    expect(toolUsesSection("objections", "evidence")).toBe(true);
    expect(toolUsesSection("objections", "why")).toBe(true);
    expect(toolUsesSection("sales-workflow", "input")).toBe(true);
  });

  it("maps deprecated aliases to contract sections", () => {
    expect(normalizeSectionAlias("output")).toBe("result");
    expect(normalizeSectionAlias("next step")).toBe("next_move");
    expect(normalizeSectionAlias("citations")).toBe("evidence");
    expect(normalizeSectionAlias("unknown-slot")).toBeNull();
  });

  it("explicit overrides only reference known catalog ids", () => {
    for (const id of Object.keys(TOOL_ANATOMY_BY_ID)) {
      expect(getToolById(id)?.id).toBe(id);
    }
  });
});
