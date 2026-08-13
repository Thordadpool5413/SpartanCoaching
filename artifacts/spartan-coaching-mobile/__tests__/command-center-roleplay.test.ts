import {
  buildContinueRoleplayPayload,
  buildStartRoleplayPayload,
  canSendRoleplayReply,
  canStartWorkflowRoleplay,
  roleplayCoachingTip,
  roleplayMessageLabel,
} from "../lib/commandCenterRoleplay";

describe("command center roleplay (pass 7)", () => {
  it("only starts on ready plans", () => {
    expect(canStartWorkflowRoleplay({ id: "p1", status: "ready" })).toBe(true);
    expect(canStartWorkflowRoleplay({ id: "p1", status: "draft" })).toBe(false);
    expect(canStartWorkflowRoleplay(null)).toBe(false);
  });

  it("builds start/continue payloads with versions", () => {
    expect(buildStartRoleplayPayload({ id: "p1", version: 3 })).toEqual({
      expectedVersion: 3,
    });
    expect(
      buildContinueRoleplayPayload({
        session: { version: 5 },
        userInput: "  How are referral paths handled?  ",
      }),
    ).toEqual({
      expectedVersion: 5,
      userInput: "How are referral paths handled?",
    });
  });

  it("blocks empty or completed replies", () => {
    const open = {
      id: "s1",
      version: 1,
      messages: [],
      complete: false,
    };
    expect(canSendRoleplayReply(open, "hello")).toBe(true);
    expect(canSendRoleplayReply(open, "   ")).toBe(false);
    expect(canSendRoleplayReply({ ...open, complete: true }, "hello")).toBe(false);
  });

  it("extracts coaching tip safely", () => {
    expect(
      roleplayCoachingTip({
        id: "s",
        version: 1,
        messages: [],
        latestCoaching: { coachingTip: " Ask about DON availability " },
      }),
    ).toBe("Ask about DON availability");
    expect(
      roleplayCoachingTip({ id: "s", version: 1, messages: [], latestCoaching: null }),
    ).toBe("");
  });

  it("labels message roles for UI", () => {
    expect(roleplayMessageLabel("prospect")).toBe("Prospect");
    expect(roleplayMessageLabel("learner")).toBe("You");
  });
});
