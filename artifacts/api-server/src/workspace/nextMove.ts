export type NextMoveStage = "Prepare" | "Practice" | "Execute" | "Review";

export type NextMoveContext = {
  contextAvailable: boolean;
  hasJobRole: boolean;
  hasCommitment: boolean;
  hasDraftWork: boolean;
  hasReviewableWork: boolean;
  canUseElite: boolean;
  alsoLeadsTeam: boolean;
};

export type NextMoveRecommendation = {
  id: string;
  stage: NextMoveStage;
  title: string;
  description: string;
  reason: string;
  webHref: string;
  mobileHref: string;
};

export type NextMoveDecision = {
  recommendation: NextMoveRecommendation;
  context: NextMoveContext;
};

const moves: Record<string, NextMoveRecommendation> = {
  commitment: {
    id: "commitment-follow-through",
    stage: "Execute",
    title: "Follow through on your commitment",
    description: "Take the next concrete action you committed to and record the outcome.",
    reason: "You have an active commitment, so follow-through is the most useful next move.",
    webHref: "/portal/coach",
    mobileHref: "/(tabs)/coach",
  },
  unavailable: {
    id: "workspace-start",
    stage: "Prepare",
    title: "Set up your workspace",
    description: "Complete your workspace setup so recommendations can reflect your current work.",
    reason: "There is not enough workspace context yet, so start with a simple setup step.",
    webHref: "/account",
    mobileHref: "/(tabs)/account",
  },
  profile: {
    id: "complete-work-profile",
    stage: "Prepare",
    title: "Complete your work profile",
    description: "Add your job role to make the next move relevant to your responsibilities.",
    reason: "Your job role is missing, so completing your profile comes before tailored guidance.",
    webHref: "/account",
    mobileHref: "/(tabs)/account",
  },
  draft: {
    id: "continue-draft-work",
    stage: "Execute",
    title: "Continue your saved work",
    description: "Open the saved work already in progress and take it one step closer to completion.",
    reason: "You have draft work waiting, so continuing it avoids starting over.",
    webHref: "/my-work",
    mobileHref: "/(tabs)/my-work",
  },
  review: {
    id: "review-recent-work",
    stage: "Review",
    title: "Review your recent work",
    description: "Look back at a recent completed exercise and choose one improvement for the next attempt.",
    reason: "Recent completed work is ready for a short review while its lessons are still fresh.",
    webHref: "/my-work",
    mobileHref: "/(tabs)/my-work",
  },
  elite: {
    id: "practice-with-coach",
    stage: "Practice",
    title: "Practice with Spartan Coach",
    description: "Rehearse a challenging conversation and sharpen your next field response.",
    reason: "Your Elite access makes private coach practice available as the next skill-building move.",
    webHref: "/portal/coach",
    mobileHref: "/(tabs)/coach",
  },
  team: {
    id: "lead-your-team",
    stage: "Execute",
    title: "Lead one team coaching moment",
    description: "Choose one conversation or workflow to reinforce with your team today.",
    reason: "Because you lead a team, a focused coaching moment can multiply your next move.",
    webHref: "/tools",
    mobileHref: "/(tabs)/tools?category=Lead",
  },
  playbook: {
    id: "prepare-with-playbook",
    stage: "Prepare",
    title: "Prepare with a playbook",
    description: "Open a playbook and select one practical framework to use in your next conversation.",
    reason: "A playbook is a dependable starting point for preparing your next field action.",
    webHref: "/tools/playbooks",
    mobileHref: "/tool/playbook",
  },
};

/** Deterministic precedence for the shared web/mobile next-move contract. */
export function decideNextMove(context: NextMoveContext): NextMoveDecision {
  let key: keyof typeof moves = "playbook";
  if (context.hasCommitment && context.canUseElite) key = "commitment";
  else if (!context.contextAvailable) key = "unavailable";
  else if (!context.hasJobRole) key = "profile";
  else if (context.hasDraftWork) key = "draft";
  else if (context.hasReviewableWork) key = "review";
  else if (context.canUseElite) key = "elite";
  else if (context.alsoLeadsTeam) key = "team";
  return { recommendation: moves[key], context };
}