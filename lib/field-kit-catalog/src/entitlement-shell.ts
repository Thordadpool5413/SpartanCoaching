/**
 * Subscription theater — shared entitlement shells for web + iOS (craft Phase 4).
 * UI maps these to PaywallCard / FieldKitGate / Account banners.
 */

export type EntitlementShellId =
  | "logged_out"
  | "trial"
  | "active"
  | "active_canceling"
  | "company_active"
  | "comp_active"
  | "expired"
  | "suspended"
  | "locked";

export type EntitlementShellInput = {
  isAuthenticated: boolean;
  /** organization.status */
  orgStatus?: string | null;
  orgType?: string | null;
  billingPlan?: string | null;
  fieldKitAllowed?: boolean;
  fieldKitReason?: string | null;
  cancelAtPeriodEnd?: boolean;
  hasPaidSubscription?: boolean;
  hoursRemaining?: number | null;
};

export type EntitlementShellCopy = {
  id: EntitlementShellId;
  /** Short chip / badge */
  chip: string;
  /** Headline for gate / paywall */
  title: string;
  /** Body copy */
  body: string;
  /** Primary CTA label */
  primaryCta: string;
  /** Secondary CTA (optional) */
  secondaryCta?: string;
  /** Restore / multi-surface note */
  restoreNote: string;
  benefits: readonly string[];
};

const BENEFITS = [
  "Live generation on field tools",
  "Command Center for today’s visits",
  "Saves and checklist synced web ↔ iPhone",
  "Cancel anytime · same seat both surfaces",
] as const;

export function resolveEntitlementShell(input: EntitlementShellInput): EntitlementShellId {
  if (!input.isAuthenticated) return "logged_out";

  const status = (input.orgStatus || "").toLowerCase();
  const reason = (input.fieldKitReason || "").toLowerCase();
  const type = (input.orgType || "").toLowerCase();
  const plan = (input.billingPlan || "").toLowerCase();

  if (status === "suspended" || reason === "suspended") return "suspended";
  if (status === "expired" || reason === "expired") return "expired";
  if (status === "trial") return "trial";

  if (status === "active" || input.fieldKitAllowed) {
    if (type === "company") return "company_active";
    if (plan === "comp") return "comp_active";
    if (input.cancelAtPeriodEnd) return "active_canceling";
    if (input.hasPaidSubscription || plan === "individual_weekly") return "active";
    return "active";
  }

  return "locked";
}

export function entitlementShellCopy(
  id: EntitlementShellId,
  opts?: { hoursLabel?: string | null },
): EntitlementShellCopy {
  const restoreNote =
    "Already subscribed? Sign in with the same email. Access restores from your account — no App Store restore button.";

  switch (id) {
    case "logged_out":
      return {
        id,
        chip: "Signed out",
        title: "Hospice Sales Pro on this device",
        body: "Sign in with your client account to run Command Center and field tools — same seat as the website.",
        primaryCta: "Sign in",
        secondaryCta: "Create account",
        restoreNote,
        benefits: BENEFITS,
      };
    case "trial":
      return {
        id,
        chip: opts?.hoursLabel
          ? `Hospice Sales Pro · evaluation · ${opts.hoursLabel}`
          : "Hospice Sales Pro · evaluation",
        title: "Evaluation access is live",
        body: "Use real tools this week. Continue at $14.99/week anytime — cancel from Manage billing.",
        primaryCta: "Continue $14.99/wk",
        secondaryCta: "Open Portal",
        restoreNote,
        benefits: BENEFITS,
      };
    case "active":
      return {
        id,
        chip: "Hospice Sales Pro · active · $14.99/wk",
        title: "Subscription active",
        body: "Weekly Hospice Sales Pro is active. Manage billing anytime — access continues through the paid period if you cancel.",
        primaryCta: "Manage billing",
        secondaryCta: "Open Portal",
        restoreNote,
        benefits: BENEFITS,
      };
    case "active_canceling":
      return {
        id,
        chip: "Hospice Sales Pro · active · canceling",
        title: "Access continues until period end",
        body: "Your subscription is set to cancel. You keep tools until the current period ends. Reverse cancel in Manage billing if needed.",
        primaryCta: "Manage billing",
        restoreNote,
        benefits: BENEFITS,
      };
    case "company_active":
      return {
        id,
        chip: "Hospice Sales Pro · team seat",
        title: "Team access active",
        body: "Your seat is under a provider contract. Seat and billing changes go through your org admin or Nick.",
        primaryCta: "Open Portal",
        secondaryCta: "Contact support",
        restoreNote,
        benefits: BENEFITS,
      };
    case "comp_active":
      return {
        id,
        chip: "Hospice Sales Pro · complimentary",
        title: "Complimentary access",
        body: "No self-serve charge on this seat. Contact Nick if you need changes.",
        primaryCta: "Open Portal",
        restoreNote,
        benefits: BENEFITS,
      };
    case "expired":
      return {
        id,
        chip: "Hospice Sales Pro · access ended",
        title: "Access has ended",
        body: "Re-subscribe for $14.99/week to unlock tools again, or contact us for a team contract.",
        primaryCta: "Subscribe $14.99/wk",
        secondaryCta: "Contact us",
        restoreNote,
        benefits: BENEFITS,
      };
    case "suspended":
      return {
        id,
        chip: "Hospice Sales Pro · suspended",
        title: "Access is paused",
        body: "Often a failed payment. Update your card under Manage billing to restore tools.",
        primaryCta: "Manage billing",
        secondaryCta: "Contact support",
        restoreNote,
        benefits: BENEFITS,
      };
    case "locked":
    default:
      return {
        id: "locked",
        chip: "Hospice Sales Pro · locked",
        title: "Access is not active",
        body: "You are signed in, but Hospice Sales Pro is not unlocked yet. Subscribe, renew, or contact us.",
        primaryCta: "Open Account",
        secondaryCta: "View pricing",
        restoreNote,
        benefits: BENEFITS,
      };
  }
}

export function formatHoursRemainingLabel(hours: number | null | undefined): string | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins}m left`;
  }
  if (hours < 48) return `${Math.round(hours)}h left`;
  return `${Math.round(hours / 24)}d left`;
}
