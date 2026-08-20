import { describe, expect, it } from "vitest";
import { normalizeAiPresentationText } from "../openai";

describe("normalizeAiPresentationText", () => {
  it("removes every dash character and raw Markdown marker", () => {
    const input = [
      "# Field Brief",
      "---",
      "- One-page follow-up",
      "Use a 10–15 minute check-in.",
      "Protect the relationship—never invent details.",
      "**Next move**",
    ].join("\n");

    const result = normalizeAiPresentationText(input);

    expect(result).not.toMatch(/[\u2010-\u2015-]/);
    expect(result).not.toMatch(/^\s*#/m);
    expect(result).not.toContain("**");
    expect(result).toContain("Field Brief");
    expect(result).toContain("• One page follow up");
  });

  it("keeps readable spacing while removing presentation artifacts", () => {
    const result = normalizeAiPresentationText("## Summary\n\n\nTrusted  guidance");
    expect(result).toBe("Summary\n\nTrusted guidance");
  });
});
