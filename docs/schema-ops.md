# Schema operations (F6 follow-through)

## Tenant IDs (auth int ↔ workflow UUID)

Product auth uses serial integers (`client_organizations.id`, `client_members.id`).
Sales Command Center tables use UUID `organization_id` / actor user ids.

**Canonical mapping only:** `@workspace/tenant-ids`  
Do not invent alternate UUID schemes. Changing the format requires a data migration
of all `sales_workflow_*` rows.

See also: `docs/repository-truth-audit.md` (Phase 1).

Checked against `708b0522af3534a0066134d646f21f2a3cb8747c` on 2026-10-01.
See [the operational contract](operational-contract.md) for limitations.

## Current model

- **Expected catalog (approved D1):** Drizzle schemas in `lib/db/src/schema/` plus the independently versioned SQL-owned declarations in `lib/db/schema-contract/sql-owned.sql`. See [contract and reconciliation](../lib/db/schema-contract/README.md). The SQL contract is test-only, never a production apply script.
- **Web package:** `artifacts/spartan-coaching/src/shared/schema.ts` is a **compatibility re-export only** of `@workspace/db/schema` (dual-schema elimination). Do not add `pgTable` definitions under the web package; change `lib/db` + migrations instead. Contract: `schema.dualSourceOfTruth.test.ts`.
- **Primary apply path (production + CI + Replit after pull):** `pnpm db:migrate`
- **Local-only:** `pnpm db:push` / `push-force` go through `push-guard` (refuses production-looking URLs unless `ALLOW_PROD_PUSH=true`). Prefer writing numbered SQL instead of push.
- **Versioned SQL:** sorted `lib/db/migrations/*.sql`, followed by the external workflow migration with stable ledger ID `0013_sales_workflow.sql`. External-last ordering is intentional; do not numerically reorder it. The reproducible [inventory](operational-evidence.json) records paths and SHA-256 hashes, including migration 0026.

**Migrate-primary:** `pnpm db:migrate` applies all entries from `@workspace/db` `migrate-manifest` (`listMigrationEntries`) into `schema_migrations`. Coverage inventory: `MIGRATE_ONLY_LIB_DB_TABLES`. CI runs **migrate only** (no drizzle push).

**Migration safety catalog (required for every schema change):** `@workspace/db/migration-safety`.
Defines `MigrationPlan` fields (forward, data migration, validation, rollback/recovery, backup expectation, client compatibility), integrity SQL, lock-risk tables, and the verification checklist. Unit tests: `pnpm --filter @workspace/db test`.

## Production rules

1. Apply reviewed versioned migrations only to an explicitly identified and authorized environment. Production application is an owner operation requiring actual backup/recovery evidence, compatibility review, and the migration plan. `REQUIRE_BACKUP_DRILL=true` fails closed pending approved actual recovery evidence.
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
- [x] CI applies SQL migrations without push; separate synthetic restore verifies recovery fixtures, while count simulation remains non-evidence
- [x] Static table-name inventory exists (`MIGRATE_ONLY_LIB_DB_TABLES`); complete synthetic catalog equivalence, prefix upgrade, checksums and locking now pass (P02/D1); production provenance/equivalence remain unverified
- [x] Deprecate `push` for production deploys (push-guard; CI migrate-only)
- [x] Fold sales_workflow into the same migrate runner (`0013_sales_workflow.sql` tracking id)

**Synthetic local/CI apply:** `MIGRATION_ENVIRONMENT=synthetic pnpm db:migrate`, using an isolated synthetic database. Do not infer environment identity from a URL substring. Production command authorization is separate from this documentation change.

**Evidence:** P02/D1 synthetic schema equivalence, prefix upgrade, ledger checksums and locking pass. P03 independent synthetic restore verifies catalog/data/privileges/RLS/application behavior. These were implemented after P01. Production historical provenance/equivalence, cloud PITR and real clinical deletion authority remain open.

**Release blocker:** missing `pnpm db:migrate` after a schema PR (not push).

## P02 runner changes (draft, not production-ready)

The runner now requires explicit `MIGRATION_ENVIRONMENT=synthetic|production`, retains the production heuristic as an additional guard, and requires `ALLOW_PROD_MIGRATE=true` for the production setting. A setting is an operator assertion, not independent proof of environment identity or production permission.

A dedicated connection owns a bounded, nonblocking advisory lock. A competing runner fails with `MIGRATION_LOCK_BUSY` and must retry after the current runner completes. Original migration bytes are SHA-256 hashed. All historical ledger IDs/hashes are checked before any new SQL. The ledger checksum column is added transactionally through the version-controlled runner; original applied IDs and file ordering remain unchanged.

**Legacy upgrade blocker:** an existing public schema with an empty/missing ledger is rejected as untracked. Rows without checksums fail with `MIGRATION_BASELINE_EVIDENCE_REQUIRED`. Do not backfill them with hashes of current files. Astra/owner must select an evidence-backed baseline process using trusted historical deployment artifacts and an in-cloud schema discrepancy report. No baseline override is provided by this packet.

Every file must have a complete existing MigrationPlan. Current files execute transactionally. Concurrent-index/nontransactional SQL is rejected pending an explicit resumable plan; it is never silently wrapped in a transaction. Per-file SQL and ledger insert commit together; prior successfully applied files remain recorded after a later failure. Errors emit codes rather than SQL/driver payloads.

`REQUIRE_BACKUP_DRILL=true` now fails closed with `ACTUAL_RESTORE_EVIDENCE_REQUIRED`; the old count simulation can no longer satisfy that gate. Actual restore verification is P03. Do not remove a required recovery gate to make an operational command pass.

Synthetic CI creates disposable, randomly named databases on its loopback PostgreSQL service. The catalog comparison checks columns/defaults, constraints, indexes, relation/RLS flags and grants, policies, functions, triggers, extensions, sequences/ownership, schema and default grants. The ledger is runner metadata and excluded from schema comparison. Drizzle export followed by the independent SQL-owned contract is applied only to a separate empty synthetic database; it never repairs the migration replay. Object names/categories may appear in the short-lived discrepancy report; raw definitions/defaults/comments and row contents do not.

Unexplained catalog differences are a failing gate, not an allowlist. A prefix-upgrade test is not exhaustive historical-production upgrade proof. Production equivalence and deployment remain blocked.


P03 separates `count-simulation` from the actual synthetic `backup-restore-drill`. See [synthetic recovery and Cloud SQL runbook](synthetic-recovery.md) for commands, proof limits and owner gates. A synthetic pass does not authorize production migration.
