import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../app/(tabs)/coach.tsx"),
  "utf8",
);

describe("Spartan Coach conversation experience", () => {
  test("continues coaching after the first response", () => {
    expect(source).toContain("async function sendFollowUp()");
    expect(source).toContain("sendCoachMessage(conversationId, text, requestId)");
    expect(source).toContain("setMessages((current) => [...current, answer])");
    expect(source).toContain("Ask Coach anything about this conversation");
    expect(source).toContain("Send message to Coach");
  });

  test("restores private conversation history", () => {
    expect(source).toContain("setMessages(visibleMessages)");
    expect(source).toContain("Coach this private hospice sales rehearsal.");
    expect(source).toContain("Private coaching conversation");
    expect(source).toContain("Only visible to you");
  });

  test("keeps safety and action cues in the coaching flow", () => {
    expect(source).toContain(
      "Continue without patient names, dates, or identifying details.",
    );
    expect(source).toContain("Turn the conversation into action");
    expect(source).toContain("Make this sound more natural");
    expect(source).toContain("What should I ask next?");
  });
});
