import { describe, expect, it } from "vitest";
import type { NextFunction, Response } from "express";
import {
  AUTH_ROLES,
  CAPABILITY_ALIASES,
  PERMISSION_MATRIX,
  assertSameTenant,
  evaluateCrossTenantAccess,
  hasPermission,
  listPermissionsForRole,
  normalizeAuthRole,
  requirePermission,
} from "./permissions";
import type { AuthedRequest } from "./middleware";

function responseRecorder() {
  const state: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;
  return { response, state };
}

describe("auth roles vs job titles", () => {
  it("only three authorization roles exist in the matrix", () => {
    expect([...AUTH_ROLES].sort()).toEqual(
      ["member", "org_admin", "platform_admin"].sort(),
    );
  });

  it("maps product language to real roles without inventing DB roles", () => {
    expect(CAPABILITY_ALIASES.organization_administrator).toBe("org_admin");
    expect(CAPABILITY_ALIASES.billing_administrator).toBe("org_admin");
    expect(CAPABILITY_ALIASES.content_administrator).toBe("platform_admin");
    expect(CAPABILITY_ALIASES.rep).toBe("member");
    expect(normalizeAuthRole("director")).toBeNull();
    expect(normalizeAuthRole("org_admin")).toBe("org_admin");
  });
});

describe("permission matrix", () => {
  it("gives members self + workflow, not org admin or CMS write", () => {
    expect(hasPermission("member", "account_self:edit")).toBe(true);
    expect(hasPermission("member", "sales_workflow:create")).toBe(true);
    expect(hasPermission("member", "org_invites:create")).toBe(false);
    expect(hasPermission("member", "org_members:delete")).toBe(false);
    expect(hasPermission("member", "cms_content:edit")).toBe(false);
    expect(hasPermission("member", "platform_ops:administer")).toBe(false);
  });

  it("gives org_admin invite/members/billing view but not platform ops", () => {
    expect(hasPermission("org_admin", "org_invites:create")).toBe(true);
    expect(hasPermission("org_admin", "org_members:assign")).toBe(true);
    expect(hasPermission("org_admin", "org_billing:view")).toBe(true);
    expect(hasPermission("org_admin", "platform_ops:view")).toBe(false);
    expect(hasPermission("org_admin", "cms_content:create")).toBe(false);
  });

  it("gives platform_admin full ops and CMS administer", () => {
    expect(hasPermission("platform_admin", "platform_ops:administer")).toBe(
      true,
    );
    expect(hasPermission("platform_admin", "cms_content:delete")).toBe(true);
    expect(hasPermission("platform_admin", "org_billing:administer")).toBe(
      true,
    );
  });

  it("every matrix entry uses only known auth roles", () => {
    for (const [perm, roles] of Object.entries(PERMISSION_MATRIX)) {
      for (const r of roles) {
        expect(AUTH_ROLES, perm).toContain(r);
      }
    }
  });

  it("lists non-empty permissions for each role", () => {
    for (const role of AUTH_ROLES) {
      expect(listPermissionsForRole(role).length).toBeGreaterThan(5);
    }
  });
});

describe("cross-tenant API access attempts", () => {
  it("denies member reading another org members list", () => {
    const result = evaluateCrossTenantAccess({
      actorRole: "member",
      actorOrganizationId: 1,
      targetOrganizationId: 2,
      permission: "org_members:view",
    });
    expect(result).toEqual({ allowed: false, code: "PERMISSION_DENIED" });
  });

  it("denies org_admin acting on a different tenant", () => {
    const result = evaluateCrossTenantAccess({
      actorRole: "org_admin",
      actorOrganizationId: 10,
      targetOrganizationId: 99,
      permission: "org_invites:create",
    });
    expect(result).toEqual({ allowed: false, code: "TENANT_MISMATCH" });
  });

  it("allows org_admin on own tenant and platform_admin cross-tenant", () => {
    expect(
      evaluateCrossTenantAccess({
        actorRole: "org_admin",
        actorOrganizationId: 10,
        targetOrganizationId: 10,
        permission: "org_members:view",
      }),
    ).toEqual({ allowed: true, code: "OK" });

    expect(
      evaluateCrossTenantAccess({
        actorRole: "platform_admin",
        actorOrganizationId: 1,
        targetOrganizationId: 999,
        permission: "org_members:view",
      }),
    ).toEqual({ allowed: true, code: "OK" });
  });

  it("assertSameTenant fails closed on missing org ids for non-platform", () => {
    expect(
      assertSameTenant({
        actorRole: "org_admin",
        actorOrganizationId: 1,
        resourceOrganizationId: null,
      }).ok,
    ).toBe(false);
  });
});

describe("requirePermission middleware", () => {
  it("rejects member for org invite create", () => {
    const req = {
      clientMemberId: 1,
      fieldKit: {
        member: { id: 1, role: "member", organizationId: 5 },
      },
    } as unknown as AuthedRequest;
    const { response, state } = responseRecorder();
    let next = false;
    requirePermission("org_invites:create")(req, response, (() => {
      next = true;
    }) as NextFunction);
    expect(next).toBe(false);
    expect(state.status).toBe(403);
    expect((state.body as { code?: string }).code).toBe("PERMISSION_DENIED");
  });

  it("allows org_admin for org invite create", () => {
    const req = {
      clientMemberId: 2,
      fieldKit: {
        member: { id: 2, role: "org_admin", organizationId: 5 },
      },
    } as unknown as AuthedRequest;
    const { response } = responseRecorder();
    let next = false;
    requirePermission("org_invites:create")(req, response, (() => {
      next = true;
    }) as NextFunction);
    expect(next).toBe(true);
  });
});
