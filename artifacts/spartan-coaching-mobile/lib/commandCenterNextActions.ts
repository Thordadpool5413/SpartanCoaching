/**
 * Command Center next-action helpers (pass 5).
 * Pure rules shared by mobile UI + unit tests — same facts as web SalesWorkflowPanel.
 */

export type WorkflowNextActionLike = {
  id: string;
  version?: number;
  cycleId?: string;
  cycleVersion?: number;
  type?: string;
  status?: string;
  title?: string;
};

/** Accepted next_call actions may schedule via POST /cycles/:id/next-call */
export function canScheduleNextFromAction(action: WorkflowNextActionLike): boolean {
  return action.type === "next_call" && action.status === "accepted";
}

/** Accepted email actions may draft via POST /next-actions/:id/email-draft */
export function canDraftEmailFromAction(action: WorkflowNextActionLike): boolean {
  return action.type === "email" && action.status === "accepted";
}

export function buildNextCallPayload(input: {
  action: WorkflowNextActionLike;
  purpose: string;
  startsAtIso: string;
  durationMinutes?: number;
  timezone?: string;
  location?: string;
}): {
  expectedVersion: number;
  nextActionId: string;
  purpose: string;
  contactIds: string[];
  schedule: {
    startsAt: string;
    durationMinutes: number;
    timezone: string;
    location?: string;
    remindersMinutes: number[];
  };
} {
  const expectedVersion =
    typeof input.action.cycleVersion === "number" ? input.action.cycleVersion : 1;
  return {
    expectedVersion,
    nextActionId: input.action.id,
    purpose: input.purpose.trim(),
    contactIds: [],
    schedule: {
      startsAt: input.startsAtIso,
      durationMinutes: input.durationMinutes ?? 30,
      timezone:
        input.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "America/New_York",
      ...(input.location?.trim()
        ? { location: input.location.trim() }
        : {}),
      remindersMinutes: [30],
    },
  };
}

export function buildEmailDraftPayload(action: WorkflowNextActionLike): {
  expectedVersion: number;
} {
  return {
    expectedVersion: typeof action.version === "number" ? action.version : 1,
  };
}
