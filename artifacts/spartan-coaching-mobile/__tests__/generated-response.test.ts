import { requireGeneratedText } from "../lib/generatedResponse";

describe("generated tool response normalization", () => {
  it.each([
    [{ response: "Objection answer" }, "Objection answer"],
    [{ playbook: "Visit plan" }, "Visit plan"],
    [{ template: "Email draft" }, "Email draft"],
    [{ script: "Call opener" }, "Call opener"],
    [{ plan: "Weekly plan" }, "Weekly plan"],
    [{ text: "Research answer" }, "Research answer"],
    [{ result: "Fallback result" }, "Fallback result"],
  ])("renders supported response shapes", (payload, expected) => {
    expect(requireGeneratedText(payload)).toBe(expected);
  });

  it("turns structured output into readable sections instead of raw JSON", () => {
    expect(requireGeneratedText({ output: { nextSteps: ["Call Monday", "Confirm owner"] } }))
      .toBe("Next Steps\nCall Monday\n\nConfirm owner");
  });

  it("rejects empty successful responses", () => {
    expect(() => requireGeneratedText({ response: "   " })).toThrow(
      "without returning usable content",
    );
  });
});
