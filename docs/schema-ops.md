# Schema operations (F6 follow-through)

## Current model

- **Source of truth for table definitions:** Drizzle schemas in `lib/db/src/schema/`
- **Dev / Replit apply:** `pnpm --filter @workspace/db run push` (and `push-force` when intentional)
- **Versioned SQL (partial):**  
  - `lib/db/migrations/0001_spartan_ai_tools.sql`  
  - `lib/db/migrations/0002_ephemeral_clinical_tools.sql`

Core auth/billing/CMS tables are still push-applied, not fully migrated via numbered SQL.

## Production rules

1. After `git pull` of schema changes, run push **before** smoke tests:
   ```bash
   pnpm --filter @workspace/db run push
   ```
2. Never rely on git alone — Replit Publish does not replace schema push.
3. Prefer generating a migration for **destructive** or multi-env changes:
   ```bash
   # When drizzle-kit generate is configured for the package:
   pnpm --filter @workspace/db exec drizzle-kit generate
   ```
4. Keep AI/clinical migrations as SQL files reviewed in PR.

## Target end-state (next ops phase)

- [ ] All core tables represented as ordered SQL migrations  
- [ ] CI job: fresh Postgres + migrate + smoke login/onboarding  
- [ ] Deprecate `push` for production deploys (local only)

Until then, treat **missing push after schema PR** as a release blocker.
