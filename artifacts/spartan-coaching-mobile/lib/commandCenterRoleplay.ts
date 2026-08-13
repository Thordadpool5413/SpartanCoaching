/**
 * Connected Command Center roleplay helpers (pass 7).
 * Pure rules for plan-gated practice — same APIs as web SalesWorkflowPanel.
 */

export type WorkflowPlanLike = {
  id: string;
  version?: number;
  status?: string;
  callId?: string;
};

export type RoleplayMessageLike = {
  role: "learner" | "prospect" | string;
  content: string;
};

export type RoleplaySessionLike = {
  id: string;
  version: number;
  messages: RoleplayMessageLike[];
  complete?: boolean;
  latestCoaching?: unknown;
  turn?: number;
};

/** Ready plans may start connected roleplay (POST /plans/:id/roleplay). */
export function canStartWorkflowRoleplay(plan: WorkflowPlanLike | null | undefined): boolean {
  return Boolean(plan && plan.status === "ready" && plan.id);
}

export function buildStartRoleplayPayload(plan: WorkflowPlanLike): {
  expectedVersion: number;
} {
  return {
    expectedVersion: typeof plan.version === "number" ? plan.version : 1,
  };
}

export function buildContinueRoleplayPayload(input: {
  session: Pick<RoleplaySessionLike, "version">;
  userInput: string;
}): { expectedVersion: number; userInput: string } {
  return {
    expectedVersion:
      typeof input.session.version === "number" ? input.session.version : 1,
    userInput: input.userInput.trim(),
  };
}

export function canSendRoleplayReply(
  session: RoleplaySessionLike | null | undefined,
  draft: string,
): boolean {
  if (!session || session.complete) return false;
  return draft.trim().length > 0;
}

/** Safe coaching tip string — never dump raw objects. */
export function roleplayCoachingTip(session: RoleplaySessionLike | null | undefined): string {
  const coaching = session?.latestCoaching;
  if (!coaching || typeof coaching !== "object") return "";
  const tip = (coaching as { coachingTip?: unknown }).coachingTip;
  return typeof tip === "string" ? tip.trim() : "";
}

export function roleplayMessageLabel(role: string): string {
  if (role === "prospect") return "Prospect";
  if (role === "learner") return "You";
  return role;
}
