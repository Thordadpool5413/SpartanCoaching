import { describe, expect, it } from "vitest";
import { GetWorkspaceNextMoveResponse } from "@workspace/api-zod";
import { decideNextMove, type NextMoveContext } from "./nextMove";

const base: NextMoveContext = {
  contextAvailable: true,
  hasJobRole: true,
  hasCommitment: false,
  hasDraftWork: false,
  hasReviewableWork: false,
  canUseElite: false,
  alsoLeadsTeam: false,
};

describe("workspace next move", () => {
  it("follows the documented precedence", () => {
    expect(decideNextMove({ ...base, hasCommitment: true, hasDraftWork: true, canUseElite: true }).recommendation.id)
      .toBe("commitment-follow-through");
    expect(decideNextMove({ ...base, contextAvailable: false, hasCommitment: true, canUseElite: true }).recommendation.id)
      .toBe("commitment-follow-through");
    expect(decideNextMove({ ...base, hasJobRole: false }).recommendation.id).toBe("complete-work-profile");
    expect(decideNextMove({ ...base, hasDraftWork: true, hasReviewableWork: true }).recommendation.id)
      .toBe("continue-draft-work");
    expect(decideNextMove({ ...base, hasReviewableWork: true, canUseElite: true }).recommendation.id)
      .toBe("review-recent-work");
    expect(decideNextMove({ ...base, canUseElite: true, alsoLeadsTeam: true }).recommendation.id)
      .toBe("practice-with-coach");
    expect(decideNextMove({ ...base, alsoLeadsTeam: true }).recommendation.id).toBe("lead-your-team");
    expect(decideNextMove(base).recommendation.id).toBe("prepare-with-playbook");
  });

  it("uses entitlement only for Elite practice", () => {
    expect(decideNextMove({ ...base, canUseElite: true }).recommendation.stage).toBe("Practice");
    expect(decideNextMove(base).recommendation.stage).not.toBe("Practice");
  });

  it("does not send downgraded members to an Elite-only commitment destination", () => {
    const downgraded = decideNextMove({ ...base, hasCommitment: true, canUseElite: false });
    expect(downgraded.recommendation.id).toBe("prepare-with-playbook");
    expect(downgraded.recommendation.mobileHref).not.toContain("coach");
    expect(downgraded.recommendation.webHref).not.toContain("coach");
  });

  it("provides explanations and validates the generated response contract", () => {
    const result = {
      ...decideNextMove({ ...base, hasReviewableWork: true }),
      generatedAt: new Date().toISOString(),
    };
    const parsed = GetWorkspaceNextMoveResponse.parse(result);
    expect(parsed.recommendation.reason.length).toBeGreaterThan(0);
    expect(parsed.recommendation.description.length).toBeGreaterThan(0);
  });

  it("returns only generic guidance, never saved-work content", () => {
    const result = decideNextMove({ ...base, hasDraftWork: true, hasReviewableWork: true });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("patient");
    expect(serialized).not.toContain("output");
    expect(Object.keys(result.recommendation)).toEqual([
      "id", "stage", "title", "description", "reason", "webHref", "mobileHref",
    ]);
  });

  it("has safe unavailable and partial-context decisions", () => {
    const unavailable = decideNextMove({ ...base, contextAvailable: false, hasJobRole: false });
    expect(unavailable.recommendation.id).toBe("workspace-start");
    expect(unavailable.context.contextAvailable).toBe(false);
    expect(decideNextMove({ ...base, hasJobRole: false }).recommendation.id).toBe("complete-work-profile");
  });
});