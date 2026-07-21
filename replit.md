# Spartan Coaching

Expert hospice growth coaching site + private Field Kit (web + iOS) for clients and approved evaluators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/spartan-coaching run dev` — web app
- `pnpm --filter @workspace/spartan-coaching-mobile run dev` — Expo mobile
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only) — **required after Field Kit auth tables**
- Required env: `DATABASE_URL` — Postgres connection string
- Auth/email env: `OPENAI_API_KEY`, `RESEND_API_KEY` / connector, `ADMIN_PASSWORD` (server-only, 8+ chars recommended), `NOTIFICATION_EMAIL`, `SITE_URL`
- Do **not** put admin passwords in `VITE_*` client env (removed from bundle)

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
- Logged-in nav shell: Field Kit · Tools · Learn · Account · Coaching (`/portal/learn`)
- Trial lifecycle emails: received, approved, rejected, midpoint (≤4h), expired, extended, membership activated
- Magic-link login (`/login` email link + `/magic-login`)
- Platform admin: one-time bootstrap + **session cookie** (legacy shared password unlocks session; no client-embedded admin code)
- Admin **Access Desk**: one-click 24h/72h approve, reject templates, follow-ups due queue, extend presets, resend invite, metrics
- Access requests auto-create CRM inquiries
- Org admin: seat invites, disable member, 7-day usage (`/api/org/usage`)
- Account: change password, sign out other devices; expired clients can request extension
- Conversion: `/request-access`, `/field-kit-membership`, FAQ Field Kit section, trust strip
- Portal first-session: role → one tool → debrief; checklist API; field context
- Mobile field companion: checklist + trial banner (lighter than web first-session panel)
- Public trust/SEO: robots.txt, sitemap, noindex private shells, TrustStrip

## Architecture decisions

- Field Kit AI tools are hard-gated server-side (`requireFieldKit`); UI gates are not enough
- Access is request → Nick approves → trial (24h individual / 72h company) → admin activates paid/client
- First-visit intro splash only (`spartan_intro_seen`); home content stays crawlable
- Personal orgs are 1-seat shells so entitlement is always org-scoped
- Platform admin = `platform_admin` member session preferred; `X-Admin-Auth` only if `ADMIN_PASSWORD` set server-side (API tools / curl)
- Rate limits: global API + login + forms; AI quotas keyed by member id when authed

## Product

- Public: marketing, method, services, content, contact, compliance
- Private Field Kit: AI tools, calculators, drills, portal checklist
- Companies: multi-seat invites via org admin

## User preferences

- Consulting language (evaluation access / Field Kit), not SaaS “subscribe/paywall”
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

## Pointers

- See the `pnpm-workspace` skill for workspace structure
