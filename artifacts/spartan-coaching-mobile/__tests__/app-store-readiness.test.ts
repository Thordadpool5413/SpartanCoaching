import {
  APP_REVIEW_NOTES,
  APP_STORE_PRIVACY_URL,
  APP_STORE_READINESS_ITEMS,
  APP_STORE_SUPPORT_URL,
  IOS_BUNDLE_ID,
  readinessSummary,
} from "@/lib/appStoreReadiness";

describe("App Store readiness contract (HSP-46)", () => {
  it("requires account deletion and privacy manifest items", () => {
    const ids = APP_STORE_READINESS_ITEMS.map((i) => i.id);
    expect(ids).toContain("account_deletion");
    expect(ids).toContain("privacy_manifest");
    expect(ids).toContain("privacy_policy_link");
    expect(ids).toContain("export_compliance");
    expect(ids).toContain("backend_compat");
  });

  it("flags incomplete StoreKit purchase as a release risk", () => {
    const sub = APP_STORE_READINESS_ITEMS.find((i) => i.id === "subscription_model");
    expect(sub?.status).toBe("risk");
    expect(sub?.action).toMatch(/StoreKit 2|App Store Connect|server/i);
  });

  it("uses production support and privacy URLs", () => {
    expect(APP_STORE_PRIVACY_URL).toMatch(/^https:\/\//);
    expect(APP_STORE_SUPPORT_URL).toMatch(/^https:\/\//);
    expect(IOS_BUNDLE_ID).toBe("com.spartancoaching.fieldkit");
  });

  it("review notes mention deletion and the gated Apple plans", () => {
    expect(APP_REVIEW_NOTES).toMatch(/Delete account/i);
    expect(APP_REVIEW_NOTES).toMatch(/Standard/i);
    expect(APP_REVIEW_NOTES).toMatch(/Elite/i);
  });

  it("readinessSummary counts statuses", () => {
    const s = readinessSummary();
    expect(s.implemented + s.external + s.partial + s.risk).toBe(
      APP_STORE_READINESS_ITEMS.length,
    );
    expect(s.reviewNotes.length).toBeGreaterThan(50);
  });
});
