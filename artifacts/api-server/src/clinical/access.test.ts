import express from "express";
import request from "supertest";
import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthedRequest } from "../auth/middleware";
import { requireElite } from "../auth/middleware";
import {
  requireClinicalAdmin,
  requireClinicalReview,
  requireClinicalUse,
  resolveClinicalAccess,
} from "./access";

const state = vi.hoisted(() => ({
  permissions: [] as Array<Record<string, unknown>>,
}));
vi.mock("../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (predicate: unknown) => ({
          limit: async () => {
            const { params } = new PgDialect().sqlToQuery(predicate as never);
            return state.permissions.filter(
              (p) => p.organizationId === params[0] && p.memberId === params[1],
            );
          },
        }),
      }),
    }),
  },
}));

function context(
  role = "member",
  memberStatus = "active",
  orgStatus = "active",
): AuthedRequest {
  return {
    clientMemberId: 7,
    fieldKit: {
      allowed: true,
      member: { id: 7, organizationId: 42, role, status: memberStatus },
      org: {
        id: 42,
        type: "personal",
        status: orgStatus,
        billingPlan: "individual_weekly_elite",
      },
    },
  } as AuthedRequest;
}
function permission(values: Record<string, unknown> = {}) {
  state.permissions = [
    {
      organizationId: 42,
      memberId: 7,
      canUse: true,
      canReview: false,
      canAdmin: false,
      revokedAt: null,
      ...values,
    },
  ];
}
function app(ctx = context(), admin = false) {
  const a = express();
  a.use((req, _res, next) => {
    Object.assign(req, ctx);
    next();
  });
  a.get(
    "/protected",
    requireElite,
    requireClinicalUse,
    admin ? requireClinicalAdmin : requireClinicalReview,
    (_req, res) => res.json({ ok: true }),
  );
  return a;
}

beforeEach(() => {
  state.permissions = [];
});
afterEach(() => vi.restoreAllMocks());
describe("explicit tenant clinical authority", () => {
  it.each(["platform_admin", "org_admin", "member"])(
    "denies role/Elite-only review for %s",
    async (role) => {
      expect((await request(app(context(role))).get("/protected")).status).toBe(
        403,
      );
      expect((await resolveClinicalAccess(context(role)))?.canAdmin).toBe(
        false,
      );
    },
  );
  it("keeps explicit clinical administration without patient viewing", async () => {
    permission({ canAdmin: true });
    expect((await request(app()).get("/protected")).status).toBe(403);
    expect((await request(app(context(), true)).get("/protected")).status).toBe(
      200,
    );
  });
  it("allows explicit tenant review permission with feature entitlement", async () => {
    permission({ canReview: true });
    expect((await request(app()).get("/protected")).status).toBe(200);
  });
  it("revocation overrides review and admin permissions", async () => {
    permission({ canReview: true, canAdmin: true, revokedAt: new Date() });
    expect((await request(app()).get("/protected")).status).toBe(403);
    expect((await request(app(context(), true)).get("/protected")).status).toBe(
      403,
    );
  });
  it.each([{ organizationId: 99 }, { memberId: 99 }])(
    "rejects a foreign permission %j",
    async (values) => {
      permission({ canReview: true, ...values });
      expect((await request(app()).get("/protected")).status).toBe(403);
    },
  );
  it.each(["disabled", "invited", "unknown"])(
    "rejects inactive membership %s",
    async (status) => {
      permission({ canReview: true });
      expect(
        (
          await request(app(context("platform_admin", status))).get(
            "/protected",
          )
        ).status,
      ).toBe(403);
    },
  );
  it.each(["suspended", "expired", "unknown"])(
    "rejects inactive organization %s even for platform_admin",
    async (status) => {
      permission({ canReview: true });
      expect(
        (
          await request(app(context("platform_admin", "active", status))).get(
            "/protected",
          )
        ).status,
      ).toBe(403);
    },
  );
  it("rejects mismatched server membership context", async () => {
    permission({ canReview: true });
    const ctx = context();
    ctx.clientMemberId = 8;
    expect(await resolveClinicalAccess(ctx)).toBeNull();
    ctx.clientMemberId = 7;
    ctx.fieldKit!.org!.id = 99;
    expect(await resolveClinicalAccess(ctx)).toBeNull();
  });
  it("denies a Standard entitlement even with a clinical grant", async () => {
    permission({ canReview: true });
    const ctx = context();
    ctx.fieldKit!.org!.billingPlan = "individual_weekly";
    expect((await request(app(ctx)).get("/protected")).status).toBe(403);
  });
});
