/**
 * Authoritative product entitlement service for Hospice Sales Pro.
 *
 * Billing source (Stripe individual/corporate, offline contract, trial, comp)
 * is separate from product access (tool/membership unlock). Web and iOS must
 * consume this server decision via /api/auth/me and /api/billing/status — never
 * re-derive access from local Stripe/Apple state.
 *
 * Existing evaluateFieldKitAccess remains the product gate used by requireFieldKit.
 * This module normalizes billing + access into one client-safe snapshot and
 * centralizes checkout / restoration policy.
 */

import {
  evaluateFieldKitAccess,
  type AccessMember,
  type AccessOrg,
  type FieldKitAccessResult,
} from "../auth/evaluateAccess";
import { entitlementFromStripeStatus } from "./entitlementMap";

/** How the org pays (or is granted access) — not the same as product unlock. */
export type BillingSource =
  | "none"
  | "trial_evaluation"
  | "stripe_individual"
  | "stripe_corporate"
  | "offline_contract"
  | "comp"
  | "platform_admin";

export type EntitlementOrg = AccessOrg & {
  id?: number;
  billingPlan?: string | null;
  billingStatus?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
  billableSeats?: number | null;
  seatLimit?: number | null;
  contractRef?: string | null;
  contractUnitAmountCents?: number | null;
  type?: string;
};

export type EntitlementMember = AccessMember & {
  id?: number;
  organizationId?: number;
};

export type ProductEntitlement = {
  /** Tool / Membership product access (server truth). */
  productAccess: boolean;
  reason: FieldKitAccessResult["reason"] | null;
  billingSource: BillingSource;
  /** Raw provider status when Stripe-backed (active, past_due, canceled, …). */
  providerStatus: string | null;
  orgStatus: string;
  trialEndsAt: string | null;
  hoursRemaining: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** past_due / unpaid billing failure while product may already be suspended. */
  billingFailure: boolean;
  /**
   * Soft grace: past_due with period still open. Product access still follows
   * org.status (suspended today); clients can show “update payment” UX.
   */
  inBillingGraceWindow: boolean;
  seats: {
    seatLimit: number;
    billableSeats: number | null;
    activeMemberCount: number | null;
    overSeatLimit: boolean;
  };
  actions: {
    canCheckoutIndividual: boolean;
    canOpenBillingPortal: boolean;
    canRestoreViaPortal: boolean;
    blockCheckoutCode: string | null;
    blockCheckoutMessage: string | null;
  };
  /**
   * App Store digital-goods note: native IAP not implemented.
   * iOS clients should open web billing / Account for Stripe, not embed StoreKit.
   */
  purchaseChannel: {
    webStripeSupported: boolean;
    appleIapImplemented: boolean;
    iosGuidance: string;
  };
};

export type CheckoutBlock = {
  code: string;
  message: string;
};

const ISO = (d: Date | string | null | undefined): string | null => {
  if (!d) return null;
  if (typeof d === "string") return d;
  return d.toISOString();
};

export function deriveBillingSource(
  member: EntitlementMember,
  org: EntitlementOrg,
): BillingSource {
  if (member.role === "platform_admin") return "platform_admin";
  const plan = (org.billingPlan || "").toLowerCase();
  if (plan === "comp") return "comp";
  if (plan === "corporate_contract") {
    return org.stripeSubscriptionId ? "stripe_corporate" : "offline_contract";
  }
  if (plan === "individual_weekly" || org.stripeSubscriptionId) {
    return "stripe_individual";
  }
  if (org.status === "trial") return "trial_evaluation";
  if (org.status === "active" && !org.stripeSubscriptionId) {
    // Active without Stripe — contract/comp/admin grant
    if (org.contractRef) return "offline_contract";
    return "comp";
  }
  return "none";
}

/**
 * past_due with a future period end is a “grace window” for UX messaging.
 * Product unlock still uses org.status (entitlementFromStripeStatus maps past_due → suspended).
 */
export function isInBillingGraceWindow(
  org: EntitlementOrg,
  nowMs: number = Date.now(),
): boolean {
  const status = (org.billingStatus || "").toLowerCase();
  if (status !== "past_due" && status !== "unpaid") return false;
  const end = org.currentPeriodEnd;
  if (!end) return true; // unknown end — still flag grace UX
  const t = typeof end === "string" ? Date.parse(end) : end.getTime();
  if (Number.isNaN(t)) return true;
  return t > nowMs;
}

export function assertIndividualCheckoutAllowed(
  member: EntitlementMember,
  org: EntitlementOrg,
  opts?: { stripeConfigured?: boolean; individualPriceConfigured?: boolean },
): CheckoutBlock | null {
  if (opts?.stripeConfigured === false) {
    return {
      code: "STRIPE_NOT_CONFIGURED",
      message: "Billing is not configured yet",
    };
  }
  if (opts?.individualPriceConfigured === false) {
    return {
      code: "PRICE_NOT_CONFIGURED",
      message: "Individual weekly price is not configured",
    };
  }
  if (org.type === "platform") {
    return {
      code: "PLATFORM_ORG",
      message: "Platform organizations do not use self-serve billing",
    };
  }
  if (org.type && org.type !== "personal") {
    return {
      code: "CORPORATE_CONTRACT_REQUIRED",
      message:
        "Corporate plans are activated under contract. Contact Spartan Coaching or use Access Desk.",
    };
  }
  if ((org.billingPlan || "").toLowerCase() === "comp") {
    return {
      code: "COMP_ACCOUNT",
      message: "This account is complimentary and does not require payment",
    };
  }
  if (member.role === "platform_admin") {
    return {
      code: "PLATFORM_ADMIN",
      message: "Platform administrators do not use self-serve individual checkout",
    };
  }
  // Duplicate subscription prevention
  if (
    org.stripeSubscriptionId &&
    (org.billingStatus === "active" || org.billingStatus === "trialing") &&
    org.status === "active"
  ) {
    return {
      code: "ALREADY_SUBSCRIBED",
      message:
        "You already have an active subscription. Use Manage billing to update or cancel.",
    };
  }
  return null;
}

export function seatCapacityStatus(
  org: EntitlementOrg,
  activeMemberCount: number | null,
): ProductEntitlement["seats"] {
  const seatLimit = Math.max(0, org.seatLimit ?? 0);
  const billableSeats =
    typeof org.billableSeats === "number" ? org.billableSeats : null;
  const limit = billableSeats != null ? Math.max(seatLimit, billableSeats) : seatLimit;
  const count = activeMemberCount ?? null;
  return {
    seatLimit,
    billableSeats,
    activeMemberCount: count,
    overSeatLimit: count != null && limit > 0 && count > limit,
  };
}

/**
 * Single snapshot: product access + billing source + restoration actions.
 * Pure — no DB. Callers pass fresh org after refreshOrgStatus.
 */
export function resolveProductEntitlement(
  member: EntitlementMember,
  org: EntitlementOrg,
  opts?: {
    activeMemberCount?: number | null;
    stripeConfigured?: boolean;
    individualPriceConfigured?: boolean;
    nowMs?: number;
  },
): ProductEntitlement {
  const access = evaluateFieldKitAccess(member, org);
  const billingSource = deriveBillingSource(member, org);
  const providerStatus = org.billingStatus ?? null;
  const grace = isInBillingGraceWindow(org, opts?.nowMs);
  const billingFailure =
    providerStatus === "past_due" ||
    providerStatus === "unpaid" ||
    org.status === "suspended";

  const checkoutBlock = assertIndividualCheckoutAllowed(member, org, {
    stripeConfigured: opts?.stripeConfigured,
    individualPriceConfigured: opts?.individualPriceConfigured,
  });

  const hasCustomer = Boolean(org.stripeCustomerId);
  const stripeConfigured = opts?.stripeConfigured !== false;

  return {
    productAccess: access.allowed,
    reason: access.reason ?? null,
    billingSource,
    providerStatus,
    orgStatus: org.status,
    trialEndsAt: ISO(access.trialEndsAt ?? org.trialEndsAt ?? null),
    hoursRemaining:
      typeof access.hoursRemaining === "number" ? access.hoursRemaining : null,
    currentPeriodEnd: ISO(org.currentPeriodEnd ?? null),
    cancelAtPeriodEnd: Boolean(org.cancelAtPeriodEnd),
    billingFailure,
    inBillingGraceWindow: grace,
    seats: seatCapacityStatus(org, opts?.activeMemberCount ?? null),
    actions: {
      canCheckoutIndividual: checkoutBlock === null && stripeConfigured,
      canOpenBillingPortal: hasCustomer && stripeConfigured,
      canRestoreViaPortal:
        hasCustomer &&
        stripeConfigured &&
        (billingFailure ||
          org.status === "expired" ||
          org.status === "suspended" ||
          providerStatus === "canceled"),
      blockCheckoutCode: checkoutBlock?.code ?? null,
      blockCheckoutMessage: checkoutBlock?.message ?? null,
    },
    purchaseChannel: {
      webStripeSupported: true,
      appleIapImplemented: false,
      iosGuidance:
        "Digital Hospice Sales Pro subscriptions are sold via web Stripe (Account / website). Native StoreKit IAP is not implemented; do not embed alternate iOS payment for the same digital unlock.",
    },
  };
}

/**
 * Map Stripe status → org entitlement fields (delegates to entitlementMap).
 * Kept here so one module is the billing→product mapping entrypoint.
 */
export function productEntitlementPatchFromStripeStatus(stripeStatus: string) {
  return entitlementFromStripeStatus(stripeStatus);
}

/**
 * App Store requirements audit (static). Not a substitute for legal review.
 * Shipping native Stripe Checkout UI inside the iOS binary for digital goods
 * risks Guideline 3.1.1; current product path uses web Account / Safari.
 */
export const APP_STORE_BILLING_AUDIT = {
  guideline: "3.1.1 In-App Purchase",
  digitalUnlock: "Hospice Sales Pro membership tools",
  currentPath: "Stripe Checkout + Customer Portal on web; iOS opens web Account for subscribe",
  nativeStripeInAppBinary: "not_recommended_for_digital_subscription",
  appleIapStatus: "not_implemented",
  enterpriseAndWebPurchase: "web_or_enterprise_contract_ok",
  nextSlice:
    "If App Review requires IAP for iOS-originated digital subscribe, add StoreKit + server receipt validation that maps into the same resolveProductEntitlement path",
} as const;

/** Public JSON shape attached to /api/auth/me and /api/billing/status. */
export function publicEntitlementPayload(ent: ProductEntitlement) {
  return {
    productAccess: ent.productAccess,
    reason: ent.reason,
    billingSource: ent.billingSource,
    providerStatus: ent.providerStatus,
    orgStatus: ent.orgStatus,
    trialEndsAt: ent.trialEndsAt,
    hoursRemaining: ent.hoursRemaining,
    currentPeriodEnd: ent.currentPeriodEnd,
    cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
    billingFailure: ent.billingFailure,
    inBillingGraceWindow: ent.inBillingGraceWindow,
    seats: ent.seats,
    actions: ent.actions,
    purchaseChannel: ent.purchaseChannel,
  };
}
