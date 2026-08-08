# API contract strategy

**Decision (2026-08-07):** The live HTTP contract is **Express route modules + Zod (and package schemas)**, not OpenAPI.

## Authoritative sources

| Concern | Source of truth |
|---------|-----------------|
| Route paths, methods, middleware | `artifacts/api-server/src/app.ts` and `routes/*`, `billing/*`, `auth/*` |
| Request validation | Zod in route handlers, `@workspace/db` schemas, `@workspace/spartan-ai-tools`, sales debrief schemas |
| Authz gates | `requireAuth`, `requireFieldKit`, `requireOrgAdmin`, `requireAdmin`, workflow `assertWorkflowAction` |
| Entitlement rules | `auth/evaluateAccess.ts` (pure) |
| Tenant ID mapping | `@workspace/tenant-ids` |
| Smoke contracts (web ↔ iOS) | `scripts/smoke-parity.mjs`, `scripts/smoke-parity-auth.mjs` |

## OpenAPI / Orval (`lib/api-spec`)

`lib/api-spec/openapi.yaml` currently documents **health only** (`GET /api/healthz`).

| Use | Status |
|-----|--------|
| Full product API description | **Not authoritative** — do not treat Orval output as complete |
| Generated `@workspace/api-client-react` / `api-zod` | Optional convenience; prefer hand-written clients for membership/tools until OpenAPI is expanded |
| Future expansion | Allowed **incrementally** for stable public endpoints only (health, public Learn feeds). Do not block shipping on full OpenAPI coverage |

## Rules for new endpoints

1. Implement and test the Express route with the correct gate (`requireFieldKit` for entitled tools, etc.).
2. Validate inputs with Zod (or shared package schemas).
3. Add unit or integration authz tests for protected behavior.
4. If the endpoint is part of web ↔ iOS parity, extend smoke scripts when practical.
5. Optionally add the path to OpenAPI later — never the reverse (OpenAPI-first is not required).

## Client guidance

- **Web:** `fetch` + credentials, or React Query wrappers in `artifacts/spartan-coaching/src`.
- **iOS:** `artifacts/spartan-coaching-mobile/lib/api.ts` (Bearer session).
- **Command Center:** `@workspace/hospice-sales-runtime/sales-workflow/http-client`.

See also: `docs/repository-truth-audit.md`, `docs/mobile-web-parity.md`.
