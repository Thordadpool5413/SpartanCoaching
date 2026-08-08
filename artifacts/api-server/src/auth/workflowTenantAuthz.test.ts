/**
 * Authorization pattern tests for multi-tenant workflow isolation.
 *
 * Pattern for new protected behavior:
 * 1. Unit-test pure deny/allow rules here (or sibling *.test.ts) without HTTP.
 * 2. Integration-test requireFieldKit / requireAdmin on the route (see middleware
 *    tests and aiToolIsolation.integration.test.ts).
 * 3. Never trust client-supplied organizationId for isolation — derive actor
 *    from the session member via workflowActorFromMember.
 */
import { describe, expect, it } from "vitest";
import {
  organizationIdToWorkflowUuid,
  memberIdToWorkflowUuid,
} from "@workspace/tenant-ids";
import {
  assertWorkflowAction,
  denyWorkflowAction,
  workflowActorFromMember,
} from "./workflowTenantAuthz";

describe("workflowActorFromMember", () => {
  it("maps integers to synthetic UUIDs and rep role for members", () => {
    const actor = workflowActorFromMember({
      memberId: 12,
      organizationId: 34,
      role: "member",
    });
    expect(actor.organizationId).toBe(organizationIdToWorkflowUuid(34));
    expect(actor.userId).toBe(memberIdToWorkflowUuid(12));
    expect(actor.role).toBe("rep");
  });

  it("elevates org_admin and platform_admin to manager", () => {
    expect(
      workflowActorFromMember({
        memberId: 1,
        organizationId: 1,
        role: "org_admin",
      }).role,
    ).toBe("manager");
    expect(
      workflowActorFromMember({
        memberId: 1,
        organizationId: 1,
        role: "platform_admin",
      }).role,
    ).toBe("manager");
  });
});

describe("denyWorkflowAction — org isolation", () => {
  const orgA = workflowActorFromMember({
    memberId: 1,
    organizationId: 10,
    role: "member",
  });
  const orgBResource = {
    organizationId: organizationIdToWorkflowUuid(99),
  };

  it("allows same-org resources", () => {
    expect(
      denyWorkflowAction(orgA, "call:complete", {
        organizationId: orgA.organizationId,
      }),
    ).toBeNull();
  });

  it("forbids cross-organization resource access", () => {
    const denial = denyWorkflowAction(orgA, "call:complete", orgBResource);
    expect(denial?.status).toBe(403);
    expect(denial?.message).toMatch(/outside your organization/i);
  });

  it("does not trust a client-forged foreign org id even for managers", () => {
    const manager = workflowActorFromMember({
      memberId: 2,
      organizationId: 10,
      role: "org_admin",
    });
    const denial = denyWorkflowAction(manager, "manager:review", orgBResource);
    expect(denial?.status).toBe(403);
  });
});

describe("denyWorkflowAction — role and ownership", () => {
  const rep = workflowActorFromMember({
    memberId: 5,
    organizationId: 1,
    role: "member",
  });
  const manager = workflowActorFromMember({
    memberId: 6,
    organizationId: 1,
    role: "org_admin",
  });
  const otherRepUserId = memberIdToWorkflowUuid(99);

  it("forbids rep integration and manager actions", () => {
    expect(denyWorkflowAction(rep, "integration:csv")?.status).toBe(403);
    expect(denyWorkflowAction(rep, "manager:team")?.status).toBe(403);
  });

  it("allows manager integration actions in-org", () => {
    expect(
      denyWorkflowAction(manager, "integration:csv", {
        organizationId: manager.organizationId,
      }),
    ).toBeNull();
  });

  it("forbids rep mutating another owner's workflow", () => {
    const denial = denyWorkflowAction(rep, "call:complete", {
      organizationId: rep.organizationId,
      ownerUserId: otherRepUserId,
    });
    expect(denial?.status).toBe(403);
    expect(denial?.message).toMatch(/do not own/i);
  });

  it("allows rep mutating own workflow", () => {
    expect(
      denyWorkflowAction(rep, "call:complete", {
        organizationId: rep.organizationId,
        ownerUserId: rep.userId,
      }),
    ).toBeNull();
  });

  it("allows manager to act on another rep's resource in-org", () => {
    expect(
      denyWorkflowAction(manager, "manager:review", {
        organizationId: manager.organizationId,
        ownerUserId: otherRepUserId,
      }),
    ).toBeNull();
  });
});

describe("assertWorkflowAction", () => {
  it("throws with FORBIDDEN code on denial", () => {
    const actor = workflowActorFromMember({
      memberId: 1,
      organizationId: 1,
      role: "member",
    });
    try {
      assertWorkflowAction(actor, "integration:csv");
      expect.unreachable("should throw");
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      expect(err.code).toBe("FORBIDDEN");
      expect(err.status).toBe(403);
    }
  });
});
