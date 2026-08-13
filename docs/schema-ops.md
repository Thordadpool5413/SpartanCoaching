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
- **Dev / Replit apply:** `pnpm --filter @workspace/db run push` (and `push-force` when intentional)
- **Versioned SQL (lib/db migrate-only product surface):**  
  - `0001`–`0002` AI/clinical  
  - `0003` product auth + org billing  
  - `0004` CMS marketing content  
  - `0005`–`0008` resource architecture / work / lifecycle / provider resources  
  - `0009`–`0010` personalization + notifications  
  - `0011` org admin audit  
  - `0012` roleplay, assessments, analytics, usage, agreements, chat, site settings, Replit sessions/users  
  - `lib/hospice-sales-runtime/migrations/001_sales_workflow.sql` — Command Center store + RLS (separate apply)

**Migrate-only:** `pnpm db:migrate` applies all `lib/db/migrations/*.sql` via `schema_migrations`. Coverage inventory: `MIGRATE_ONLY_LIB_DB_TABLES` in `@workspace/db/migration-safety`. CI still runs `push-force` after migrate as a safety net until push is fully retired for production.

**Migration safety catalog (required for every schema change):** `@workspace/db/migration-safety`.
Defines `MigrationPlan` fields (forward, data migration, validation, rollback/recovery, backup expectation, client compatibility), integrity SQL, lock-risk tables, and the verification checklist. Unit tests: `pnpm --filter @workspace/db test`.

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
5. **Do not DROP** legacy columns/tables until new reads and writes are proven in production-compatible clients (`clientCompatibility: block_until_clients_compatible` + backup completed).
6. **Pre-deploy backup:** at least a logical dump (`pg_dump`) for any plan with risk `data_backfill` or `destructive`; prefer dump + point-in-time recovery for drops.
7. **Post-apply integrity** (when `DATABASE_URL` is available):
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
| apply | Ordered SQL or push; never destructive before clients are compatible |
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
- [ ] Deprecate `push` for production deploys (local only; CI still uses `push-force` as safety net)
- [ ] Fold sales_workflow into the same migrate runner (or document dual apply forever)

**Apply schema after pull:**

```bash
pnpm db:migrate          # numbered SQL + schema_migrations tracking
pnpm db:push             # drizzle kit for any tables not yet in SQL
# production: ALLOW_PROD_MIGRATE=true REQUIRE_BACKUP_DRILL=true pnpm db:migrate
```

Until push is fully retired, treat **missing migrate+push after schema PR** as a release blocker.
