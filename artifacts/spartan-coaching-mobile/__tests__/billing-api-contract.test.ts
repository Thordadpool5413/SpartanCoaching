const fs = require("node:fs");
const path = require("node:path");

describe("mobile billing API contract", () => {
  it("derives billing paths and request payloads from generated contracts", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../lib/api.ts"), "utf8");

    expect(source).toContain("getGetBillingStatusUrl()");
    expect(source).toContain("getGetAppleBillingCatalogUrl()");
    expect(source).toContain("getGetAppleBillingConfigUrl()");
    expect(source).toContain("getVerifyAppleBillingTransactionUrl()");
    expect(source).toContain("getVerifyGuestAppleBillingTransactionUrl()");
    expect(source).toContain("getClaimAppleBillingTransactionUrl()");
    expect(source).toContain("const input: AppleTransactionInput");
    expect(source).toContain("const input: AppleTransactionClaimInput");
    expect(source).not.toContain('"/api/billing/apple/');
    expect(source).not.toContain('"/api/billing/status"');
  });
});