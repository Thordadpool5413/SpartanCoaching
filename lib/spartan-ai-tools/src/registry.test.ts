import { describe, expect, it } from "vitest";
import { SPARTAN_AI_TOOLS, getSpartanAiTool } from "./registry";

describe("Spartan AI tool registry", () => {
  it("contains fourteen unique tools", () => {
    expect(SPARTAN_AI_TOOLS).toHaveLength(14);
    expect(new Set(SPARTAN_AI_TOOLS.map((tool) => tool.id)).size).toBe(14);
  });

  it.each(SPARTAN_AI_TOOLS)(
    "$id example input satisfies its schema",
    (tool) => {
      expect(tool.inputSchema.safeParse(tool.exampleInput).success).toBe(true);
      expect(getSpartanAiTool(tool.id)).toBe(tool);
    },
  );

  it("classifies every PHI tool behind clinical access", () => {
    for (const tool of SPARTAN_AI_TOOLS) {
      if (tool.containsPhi) expect(tool.permission).toBe("clinical:use");
    }
  });
});
