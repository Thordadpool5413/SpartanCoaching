# Environment architecture (HSP-06)

Canonical catalog and validators: `@workspace/env-config`.

## Targets

| Target | Who runs it | Config homes |
| --- | --- | --- |
| **local** | Dev machine / Replit shell | `server_env`, Replit env |
| **preview** | Replit preview deploy | Replit Secrets + env |
| **staging** | Pre-prod API/web | Server env + secrets |
| **production_web** | Publish → spartanhospicecoaching.com | Replit Secrets (primary) |
| **testflight** | EAS `testflight` | EAS Secrets/env + Apple |
| **app_store** | EAS `production` + submit | EAS Secrets/env + Apple Connect |

Set `APP_ENV` explicitly when possible (`local` \| `preview` \| `staging` \| `production_web` \| `testflight` \| `app_store`).

## What goes where

| Kind | Examples | Store in |
| --- | --- | --- |
| **Server secrets** | `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `ADMIN_PASSWORD`, `CRON_SECRET`, `AI_TOOL_ENCRYPTION_KEY` | Replit Secrets / server env only |
| **Server config** | `SITE_URL`, `STRIPE_PRICE_*`, `RESEND_FROM_EMAIL`, `CLINICAL_*`, `PRODUCTION_DATABASE_HOST` | Replit env / server env |
| **Client public** | `EXPO_PUBLIC_DOMAIN`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_ORIGIN`, `VITE_GA_MEASUREMENT_ID`, `EAS_PROJECT_ID` | EAS env / Vite env (never secrets) |
| **Apple** | Team ID, ASC app id, signing | App Store Connect + EAS credentials (see `eas.json` submit) |

**Never** put Stripe secret keys, webhook secrets, DB URLs, OpenAI keys, admin passwords, or private keys in `EXPO_PUBLIC_*` or `VITE_*` or source control.

## Cross-env write protection

1. Set `PRODUCTION_DATABASE_HOST` to the production Postgres hostname.
2. Non-prod `APP_ENV` (`local` \| `preview` \| `staging`) **fails fatal** if `DATABASE_URL` contains that host.
3. Non-prod **fails fatal** if `STRIPE_SECRET_KEY` starts with `sk_live_`.

## Commands

```bash
# Catalog-aware production preflight (names only; no secret values)
pnpm --filter @workspace/env-config run preflight

# Soft server-mode check (uses resolveAppEnv)
pnpm --filter @workspace/env-config run preflight -- --server

# Unit tests
pnpm --filter @workspace/env-config test
```

Api-server runs `validateServerStartupConfig` at startup (fatal issues exit; non-fatal log only).

Clinical PHI gates remain in `scripts/verify-clinical-production-env.mjs` / `clinicalRuntimeReadiness` (composed, not replaced).
