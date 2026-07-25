/**
 * Live Resend API integration test — NOT in the CI suite.
 *
 * This test hits the real Resend API to confirm that:
 *  - RESEND_API_KEY is valid
 *  - The sender domain is verified in Resend
 *  - The billing-active admin-alert email is accepted for delivery
 *    (i.e. Resend returns a message id, not a validation/domain error)
 *
 * Run manually when you need to confirm end-to-end delivery:
 *
 *   RESEND_API_KEY=re_live_... \
 *     pnpm --filter @workspace/api-server exec vitest run \
 *     src/billing/billingEmail.live.test.ts
 *
 * The test automatically skips when RESEND_API_KEY is not set so it can live
 * in the repo without breaking a clean CI environment that omits the key.
 *
 * See also: docs/smoke-test-billing-email.md
 */
import { describe, it, expect } from "vitest";
import { Resend } from "resend";

const LIVE_KEY = process.env.RESEND_API_KEY?.trim() ?? "";
const SKIP = !LIVE_KEY;

/**
 * The recipient for this test is the ops/admin address configured via the
 * NOTIFICATION_EMAIL env var (default: nick@spartanhospicecoaching.com).
 * The test sends a clearly labelled "[SMOKE TEST]" email so it is easy to
 * identify and delete from the inbox afterwards.
 */
const ADMIN_TO =
  process.env.NOTIFICATION_EMAIL ||
  process.env.OPS_DIGEST_EMAIL ||
  "nick@spartanhospicecoaching.com";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "Spartan Coaching <nick@spartanhospicecoaching.com>";

describe.skipIf(SKIP)("billing email — live Resend API", () => {
  it("sendBillingActiveAdminAlert: Resend accepts the email without a delivery error", async () => {
    // Import the real helper (not mocked — no vi.mock in this file)
    const { sendBillingActiveAdminAlert } = await import("../resend");

    // Call the same function the webhook handler uses
    const result = await sendBillingActiveAdminAlert(ADMIN_TO, {
      orgId: 0,
      orgName: "Smoke-Test Org (live key check — safe to delete)",
      billingPlan: "individual_weekly",
      memberEmails: ["smoke-test-member@example.com"],
    });

    expect(result).toBe(true);
  }, 20_000 /* 20 s timeout — real HTTP call */);

  it("raw Resend client: accepts a minimal email from the configured sender domain", async () => {
    const client = new Resend(LIVE_KEY);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_TO,
      subject: "[SMOKE TEST] Spartan billing email delivery check — safe to delete",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; padding: 24px;">
          <p><strong>[SMOKE TEST]</strong></p>
          <p>This email was sent by the Vitest live-API integration test in
             <code>artifacts/api-server/src/billing/billingEmail.live.test.ts</code>.</p>
          <p>If you received it, the Resend API key is valid and the sender domain
             (<code>${FROM_EMAIL}</code>) is verified.</p>
          <p style="color: #888; font-size: 12px;">You may safely delete this email.</p>
        </div>
      `,
    });

    // A delivery error from Resend (e.g. domain_not_verified, invalid_api_key)
    // surfaces here — assert none occurred.
    expect(
      error,
      `Resend returned a delivery error: ${JSON.stringify(error)}`,
    ).toBeNull();

    expect(data).toBeTruthy();
    expect(typeof (data as any)?.id).toBe("string");
  }, 20_000);
});

describe("billing email — key absent (no-op guard)", () => {
  it("test file loaded without error", () => {
    // Always passes — confirms the file is syntactically valid even without a key.
    expect(true).toBe(true);
  });
});
