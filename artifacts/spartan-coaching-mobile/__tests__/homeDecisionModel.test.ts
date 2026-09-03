import { determineNextMove } from "../lib/homeDecisionModel";

describe("homeDecisionModel", () => {
  const baseSignals = {
    contextAvailable: true,
    hasJobRole: true,
    hasCommitment: false,
    hasDraftWork: false,
    hasReviewableWork: false,
    canUseElite: false,
    alsoLeadsTeam: false,
  };

  it("recommends setup if no job role", () => {
    const move = determineNextMove({ ...baseSignals, hasJobRole: false });
    expect(move.id).toBe("setup");
    expect(move.stage).toBe("Prepare");
  });

  it("does not infer incomplete setup while account context is unavailable", () => {
    const move = determineNextMove({
      ...baseSignals,
      contextAvailable: false,
      hasJobRole: false,
    });
    expect(move.id).toBe("explore");
    expect(move.why).toContain("Loading");
  });

  it("keeps a locally cached commitment above unavailable account context", () => {
    const move = determineNextMove({
      ...baseSignals,
      contextAvailable: false,
      hasJobRole: false,
      hasCommitment: true,
    });
    expect(move.id).toBe("commitment");
  });

  it("recommends commitment if present", () => {
    const move = determineNextMove({ ...baseSignals, hasCommitment: true });
    expect(move.id).toBe("commitment");
    expect(move.stage).toBe("Execute");
  });

  it("recommends coach if elite and no commitment", () => {
    const move = determineNextMove({ ...baseSignals, canUseElite: true });
    expect(move.id).toBe("coach");
    expect(move.stage).toBe("Practice");
  });

  it("continues unfinished work before starting practice", () => {
    const move = determineNextMove({ ...baseSignals, hasDraftWork: true, canUseElite: true });
    expect(move.id).toBe("resume-work");
    expect(move.stage).toBe("Execute");
  });

  it("reviews a recent completed result before starting new work", () => {
    const move = determineNextMove({ ...baseSignals, hasReviewableWork: true, canUseElite: true });
    expect(move.id).toBe("review-work");
    expect(move.stage).toBe("Review");
  });

  it("recommends leadership if alsoLeadsTeam and no elite/commitment", () => {
    const move = determineNextMove({ ...baseSignals, alsoLeadsTeam: true });
    expect(move.id).toBe("leadership");
    expect(move.stage).toBe("Prepare");
  });

  it("falls back to playbook", () => {
    const move = determineNextMove({ ...baseSignals });
    expect(move.id).toBe("playbook");
    expect(move.stage).toBe("Prepare");
  });
});
