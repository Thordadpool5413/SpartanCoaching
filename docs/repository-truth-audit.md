# Repository truth audit

**Date:** 2026-08-07  
**Scope:** Read-only audit of the SpartanCoaching monorepo as source of truth.  
**Not in scope:** Product redesign, feature implementation, or schema rewrites.

This document is an evidence-based architecture map, risk register, and ordered
implementation sequence for future work. Paths and behaviors were verified against
the current tree, not assumed from marketing copy or prior plans.

---

## 1. Acceptance criteria (this audit)

| # | Criterion | Status |
|---|-----------|--------|
| A1 | Map website, iOS, API, shared packages, DB, auth, billing, org, tools, resources, knowledge, analytics, notifications, offline, tests, deploy, docs | Done |
| A2 | Identify duplicate implementations, stale code, client-only state, parity gaps, WebViews, security boundaries, business-fact disagreements | Done |
| A3 | Produce dependency map and ordered sequence before major product work | Done |
| A4 | No unrelated product implementation in this pass | Done |

---

## 2. Monorepo shape (source of truth)

### 2.1 Workspace layout

| Path | Package / role | Production? |
|------|----------------|-------------|
| `artifacts/api-server` | Express API (`@workspace/api-server`) | **Yes** — single backend |
| `artifacts/spartan-coaching` | Vite + React + wouter web SPA | **Yes** — marketing + portal + tools |
| `artifacts/spartan-coaching-mobile` | Expo Router iOS (and Expo Go static build) | **Yes** — native client |
| `artifacts/spartan-video` | Separate Vite brand-video site | Peripheral / marketing asset host |
| `artifacts/mockup-sandbox` | UI component sandbox | **No** — design exploration only |
| `lib/db` | Drizzle schemas + partial SQL migrations | **Yes** |
| `lib/field-kit-catalog` | Shared tool inventory (web + mobile) | **Yes** |
| `lib/spartan-ai-tools` | Advanced AI tool registry, clinical contracts | **Yes** |
| `lib/hospice-sales-runtime` | Sales Command Center domain + React panel + Express router | **Yes** |
| `lib/branch-engine` | Branch profitability math (deterministic) | **Yes** |
| `lib/design-tokens` | Shared colors/tokens | **Yes** |
| `lib/api-client-react` / `lib/api-zod` / `lib/api-spec` | Orval-generated client + Zod (minimal OpenAPI) | Partial / **stale vs real API** |
| `docs/*` | Ops, security, parity, ship readiness | Authoritative for process |
| `scripts/*` | smoke-health, smoke-parity, ship-check, schema helpers | Release gate tooling |
| `attached_assets/*` | Historical prompts, media, zips | **Not runtime** |
| `.github/workflows/ci.yml` | Typecheck, test, build, audit, gitleaks | CI truth |

**Package manager:** `pnpm@10.26.1` (`packageManager` + `pnpm-workspace.yaml`).

### 2.2 Runtime topology (production intent)

```text
                    ┌─────────────────────────────┐
                    │  Replit host (canonical)    │
                    │  spartanhospicecoaching.com │
                    │                             │
   Web SPA ────────►│  Express api-server         │◄──── iOS (Bearer token)
   cookies          │  + static web assets        │      EXPO_PUBLIC_API_URL
                    │  + Postgres (Drizzle)       │
                    │  + Stripe webhooks          │
                    │  + Resend email             │
                    │  + OpenAI                   │
                    └─────────────────────────────┘
                              │
                              ▼
                         PostgreSQL
```

- **Ship docs** (`docs/ship-readiness.md`, `docs/mobile-web-parity.md`): one API, one seat model, web + iOS.
- **iOS** uses `Authorization: Bearer` + SecureStore; **web** uses `spartan_session` cookie (same session table).
- Mobile static Expo Go path (`scripts/build.js` + `server/serve.js`) is a **secondary** delivery path, not a second backend.

---

## 3. Product surfaces

### 3.1 Website (`artifacts/spartan-coaching`)

| Concern | Implementation truth |
|---------|----------------------|
| Routing | `src/App.tsx` — wouter, heavy lazy-loading |
| Auth UX | `src/context/AuthContext.tsx` → `/api/auth/*` |
| Entitlement gate UI | `RequireFieldKit`, `FieldKitGate`, trial banner |
| Marketing | Home, Services, Method, About, Contact, FAQ, legal pages |
| Membership / HSP | Portal, Account, Tools grid, gated tool pages |
| Command Center | `/tools/sales-workflow` → shared `SalesWorkflowPanel` |
| Advanced AI | `/tools/ai/*` → `@workspace/spartan-ai-tools` via API |
| CMS public | Articles, podcasts, resources (public GETs) |
| Ops | Admin + Access Desk pages |
| Branding debt | Routes/aliases still mention Field Kit; product noun is **Hospice Sales Pro** |

### 3.2 Native iOS (`artifacts/spartan-coaching-mobile`)

| Concern | Implementation truth |
|---------|----------------------|
| Shell | Expo Router tabs: Home, Command, Tools, Learn, Account (+ Contact) |
| Auth | `lib/AuthContext.tsx` + SecureStore session token |
| Catalog | `@workspace/field-kit-catalog` drives Tools inventory |
| Command Center | Native `app/sales-workflow.tsx` (**not** shared React panel) |
| Core tools | Mostly native tabs / dedicated routes |
| WebView | `app/tool-web.tsx` — secured session load of web tool routes |
| Advanced AI | `app/ai-tools/*` native screens |
| Offline | `lib/offlineQueue.ts` — retry failed **generate** POSTs only |
| Drafts | `lib/toolDraftCache.ts` (local) |
| Handoffs | `lib/aiToolHandoff.ts` — **in-memory only** (process lifetime) |
| Notifications | Local reminders via expo-notifications + AsyncStorage |
| Analytics | `lib/analytics.ts` → server events |
| Store | `store/*` App Store copy, smoke checklist, screenshots |

**Catalog `mobile` field (current):** almost all tools `native`; **Call Transcriber** is `webview`. No `missing` entries found in catalog grep.

### 3.3 API server composition (`app.ts`)

Order of registration (truth):

1. Security headers, CORS, trusted mutation origin  
2. Stripe webhook (raw body)  
3. JSON body parser  
4. `loadSession` (cookie or Bearer)  
5. Global API rate limit  
6. Health router  
7. `registerAuthRoutes`  
8. `registerBillingRoutes`  
9. `registerSalesWorkflowRoutes`  
10. `registerAiToolRoutes`  
11. `registerRoutes` (legacy monolith of CMS + classic tools + roleplay + assessments)

---

## 4. Authentication and entitlement (authoritative)

### 4.1 Product identity (current)

| Table | Role |
|-------|------|
| `client_organizations` | Tenant: personal / company / platform; access `status`; pipeline; Stripe fields |
| `client_members` | User: email, passwordHash, role, org FK, checklist, jobRole |
| `client_sessions` | Session token **hash**, expiry, optional MFA timestamp |
| `auth_tokens` | set-password / reset / invite one-time tokens |
| `access_requests` | Intake before approval |
| `org_invites` | Multi-seat invites |
| `auth_events` | Audit-ish auth events |

**Roles:** `member` | `org_admin` | `platform_admin`  
**Org access status:** `trial` | `active` | `expired` | `suspended`  
**Member status:** `invited` | `active` | `disabled`

**Entitlement pure function:** `auth/evaluateAccess.ts`  
**DB-backed evaluation:** `auth/entitlement.ts` → `getAccessForMemberId`  
**Gate middleware:** `requireAuth`, `requireFieldKit` (entitled), `requireAdmin` / `isAdminRequest` (platform_admin only)

**Rules (server is source of truth):**

- Client UI gates are **not** authorization.  
- Platform admin role always allowed.  
- Trial/active org + active member with password required for tools.  
- Stripe subscription status maps into org status via `billing/entitlementMap.ts`.

### 4.2 Dual / legacy identity tables

| Table | Comment in schema | Status |
|-------|-------------------|--------|
| `sessions` / `users` | “Replit Auth mandatory blueprint” | **Legacy / parallel** — not the product seat model |
| Roleplay pre-tenant rows | Null ownership | Documented as archive-only; tenant-safe path requires memberId + organizationId |

**Risk:** Future work must not reintroduce Replit Auth as product login. Product auth is `client_*` only.

### 4.3 Session transport

| Client | Mechanism |
|--------|-----------|
| Web | Cookie `spartan_session` (HttpOnly, Secure when deployed) |
| iOS | Bearer token from login response, SecureStore |
| Both | Same `client_sessions` table; max 8 concurrent sessions / member |

---

## 5. Billing

| Component | Path | Truth |
|-----------|------|-------|
| Routes | `billing/billingRoutes.ts` | status, checkout, portal, admin health, corporate ops |
| Webhook | `POST /api/billing/webhook` | Signature-verified; updates org Stripe fields + entitlement |
| Mapping | `entitlementMap.ts` | active/trialing → active; past_due → suspended; canceled → expired |
| Email ops | Resend + metrics | Trial lifecycle, billing alerts |
| Corporate | `corporateBilling.ts` | Contract seats / unit amount |

**Business fact:** Access for paid seats is **org.status** derived from Stripe (and Access Desk / trial lifecycle), not client-side “subscribed” flags.

---

## 6. Database schema map

### 6.1 Schema modules (`lib/db/src/schema/`)

| Module | Domain |
|--------|--------|
| `auth.ts` | Orgs, members, sessions, access, invites |
| `schema.ts` | CMS, marketing, roleplay, drills, assessments, analytics, agreements, usage |
| `salesWorkflow.ts` | Entity store, outbox, audit, idempotency (UUID tenant keys) |
| `aiTools.ts` | Runs, clinical cases, ephemeral sessions, MFA challenges, audit |
| `chat.ts` | Conversations / messages (light) |

### 6.2 Migration reality

| Mechanism | Coverage |
|-----------|----------|
| `pnpm --filter @workspace/db run push` | **Primary** apply path for core tables |
| `lib/db/migrations/0001_*.sql`, `0002_*.sql` | AI tools + ephemeral clinical |
| `lib/hospice-sales-runtime/migrations/001_sales_workflow.sql` | Workflow + RLS policies (apply script exists) |

**Documented gap (`docs/schema-ops.md`):** Core auth/billing/CMS not fully represented as ordered SQL migrations. Missing push after pull is a **release blocker**.

### 6.3 ID namespace disagreement (critical)

| System | Org ID type | Mapping |
|--------|-------------|---------|
| `client_organizations.id` | **serial integer** | Auth, billing, checklist, most APIs |
| `sales_workflow_*` | **UUID** `organizationId` | Synthetic UUIDs from int (`SalesWorkflow.tsx` `workflowUuid`) |
| Actors in workflow | UUID user ids | Derived from member id |

**Business fact at risk:** “organization” is not one primitive type. Command Center isolation depends on consistent synthetic UUID mapping. Any new cross-table FK assuming integer org IDs into workflow tables will be wrong.

---

## 7. Tool systems (three layers)

### 7.1 Layer A — Classic Field tools (monolith routes)

Implemented in `routes/routes.ts`, gated by `requireFieldKit`:

- `/api/playbooks`, `/api/objections`, `/api/research`, `/api/email-templates`
- `/api/cold-call-script`, `/api/weekly-plan-builder`
- `/api/transcribe`, `/api/roleplay/*`, `/api/drills/*`
- Calculators partly client-side; branch profitability via `/api/branch-profitability/calculate` + `branch-engine`

Web pages under `/tools/*`; mobile native or WebView per catalog.

### 7.2 Layer B — Advanced AI library (shared package)

| Piece | Path |
|-------|------|
| Registry | `lib/spartan-ai-tools/src/registry.ts` (~14 tools) |
| HTTP | `routes/aiToolRoutes.ts` `/api/ai-tools/*` |
| Persistence | `ai_tool_runs` (non-clinical), clinical tables for vault tools |
| Handoffs | In-memory typed handoffs (web + iOS); clinical never auto-saved to sales history |

### 7.3 Layer C — Sales Command Center (workflow runtime)

| Piece | Path |
|-------|------|
| Domain | `lib/hospice-sales-runtime` (plans, roleplay, complete-call, coaching, email drafts) |
| Express mount | `/api/v1/sales-workflow/*` |
| Extra | `POST .../debrief/draft` (AI structured complete-call draft; no auto-save) |
| Web UI | Shared React panel |
| Mobile UI | Separate native screen (subset of features) |

**Disagreement:** Web Command Center uses full shared panel (prepare/practice/complete/approve/import). Mobile implements schedule / build plan / complete with debrief draft — **not full feature parity** of the shared panel.

### 7.4 Catalog as inventory truth

`@workspace/field-kit-catalog` is the **intended** single inventory. Web marketing pages and mobile Tools should consume it. Drift risk: ad-hoc tool lists on pages not reading the catalog.

---

## 8. Content, knowledge, resources

| System | Storage | API | Clients |
|--------|---------|-----|---------|
| Articles | `articles` | public GET; admin CUD | Web Learn, mobile Learn |
| Podcasts | `podcasts` | public GET; admin CUD | Web + mobile |
| Resources / PDFs | `resources` + static files | public list; admin CUD | Web + downloads |
| Knowledge search | Corpus module | `/api/knowledge/search` (entitled) | Web tools |
| NPI lookup | External | `/api/reference/npi` (entitled) | Command Center / tools |
| Spartan corpus | Code + tests | Server-side only | AI grounding |

---

## 9. Analytics and observability

| Channel | Mechanism |
|---------|-----------|
| Visitor / page | `/api/analytics/track`, `visitors` |
| Events | `/api/analytics/events`, `event_tracking` |
| Usage | `usage_events`, AI/email daily counters |
| API logs | pino-http (URL path only; no query secrets in serializers) |
| Admin | AI usage, access metrics, billing email health, webhook health |

**Mobile:** `trackMobileEvent` posts to same analytics contracts; must not send PHI.

---

## 10. Security and privacy boundaries (current)

| Boundary | Implementation |
|----------|----------------|
| Session | Hashed tokens; secure cookies in deploy |
| Tool access | `requireFieldKit` on AI / workflow / classic tools |
| Admin | `platform_admin` only (shared passcode retired) |
| Roleplay | Tenant-owned; null ownership not served |
| Clinical / PHI mode | Separate clinical routes, MFA challenges, ephemeral sessions; PHI mode gated until BAA stack ready |
| Rate limits | Global + auth + AI + email + public forms |
| CORS / CSRF-ish | Allowed origins + trusted mutation origin |
| Logging | Avoid secrets/PHI in pino serializers (path only) |

**CMS mutations** use `isAdminRequest` inline (not always `requireAdmin` middleware) — pattern is consistent but easy to miss on new routes.

---

## 11. Offline, notifications, local-only state

| State | Location | Server truth? |
|-------|----------|---------------|
| Session token | SecureStore (iOS) / cookie (web) | Yes (session row) |
| Offline generate queue | AsyncStorage | No — retry queue only |
| Tool draft cache | Local | No |
| AI tool handoff | Process memory | No |
| Activation ceremony seen | AsyncStorage | No |
| Local reminders | AsyncStorage + OS notifications | No |
| Checklist progress | `client_members.checklist_progress` | **Yes** |
| Command Center accounts/calls | `sales_workflow_entities` | **Yes** |
| Saved AI runs (non-clinical) | `ai_tool_runs` | **Yes** |

---

## 12. Tests and release engineering

### 12.1 Automated (representative)

| Layer | Examples |
|-------|----------|
| API unit/integration | auth entitlement, middleware, billing map, clinical, AI isolation, salesDebrief, analytics schema |
| Web | Vitest under `spartan-coaching` |
| Mobile | Jest: offline queue, billing, AI tools acceptance, staffing |
| Shared | field-kit parity test, branch-engine, spartan-ai-tools tests |
| CI | install, audit high, db push-force, typecheck, package tests, web contracts, mobile contracts, build |
| Post-deploy smoke | `smoke-health`, `smoke-parity`, `smoke-parity-auth`, `ship-check` |

### 12.2 Deploy configuration

| Surface | Config truth |
|---------|--------------|
| Web + API | Replit publish (`docs/replit-publish.md`) |
| Schema | Manual `db push` after schema PRs |
| iOS | EAS profiles in `eas.json`; secrets `EXPO_PUBLIC_API_URL` / domain |
| Mobile static | `scripts/build.js` Metro export for Expo Go landing |

### 12.3 OpenAPI / generated clients

`lib/api-spec/openapi.yaml` currently documents **only** `/healthz`.  
**Implication:** `api-client-react` / `api-zod` are **not** the live API contract. Real contracts are Express routes + Zod in route handlers / shared packages. Do not trust Orval artifacts as completeness.

---

## 13. Duplicate, stale, and disagreeing systems

### 13.1 Duplicates / parallels

| Topic | Implementations | Prefer |
|-------|-----------------|--------|
| Product auth | `client_*` vs Replit `users`/`sessions` | `client_*` only |
| AI coaching tools | Classic `/api/objections` etc. vs Advanced `/api/ai-tools` vs Workflow coaches | Keep all three but **document ownership**; do not merge casually |
| Command Center UI | Web shared panel vs mobile native subset | Shared contracts; platform UIs may differ intentionally |
| Tool inventory | Catalog package vs ad-hoc page lists | Catalog |
| Calculators | Web pages vs mobile screens vs branch-engine | Shared engine for profitability math; others platform UI |
| Design tokens | `design-tokens` vs mobile `constants/colors` + hooks | Prefer tokens package |
| Auth helpers | Web AuthContext vs mobile AuthContext | Same API endpoints; separate clients OK |

### 13.2 Stale / non-production

| Artifact | Note |
|----------|------|
| `mockup-sandbox` | Not shipped |
| `attached_assets` | Historical; not import into runtime |
| OpenAPI surface | Stub |
| Security doc Gemini history purge | Operator process may still be open |
| Field Kit naming | Residual paths/copy vs Hospice Sales Pro noun |

### 13.3 Business-fact disagreements

| Fact | Systems that must agree | Current risk |
|------|-------------------------|--------------|
| Is this seat entitled? | DB org/member status, Stripe webhook, evaluateAccess, both clients’ `/api/auth/me` | Low if clients only display server result |
| Org identity | Integer org id vs workflow UUID | **Medium–high** for new cross-system features |
| Checklist progress | `checklist_progress` JSON | Low if both PATCH same API |
| Tool list | Catalog vs UI | Medium if pages hardcode tools |
| “Completed call” quality | Web full coaching review vs mobile lighter complete | Medium UX/data parity |
| Clinical vs sales data | Ephemeral clinical vs durable sales/AI runs | Policy documented; must not cross-save PHI |

---

## 14. Risk register

| ID | Risk | Severity | Evidence | Mitigation direction |
|----|------|----------|----------|----------------------|
| R1 | Schema apply via push only; prod drift | High | `docs/schema-ops.md` | Ordered migrations + CI migrate job |
| R2 | Org ID integer vs workflow UUID | High | `salesWorkflow.ts` + web UUID helper | Single mapping module; document; never dual write without adapter |
| R3 | OpenAPI not real contract | Medium | openapi health-only | Expand OpenAPI or declare Express+Zod as contract |
| R4 | Command Center web/mobile feature skew | Medium | panel vs `sales-workflow.tsx` | Contract tests on API; intentional mobile MVP list |
| R5 | Replit Auth tables confuse new work | Medium | schema comments | Freeze/delete when safe; ban new deps |
| R6 | Clinical PHI enablement incomplete | High (if enabled early) | clinical docs + flags | Keep disabled until BAA/MFA/storage evidence |
| R7 | Offline queue holds tool bodies on device | Medium | offlineQueue AsyncStorage | No PHI in queued bodies; size caps already |
| R8 | Mobile Metro/static build fragility on Replit | Medium | build.js history | Keep projectRoot + node_modules watch pattern |
| R9 | Live deploy lag vs `origin/main` | High (ops) | ship-readiness | Publish checklist + ship-check |
| R10 | Secret history (Gemini) | High (ops) | security-foundation | Operator revocation + history purge |
| R11 | CMS routes manual admin checks | Low–Med | routes.ts pattern | Prefer requireAdmin middleware consistently |
| R12 | Dual AI stacks cost/quota | Medium | two OpenAI entry points | Shared rate limits + usage tables |
| R13 | image-size audit ignore | Low | pnpm auditConfig | Drop ignore when upstream patches |
| R14 | App Store / EAS secret misconfig | High for iOS | empty API URL console error | EAS secrets required for production |

---

## 15. Dependency map (what must be correct before what)

```text
[0] Secrets & deploy host truth
     SITE_URL / APP_URL, OPENAI, Stripe, Resend, DB URL, encryption keys
           │
           ▼
[1] Database schema apply (push / migrations)
     client_* , billing columns, workflow, ai tools, clinical
           │
           ▼
[2] Auth + session + entitlement pure rules
     evaluateAccess, loadSession, requireFieldKit, requireAdmin
           │
           ├──────────────► [3] Billing webhooks ↔ org status
           │
           ├──────────────► [4] Org isolation on every multi-tenant write
           │                      (workflow UUID map, roleplay ownership, AI runs)
           │
           ▼
[5] Shared catalogs & contracts
     field-kit-catalog, spartan-ai-tools registry, branch-engine, API smoke contracts
           │
           ├──────────────► [6a] Web portal + gated tools
           ├──────────────► [6b] iOS auth shell + catalog-driven tools
           └──────────────► [6c] Command Center API (then web panel / mobile native)
           │
           ▼
[7] Observability smokes (health, parity, parity-auth)
           │
           ▼
[8] Clinical vault enablement (only after security evidence)
           │
           ▼
[9] App Store / marketing polish (depends on stable API + seat)
```

**Rule:** Do not start net-new product verticals (e.g. CRM, multi-tenant reporting) until **[1]–[4]** and the org-ID mapping story are explicit and tested.

---

## 16. Ordered implementation sequence (for future work)

Use this sequence when prioritizing engineering after this audit. Each step assumes prior steps remain green.

### Phase 0 — Ops truth (no product code)

1. Confirm production `HEAD` == `origin/main` and `db push` applied.  
2. Run `ship-check` (+ auth smoke).  
3. Close or track R10 (Gemini) and encryption key presence for workflow transcripts.

### Phase 1 — Contract and tenant foundations

1. ~~Document (or code) **canonical org ID adapter** (int ↔ workflow UUID).~~  
   **Done:** `@workspace/tenant-ids` + `workflowActorFromMember` / `assertWorkflowAction` in api-server.  
2. ~~Expand automated **authorization tests** for workflow tenant isolation.~~  
   **Done:** `lib/tenant-ids` unit tests + `src/auth/workflowTenantAuthz.test.ts` + middleware gate tests (`requireAuth` / `requireFieldKit` / `requireOrgAdmin`).  
   Still open for other protected routes: follow aiToolIsolation / middleware patterns.  
3. ~~Decide OpenAPI strategy.~~  
   **Done:** Express + Zod is authoritative — `docs/api-contract.md`. OpenAPI remains health-only stub.  
4. ~~Start numbering SQL migrations for auth/billing.~~  
   **Done:** `lib/db/migrations/0003_client_auth_billing.sql` (IF NOT EXISTS baseline). Push remains primary apply.

### Phase 2 — Parity of **facts**, not pixels

1. Checklist, billing status, entitlement reasons: already shared — add regression if UI caches stale.  
2. ~~Command Center: list intentional mobile subset vs web; any new field goes API-first.~~  
   **Done:** `COMMAND_CENTER_CAPABILITIES` + `docs/command-center-parity.md`; smoke gates debrief draft.  
3. ~~Keep catalog `mobile` field honest; zero `missing`.~~  
   **Done:** parity tests + shared `FIELD_KIT_DAILY_TOOL_IDS` / `FIELD_KIT_LEADER_TOOL_IDS` on web + mobile Tools.  
4. Prefer catalog imports on web marketing tool grids (Tools page uses catalog).

### Phase 3 — Tool architecture hygiene

1. ~~Map classic tools vs advanced library ownership (when to use which).~~  
   **Done:** `docs/tool-architecture.md` + `CLASSIC_FIELD_TOOL_ROUTES` + stack-boundary tests.  
2. Do not merge Command Center coaches into advanced library without product decision (policy documented).  
3. Rate limits / daily AI caps remain global across stacks (unchanged; call out on new tools).

### Phase 4 — Hardening

1. ~~Consistent `requireAdmin` on all CMS mutations.~~  
   **Done:** CMS CUD + upload/normalize-pdf use `requireAdmin` middleware (not inline 401-only checks).  
2. Clinical enablement checklist only when legal/security evidence complete.  
3. Offline queue PHI review; never queue clinical payloads.

### Phase 5 — Platform experience

1. Web responsive polish, iOS App Store assets, accessibility passes — **after** APIs and seats are stable.

---

## 17. What this audit did **not** verify

| Item | Why |
|------|-----|
| Live production data contents | No prod DB access in this pass |
| Stripe live webhook delivery | Requires deployed secrets + Stripe dashboard |
| Physical iPhone TestFlight | Requires device + EAS build |
| Full history secret purge completion | Operator process outside repo |
| Every route’s authorization matrix exhaustively | 170+ handlers; pattern sampled; CMS/admin/tools gates checked |
| Runtime Replit Metro build after latest fix | Code fixed; redeploy not executed here |

---

## 18. Recommended “definition of done” for future product PRs

Before calling a product change complete:

1. Server enforces authz (not only UI).  
2. Web and iOS use the **same API** for the business fact changed.  
3. Tests at the correct layer (API authz for protected behavior).  
4. Schema applied via documented ops path.  
5. `smoke-parity` / auth smoke still green if public contracts touched.  
6. No PHI in logs, analytics, offline queue, or URLs.  
7. Catalog updated if tools inventory changed.

---

## 19. File index (quick navigation)

| Concern | Start here |
|---------|------------|
| API bootstrap | `artifacts/api-server/src/app.ts` |
| Auth routes | `artifacts/api-server/src/routes/authRoutes.ts` |
| Entitlement | `artifacts/api-server/src/auth/evaluateAccess.ts` |
| Billing | `artifacts/api-server/src/billing/` |
| Classic tools + CMS | `artifacts/api-server/src/routes/routes.ts` |
| Advanced AI | `artifacts/api-server/src/routes/aiToolRoutes.ts` + `lib/spartan-ai-tools` |
| Command Center | `lib/hospice-sales-runtime` + `salesWorkflowRoutes.ts` |
| Schema | `lib/db/src/schema/*` |
| Catalog | `lib/field-kit-catalog/src/index.ts` |
| Web app shell | `artifacts/spartan-coaching/src/App.tsx` |
| iOS shell | `artifacts/spartan-coaching-mobile/app/_layout.tsx` |
| Parity / ship | `docs/mobile-web-parity.md`, `docs/ship-readiness.md` |
| Schema ops | `docs/schema-ops.md` |
| Security ops | `docs/security-foundation.md` |

---

*End of audit. Update this document when a phase above changes system truth (e.g. full migrations, org ID unification, OpenAPI expansion).*
