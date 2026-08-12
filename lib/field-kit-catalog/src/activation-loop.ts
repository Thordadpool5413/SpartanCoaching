/**
 * First meaningful value loop (HSP-39).
 *
 * Registration and subscription are NOT activation.
 * Activation = completing a real product workflow path for the user's role.
 */

export const ACTIVATION_VERSION = "activation-v1";

export type ActivationJobRole = "rep" | "director" | "vp" | "owner" | "other" | "admin";

export type ActivationStepId =
  | "activation_role_context"
  | "activation_first_account"
  | "activation_objective"
  | "activation_call_prep"
  | "activation_practice"
  | "activation_outcome"
  | "activation_next_action"
  | "activation_leader_review"
  | "activation_team_math"
  | "activation_admin_seats";

export const ACTIVATION_STEP_IDS: ActivationStepId[] = [
  "activation_role_context",
  "activation_first_account",
  "activation_objective",
  "activation_call_prep",
  "activation_practice",
  "activation_outcome",
  "activation_next_action",
  "activation_leader_review",
  "activation_team_math",
  "activation_admin_seats",
];

export type ActivationStepDef = {
  id: ActivationStepId;
  title: string;
  /** Why this step creates value (shown to user) */
  why: string;
  /** Real product destination */
  webHref: string;
  mobileHref: string;
  required: boolean;
  /** Maps to existing tool checklist ids when overlapping */
  legacyChecklistId?: string;
};

export type ActivationStepStatus = ActivationStepDef & {
  done: boolean;
  doneAt?: string;
};

export type ActivationView = {
  version: typeof ACTIVATION_VERSION;
  role: ActivationJobRole;
  /** True when required steps complete OR user skipped as experienced */
  activated: boolean;
  skipped: boolean;
  steps: ActivationStepStatus[];
  nextStep: ActivationStepStatus | null;
  completedRequired: number;
  totalRequired: number;
  /** Analytics-friendly event names already completed */
  completedEvents: string[];
};

const REP_LOOP: ActivationStepDef[] = [
  {
    id: "activation_role_context",
    title: "Set role & territory context",
    why: "Personalizes your checklist and recommendations — not a tutorial.",
    webHref: "/portal#activation-role",
    mobileHref: "/(tabs)",
    required: true,
  },
  {
    id: "activation_first_account",
    title: "Open first account in Command Center",
    why: "The spine of Hospice Sales Pro — one real facility (no PHI).",
    webHref: "/tools/sales-workflow",
    mobileHref: "/(tabs)/command",
    required: true,
  },
  {
    id: "activation_objective",
    title: "Set the visit objective",
    why: "Know the ask before you walk in — Command Center call plan.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/sales-workflow",
    required: true,
  },
  {
    id: "activation_call_prep",
    title: "Prepare the call",
    why: "Playbook or research so you are not winging the visit.",
    webHref: "/tools/playbooks",
    mobileHref: "/tool/playbook",
    required: true,
  },
  {
    id: "activation_practice",
    title: "Optional: practice the hard line",
    why: "Objection Handler or role-play before high-stakes rooms.",
    webHref: "/tools/objections",
    mobileHref: "/tool/objection",
    required: false,
    legacyChecklistId: "objection",
  },
  {
    id: "activation_outcome",
    title: "Capture the outcome",
    why: "Log what happened so next week is intentional.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/sales-workflow",
    required: true,
  },
  {
    id: "activation_next_action",
    title: "Lock the next action",
    why: "A dated next step is activation — not browsing tools.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/(tabs)/command",
    required: true,
  },
];

const LEADER_LOOP: ActivationStepDef[] = [
  {
    id: "activation_role_context",
    title: "Confirm leader role",
    why: "Unlocks leader steps (activity math, coaching view).",
    webHref: "/portal#activation-role",
    mobileHref: "/(tabs)",
    required: true,
  },
  {
    id: "activation_first_account",
    title: "Inspect Command Center queue",
    why: "Coach from live account workflow, not a slide deck.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/(tabs)/command",
    required: true,
  },
  {
    id: "activation_leader_review",
    title: "Review one rep workflow path",
    why: "See plan → practice → outcome on a real account.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/sales-workflow",
    required: true,
  },
  {
    id: "activation_team_math",
    title: "Run activity / conversation math",
    why: "Turn goals into daily conversations the team can execute.",
    webHref: "/tools/activity-calculator",
    mobileHref: "/activity-calculator",
    required: true,
    legacyChecklistId: "director_scorecard",
  },
  {
    id: "activation_next_action",
    title: "Set one coaching next action",
    why: "Activation is a decision, not a dashboard screenshot.",
    webHref: "/portal",
    mobileHref: "/(tabs)",
    required: true,
  },
];

const EXEC_LOOP: ActivationStepDef[] = [
  {
    id: "activation_role_context",
    title: "Confirm executive role",
    why: "Routes you to economics and execution quality, not rep drills.",
    webHref: "/portal#activation-role",
    mobileHref: "/(tabs)",
    required: true,
  },
  {
    id: "activation_first_account",
    title: "Open Command Center spine",
    why: "Growth is Tuesday behavior — see the call OS first.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/(tabs)/command",
    required: true,
  },
  {
    id: "activation_team_math",
    title: "Open branch / activity economics",
    why: "Connect field activity to the P&L frame.",
    webHref: "/tools/branch-profitability",
    mobileHref: "/staffing",
    required: true,
  },
  {
    id: "activation_next_action",
    title: "Name one growth lever",
    why: "Leave with a concrete next action for the team.",
    webHref: "/portal",
    mobileHref: "/(tabs)",
    required: true,
  },
];

const ADMIN_LOOP: ActivationStepDef[] = [
  {
    id: "activation_role_context",
    title: "Confirm admin context",
    why: "Admins unlock seats and org content — not rep checklists.",
    webHref: "/portal#activation-role",
    mobileHref: "/(tabs)/account",
    required: true,
  },
  {
    id: "activation_admin_seats",
    title: "Review organization access",
    why: "Confirm seats, billing, and who can run live tools.",
    webHref: "/account",
    mobileHref: "/(tabs)/account",
    required: true,
  },
  {
    id: "activation_first_account",
    title: "Tour Command Center as member experience",
    why: "Know what reps live in every day.",
    webHref: "/tools/sales-workflow",
    mobileHref: "/(tabs)/command",
    required: true,
  },
  {
    id: "activation_next_action",
    title: "Invite or brief one rep",
    why: "Admin activation is enabling a human, not finishing a wizard.",
    webHref: "/account",
    mobileHref: "/(tabs)/account",
    required: true,
  },
];

export function normalizeActivationRole(
  jobRole?: string | null,
  memberRole?: string | null,
): ActivationJobRole {
  if (memberRole === "org_admin" || memberRole === "platform_admin") return "admin";
  const r = (jobRole || "").toLowerCase();
  if (r === "rep" || r === "director" || r === "vp" || r === "owner" || r === "other") {
    return r;
  }
  return "other";
}

export function activationStepsForRole(role: ActivationJobRole): ActivationStepDef[] {
  switch (role) {
    case "rep":
    case "other":
      return REP_LOOP;
    case "director":
      return LEADER_LOOP;
    case "vp":
    case "owner":
      return EXEC_LOOP;
    case "admin":
      return ADMIN_LOOP;
    default:
      return REP_LOOP;
  }
}

export function isProgressDone(
  progress: Record<string, boolean | string> | undefined | null,
  id: string,
): boolean {
  if (!progress) return false;
  const v = progress[id];
  return v === true || (typeof v === "string" && v.length > 0);
}

/**
 * Evaluate activation from persisted checklistProgress (+ optional legacy tool marks).
 */
export function evaluateActivation(input: {
  jobRole?: string | null;
  memberRole?: string | null;
  progress?: Record<string, boolean | string> | null;
}): ActivationView {
  const role = normalizeActivationRole(input.jobRole, input.memberRole);
  const progress = input.progress || {};
  const skipped = isProgressDone(progress, "activation_skipped");
  const defs = activationStepsForRole(role);

  // Role context auto-done when jobRole is set
  const effective: Record<string, boolean | string> = { ...progress };
  if (input.jobRole && !isProgressDone(effective, "activation_role_context")) {
    effective.activation_role_context = true;
  }

  const steps: ActivationStepStatus[] = defs.map((def) => {
    let done = isProgressDone(effective, def.id);
    if (!done && def.legacyChecklistId) {
      done = isProgressDone(effective, def.legacyChecklistId);
    }
    const raw = effective[def.id];
    return {
      ...def,
      done,
      doneAt: typeof raw === "string" ? raw : undefined,
    };
  });

  const required = steps.filter((s) => s.required);
  const completedRequired = required.filter((s) => s.done).length;
  const totalRequired = required.length;
  const allRequiredDone = totalRequired > 0 && completedRequired === totalRequired;
  const activated =
    skipped ||
    allRequiredDone ||
    isProgressDone(progress, "activation_complete");

  const nextStep = activated ? null : steps.find((s) => !s.done) || null;

  const completedEvents = steps
    .filter((s) => s.done)
    .map((s) => `activation_step_${s.id}`);
  if (skipped) completedEvents.push("activation_skipped");
  if (activated) completedEvents.push("activation_completed");

  return {
    version: ACTIVATION_VERSION,
    role,
    activated,
    skipped,
    steps,
    nextStep,
    completedRequired,
    totalRequired,
    completedEvents,
  };
}

export function markActivationStep(
  progress: Record<string, boolean | string>,
  stepId: ActivationStepId | "activation_skipped" | "activation_complete",
  done: boolean,
): Record<string, boolean | string> {
  const next = { ...progress };
  if (done) {
    next[stepId] = new Date().toISOString();
  } else {
    delete next[stepId];
  }
  return next;
}

/** After a step mark, if all required done, stamp activation_complete. */
export function withAutoActivationComplete(
  progress: Record<string, boolean | string>,
  jobRole?: string | null,
  memberRole?: string | null,
): Record<string, boolean | string> {
  const view = evaluateActivation({ jobRole, memberRole, progress });
  if (view.skipped) return progress;
  const requiredDone = view.steps.filter((s) => s.required).every((s) => s.done);
  if (requiredDone && !isProgressDone(progress, "activation_complete")) {
    return { ...progress, activation_complete: new Date().toISOString() };
  }
  return progress;
}
