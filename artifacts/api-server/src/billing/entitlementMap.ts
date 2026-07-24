/**
 * Pure mapping: Stripe subscription status → Field Kit org access fields.
 * Kept free of DB imports so unit tests stay light.
 */

export type EntitlementSlice = {
  status?: string;
  pipelineStatus?: string;
  activatedAt?: Date | null;
  trialEndsAt?: Date | null;
};

/**
 * - active / trialing → active Field Kit
 * - past_due / unpaid → suspended
 * - canceled / incomplete_expired → expired
 * - incomplete / paused → no forced status change
 */
export function entitlementFromStripeStatus(stripeStatus: string): EntitlementSlice {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return {
        status: "active",
        pipelineStatus: "won",
        activatedAt: new Date(),
        trialEndsAt: null,
      };
    case "past_due":
    case "unpaid":
      return {
        status: "suspended",
        pipelineStatus: "follow_up",
      };
    case "canceled":
    case "incomplete_expired":
      return {
        status: "expired",
        pipelineStatus: "churned",
        trialEndsAt: new Date(),
      };
    case "incomplete":
    case "paused":
    default:
      return {};
  }
}
