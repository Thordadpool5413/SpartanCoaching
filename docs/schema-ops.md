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
- **Dev / Replit apply:** `pnpm --filter @workspace/db run push` (and `push-force` when intentional)
- **Versioned SQL (partial):**  
  - `lib/db/migrations/0001_spartan_ai_tools.sql`  
  - `lib/db/migrations/0002_ephemeral_clinical_tools.sql`  
  - `lib/db/migrations/0003_client_auth_billing.sql` — product auth + org billing columns (IF NOT EXISTS)  
  - `lib/db/migrations/0004_cms_content.sql` — articles, resources, podcasts, testimonials, case studies, inquiries, newsletter, resource leads
  - `lib/hospice-sales-runtime/migrations/001_sales_workflow.sql` — Command Center store + RLS

CI and Replit still use **`pnpm --filter @workspace/db run push`** as the primary apply path.
Numbered SQL is the **reviewed baseline / recovery** path and the target for future migrate-only deploys.

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
- [ ] Roleplay / assessments / analytics migrations
- [ ] Ordered migrate apply runner with backup gate (not push-only)
- [ ] CI job: fresh Postgres + migrate-only + integrity + smoke login/onboarding
- [ ] Deprecate `push` for production deploys (local only)

Until then, treat **missing push after schema PR** as a release blocker.
