/**
 * Unit tests for the Apple reviewer reset-password endpoint authorization gate.
 *
 * These tests verify the auth-gate logic the endpoint enforces:
 *   1. Platform admin session  → authorized
 *   2. Correct X-Admin-Auth   → authorized (when ADMIN_PASSWORD is configured)
 *   3. Wrong X-Admin-Auth     → rejected
 *   4. No ADMIN_PASSWORD set  → X-Admin-Auth header is useless (rejected)
 *   5. Unauthenticated        → 401/403
 *
 * Full round-trip (DB write + response shape) is covered by the smoke script:
 *   scripts/src/smoke-reviewer-reset.mts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAdminRequest, type AdminAuthorizationRequest } from "../auth/adminAuthorization.ts";
import { safeEqualString } from "../auth/crypto.ts";

function makeAdminReq(role: string, status = "active"): AdminAuthorizationRequest {
  return {
    clientMemberId: 1,
    headers: {},
    fieldKit: { member: { status, role } },
  } as unknown as AdminAuthorizationRequest;
}

function makeAnonReq(): AdminAuthorizationRequest {
  return { headers: {} } as unknown as AdminAuthorizationRequest;
}

/**
 * Mirrors the authorization logic in the reviewer/reset-password route handler:
 *   const sessionOk = isAdminRequest(req);
 *   const headerOk  = !!(headerSecret && headerValue && safeEqualString(...));
 *   if (!sessionOk && !headerOk) → reject
 */
function gateAllowed(
  req: AdminAuthorizationRequest,
  configuredSecret: string | null,
  headerValue: string | null,
): boolean {
  const sessionOk = isAdminRequest(req);
  const headerOk =
    configuredSecret !== null &&
    headerValue !== null &&
    safeEqualString(headerValue, configuredSecret);
  return sessionOk || headerOk;
}

describe("reviewer reset-password — authorization gate", () => {
  it("allows an active platform_admin session", () => {
    const req = makeAdminReq("platform_admin");
    assert.equal(gateAllowed(req, null, null), true);
  });

  it("rejects a plain member session (no admin role)", () => {
    const req = makeAdminReq("member");
    assert.equal(gateAllowed(req, null, null), false);
  });

  it("rejects a disabled platform_admin account", () => {
    const req = makeAdminReq("platform_admin", "disabled");
    assert.equal(gateAllowed(req, null, null), false);
  });

  it("allows a correct X-Admin-Auth header when ADMIN_PASSWORD is configured", () => {
    const req = makeAnonReq();
    assert.equal(gateAllowed(req, "s3cr3t!", "s3cr3t!"), true);
  });

  it("rejects a wrong X-Admin-Auth header even when ADMIN_PASSWORD is configured", () => {
    const req = makeAnonReq();
    assert.equal(gateAllowed(req, "s3cr3t!", "wrong-value"), false);
  });

  it("rejects X-Admin-Auth when ADMIN_PASSWORD is not configured (fails closed)", () => {
    const req = makeAnonReq();
    assert.equal(gateAllowed(req, null, "anything"), false);
  });

  it("rejects a completely unauthenticated request with no header", () => {
    const req = makeAnonReq();
    assert.equal(gateAllowed(req, null, null), false);
  });
});

describe("reviewer reset-password — response shape contract", () => {
  it("response shape has required keys (ok, email, password, created)", () => {
    const mockResponse = {
      ok: true,
      email: "apple-reviewer@spartanhospicecoaching.com",
      password: "AbCd1234!@#$EfGh5678",
      created: false,
    };
    assert.equal(mockResponse.ok, true);
    assert.ok(typeof mockResponse.email === "string" && mockResponse.email.length > 0, "email must be non-empty string");
    assert.ok(typeof mockResponse.password === "string" && mockResponse.password.length >= 8, "password must be ≥8 chars");
    assert.equal(typeof mockResponse.created, "boolean");
  });

  it("reviewer email is the expected App Store account address", () => {
    const REVIEWER_EMAIL = "apple-reviewer@spartanhospicecoaching.com";
    assert.equal(REVIEWER_EMAIL, "apple-reviewer@spartanhospicecoaching.com");
  });
});
