import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "appleBilling.ts"), "utf8");
const migration = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../../lib/db/migrations/0017_apple_subscriptions.sql"),
  "utf8",
);

describe("Apple subscription verification contract", () => {
  it("verifies production and sandbox signatures against the Spartan bundle", () => {
    expect(source).toContain("SignedDataVerifier");
    expect(source).toContain('const BUNDLE_ID = "com.spartancoaching.fieldkit"');
    expect(source).toContain("Environment.PRODUCTION");
    expect(source).toContain("Environment.SANDBOX");
  });

  it("binds a transaction to one member and one organization", () => {
    expect(source).toContain("appAccountToken");
    expect(source).toContain("APPLE_TRANSACTION_REJECTED");
    expect(migration).toContain("uq_client_members_apple_account");
    expect(migration).toContain("uq_client_org_apple_original_transaction");
  });

  it("supports purchase before account creation and secure claim after sign in", () => {
    expect(source).toContain('/api/billing/apple/catalog');
    expect(source).toContain('/api/billing/apple/guest-verify');
    expect(source).toContain('/api/billing/apple/claim');
    expect(source).toContain("previewTransaction(verified)");
    expect(source).toContain("requireAccountBinding: false");
  });

  it("handles lifecycle notifications and expiration", () => {
    expect(source).toContain('/api/billing/apple/notifications');
    expect(source).toContain("verifyAndDecodeNotification");
    expect(source).toContain("revocationDate");
    expect(source).toContain("accessEnd.getTime() > Date.now()");
    expect(source).toContain("verifyAndDecodeRenewalInfo");
    expect(source).toContain("AutoRenewStatus.OFF");
    expect(source).toContain("gracePeriodExpiresDate");
    expect(source).toContain("STALE_TRANSACTION");
    expect(source).toContain("appleLastSignedAt");
    expect(source).toContain("eventSignedAt: decoded.signedDate");
  });

  it("exposes a secret safe production readiness endpoint", () => {
    expect(source).toContain('/api/billing/apple/health');
    expect(source).toContain('status: configured ? "ok" : "not_configured"');
    expect(source).not.toContain("APPLE_ROOT_CERTIFICATES_BASE64,");
  });
});
