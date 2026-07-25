# Billing email smoke test — after checkout

Use this runbook whenever you need to confirm that billing emails actually land in
the admin inbox after a real (or Stripe test-mode) checkout.  All steps use
test-mode keys and Stripe test cards so no real money changes hands.

---

## Prerequisites

| What | Where |
|------|-------|
| `STRIPE_SECRET_KEY` set to a **test-mode** key (`sk_test_…`) | Replit Secrets |
| `STRIPE_WEBHOOK_SECRET` set to the matching webhook signing secret | Replit Secrets |
| `STRIPE_PRICE_INDIVIDUAL_WEEKLY` set to the test-mode weekly price id | Replit Secrets |
| `RESEND_API_KEY` set (live key — Resend delivers in test-mode just like production) | Replit Secrets |
| Admin inbox accessible (check `NOTIFICATION_EMAIL` env; default `nick@spartanhospicecoaching.com`) | — |
| Stripe CLI installed locally **or** Stripe Dashboard webhook forwarding active | [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) |

---

## Step 1 — Fire a quick admin-alert smoke test (no checkout required)

This lets you confirm Resend credentials and domain are working **before** running
a full checkout flow.

```bash
# Replace SESSION_COOKIE with a valid platform-admin session cookie
curl -s -X POST https://<YOUR_SITE_URL>/api/admin/billing/test-alert \
  -H "Cookie: <SESSION_COOKIE>" \
  -H "Content-Type: application/json" \
  | jq .
```

Expected response:
```json
{
  "ok": true,
  "recipient": "nick@spartanhospicecoaching.com",
  "note": "Alert sent. Check the inbox listed in recipient."
}
```

> **If `ok` is `false`:** Check the API server logs for a `[Resend]` error line.
> The most common causes are a missing/invalid `RESEND_API_KEY` or a domain that
> has not yet been verified in the Resend dashboard.  See also Task #172 for
> domain-verification steps.

Open the admin inbox.  You should see an email with subject  
**"[Billing] New active subscription — …"** within 1–2 minutes.

---

## Step 2 — Confirm webhook is wired up

```bash
curl -s https://<YOUR_SITE_URL>/api/admin/stripe-webhook-health | jq .
```

`ok: true` means the webhook signing secret is consistent with the endpoint
registered in Stripe.  `ok: false` will include a `hint` explaining what is wrong.

---

## Step 3 — Trigger a test checkout

1. Log in to the app as a **personal** trial member (not a platform admin).
2. Navigate to **Account** and click **Subscribe — $14.99/week**.
3. The app POSTs to `/api/billing/checkout` and returns a Stripe Checkout URL.
4. Open the URL and enter the Stripe test card:

   | Field | Value |
   |-------|-------|
   | Card number | `4242 4242 4242 4242` |
   | Expiry | Any future date |
   | CVC | Any 3 digits |
   | ZIP | Any 5 digits |

5. Complete the checkout.  Stripe fires `checkout.session.completed` → your
   webhook handler calls `notifySubscriptionActive`.

---

## Step 4 — Verify emails arrive

Open the **admin inbox** (see `NOTIFICATION_EMAIL`).  Within 1–2 minutes you
should see **two** emails:

| # | To | Subject pattern |
|---|-----|----------------|
| 1 | Admin inbox | `[Billing] New active subscription — <Org Name>` |
| 2 | Member email | `Your Spartan Field Kit subscription is active` |

> **If emails do not arrive within 5 minutes:**
> 1. Check API server logs for `billing_subscription_active` event and any
>    `[Resend] …` warning lines.
> 2. Run the quick smoke test in Step 1 to isolate whether the issue is Resend
>    credentials vs. the webhook not firing.
> 3. Run `GET /api/admin/stripe-webhook-health` (Step 2) to verify the webhook.
> 4. In the Stripe Dashboard → Webhooks → your endpoint, inspect recent events
>    and look for failed deliveries.

---

## Step 5 — Trigger a payment-failure email (optional)

In the Stripe Dashboard (test mode), find the subscription and use
**"Simulate payment failure"** or use test card `4000 0000 0000 0341` (always
declines).  This fires `invoice.payment_failed` and should produce:

| # | To | Subject pattern |
|---|-----|----------------|
| 1 | Admin inbox | `[Billing Alert] Payment failed — <Org Name>` |
| 2 | Member email | `Action required: payment failed for your Spartan Field Kit` |

---

## Step 6 — Trigger a cancellation email (optional)

1. Navigate to **Account → Manage billing** to open the Stripe Customer Portal.
2. Cancel the subscription (choose "at period end").
3. The webhook fires `customer.subscription.updated` with `cancel_at_period_end: true`.
4. Member inbox should receive a cancellation confirmation email.

---

## Checklist

- [ ] Step 1: `POST /api/admin/billing/test-alert` returns `ok: true`
- [ ] Step 1: Admin-alert email arrives in inbox
- [ ] Step 2: `/api/admin/stripe-webhook-health` returns `ok: true`
- [ ] Step 3: Checkout completed with test card `4242…`
- [ ] Step 4: Admin billing-active alert email received
- [ ] Step 4: Member subscription-active email received
- [ ] Step 5 (opt): Payment-failure emails received (admin + member)
- [ ] Step 6 (opt): Cancellation email received (member)

---

## Automated live-API check (development only)

A Vitest integration test at  
`artifacts/api-server/src/billing/billingEmail.live.test.ts`  
hits the **real Resend API** and asserts that the `sendBillingActiveAdminAlert`
call returns without a delivery error.  It is **not included in the CI test
suite** (the `test` script in `package.json` does not list it).  Run it manually
when you need programmatic confirmation that the API key and sender domain are
working:

```bash
# From the repo root — requires RESEND_API_KEY in the environment
RESEND_API_KEY=re_live_... \
  pnpm --filter @workspace/api-server exec vitest run \
  src/billing/billingEmail.live.test.ts
```

The test skips automatically when `RESEND_API_KEY` is absent.
