# API contract strategy

**Decision (2026-08-07):** The live HTTP contract is **Express route modules + Zod (and package schemas)**, not OpenAPI.

**Machine-readable contract helpers:** `@workspace/api-contract`  
- Stable error codes/envelope: `buildApiErrorBody`, `CLIENT_CRITICAL_ERROR_CODES`  
- Shared web+iOS paths: `SHARED_API_PATHS`  
- Compatibility: `API_DEPRECATION_WINDOW_MONTHS` (6), `API_CONTRACT_VERSION` (`1`)

## Error envelope (stable)

```json
{ "error": "human message", "code": "UNAUTHENTICATED", "reason": "optional" }
```

Critical codes both clients must handle: `UNAUTHENTICATED` (401), `FIELD_KIT_DENIED` (403 + reason), `ORG_ADMIN_REQUIRED` (403), `ADMIN_REQUIRED` (401/403).

## Backward compatibility

| Change type | Policy |
|-------------|--------|
| Additive JSON fields | Allowed anytime |
| Rename/remove error `code` or required field | 6-month deprecation window minimum |
| Remove endpoint | Deprecate first; keep callable for window |
| New required request field | Breaking unless server defaults it |
| iOS min build | `MIN_SUPPORTED_IOS_BUILD` in package (`null` = all current releases) |

Retire a contract only after: window elapsed, smoke-parity green, no TestFlight build below min still required.

## Authoritative sources

| Concern | Source of truth |
|---------|-----------------|
| Route paths, methods, middleware | `artifacts/api-server/src/app.ts` and `routes/*`, `billing/*`, `auth/*` |
| Shared path inventory + error codes | `@workspace/api-contract` |
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
