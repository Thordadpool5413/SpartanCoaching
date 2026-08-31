import { describe, expect, it } from "vitest";
import {
  SPARTAN_AI_TOOLS,
  buildAiToolExperienceInput,
  getAiToolExperience,
  initialAiToolExperienceValues,
  type AiToolExperienceValue,
} from "./index";

function completedValues(toolId: (typeof SPARTAN_AI_TOOLS)[number]["id"]) {
  const experience = getAiToolExperience(toolId);
  const values: Record<string, AiToolExperienceValue> =
    initialAiToolExperienceValues(toolId);

  for (const field of experience.fields) {
    const current = values[field.key];
    const empty = Array.isArray(current)
      ? current.length === 0
      : String(current ?? "").trim().length === 0;
    if (!empty) continue;

    if (field.kind === "multi-choice") {
      values[field.key] = [field.options?.[0] ?? "Relevant context"];
    } else if (field.kind === "single-choice") {
      values[field.key] = field.options?.[0] ?? "Relevant context";
    } else if (field.kind === "number") {
      values[field.key] = field.minimum ?? 1;
    } else {
      values[field.key] = "Relevant deidentified field context";
    }
  }

  return values;
}

describe("advanced tool experience contracts", () => {
  it("provides a guided experience for every registered tool", () => {
    for (const tool of SPARTAN_AI_TOOLS) {
      const experience = getAiToolExperience(tool.id);
      expect(experience.promise.length).toBeGreaterThan(20);
      expect(experience.submitLabel.length).toBeGreaterThan(3);
      expect(experience.resultTitle.length).toBeGreaterThan(3);
      expect(experience.progressStages.length).toBeGreaterThanOrEqual(3);
      expect(experience.fields.length).toBeGreaterThan(0);
      expect(experience.workflow?.audience.length).toBeGreaterThan(3);
      expect(experience.workflow?.nextAction.length).toBeGreaterThan(20);
      expect(experience.workflow?.reviewCheckpoint.length).toBeGreaterThan(20);
      expect(experience.workflow?.persistence.length).toBeGreaterThan(20);
    }
  });

  it("never exposes technical payload editors", () => {
    for (const tool of SPARTAN_AI_TOOLS) {
      const experience = getAiToolExperience(tool.id);
      for (const field of experience.fields) {
        expect(field.label).not.toMatch(/json|structured data|learner id|user id/i);
        expect(field.placeholder ?? "").not.toMatch(/[{}\[\]]/);
        expect(field.kind).not.toMatch(/json|code/);
      }
    }
  });

  it("builds inputs accepted by every existing API schema", () => {
    for (const tool of SPARTAN_AI_TOOLS) {
      const values = completedValues(tool.id);
      const input = buildAiToolExperienceInput(tool.id, values);
      const parsed = tool.inputSchema.safeParse(input);
      const reason = parsed.success ? "" : JSON.stringify(parsed.error);
      expect(parsed.success, `${tool.id}: ${reason}`).toBe(true);
    }
  });

  it("keeps system supplied identifiers out of microlearning input", () => {
    const experience = getAiToolExperience("microlearning-generator");
    expect(experience.fields.some((field) => field.key === "userId")).toBe(false);
    const input = buildAiToolExperienceInput(
      "microlearning-generator",
      completedValues("microlearning-generator"),
    );
    expect(input.userId).toBe("current-user");
  });

  it("renames the medical record tool for deidentified customer use", () => {
    expect(getAiToolExperience("medical-record-lcd-verifier").title).toBe(
      "Deidentified Documentation Review",
    );
  });
});
