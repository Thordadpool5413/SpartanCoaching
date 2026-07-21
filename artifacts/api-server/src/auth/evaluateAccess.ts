/** Pure Field Kit entitlement rules — no DB imports (unit-testable). */

export type AccessMember = {
  status: string;
  role: string;
  passwordHash?: string | null;
};

export type AccessOrg = {
  type: string;
  status: string;
  trialEndsAt?: Date | null;
};

export type FieldKitAccessResult<M = AccessMember, O = AccessOrg> = {
  allowed: boolean;
  reason?: "unauthenticated" | "disabled" | "no_org" | "suspended" | "expired" | "pending_password";
  member?: M;
  org?: O;
  trialEndsAt?: Date | null;
  hoursRemaining?: number | null;
};

export function evaluateFieldKitAccess<M extends AccessMember, O extends AccessOrg>(
  member: M,
  org: O,
): FieldKitAccessResult<M, O> {
  if (member.status === "disabled") {
    return { allowed: false, reason: "disabled", member, org };
  }
  if (member.status === "invited" || !member.passwordHash) {
    return { allowed: false, reason: "pending_password", member, org };
  }
  if (member.status !== "active") {
    return { allowed: false, reason: "disabled", member, org };
  }

  // Platform operators always have tool + admin access
  if (member.role === "platform_admin" || org.type === "platform") {
    return {
      allowed: true,
      member,
      org,
      trialEndsAt: null,
      hoursRemaining: null,
    };
  }

  if (org.status === "suspended") {
    return { allowed: false, reason: "suspended", member, org };
  }
  if (org.status === "expired") {
    return { allowed: false, reason: "expired", member, org, trialEndsAt: org.trialEndsAt };
  }
  if (org.status === "trial") {
    if (org.trialEndsAt && org.trialEndsAt.getTime() <= Date.now()) {
      return { allowed: false, reason: "expired", member, org, trialEndsAt: org.trialEndsAt };
    }
    const hoursRemaining = org.trialEndsAt
      ? Math.max(0, (org.trialEndsAt.getTime() - Date.now()) / 3_600_000)
      : null;
    return {
      allowed: true,
      member,
      org,
      trialEndsAt: org.trialEndsAt,
      hoursRemaining,
    };
  }
  if (org.status === "active") {
    return { allowed: true, member, org, trialEndsAt: null, hoursRemaining: null };
  }

  return { allowed: false, reason: "expired", member, org };
}
