import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildPrompt } from "./prompt";
import { outputSchema } from "./schema";

describe("email optimizer voice and payload contract", () => {
  it("requires the Spartan Coaching voice and blocks common generated language", () => {
    expect(SYSTEM_PROMPT).toContain("Sound natural");
    expect(SYSTEM_PROMPT).toContain("Never use dashes");
    expect(SYSTEM_PROMPT).toContain("Never use template braces");
    expect(SYSTEM_PROMPT).toContain("low friction");
    expect(SYSTEM_PROMPT).toContain("workflow sync");
  });

  it("builds a specific quality brief from the customer context", () => {
    const prompt = buildPrompt({
      prospectType: "Physician",
      situation: "We had lunch and discussed what quality of life means to the physician.",
      objective: "Continue the conversation",
      tone: "warm",
      previousInteraction: "The physician values honest communication.",
      accountHistory: [],
      includeSequence: false,
    });
    expect(prompt).toContain("what quality of life means");
    expect(prompt).toContain("Every email sounds human");
    expect(prompt).toContain("No placeholders appear");
    expect(prompt).toContain("No corporate buzzwords appear");
  });

  it("keeps output focused on usable drafts without simulated scoring", () => {
    const shape = JSON.stringify(outputSchema);
    expect(shape).not.toContain("simulatedMetrics");
    expect(shape).not.toContain("relativeRanking");
  });
});
