# Schema operations (F6 follow-through)

## Tenant IDs (auth int ↔ workflow UUID)

Product auth uses serial integers (`client_organizations.id`, `client_members.id`).
Sales Command Center tables use UUID `organization_id` / actor user ids.

**Canonical mapping only:** `@workspace/tenant-ids`  
Do not invent alternate UUID schemes. Changing the format requires a data migration
of all `sales_workflow_*` rows.

See also: `docs/repository-truth-audit.md` (Phase 1).

## Current model

- **Source of truth for table definitions:** Drizzle schemas in `lib/db/src/schema/`
- **Web package:** `artifacts/spartan-coaching/src/shared/schema.ts` is a **compatibility re-export only** of `@workspace/db/schema` (dual-schema elimination). Do not add `pgTable` definitions under the web package; change `lib/db` + migrations instead. Contract: `schema.dualSourceOfTruth.test.ts`.
- **Primary apply path (production + CI + Replit after pull):** `pnpm db:migrate`
- **Local-only:** `pnpm db:push` / `push-force` go through `push-guard` (refuses production-looking URLs unless `ALLOW_PROD_PUSH=true`). Prefer writing numbered SQL instead of push.
- **Versioned SQL (migrate runner):**  
  - `lib/db/migrations/0001`–`0012` product tables  
  - external `0013_sales_workflow.sql` tracking id → `lib/hospice-sales-runtime/migrations/001_sales_workflow.sql` (Command Center + RLS)

**Migrate-primary:** `pnpm db:migrate` applies all entries from `@workspace/db` `migrate-manifest` (`listMigrationEntries`) into `schema_migrations`. Coverage inventory: `MIGRATE_ONLY_LIB_DB_TABLES`. CI runs **migrate only** (no drizzle push).

**Migration safety catalog (required for every schema change):** `@workspace/db/migration-safety`.
Defines `MigrationPlan` fields (forward, data migration, validation, rollback/recovery, backup expectation, client compatibility), integrity SQL, lock-risk tables, and the verification checklist. Unit tests: `pnpm --filter @workspace/db test`.

## Production rules

1. After `git pull` of schema changes, run **migrate** before smoke tests:
   ```bash
   pnpm db:migrate
   # production host:
   ALLOW_PROD_MIGRATE=true REQUIRE_BACKUP_DRILL=true pnpm db:migrate
   ```
2. Never rely on git alone — Replit Publish does not apply schema; run migrate after pull.
3. **Do not use drizzle push against production.** Schema changes ship as numbered SQL under `lib/db/migrations/` (or hospice-sales-runtime for Command Center).
4. Prefer generating reviewed SQL for **destructive** or multi-env changes; document a `MigrationPlan` in the safety catalog.
5. Keep AI/clinical migrations as SQL files reviewed in PR.
6. **Do not DROP** legacy columns/tables until new reads and writes are proven in production-compatible clients (`clientCompatibility: block_until_clients_compatible` + backup completed).
7. **Pre-deploy backup:** at least a logical dump (`pg_dump`) for any plan with risk `data_backfill` or `destructive`; prefer dump + point-in-time recovery for drops.
8. **Post-apply integrity** (when `DATABASE_URL` is available):
   ```bash
   pnpm --filter @workspace/db run verify-integrity
   ```
   Then run the plan’s own `validationQueries` and a tenant-scoped smoke path.

## Migration verification checklist (summary)

Blocking phases encoded in `MIGRATION_VERIFICATION_CHECKLIST`:

| Phase | Gate |
| --- | --- |
| author | Complete `MigrationPlan`; no silent drops; validation queries; lock-risk review |
| predeploy | Client compatibility; backup matches `backupExpectation` |
| apply | Ordered SQL via migrate; never destructive before clients are compatible |
| postdeploy | Integrity checks + validation queries + smoke |
| cleanup | Legacy drop only after dual-write proven |

Lock-risk tables (batch / CONCURRENTLY / maintenance window): `sales_workflow_entities`, `sales_workflow_audit`, `ai_tool_runs`, `clinical_audit_events`, `client_sessions`, `auth_events`, `roleplay_sessions`.

## Target end-state (next ops phase)

- [x] Auth + billing tables represented as ordered SQL (`0003_client_auth_billing.sql`)  
- [x] CMS marketing content baseline (`0004_cms_content.sql`)  
- [x] Migration safety catalog + integrity checks + verification checklist (`@workspace/db/migration-safety`)
- [x] Roleplay / assessments / analytics migrations (`0012_roleplay_assessments_analytics.sql`)
- [x] Ordered migrate apply runner (`pnpm db:migrate` / `@workspace/db migrate`) with optional `REQUIRE_BACKUP_DRILL=true`
- [x] CI applies SQL migrations before `push-force` + backup restore drill
- [x] Full migrate-only **SQL coverage** for all `lib/db` product tables (`MIGRATE_ONLY_LIB_DB_TABLES` contract)
- [x] Deprecate `push` for production deploys (push-guard; CI migrate-only)
- [x] Fold sales_workflow into the same migrate runner (`0013_sales_workflow.sql` tracking id)

**Apply schema after pull:**

```bash
pnpm db:migrate
# production:
ALLOW_PROD_MIGRATE=true REQUIRE_BACKUP_DRILL=true pnpm db:migrate
# local experiments only (refuses prod URL):
pnpm db:push
```

**Release blocker:** missing `pnpm db:migrate` after a schema PR (not push).
