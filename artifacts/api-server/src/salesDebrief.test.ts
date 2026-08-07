import { describe, expect, it } from "vitest";
import {
  draftDebriefFallback,
  draftDebriefInputSchema,
  draftDebriefOutputSchema,
} from "./salesDebrief";

describe("sales debrief schemas", () => {
  it("accepts valid draft input", () => {
    const parsed = draftDebriefInputSchema.parse({
      notes: "Saw DON, she wants a follow-up next Tuesday about education.",
      purpose: "Intro visit",
    });
    expect(parsed.notes).toContain("DON");
  });

  it("rejects empty notes", () => {
    expect(() => draftDebriefInputSchema.parse({ notes: "hi" })).toThrow();
  });

  it("fallback produces schema-valid debrief", () => {
    const draft = draftDebriefFallback({
      notes: "No show — gate said they were in a meeting. Reschedule Friday.",
    });
    expect(draftDebriefOutputSchema.parse(draft).suggestedOutcome).toBe("no_show");
    expect(draft.needsHumanReview).toBe(true);
  });

  it("fallback maps not interested", () => {
    const draft = draftDebriefFallback({
      notes: "Facility not interested in a new hospice partner right now.",
    });
    expect(draft.suggestedOutcome).toBe("not_interested");
  });

  it("fallback maps advanced and reschedule", () => {
    expect(
      draftDebriefFallback({
        notes: "They advanced the partnership and won a trial education slot.",
      }).suggestedOutcome,
    ).toBe("advanced");
    expect(
      draftDebriefFallback({
        notes: "They asked to reschedule the education lunch for next month.",
      }).suggestedOutcome,
    ).toBe("reschedule");
  });

  it("rejects oversized notes", () => {
    expect(() =>
      draftDebriefInputSchema.parse({ notes: "x".repeat(8001) }),
    ).toThrow();
  });
});
