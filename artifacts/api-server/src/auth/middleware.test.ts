import { test, expect } from "vitest";
import type { NextFunction, Response } from "express";
import {
  isAdminRequest,
  requireAdmin,
  type AdminAuthorizationRequest,
} from "./adminAuthorization.ts";
import {
  requireAuth,
  requireFieldKit,
  requireOrgAdmin,
  type AuthedRequest,
} from "./middleware.ts";

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

test("admin header cannot authorize a request", () => {
  const req = { headers: { "x-admin-auth": "5413" } } as unknown as AdminAuthorizationRequest;
  expect(isAdminRequest(req)).toBe(false);
});

test("active platform admin session is authorized", () => {
  const req = {
    clientMemberId: 7,
    fieldKit: { member: { status: "active", role: "platform_admin" } },
  } as unknown as AdminAuthorizationRequest;
  expect(isAdminRequest(req)).toBe(true);
});

test("ordinary authenticated member receives forbidden", () => {
  const req = {
    clientMemberId: 8,
    fieldKit: { member: { status: "active", role: "member" } },
  } as unknown as AdminAuthorizationRequest;
  const { response, state } = responseRecorder();
  let called = false;
  requireAdmin(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(false);
  expect(state.status).toBe(403);
  expect(state.body).toEqual({
    error: "Platform administrator session required",
    code: "ADMIN_REQUIRED",
  });
});

// ── requireAuth / requireFieldKit / requireOrgAdmin patterns ─────────
// Pattern for new protected routes: unit-test the gate with a fake AuthedRequest
// before writing HTTP integration tests. Client visibility is never authorization.

test("requireAuth rejects missing session", () => {
  const req = {} as AuthedRequest;
  const { response, state } = responseRecorder();
  let called = false;
  requireAuth(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(false);
  expect(state.status).toBe(401);
  expect((state.body as { code?: string }).code).toBe("UNAUTHENTICATED");
});

test("requireAuth allows authenticated member without entitlement", () => {
  const req = {
    clientMemberId: 3,
    fieldKit: { allowed: false, reason: "expired", member: { id: 3, role: "member" } },
  } as unknown as AuthedRequest;
  const { response } = responseRecorder();
  let called = false;
  requireAuth(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(true);
});

test("requireFieldKit rejects unauthenticated", () => {
  const req = {} as AuthedRequest;
  const { response, state } = responseRecorder();
  let called = false;
  requireFieldKit(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(false);
  expect(state.status).toBe(401);
});

test("requireFieldKit rejects authenticated but not entitled", () => {
  const req = {
    clientMemberId: 4,
    fieldKit: {
      allowed: false,
      reason: "expired",
      member: { id: 4, role: "member", status: "active" },
    },
  } as unknown as AuthedRequest;
  const { response, state } = responseRecorder();
  let called = false;
  requireFieldKit(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(false);
  expect(state.status).toBe(403);
  expect((state.body as { code?: string }).code).toBe("FIELD_KIT_DENIED");
  expect((state.body as { reason?: string }).reason).toBe("expired");
});

test("requireFieldKit allows entitled member", () => {
  const req = {
    clientMemberId: 5,
    fieldKit: {
      allowed: true,
      member: { id: 5, role: "member", status: "active" },
    },
  } as unknown as AuthedRequest;
  const { response } = responseRecorder();
  let called = false;
  requireFieldKit(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(true);
});

test("requireOrgAdmin rejects ordinary member", () => {
  const req = {
    clientMemberId: 6,
    fieldKit: {
      allowed: true,
      member: { id: 6, role: "member", status: "active" },
    },
  } as unknown as AuthedRequest;
  const { response, state } = responseRecorder();
  let called = false;
  requireOrgAdmin(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(false);
  expect(state.status).toBe(403);
  expect((state.body as { code?: string }).code).toBe("ORG_ADMIN_REQUIRED");
});

test("requireOrgAdmin allows contracted org_admin and platform_admin", () => {
  for (const role of ["org_admin", "platform_admin"] as const) {
    const req = {
      clientMemberId: 7,
      fieldKit: {
        allowed: true,
        member: { id: 7, role, status: "active" },
        org: role === "org_admin" ? {
          id: 2,
          type: "company",
          status: "active",
          billingPlan: "corporate_contract",
        } : null,
      },
    } as unknown as AuthedRequest;
    const { response } = responseRecorder();
    let called = false;
    requireOrgAdmin(req, response, (() => {
      called = true;
    }) as NextFunction);
    expect(called).toBe(true);
  }
});

test("requireOrgAdmin rejects an org_admin without an active company contract", () => {
  const req = {
    clientMemberId: 7,
    fieldKit: {
      allowed: true,
      member: { id: 7, role: "org_admin", status: "active" },
      org: { id: 2, type: "personal", status: "active", billingPlan: "individual_weekly_elite" },
    },
  } as unknown as AuthedRequest;
  const { response, state } = responseRecorder();
  requireOrgAdmin(req, response, (() => undefined) as NextFunction);
  expect(state.status).toBe(403);
});
