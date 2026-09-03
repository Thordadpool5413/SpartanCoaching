export type MemberSignals = {
  contextAvailable: boolean;
  hasJobRole: boolean;
  hasCommitment: boolean;
  hasDraftWork: boolean;
  hasReviewableWork: boolean;
  canUseElite: boolean;
  alsoLeadsTeam: boolean;
};

export type FieldLoopStage = "Prepare" | "Practice" | "Execute" | "Review";

export type NextMoveDecision = {
  id: string;
  stage: FieldLoopStage;
  why: string;
};

/**
 * Deterministic daily decision model that ranks one next move
 * using available local/member signals.
 */
export function determineNextMove(signals: MemberSignals): NextMoveDecision {
  if (signals.hasCommitment) {
    return { id: "commitment", stage: "Execute", why: "You have an unfinished commitment recorded." };
  }
  if (!signals.contextAvailable) {
    return { id: "explore", stage: "Prepare", why: "Loading your saved field context. The full tool set remains available." };
  }
  if (!signals.hasJobRole) {
    return { id: "setup", stage: "Prepare", why: "Your profile is incomplete." };
  }
  if (signals.hasDraftWork) {
    return { id: "resume-work", stage: "Execute", why: "You have unfinished work ready to continue." };
  }
  if (signals.hasReviewableWork) {
    return { id: "review-work", stage: "Review", why: "A recent result is ready for review and a next action." };
  }
  if (signals.canUseElite) {
    return { id: "coach", stage: "Practice", why: "You have no active commitment. Practice your approach first." };
  }
  if (signals.alsoLeadsTeam) {
    return { id: "leadership", stage: "Prepare", why: "As a team leader, your next move is enabling others." };
  }
  return { id: "playbook", stage: "Prepare", why: "Start the loop by preparing your next important conversation." };
}
