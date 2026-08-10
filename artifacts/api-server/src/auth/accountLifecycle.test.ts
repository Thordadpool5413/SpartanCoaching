import { describe, expect, it } from "vitest";
import {
  ACCOUNT_LIFECYCLE_CAPABILITIES,
  REAUTH_VALID_MS,
  buildAccountExportPayload,
  buildAnonymizedEmail,
  isReauthFresh,
  planAccountDeletion,
  resolveSessionAccess,
  sensitiveActionRequiresPassword,
} from "./accountLifecycle";

describe("account lifecycle inventory", () => {
  it("marks App Store critical deletion and export as slice_a or implemented", () => {
    expect(ACCOUNT_LIFECYCLE_CAPABILITIES.account_deletion.status).toBe("slice_a");
    expect(ACCOUNT_LIFECYCLE_CAPABILITIES.data_export.status).toBe("slice_a");
    expect(ACCOUNT_LIFECYCLE_CAPABILITIES.login.status).toBe("implemented");
    expect(ACCOUNT_LIFECYCLE_CAPABILITIES.disabled_accounts.status).toBe("implemented");
    expect(ACCOUNT_LIFECYCLE_CAPABILITIES.email_verification_general.status).toBe(
      "not_applicable",
    );
  });
});

describe("sensitiveActionRequiresPassword", () => {
  it("requires password for delete and change password only", () => {
    expect(sensitiveActionRequiresPassword("delete_account")).toBe(true);
    expect(sensitiveActionRequiresPassword("change_password")).toBe(true);
    expect(sensitiveActionRequiresPassword("export_account")).toBe(false);
    expect(sensitiveActionRequiresPassword("session_refresh")).toBe(false);
  });
});

describe("planAccountDeletion", () => {
  const base = {
    memberId: 42,
    role: "member",
    status: "active",
    organizationId: 7,
    otherActiveMemberCount: 0,
    isSoleActiveOrgAdmin: false,
  };

  it("plans soft-delete with anonymized email and session revoke", () => {
    const plan = planAccountDeletion(base);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.anonymizedEmail).toBe(buildAnonymizedEmail(42));
    expect(plan.nextStatus).toBe("disabled");
    expect(plan.clearPassword).toBe(true);
    expect(plan.revokeAllSessions).toBe(true);
    expect(plan.suspendPersonalOrg).toBe(true);
  });

  it("blocks already disabled, platform admin, and sole org admin with teammates", () => {
    expect(planAccountDeletion({ ...base, status: "disabled" }).ok).toBe(false);
    expect(planAccountDeletion({ ...base, role: "platform_admin" }).ok).toBe(false);
    const sole = planAccountDeletion({
      ...base,
      role: "org_admin",
      isSoleActiveOrgAdmin: true,
      otherActiveMemberCount: 3,
    });
    expect(sole.ok).toBe(false);
    if (sole.ok) return;
    expect(sole.code).toBe("SOLE_ORG_ADMIN");
  });

  it("allows sole org admin when no other active members (personal seat)", () => {
    const plan = planAccountDeletion({
      ...base,
      role: "org_admin",
      isSoleActiveOrgAdmin: true,
      otherActiveMemberCount: 0,
    });
    expect(plan.ok).toBe(true);
  });
});

describe("buildAccountExportPayload", () => {
  it("never includes password hashes or raw tokens", () => {
    const payload = buildAccountExportPayload({
      exportedAt: "2026-01-01T00:00:00.000Z",
      member: {
        id: 1,
        email: "rep@example.com",
        name: "Rep",
        title: null,
        role: "member",
        organizationId: 2,
        status: "active",
        jobRole: "rep",
        territoryNote: "Miami",
        topObjections: null,
        lastLoginAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      organization: {
        id: 2,
        name: "Acme",
        type: "personal",
        status: "trial",
        seatLimit: 1,
      },
      sessions: [
        {
          id: 9,
          createdAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-15T00:00:00.000Z",
          userAgent: "test",
          isCurrent: true,
        },
      ],
    });
    const json = JSON.stringify(payload);
    expect(json).not.toMatch(/password/i);
    expect(json).not.toMatch(/tokenHash|Bearer /i);
    expect(payload.subject.email).toBe("rep@example.com");
    expect(payload.sessions).toHaveLength(1);
    expect(payload.schemaVersion).toBe(1);
  });
});

describe("reauth freshness and session access", () => {
  it("accepts reauth within window only", () => {
    const now = Date.parse("2026-06-01T12:00:00.000Z");
    expect(isReauthFresh(new Date(now - REAUTH_VALID_MS + 1000), now)).toBe(true);
    expect(isReauthFresh(new Date(now - REAUTH_VALID_MS - 1000), now)).toBe(false);
    expect(isReauthFresh(null, now)).toBe(false);
  });

  it("rejects missing, expired, and disabled sessions", () => {
    expect(
      resolveSessionAccess({
        hasToken: false,
        sessionFound: false,
        sessionExpired: false,
        memberDisabled: false,
        memberDeletedAnonymized: false,
      }).code,
    ).toBe("UNAUTHENTICATED");
    expect(
      resolveSessionAccess({
        hasToken: true,
        sessionFound: true,
        sessionExpired: true,
        memberDisabled: false,
        memberDeletedAnonymized: false,
      }).code,
    ).toBe("SESSION_INVALID");
    expect(
      resolveSessionAccess({
        hasToken: true,
        sessionFound: true,
        sessionExpired: false,
        memberDisabled: true,
        memberDeletedAnonymized: false,
      }).code,
    ).toBe("DISABLED");
    expect(
      resolveSessionAccess({
        hasToken: true,
        sessionFound: true,
        sessionExpired: false,
        memberDisabled: false,
        memberDeletedAnonymized: true,
      }).allowed,
    ).toBe(false);
  });
});
