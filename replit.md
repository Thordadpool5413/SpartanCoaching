# Spartan Coaching

Expert hospice growth consulting site + Spartan Membership tools (web + iOS). Two offers: human consulting, and membership for tools/resources.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/spartan-coaching run dev` — web app
- `pnpm --filter @workspace/spartan-coaching-mobile run dev` — Expo mobile
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only) — **required after Field Kit auth tables**
- Required env: `DATABASE_URL` — Postgres connection string
- Auth/email env: `OPENAI_API_KEY`, `RESEND_API_KEY` / connector, `NOTIFICATION_EMAIL`, `SITE_URL`
- **Billing (Stripe):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_INDIVIDUAL_WEEKLY` ($14.99/week price id)
  - Individual: Checkout + Customer Portal cancel · Corporate: Access Desk contract form (seats × weekly rate)
  - Webhook: `POST /api/billing/webhook` · Admin contract: `POST /api/admin/organizations/:id/billing/contract`
  - After schema pull: `pnpm --filter @workspace/db run push`
  - **Bootstrap script:** `node scripts/stripe-bootstrap.mjs` — idempotent, creates/reuses Product + Price + Portal + Webhook
    - Re-run safely after domain changes; output IDs in `scripts/stripe-bootstrap.out.json` (gitignored)
    - **Re-run after a new production deploy or domain change:**
      ```
      SITE_URL=https://your-new-domain.com pnpm --filter @workspace/api-server exec node ../../scripts/stripe-bootstrap.mjs
      ```
      The script detects and deletes any stale webhook pointing to the old domain, then registers a fresh one at the new URL. Copy the new `STRIPE_WEBHOOK_SECRET` from the Stripe Dashboard and update Replit Secrets.
    - Webhook registered at `https://spartanhospicecoaching.com/api/billing/webhook` (we_1TwvuuLF4JQdUFsUNGNQh0cH)
    - Price ID: `price_1TwvuBLF4JQdUFsUjbKVeeU2` · Product: `prod_UwpZ5fOVA5SerY`
- **Platform admin:** shared passcode unlock is **retired**. Use a real `platform_admin` member session (email/password).
  - First install only: set random `ADMIN_BOOTSTRAP_TOKEN` (≥32 chars), call one-time bootstrap, then **delete** the token.
  - Optional seed email: `ADMIN_EMAIL` (default `nick@spartanhospicecoaching.com`) when bootstrap creates the first admin.
- Admin UI: `/admin` or `/admin/access-desk` after signing in as platform admin.
- Do **not** put admin secrets in `VITE_*` client env
- After roleplay ownership columns: `pnpm --filter @workspace/db run push`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Web: Vite + React 19 + Wouter
- Mobile: Expo Router
- Field Kit auth: scrypt passwords, httpOnly cookie (web) + Bearer token (mobile)
- AI: OpenAI; Email: Resend

## Where things live

- `lib/branch-engine` — canonical branch profitability engine
- `lib/db/src/schema/auth.ts` — client orgs, members, sessions, access requests
- `artifacts/api-server/src/routes/authRoutes.ts` — login, request-access, Access Desk APIs
- `artifacts/api-server/src/auth/` — crypto, entitlement, middleware (`requireFieldKit`)
- Web portal: `/welcome`, `/login`, `/request-access`, `/portal`, `/account`
- Logged-in nav shell: Portal · Command · Tools · Learn · Account · Coaching (`/portal/learn`)
- Trial lifecycle emails: received, approved, rejected, midpoint (≤4h), expired, extended, membership activated
- Magic-link login (`/login` email link + `/magic-login`)
- Platform admin: one-time bootstrap + **session cookie** only (no shared passcode / no client-embedded admin code)
- Role-play: tenant-safe (`memberId` + `organizationId`); unowned legacy rows never exposed
- Admin **Access Desk**: dedicated `/admin/access-desk` (fast) + tab inside `/admin`
- Access Desk: one-click 24h/72h approve, reject templates, follow-ups due, ops jobs, extend presets
- Access requests auto-create CRM inquiries
- Org admin: seat invites, disable member, 7-day usage (`/api/org/usage`)
- Account: change password, sign out other devices; expired clients can request extension
- Conversion: `/request-access`, `/membership`, FAQ Membership section, trust strip
- Portal first-session: role → one tool → debrief; checklist API; field context
- Mobile field companion: checklist + trial banner; Quick Actions include objections, playbooks, email, role-play, research, weekly plan, cold call
- Public trust/SEO: robots.txt, sitemap, noindex private shells, TrustStrip

## Architecture decisions

- Membership AI tools are hard-gated server-side (`requireFieldKit`); UI gates are not enough
- Access is request → Nick approves → trial (24h individual / 72h company) → admin activates paid/client (or self-serve individual subscribe)
- First-visit intro splash only (`spartan_intro_seen`); home content stays crawlable
- Personal orgs are 1-seat shells so entitlement is always org-scoped
- Platform admin = `platform_admin` member session preferred; `X-Admin-Auth` only if `ADMIN_PASSWORD` set server-side (API tools / curl)
- Rate limits: global API + login + forms; AI quotas keyed by member id when authed

## Product

- Public: marketing, method, services, content, contact, compliance
- Two offers: **Consulting** (human) · **Spartan Membership** (tools & resources, web + iOS)
- Logged-in **Portal**: Command Center spine, tools, drills, checklist
- Companies: multi-seat invites via org admin

## User preferences

- Dual product language (Consulting + Membership / Portal), not “Field Kit” as brand
- Human path (book call) on every gate
- Additive changes preferred; home condensed not deleted

## Background jobs

- Production / Replit deploy starts a scheduler (~15m): trial lifecycle sweep + daily ops digest (13–15 UTC)
- Manual: Access Desk → **Ops jobs**, or `POST /api/admin/jobs/trial-sweep` | `ops-digest` | `run-all`
- External cron: `POST /api/cron/jobs` with header `X-Cron-Secret: $CRON_SECRET`
- Env: `ENABLE_BACKGROUND_JOBS=1` (dev), `JOB_INTERVAL_MS`, `NOTIFICATION_EMAIL` / `OPS_DIGEST_EMAIL`, `CRON_SECRET`

## Gotchas

- After pulling auth schema: run `pnpm --filter @workspace/db run push` on Replit before testing login
- Mobile app (Expo Go): scan QR from the **Replit URL bar**, not the Expo LAN IP
- Mobile session token stored in AsyncStorage; send `Authorization: Bearer <token>`
- Auth unit tests: `pnpm --filter @workspace/api-server run test`
- Smoke checklist: `scripts/smoke-field-kit.md`
- Live health smoke: `node scripts/smoke-health.mjs https://your-host`

## Pointers

- See the `pnpm-workspace` skill for workspace structure
