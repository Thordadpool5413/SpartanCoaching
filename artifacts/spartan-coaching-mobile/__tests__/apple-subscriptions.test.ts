import { ELITE_WEEKLY_PLAN, STANDARD_WEEKLY_PLAN } from "@workspace/field-kit-catalog";
import { APPLE_SUBSCRIPTION_PRODUCT_IDS, missingAppleProducts, tierForAppleProduct } from "@/lib/appleSubscriptions";

describe("Apple subscription contract", () => {
  it("uses the canonical Standard and Elite product IDs", () => {
    expect(APPLE_SUBSCRIPTION_PRODUCT_IDS).toEqual([
      STANDARD_WEEKLY_PLAN.appleProductId,
      ELITE_WEEKLY_PLAN.appleProductId,
    ]);
  });

  it("maps products to separate entitlement tiers", () => {
    expect(tierForAppleProduct(STANDARD_WEEKLY_PLAN.appleProductId)).toBe("standard");
    expect(tierForAppleProduct(ELITE_WEEKLY_PLAN.appleProductId)).toBe("elite");
    expect(tierForAppleProduct("unknown")).toBeNull();
  });

  it("fails readiness when either product is unavailable", () => {
    expect(missingAppleProducts([{ id: STANDARD_WEEKLY_PLAN.appleProductId }])).toEqual([ELITE_WEEKLY_PLAN.appleProductId]);
  });
});
