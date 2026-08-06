import { describe, it, expect } from "vitest";
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
    expect(access.allowed).toBe(true);
    expect(access.hoursRemaining).toBe(null);
  });

  it("allows trial members with time remaining", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "trial",
      trialEndsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    });
    expect(access.allowed).toBe(true);
    expect((access.hoursRemaining ?? 0) > 0).toBe(true);
  });

  it("denies expired trials", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "expired",
      trialEndsAt: new Date(Date.now() - 1000),
    });
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("expired");
  });

  it("denies trial past trialEndsAt even if status still trial", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "personal",
      status: "trial",
      trialEndsAt: new Date(Date.now() - 60_000),
    });
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("expired");
  });

  it("denies disabled members", () => {
    const access = evaluateFieldKitAccess(
      { status: "disabled", role: "member", passwordHash: "x" },
      { type: "personal", status: "active", trialEndsAt: null },
    );
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("disabled");
  });

  it("denies invited / pending password", () => {
    const access = evaluateFieldKitAccess(
      { status: "invited", role: "member", passwordHash: null },
      { type: "personal", status: "trial", trialEndsAt: new Date(Date.now() + 3600_000) },
    );
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("pending_password");
  });

  it("denies suspended orgs", () => {
    const access = evaluateFieldKitAccess(activeMember, {
      type: "company",
      status: "suspended",
      trialEndsAt: null,
    });
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("suspended");
  });

  it("always allows platform admins", () => {
    const access = evaluateFieldKitAccess(
      { status: "active", role: "platform_admin", passwordHash: "x" },
      { type: "platform", status: "expired", trialEndsAt: null },
    );
    expect(access.allowed).toBe(true);
  });

  it("does not grant tools to non-admin members of a platform org solely by org type", () => {
    const access = evaluateFieldKitAccess(
      { status: "active", role: "member", passwordHash: "x" },
      { type: "platform", status: "expired", trialEndsAt: null },
    );
    expect(access.allowed).toBe(false);
  });
});
