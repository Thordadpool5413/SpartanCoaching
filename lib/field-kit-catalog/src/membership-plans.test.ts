import { describe, expect, it } from "vitest";
import {
  COMPANY_ELITE_PLAN,
  COMPANY_STANDARD_PLAN,
  ELITE_WEEKLY_PLAN,
  STANDARD_WEEKLY_PLAN,
  canUseDeidentifiedClinical,
  canUsePhiClinical,
  hasEliteMembership,
  hasContractedOrganizationAdminAccess,
  hasStandardMembership,
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

  it("keeps Standard and Elite access distinct for individual and contract members", () => {
    expect(hasStandardMembership({ billingPlan: STANDARD_WEEKLY_PLAN.billingPlan })).toBe(true);
    expect(hasEliteMembership({ billingPlan: STANDARD_WEEKLY_PLAN.billingPlan })).toBe(false);
    expect(hasStandardMembership({ billingPlan: ELITE_WEEKLY_PLAN.billingPlan })).toBe(true);
    expect(hasEliteMembership({ billingPlan: ELITE_WEEKLY_PLAN.billingPlan })).toBe(true);
    expect(hasStandardMembership({ organizationType: "company", billingPlan: COMPANY_STANDARD_PLAN })).toBe(true);
    expect(hasEliteMembership({ organizationType: "company", billingPlan: COMPANY_STANDARD_PLAN })).toBe(false);
    expect(hasEliteMembership({ organizationType: "company", billingPlan: COMPANY_ELITE_PLAN })).toBe(true);
  });

  it("limits deidentified clinical tools to Elite or explicitly approved organizations", () => {
    expect(canUseDeidentifiedClinical("standard")).toBe(false);
    expect(canUseDeidentifiedClinical("elite")).toBe(true);
    expect(canUseDeidentifiedClinical("organization", true)).toBe(true);
  });

  it("never allows PHI in individual or organization accounts", () => {
    expect(canUsePhiClinical("elite", true)).toBe(false);
    expect(canUsePhiClinical("organization", false)).toBe(false);
    expect(canUsePhiClinical("organization", true)).toBe(false);
    expect(canUsePhiClinical("organization", true, "platform_admin")).toBe(false);
  });

  it("opens organization administration only for an active contracted company admin", () => {
    expect(hasContractedOrganizationAdminAccess({ memberRole: "platform_admin" })).toBe(true);
    expect(hasContractedOrganizationAdminAccess({
      memberRole: "org_admin",
      organizationType: "company",
      organizationStatus: "active",
      billingPlan: COMPANY_STANDARD_PLAN,
    })).toBe(true);
    expect(hasContractedOrganizationAdminAccess({
      memberRole: "org_admin",
      organizationType: "personal",
      organizationStatus: "active",
      billingPlan: "individual_weekly_elite",
    })).toBe(false);
    expect(hasContractedOrganizationAdminAccess({
      memberRole: "org_admin",
      organizationType: "company",
      organizationStatus: "pending",
      billingPlan: COMPANY_STANDARD_PLAN,
    })).toBe(false);
  });
});
