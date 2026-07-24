import { describe, expect, it } from "vitest";
import { entitlementFromStripeStatus } from "./entitlementMap";

describe("entitlementFromStripeStatus", () => {
  it("maps active and trialing to Field Kit active", () => {
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
});
