# Complete synthetic expected catalog — D1

K1B adds the independently maintained `knowledge-owned.sql` declaration after
the Drizzle schema export. Migration 0031 separately installs the approved
knowledge tables and SQL-owned checks, indexes, foreign keys and immutable
history guards. P02 compares every catalog category; no knowledge differences
are excluded. The declaration is never constructed from a replayed catalog.

Owner approval: 2026-10-02 in the implementation conversation, following the
D1 proposal in `docs/execplans/ci-remediation-decisions.md`.

The expected catalog is the current `src/schema/index.ts` Drizzle export plus
`sql-owned.sql`. The migration side independently replays the historical SQL
through the canonical migration runner. Neither side reads the other's generated
catalog, and no differences are filtered out. The comparator still checks all
12 categories. Both sides run only in newly created synthetic databases.

`sql-owned.sql` is a version-controlled declaration, not a migration and not a
production repair script. It is executed only after the Drizzle export in the
integration test. Never run it against an existing database. Future changes to
SQL-owned objects require a reviewed update here and a separate additive
migration. Do not regenerate this file from replay output to obtain a pass.

## Reconciliation decisions

| Difference | Reviewed resolution | Historical evidence |
| --- | --- | --- |
| Unique/CHECK/PK names | Declare actual names in Drizzle; preserve expression and validation | 0001, 0002, 0003, 0004, 0012, external workflow |
| Four clinical unique indexes versus constraints | Use Drizzle `unique` for the existing UNIQUE constraints | 0001 |
| Workflow tenant/kind/id uniqueness | Declare the existing UNIQUE constraint and its name | external workflow |
| Apple duplicate declaration and partial uniqueness | Declare the actual unique indexes; preserve non-null token and nullable transaction behavior | 0017 |
| Audit index column order | Include time DESC NULLS FIRST, matching PostgreSQL DESC defaults explicitly | 0011, external workflow |
| Idempotency/outbox/active-entity predicates | Declare the existing partial-index predicates | 0026, external workflow |
| Workflow GIN index, branch/team indexes | Add missing index declarations | 0014, external workflow |
| Five auto-generated FK names | SQL extension renames only the independent Drizzle constraints; preserves columns/actions | 0002, 0012, 0016 |
| Clinical/coach FK and coach CHECK omissions | Explicit expected SQL constraints; preserve cascade/no-action semantics and allowed values | 0001, 0016 |
| Event/public-approval indexes | Explicit expected SQL definitions | 0012, 0028 |
| Medicare cache/workspace tables | Explicit expected tables, defaults, primary keys and indexes | 0027 |
| Offboarding lifecycle | Explicit table, owned bigserial sequence, indexes, functions and triggers; unchanged bodies | 0018 |
| Four workflow RLS policies and FORCE flags | Explicit expected policies with tenant-qualified USING/WITH CHECK | external workflow |

The earlier personalization-default discrepancy was already corrected by 0030.
No new product migration or historical SQL edit is needed for these remaining
179 discrepancies. All are reconciled as declaration omissions/differences,
not waived or counted as 179 application defects. Existing migration IDs,
checksums, order and production-baseline refusal remain intact.

## Verification

`RUN_MIGRATION_INTEGRATION=true MIGRATION_ENVIRONMENT=synthetic
MIGRATION_TEST_DATABASE_URL=<isolated-loopback-PostgreSQL> pnpm --filter
@workspace/db test` performs replay, prefix upgrade, rerun, concurrency,
checksum refusal, rollback, baseline refusal, non-owner tenant isolation and
complete equivalence. Credentials are synthetic and supplied by the environment.

The drift regression mutates the independently constructed expected database
inside rolled-back transactions. It requires detection of default changes,
missing FK/CHECK/index, lost index predicate, permissive policy, disabled/relaxed
RLS, broadened table/schema/default grants, changed function, disabled trigger,
sequence increment and lost sequence ownership. It then verifies full restoration
of the expected catalog. The existing real dump/restore gate remains separate.

This proves synthetic equivalence only. Production provenance adoption, covered
production metadata, cloud recovery and clinical deletion authority remain
separate owner/architecture gates.
