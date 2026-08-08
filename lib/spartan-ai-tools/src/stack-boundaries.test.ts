/**
 * Cross-stack hygiene: Advanced AI (Stack B) must not collide with
 * Field Kit catalog ids (Stack A) or steal Command Center path prefixes.
 */
import { describe, expect, it } from "vitest";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SPARTAN_AI_TOOLS } from "./registry";

describe("AI tool stack boundaries", () => {
  it("advanced tool ids do not collide with field-kit catalog ids", () => {
    const catalogIds = new Set(FIELD_KIT_TOOLS.map((t) => t.id));
    for (const tool of SPARTAN_AI_TOOLS) {
      expect(catalogIds.has(tool.id)).toBe(false);
    }
  });

  it("advanced tools use dedicated web/mobile paths under /tools/ai or /ai-tools", () => {
    for (const tool of SPARTAN_AI_TOOLS) {
      expect(
        tool.webPath.includes("/tools/ai") || tool.webPath.includes("/ai-tools"),
      ).toBe(true);
      expect(
        tool.mobilePath.includes("ai-tools") || tool.mobilePath.startsWith("/ai-tools"),
      ).toBe(true);
      expect(tool.webPath.includes("sales-workflow")).toBe(false);
    }
  });

  it("clinical tools declare containsPhi and clinical permission", () => {
    for (const tool of SPARTAN_AI_TOOLS.filter((t) => t.containsPhi)) {
      expect(tool.permission).toBe("clinical:use");
    }
  });
});
