import { describe, expect, it } from "vitest";
import { entitlementFromStripeStatus } from "./entitlementMap";
import fs from "node:fs";
import path from "node:path";

describe("entitlementFromStripeStatus", () => {
  it("maps active and trialing to membership active", () => {
    expect(entitlementFromStripeStatus("active").status).toBe("active");
    expect(entitlementFromStripeStatus("trialing").status).toBe("active");
    expect(entitlementFromStripeStatus("active").trialEndsAt).toBeNull();
  });

  it("maps past_due and unpaid to suspended", () => {
    expect(entitlementFromStripeStatus("past_due").status).toBe("suspended");
    expect(entitlementFromStripeStatus("unpaid").status).toBe("suspended");
  });

  it("maps canceled to expired", () => {
    expect(entitlementFromStripeStatus("canceled").status).toBe("expired");
    expect(entitlementFromStripeStatus("incomplete_expired").status).toBe("expired");
  });

  it("leaves incomplete without forcing status", () => {
    expect(entitlementFromStripeStatus("incomplete")).toEqual({});
  });

  it("keeps Standard and Elite checkout plans distinct", () => {
    const routes = fs.readFileSync(path.resolve(import.meta.dirname, "billingRoutes.ts"), "utf8");
    const stripe = fs.readFileSync(path.resolve(import.meta.dirname, "stripeClient.ts"), "utf8");
    expect(routes).toContain("STANDARD_WEEKLY_PLAN");
    expect(routes).toContain("ELITE_WEEKLY_PLAN");
    expect(routes).toContain("requestedPlan.billingPlan");
    expect(stripe).toContain("STRIPE_PRICE_INDIVIDUAL_WEEKLY_ELITE");
  });
});
