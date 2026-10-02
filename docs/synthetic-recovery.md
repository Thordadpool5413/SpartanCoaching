# P03 synthetic recovery and Cloud SQL runbook

The actual drill is `pnpm --filter @workspace/db run backup-restore-drill`. Set `RECOVERY_ENVIRONMENT=synthetic` and `RECOVERY_TEST_DATABASE_URL` to a disposable loopback PostgreSQL 16 service. Install matching `pg_dump` and `pg_restore` clients. The admin needs database/role creation privileges for this isolated test. Ordinary application access is checked under a generated non-owner, non-superuser role without BYPASSRLS.

The command never reads DATABASE_URL, accepts an externally supplied archive or restores into an existing target. It creates two randomly named databases, applies versioned migrations to one, populates only synthetic fixtures, dumps a custom archive, deliberately corrupts rows/drops a table, then restores to the other with single-transaction/error-stop options. No production override exists. Temporary archives/manifests have private directory/file permissions and are deleted in finally cleanup. Only a content-free measurement report is uploaded by CI for seven days; never upload archives, row hashes, keys or plaintext fixtures.

Checks compare the entire public catalog through the P02 comparator (12 categories including constraints, indexes, RLS, grants, functions/triggers and extensions), all table rows including the migration ledger, and every sequence's last_value/is_called. The comparison is source-to-restored, not an assertion of Drizzle target equivalence. The P02 gate remains independent and strict.

Post-restore checks exercise non-owner tenant reads/writes, denied cross-tenant insertion, an application preference transaction/default/serial insert and duplicate-key rejection. The existing API envelope encryption implementation must refuse absent/wrong keys and decrypt with the separately restored synthetic key. A post-backup deletion manifest fixture removes a resurrected synthetic workflow record using tenant plus resource ID before the simulated reopen checks. The other tenant's record must survive. One committed post-backup preference row is deliberately lost and explicitly counted in the report.

`dumpMs`, `restoreMs`, `verifiedRecoveryMs` and `snapshotAgeAtIncidentMs` describe this tiny local synthetic run. They are measurements, not accepted production RPO/RTO. Roles are precreated in the same cluster; this does not prove cluster-role disaster recovery. Existing recovery-objective numbers remain proposals. `OPS_LAST_RESTORE_DRILL_ISO` is informational only. `REQUIRE_BACKUP_DRILL=true` continues failing closed until the approved production evidence-adoption process exists.

The former metadata-count script is now `pnpm --filter @workspace/db run count-simulation`; it explicitly reports that it is not recovery evidence and requires a synthetic loopback database.

## ARCHITECTURE BLOCKER — clinical deletion recovery contract

Repository search found `clinical/ephemeral.ts`, `clinical/retention.ts` and `member_offboarding_lifecycle`, but no canonical durable clinical deletion-tombstone recovery contract. Offboarding retention is not a substitute for a clinical deletion ledger. A stale backup can reintroduce deleted content if recovery reopens service without independent, current deletion evidence.

The synthetic manifest is a drill fixture only, not a new production system. Astra must establish the P07/P08 durable deletion authority, independent recovery ordering, integrity/watermark requirements and cross-store reconciliation with GCS/FHIR. Options: an independently recoverable versioned deletion ledger, or an equivalent approved external authority with provable completeness. Recommend the former under the approved deletion/job packets. Missing or unverifiable evidence must block reopening. No retention policy or production tombstone architecture is invented in P03.

## Owner-operated covered sandbox recovery

1. Obtain named owner approval for a synthetic Cloud SQL sandbox, region, cost ceiling, network/IAM boundary and measured recovery objectives. Confirm actual service coverage separately; do not place agreements or production metadata here.
2. Verify automated backups, PITR/WAL retention, encryption-key access, private destinations and deletion protection are explicitly configured. Inventory role/grant/IAM recreation outside the logical database backup. Record configuration evidence inside the covered boundary.
3. Write timestamped synthetic canaries and approved synthetic deletion events. Record the last confirmed durable write, backup consistency point, independent deletion watermark and required key versions. Do not use real records for development evidence.
4. Restore/PITR to a **new isolated instance**, never a live destination. Keep application traffic, workers, exports and inference disabled. Restore role/IAM dependencies and retrieve required keys through the approved secret manager; missing or wrong keys block recovery.
5. Verify schema/catalog, data content, constraints, indexes, triggers/functions, grants, RLS, sequence positions and application transactions. Use a non-owner application identity for tenant-negative checks. Apply current authoritative tombstones/holds before enabling reads. Reconcile SQL, retained GCS source versions and FHIR projections; do not assume database restore covers these stores.
6. Calculate observed RPO from the last durable canary recovered versus incident time and observed RTO through all verification/reconciliation steps. Record failures, data-loss window, object/version coverage, key/tombstone evidence and recovery timings. Report unresolved consistency gaps rather than declaring a pass.
7. Owner reviews the evidence and accepts targets before any separately authorized cutover. Keep the source intact. Revert traffic to the original verified instance if recovery validation fails. Cleanup restored sandbox resources only after evidence retention and owner approval; no automatic production deletion.

Cloud execution, measured PITR, cross-store recovery, production key/role recovery, clinical tombstones and production acceptance remain unverified. This runbook is not an authorization to apply infrastructure or enable PHI.

References verified 2026-10-02: [PostgreSQL 16 pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html), [Cloud SQL PITR](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/pitr). pg_dump covers a single database; global roles require separate recovery. Only archives created from this trusted synthetic fixture are restored by the command.
