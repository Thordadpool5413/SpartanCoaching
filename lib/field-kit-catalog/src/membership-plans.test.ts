import { describe, expect, it } from "vitest";
import {
  ELITE_WEEKLY_PLAN,
  STANDARD_WEEKLY_PLAN,
  canUseDeidentifiedClinical,
  canUsePhiClinical,
  resolveMembershipTier,
} from "./membership-plans";

describe("membership plans", () => {
  it("keeps Standard and Elite prices and Apple product IDs distinct", () => {
    expect(STANDARD_WEEKLY_PLAN.priceCents).toBe(1499);
    expect(ELITE_WEEKLY_PLAN.priceCents).toBe(1999);
    expect(STANDARD_WEEKLY_PLAN.appleProductId).not.toBe(ELITE_WEEKLY_PLAN.appleProductId);
  });

  it("resolves individual and organization tiers", () => {
    expect(resolveMembershipTier({ billingPlan: "individual_weekly" })).toBe("standard");
    expect(resolveMembershipTier({ billingPlan: "individual_weekly_elite" })).toBe("elite");
    expect(resolveMembershipTier({ organizationType: "company" })).toBe("organization");
  });

  it("limits deidentified clinical tools to Elite or explicitly approved organizations", () => {
    expect(canUseDeidentifiedClinical("standard")).toBe(false);
    expect(canUseDeidentifiedClinical("elite")).toBe(true);
    expect(canUseDeidentifiedClinical("organization", true)).toBe(true);
  });

  it("allows PHI only for explicitly approved organization accounts", () => {
    expect(canUsePhiClinical("elite", true)).toBe(false);
    expect(canUsePhiClinical("organization", false)).toBe(false);
    expect(canUsePhiClinical("organization", true)).toBe(true);
  });
});
