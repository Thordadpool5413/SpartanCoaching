# Field Kit billing — Phase 1 (Stripe)

## What shipped

- DB columns on `client_organizations` for Stripe customer/subscription, plan, period end, cancel flag, corporate contract fields (for Phase 3)
- APIs:
  - `GET /api/billing/status` — signed-in org billing summary
  - `POST /api/billing/checkout` — individual weekly Checkout Session
  - `POST /api/billing/portal` — Stripe Customer Portal (self-cancel / payment method)
  - `POST /api/billing/webhook` — Stripe events → org entitlement
- Entitlement still uses `org.status` (`active` / `suspended` / `expired`); webhooks set those fields

## Replit / production secrets

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` or `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from Stripe webhook endpoint (`whsec_…`) |
| `STRIPE_PRICE_INDIVIDUAL_WEEKLY` | Price id for **$14.99 / week** recurring (`price_…`) |
| `SITE_URL` | Public HTTPS origin (success/cancel/portal return URLs) |

## Stripe Dashboard setup

1. Create Product **Field Kit Individual** with recurring **weekly** price **$14.99 USD**.
2. Copy Price id → `STRIPE_PRICE_INDIVIDUAL_WEEKLY`.
3. Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR_HOST/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`.
5. Settings → Customer portal: enable **Cancel subscription** (prefer **at period end**).

## Database

```bash
pnpm --filter @workspace/db run push
```

## Manual smoke (after secrets)

1. Log in as a **personal** trial member (not platform admin).
2. `POST /api/billing/checkout` with session cookie → open returned `url`.
3. Complete test card `4242…` in Checkout.
4. Confirm org `status=active`, `billingPlan=individual_weekly`.
5. `POST /api/billing/portal` → cancel at period end → `cancelAtPeriodEnd=true`.
6. After period end (or test clock), org should become `expired` and tools lock.

## Phase 2 UI + full website (shipped)

- `/field-kit-membership` — $14.99/week individual, contract language for teams, Subscribe CTA when signed in
- `/account` — Subscribe · $14.99/week, Manage billing / cancel, post-checkout banners
- `FieldKitGate` — Subscribe / Manage billing when evaluation ended or suspended
- `TrialBanner` + Portal trial chip — Continue $14.99/wk during personal evaluation
- FAQ, Terms, Privacy, Request Access, Services, Home SEO, TrustStrip, footer — aligned with self-serve individual + contract teams
- Shared `billingClient.ts` + `useBillingActions` for checkout/portal CTAs

## Phase 3 — Corporate contract (shipped)

Access Desk → open an organization → **Corporate / provider contract**:

- Seats (billable) × **$ / seat / week** (contract rate)
- Contract ref (optional)
- Mode: **Stripe invoice (weekly)** or **Offline**
- **Update seats** syncs Stripe subscription quantity when a sub exists

APIs:

- `POST /api/admin/organizations/:id/billing/contract`
- `PATCH /api/admin/organizations/:id/billing/seats`

Invites enforce seat cap (`billableSeats` or `seatLimit`).

## Phase 4 — Lifecycle polish (shipped)

- Payment failed → member email + admin alert; org `suspended` / `past_due`
- Cancel at period end → member email; Access Desk “Canceling” badge
- Subscription deleted → member canceled email; org `expired`
- Ops digest includes past due / canceled / paid active counts
- Access Desk filters: Past due, Billing cancel
- Audit events: `billing_*` in `auth_events`
- Membership + Account legal summary (auto-renew, cancel at period end)

## Out of scope (later)

- Mobile IAP
- Org-admin self-serve seat purchase

## Comp / offline accounts

Set `billing_plan = 'comp'` and `status = 'active'` in Access Desk (manual activate) so complimentary orgs skip checkout.
