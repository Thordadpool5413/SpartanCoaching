import { z } from "zod";
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

  it.each(SPARTAN_AI_TOOLS)(
    "$id rejects undeclared input fields",
    (tool) => {
      expect(
        tool.inputSchema.safeParse({
          ...tool.exampleInput,
          unexpectedField: "must not pass",
        }).success,
      ).toBe(false);
    },
  );

  it.each(SPARTAN_AI_TOOLS)(
    "$id rejects a missing required field",
    (tool) => {
      const required = tool.fields.find((field) => field.required);
      expect(required).toBeDefined();
      const input = { ...tool.exampleInput };
      delete input[required!.key];
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    },
  );

  it("assigns unique dedicated web and native routes to every tool", () => {
    const webPaths = SPARTAN_AI_TOOLS.map((tool) => tool.webPath);
    const mobilePaths = SPARTAN_AI_TOOLS.map((tool) => tool.mobilePath);
    expect(new Set(webPaths).size).toBe(SPARTAN_AI_TOOLS.length);
    expect(new Set(mobilePaths).size).toBe(SPARTAN_AI_TOOLS.length);
    for (const tool of SPARTAN_AI_TOOLS) {
      expect(tool.webPath).toBe(`/tools/ai/${tool.id}`);
      expect(tool.mobilePath).toBe(`/ai-tools/${tool.id}`);
      expect(tool.featureFlag).toMatch(/^AI_TOOL_[A-Z0-9_]+$/);
    }
  });

  it("classifies every PHI tool behind clinical access", () => {
    for (const tool of SPARTAN_AI_TOOLS) {
      if (tool.containsPhi) {
        expect(tool.permission).toBe("clinical:use");
        expect(tool.safetyWarnings.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("requires citations, missing-evidence indicators, bounded confidence, and human review for every clinical output", () => {
    for (const tool of SPARTAN_AI_TOOLS.filter((entry) => entry.containsPhi)) {
      const jsonSchema = z.toJSONSchema(tool.outputSchema) as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      expect(jsonSchema.required).toEqual(
        expect.arrayContaining([
          "citations",
          "confidence",
          "missingEvidence",
          "humanReviewRequired",
        ]),
      );
      expect(jsonSchema.properties?.citations).toBeDefined();
      expect(jsonSchema.properties?.confidence).toBeDefined();
      expect(jsonSchema.properties?.missingEvidence).toBeDefined();
      expect(jsonSchema.properties?.humanReviewRequired).toBeDefined();
    }
  });
});
