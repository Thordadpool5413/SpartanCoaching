export const STANDARD_WEEKLY_PLAN = {
  id: "standard_weekly",
  billingPlan: "individual_weekly",
  appleProductId: "com.spartancoaching.fieldkit.standard.weekly",
  priceCents: 1499,
  displayPrice: "$14.99/week",
} as const;

export const ELITE_WEEKLY_PLAN = {
  id: "elite_weekly",
  billingPlan: "individual_weekly_elite",
  appleProductId: "com.spartancoaching.fieldkit.elite.weekly",
  priceCents: 1999,
  displayPrice: "$19.99/week",
} as const;

export const MEMBERSHIP_PLANS = [STANDARD_WEEKLY_PLAN, ELITE_WEEKLY_PLAN] as const;

export type MembershipTier = "none" | "standard" | "elite" | "organization";

export const COMPANY_STANDARD_PLAN = "corporate_contract" as const;
export const COMPANY_ELITE_PLAN = "corporate_contract_elite" as const;

export function resolveMembershipTier(input: {
  billingPlan?: string | null;
  organizationType?: string | null;
  memberRole?: string | null;
}): MembershipTier {
  if (input.memberRole === "platform_admin") {
    return "elite";
  }
  if (input.organizationType === "company") {
    return "organization";
  }
  if (input.billingPlan === ELITE_WEEKLY_PLAN.billingPlan) return "elite";
  if (input.billingPlan === STANDARD_WEEKLY_PLAN.billingPlan || input.billingPlan === "comp") {
    return "standard";
  }
  return "none";
}

export function hasEliteMembership(input: {
  billingPlan?: string | null;
  organizationType?: string | null;
  memberRole?: string | null;
}): boolean {
  if (input.memberRole === "platform_admin") return true;
  return (
    input.billingPlan === ELITE_WEEKLY_PLAN.billingPlan ||
    input.billingPlan === COMPANY_ELITE_PLAN
  );
}

export function hasStandardMembership(input: {
  billingPlan?: string | null;
  organizationType?: string | null;
  memberRole?: string | null;
}): boolean {
  if (hasEliteMembership(input)) return true;
  if (input.organizationType === "company") {
    return input.billingPlan === COMPANY_STANDARD_PLAN;
  }
  return (
    input.billingPlan === STANDARD_WEEKLY_PLAN.billingPlan ||
    input.billingPlan === "comp"
  );
}

export function canUseDeidentifiedClinical(
  tier: MembershipTier,
  explicitPermission = false,
  memberRole?: string | null,
): boolean {
  if (memberRole === "platform_admin") return true;
  if (tier === "elite") return true;
  return tier === "organization" && explicitPermission;
}

export function canUsePhiClinical(
  _tier: MembershipTier,
  _explicitPermission = false,
  _memberRole?: string | null,
): boolean {
  return false;
}
