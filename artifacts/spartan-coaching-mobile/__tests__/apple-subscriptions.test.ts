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

  it("uses localized StoreKit prices and keeps iOS membership independent of Stripe", () => {
    const account = fs.readFileSync(
      path.resolve(__dirname, "../app/(tabs)/account.tsx"),
      "utf8",
    );
    const membership = fs.readFileSync(
      path.resolve(__dirname, "../app/membership.tsx"),
      "utf8",
    );
    const actions = fs.readFileSync(
      path.resolve(__dirname, "../components/AppleSubscriptionActions.tsx"),
      "utf8",
    );

    expect(membership).toContain("prices.standard_weekly");
    expect(membership).toContain("prices.elite_weekly");
    expect(membership).toContain("onPricesLoaded={setPrices}");
    expect(actions).toContain("onPricesLoaded");
    expect(actions).toContain("displayPrice");
    expect(account).not.toContain("startIndividualCheckout");
    expect(account).not.toContain("openBillingPortal");
    expect(membership).not.toContain("startIndividualCheckout");
    expect(membership).not.toContain("stripe");
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
    expect(source).toContain("appAccountToken,");
    expect(source).toContain("verifyGuestAppleTransaction(purchase.purchaseToken");
    expect(source).toContain("claimAppleTransaction(purchase.purchaseToken");
    expect(source).toContain("finishTransaction({ purchase, isConsumable: false })");
    expect(source).toContain("getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })");
    expect(source).toContain("deepLinkToSubscriptions({})");
    expect(source).toContain("renews automatically each week");
    expect(source).toContain("APP_STORE_TERMS_URL");
    expect(source).toContain("APP_STORE_PRIVACY_URL");
  });

  it("allows Apple purchase before Spartan account creation", () => {
    const membership = fs.readFileSync(path.resolve(__dirname, "../app/membership.tsx"), "utf8");
    const api = fs.readFileSync(path.resolve(__dirname, "../lib/api.ts"), "utf8");
    expect(membership).toContain("Payment happens through Apple before Spartan account creation");
    expect(membership).toContain("Add private Coach when you want the complete system");
    expect(membership).toContain("<AppleSubscriptionActions");
    expect(membership).toContain('router.push("/register" as any)');
    expect(api).toContain('"/api/billing/apple/guest-verify"');
    expect(api).toContain('"/api/billing/apple/claim"');
  });

  it("auto claims purchases only into personal workspaces", () => {
    const auth = fs.readFileSync(path.resolve(__dirname, "../lib/AuthContext.tsx"), "utf8");
    expect(auth).toContain('data.organization?.type === "personal"');
    expect(auth).toContain("shouldClaimApplePurchase(data) && await claimCurrentApplePurchases()");
  });
});
