import { ELITE_WEEKLY_PLAN, STANDARD_WEEKLY_PLAN } from "@workspace/field-kit-catalog";
import { APPLE_SUBSCRIPTION_PRODUCT_IDS, missingAppleProducts, tierForAppleProduct } from "@/lib/appleSubscriptions";
import fs from "node:fs";
import path from "node:path";

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

  it("purchases and restores only after server verification", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../components/AppleSubscriptionActions.tsx"), "utf8");
    expect(source).toContain("appAccountToken: config.appAccountToken");
    expect(source).toContain("verifyAppleTransaction(purchase.purchaseToken)");
    expect(source).toContain("finishTransaction({ purchase, isConsumable: false })");
    expect(source).toContain("getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })");
    expect(source).toContain("deepLinkToSubscriptions({})");
  });
});
