/**
 * Pure authorization helpers for Sales Command Center multi-tenant isolation.
 * Keep free of Express/DB so unit tests can lock the rules without spinning a server.
 *
 * Product auth still owns session + requireFieldKit. This module only answers:
 * "given an already-authenticated workflow actor, may they touch this resource?"
 */
import {
  sameWorkflowOrganization,
  workflowIdentityFromMember,
} from "@workspace/tenant-ids";

export type WorkflowActorRole = "rep" | "manager";

export type WorkflowActor = {
  organizationId: string;
  userId: string;
  role: WorkflowActorRole;
};

export type WorkflowResource = {
  organizationId?: string;
  ownerUserId?: string;
};

export type WorkflowAuthzDenial = {
  code: "FORBIDDEN";
  status: 403;
  message: string;
};

/**
 * Map product membership fields → workflow actor (identity only).
 * Role: org_admin and platform_admin act as manager in the workflow domain.
 */
export function workflowActorFromMember(input: {
  memberId: number;
  organizationId: number;
  role: string;
}): WorkflowActor {
  const identity = workflowIdentityFromMember({
    memberId: input.memberId,
    organizationId: input.organizationId,
  });
  const administrator =
    input.role === "org_admin" || input.role === "platform_admin";
  return {
    ...identity,
    role: administrator ? "manager" : "rep",
  };
}

/**
 * Returns a denial object when the action is not allowed; null when allowed.
 * Mirrors production Sales Command Center authorization adapter behavior.
 */
export function denyWorkflowAction(
  actor: WorkflowActor,
  action: string,
  resource?: WorkflowResource,
): WorkflowAuthzDenial | null {
  if (
    resource?.organizationId &&
    !sameWorkflowOrganization(resource.organizationId, actor.organizationId)
  ) {
    return {
      code: "FORBIDDEN",
      status: 403,
      message: "Resource is outside your organization",
    };
  }
  if (action.startsWith("integration:") && actor.role !== "manager") {
    return {
      code: "FORBIDDEN",
      status: 403,
      message: "Organization administrator access is required",
    };
  }
  if (action.startsWith("manager:") && actor.role !== "manager") {
    return {
      code: "FORBIDDEN",
      status: 403,
      message: "Manager access is required",
    };
  }
  if (
    resource?.ownerUserId &&
    actor.role === "rep" &&
    resource.ownerUserId !== actor.userId
  ) {
    return {
      code: "FORBIDDEN",
      status: 403,
      message: "You do not own this workflow",
    };
  }
  return null;
}

export function assertWorkflowAction(
  actor: WorkflowActor,
  action: string,
  resource?: WorkflowResource,
): void {
  const denial = denyWorkflowAction(actor, action, resource);
  if (denial) {
    const err = new Error(denial.message) as Error & {
      code: string;
      status: number;
    };
    err.code = denial.code;
    err.status = denial.status;
    throw err;
  }
}
