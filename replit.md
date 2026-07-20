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
- Auth/email env: `OPENAI_API_KEY`, `RESEND_API_KEY` / connector, `ADMIN_PASSWORD`, `VITE_ADMIN_PASSWORD`, `NOTIFICATION_EMAIL`, `SITE_URL`

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
- Trial lifecycle emails: midpoint (≤4h left) + expired (on status flip)
- Magic-link login (`/login` email link + `/magic-login`)
- Platform admin: one-time bootstrap + session auth (legacy password still works)
- Admin **Access Desk**: approve/reject+notify/extend/activate, resend invite, copy to inquiries, metrics
- Access requests auto-create CRM inquiries
- Org admin: seat invites, disable member, 7-day usage (`/api/org/usage`)
- Account: change password; expired clients can request extension

## Architecture decisions

- Field Kit AI tools are hard-gated server-side (`requireFieldKit`); UI gates are not enough
- Access is request → Nick approves → trial (24h individual / 72h company) → admin activates paid/client
- First-visit intro splash only (`spartan_intro_seen`); home content stays crawlable
- Personal orgs are 1-seat shells so entitlement is always org-scoped
- Platform admin remains shared `ADMIN_PASSWORD` / `X-Admin-Auth` (separate from client auth)

## Product

- Public: marketing, method, services, content, contact, compliance
- Private Field Kit: AI tools, calculators, drills, portal checklist
- Companies: multi-seat invites via org admin

## User preferences

- Consulting language (evaluation access / Field Kit), not SaaS “subscribe/paywall”
- Human path (book call) on every gate
- Additive changes preferred; home condensed not deleted

## Gotchas

- After pulling auth schema: run `pnpm --filter @workspace/db run push` on Replit before testing login
- Mobile app (Expo Go): scan QR from the **Replit URL bar**, not the Expo LAN IP
- Mobile session token stored in AsyncStorage; send `Authorization: Bearer <token>`

## Pointers

- See the `pnpm-workspace` skill for workspace structure
