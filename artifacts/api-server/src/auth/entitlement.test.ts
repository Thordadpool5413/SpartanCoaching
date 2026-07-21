import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateFieldKitAccess } from "./evaluateAccess.ts";

describe("evaluateFieldKitAccess", () => {
  const activeMember = {
    status: "active",
    role: "member",
    passwordHash: "salt:hash",
  };

  it("allows active members on active orgs", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "active",
      trialEndsAt: null,
    });
    assert.equal(access.allowed, true);
    assert.equal(access.hoursRemaining, null);
  });

  it("allows trial members with time remaining", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "trial",
      trialEndsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    });
    assert.equal(access.allowed, true);
    assert.ok((access.hoursRemaining ?? 0) > 0);
  });

  it("denies expired trials", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "expired",
      trialEndsAt: new Date(Date.now() - 1000),
    });
    assert.equal(access.allowed, false);
    assert.equal(access.reason, "expired");
  });

  it("denies trial past trialEndsAt even if status still trial", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "trial",
      trialEndsAt: new Date(Date.now() - 60_000),
    });
    assert.equal(access.allowed, false);
    assert.equal(access.reason, "expired");
  });

  it("denies disabled members", () => {
    const access = evaluateFieldKitAccess(
      { status: "disabled", role: "member", passwordHash: "x" },
      { type: "personal", status: "active", trialEndsAt: null },
    );
    assert.equal(access.allowed, false);
    assert.equal(access.reason, "disabled");
  });

  it("denies invited / pending password", () => {
    const access = evaluateFieldKitAccess(
      { status: "invited", role: "member", passwordHash: null },
      { type: "personal", status: "trial", trialEndsAt: new Date(Date.now() + 3600_000) },
    );
    assert.equal(access.allowed, false);
    assert.equal(access.reason, "pending_password");
  });

  it("denies suspended orgs", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "company",
      status: "suspended",
      trialEndsAt: null,
    });
    assert.equal(access.allowed, false);
    assert.equal(access.reason, "suspended");
  });

  it("always allows platform admins", () => {
    const access = evaluateFieldKitAccess(
      { status: "active", role: "platform_admin", passwordHash: "x" },
      { type: "platform", status: "expired", trialEndsAt: null },
    );
    assert.equal(access.allowed, true);
  });
});
