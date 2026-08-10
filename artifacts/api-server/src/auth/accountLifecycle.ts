/**
 * Account lifecycle policy for Hospice Sales Pro membership identity.
 * Server-authoritative: clients may call export/delete/reauth APIs but cannot
 * skip password reauth or soft-delete rules.
 *
 * Already covered elsewhere (authRoutes / middleware / entitlement):
 * register, login, logout, logout-others, expired sessions, forgot/reset password,
 * set-password invite, magic link, org membership invite/disable, change-password.
 *
 * This module completes: data export, account deletion (App Store), reauth gate,
 * session refresh policy. Email verification for general login is not a product
 * requirement today (clinical MFA is separate).
 */

export type LifecycleCapability =
  | "register"
  | "login"
  | "logout"
  | "session_refresh"
  | "expired_session"
  | "password_recovery"
  | "change_password"
  | "profile"
  | "org_membership"
  | "disabled_accounts"
  | "data_export"
  | "account_deletion"
  | "reauthenticate"
  | "email_verification_general";

/** Inventory for tests / product truth — server is source of capability. */
export const ACCOUNT_LIFECYCLE_CAPABILITIES: Record<
  LifecycleCapability,
  { status: "implemented" | "slice_a" | "not_applicable"; notes: string }
> = {
  register: { status: "implemented", notes: "POST /api/auth/register + request-access" },
  login: { status: "implemented", notes: "POST /api/auth/login (cookie + bearer token)" },
  logout: { status: "implemented", notes: "POST /api/auth/logout + logout-others" },
  session_refresh: {
    status: "slice_a",
    notes: "POST /api/auth/session/refresh rotates session without password",
  },
  expired_session: {
    status: "implemented",
    notes: "loadSession requires expiresAt > now; disabled members not loaded",
  },
  password_recovery: {
    status: "implemented",
    notes: "forgot-password + reset-password + set-password tokens",
  },
  change_password: {
    status: "implemented",
    notes: "POST /api/auth/change-password (current password required)",
  },
  profile: { status: "implemented", notes: "GET/PATCH /api/me/onboarding + /api/auth/me" },
  org_membership: {
    status: "implemented",
    notes: "org invites, members list, disable member",
  },
  disabled_accounts: {
    status: "implemented",
    notes: "login + loadSession deny status=disabled",
  },
  data_export: { status: "slice_a", notes: "GET /api/auth/account/export" },
  account_deletion: {
    status: "slice_a",
    notes: "POST /api/auth/account/delete (password + confirmation)",
  },
  reauthenticate: {
    status: "slice_a",
    notes: "POST /api/auth/reauthenticate for sensitive follow-up actions",
  },
  email_verification_general: {
    status: "not_applicable",
    notes: "No general email-verify gate for membership login; clinical MFA separate",
  },
};

export type SensitiveAction =
  | "delete_account"
  | "change_password"
  | "export_account"
  | "session_refresh";

/** Whether the action requires a fresh password proof (server-side). */
export function sensitiveActionRequiresPassword(action: SensitiveAction): boolean {
  switch (action) {
    case "delete_account":
    case "change_password":
      return true;
    case "export_account":
    case "session_refresh":
      return false;
    default:
      return true;
  }
}

/** Reauth window for actions that accept recent reauthenticate() (ms). */
export const REAUTH_VALID_MS = 10 * 60 * 1000;

export function isReauthFresh(
  reauthenticatedAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!reauthenticatedAt) return false;
  const t =
    typeof reauthenticatedAt === "string"
      ? Date.parse(reauthenticatedAt)
      : reauthenticatedAt.getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t <= REAUTH_VALID_MS;
}

export function buildAnonymizedEmail(memberId: number): string {
  return `deleted+${memberId}@account.invalid`;
}

export type DeletePlanInput = {
  memberId: number;
  role: string;
  status: string;
  organizationId: number;
  /** Other active (non-disabled) members in the same org, excluding this member. */
  otherActiveMemberCount: number;
  /** True if this member is the only org_admin remaining among active members. */
  isSoleActiveOrgAdmin: boolean;
};

export type DeletePlanResult =
  | {
      ok: true;
      anonymizedEmail: string;
      anonymizedName: string;
      nextStatus: "disabled";
      clearPassword: true;
      revokeAllSessions: true;
      suspendPersonalOrg: boolean;
    }
  | {
      ok: false;
      code:
        | "ALREADY_DISABLED"
        | "SOLE_ORG_ADMIN"
        | "PLATFORM_ADMIN_BLOCKED";
      message: string;
    };

/**
 * Pure delete planner. Does not touch the database.
 * Soft-delete: disable account, scrub credentials/PII fields, free email uniqueness.
 */
export function planAccountDeletion(input: DeletePlanInput): DeletePlanResult {
  if (input.status === "disabled") {
    return {
      ok: false,
      code: "ALREADY_DISABLED",
      message: "Account is already disabled.",
    };
  }
  if (input.role === "platform_admin") {
    return {
      ok: false,
      code: "PLATFORM_ADMIN_BLOCKED",
      message:
        "Platform administrator accounts cannot self-delete. Contact another platform admin.",
    };
  }
  if (input.role === "org_admin" && input.isSoleActiveOrgAdmin && input.otherActiveMemberCount > 0) {
    return {
      ok: false,
      code: "SOLE_ORG_ADMIN",
      message:
        "You are the only organization admin with active teammates. Promote another admin before deleting your account.",
    };
  }

  return {
    ok: true,
    anonymizedEmail: buildAnonymizedEmail(input.memberId),
    anonymizedName: "Deleted User",
    nextStatus: "disabled",
    clearPassword: true,
    revokeAllSessions: true,
    // Personal/single-seat orgs with no remaining active members should stop trial burn.
    suspendPersonalOrg: input.otherActiveMemberCount === 0,
  };
}

export type AccountExportSession = {
  id: number;
  createdAt: string | Date | null;
  expiresAt: string | Date;
  userAgent: string | null;
  isCurrent: boolean;
};

export type AccountExportInput = {
  exportedAt: string;
  member: {
    id: number;
    email: string;
    name: string;
    title: string | null;
    role: string;
    organizationId: number;
    status: string;
    jobRole: string | null;
    territoryNote: string | null;
    topObjections: string | null;
    lastLoginAt: string | Date | null;
    createdAt: string | Date | null;
  };
  organization: {
    id: number;
    name: string;
    type: string;
    status: string;
    seatLimit: number;
  } | null;
  sessions: AccountExportSession[];
};

/**
 * Build a portable JSON export of membership identity data (not clinical PHI).
 */
export function buildAccountExportPayload(input: AccountExportInput) {
  return {
    schemaVersion: 1 as const,
    product: "hospice_sales_pro",
    exportedAt: input.exportedAt,
    subject: {
      memberId: input.member.id,
      email: input.member.email,
      name: input.member.name,
      title: input.member.title,
      role: input.member.role,
      status: input.member.status,
      organizationId: input.member.organizationId,
      jobRole: input.member.jobRole,
      territoryNote: input.member.territoryNote,
      topObjections: input.member.topObjections,
      lastLoginAt: input.member.lastLoginAt,
      createdAt: input.member.createdAt,
    },
    organization: input.organization,
    sessions: input.sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      userAgent: s.userAgent,
      isCurrent: s.isCurrent,
    })),
    notes: [
      "Export contains membership account data only.",
      "Clinical or tool-run content is not included in this export.",
      "Credential digests and raw session tokens are never exported.",
    ],
  };
}

/** Stale / revoked session resolution for API tests (no DB). */
export function resolveSessionAccess(input: {
  hasToken: boolean;
  sessionFound: boolean;
  sessionExpired: boolean;
  memberDisabled: boolean;
  memberDeletedAnonymized: boolean;
}): { allowed: boolean; code: "OK" | "UNAUTHENTICATED" | "SESSION_INVALID" | "DISABLED" } {
  if (!input.hasToken) return { allowed: false, code: "UNAUTHENTICATED" };
  if (!input.sessionFound || input.sessionExpired) {
    return { allowed: false, code: "SESSION_INVALID" };
  }
  if (input.memberDisabled || input.memberDeletedAnonymized) {
    return { allowed: false, code: "DISABLED" };
  }
  return { allowed: true, code: "OK" };
}
