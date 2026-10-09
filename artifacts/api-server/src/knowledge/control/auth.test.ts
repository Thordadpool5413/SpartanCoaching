import { it, expect } from "vitest";
import { organizationEligible, memberEligible } from "./auth";
import { extractSessionToken } from "../../auth/middleware";
import type { Request } from "express";
it("derives eligibility without application/admin role bypass or organization refresh writes", () => {
  const now = "2026-10-09T00:00:00.000Z";
  expect(
    organizationEligible({ status: "expired", type: "platform" }, now),
  ).toBe(false);
  expect(
    organizationEligible(
      { status: "active", billing_provider: "apple", current_period_end: now },
      now,
    ),
  ).toBe(false);
  expect(
    organizationEligible({ status: "trial", trial_ends_at: null }, now),
  ).toBe(true);
  expect(organizationEligible({ status: "unknown" }, now)).toBe(false);
  expect(
    memberEligible({
      status: "active",
      password_hash: null,
      role: "platform_admin",
    }),
  ).toBe(false);
  expect(
    memberEligible({
      status: "disabled",
      password_hash: "synthetic",
      role: "platform_admin",
    }),
  ).toBe(false);
});
it("keeps cookie-first principal even when invalid cookie accompanies valid native Bearer", () => {
  expect(
    extractSessionToken({
      cookies: { spartan_session: "synthetic-invalid-cookie" },
      headers: { authorization: "Bearer synthetic-bearer" },
    } as unknown as Request),
  ).toBe("synthetic-invalid-cookie");
  expect(
    extractSessionToken({
      cookies: {},
      headers: { authorization: "Bearer synthetic-bearer" },
    } as unknown as Request),
  ).toBe("synthetic-bearer");
});
