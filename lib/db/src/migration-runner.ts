import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { PoolClient } from "pg";
import type { MigrationEntry } from "./migrate-manifest";
import { stripSqlTransactionWrappers } from "./migrate-manifest";
import {
  MIGRATION_CATALOG,
  assertMigrationPlanComplete,
} from "./migration-safety";

export class MigrationSafetyError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export type PreparedMigration = { id: string; checksum: string; sql: string };
export type AppliedMigration = { id: string; checksum: string | null };

/** Hash original bytes, before normalization: historical edits must be visible. */
export function prepareMigrations(
  entries: MigrationEntry[],
): PreparedMigration[] {
  if (new Set(entries.map((e) => e.id)).size !== entries.length) {
    throw new MigrationSafetyError("MIGRATION_DUPLICATE_ID");
  }
  return entries.map((entry) => {
    const plan = MIGRATION_CATALOG.find(
      (p) => p.forwardPath === entry.repoPath,
    );
    if (!plan || assertMigrationPlanComplete(plan).length) {
      throw new MigrationSafetyError("MIGRATION_PLAN_REQUIRED");
    }
    const bytes = readFileSync(entry.absPath);
    const raw = bytes.toString("utf8");
    // No current migration requires nontransactional execution. Fail closed rather
    // than silently running concurrent indexes inside a transaction. A future
    // concurrent plan needs explicit resumability/verification and separate review.
    if (
      /\bCONCURRENTLY\b|\bVACUUM\b|\b(?:CREATE|DROP)\s+DATABASE\b/i.test(raw)
    ) {
      throw new MigrationSafetyError(
        "MIGRATION_NONTRANSACTIONAL_PLAN_REQUIRED",
      );
    }
    return {
      id: entry.id,
      checksum: createHash("sha256").update(bytes).digest("hex"),
      sql: stripSqlTransactionWrappers(raw),
    };
  });
}

/** Validate every historical entry before applying any new SQL. */
export function verifyMigrationLedger(
  applied: AppliedMigration[],
  migrations: PreparedMigration[],
): void {
  const byId = new Map(migrations.map((m) => [m.id, m]));
  for (const row of applied) {
    const current = byId.get(row.id);
    if (!current)
      throw new MigrationSafetyError("MIGRATION_UNKNOWN_APPLIED_ID");
    // A hash of today's file does not establish what ran in the past.
    if (row.checksum === null)
      throw new MigrationSafetyError("MIGRATION_BASELINE_EVIDENCE_REQUIRED");
    if (row.checksum !== current.checksum)
      throw new MigrationSafetyError("MIGRATION_CHECKSUM_MISMATCH");
  }
}

/** One dedicated connection owns the advisory lock through ledger and SQL writes. */
export async function runMigrations(
  client: PoolClient,
  migrations: PreparedMigration[],
): Promise<{ applied: number; skipped: number; total: number }> {
  const lock = await client.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock(1936744802, 1) AS locked",
  );
  if (!lock.rows[0]?.locked)
    throw new MigrationSafetyError("MIGRATION_LOCK_BUSY");
  try {
    let ledger: AppliedMigration[];
    await client.query("BEGIN");
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now(), checksum text
      )`);
      await client.query(
        "ALTER TABLE public.schema_migrations ADD COLUMN IF NOT EXISTS checksum text",
      );
      ledger = (
        await client.query<AppliedMigration>(
          "SELECT id, checksum FROM public.schema_migrations ORDER BY id",
        )
      ).rows;
      if (ledger.length === 0) {
        const existing = await client.query<{ found: boolean }>(`
          SELECT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname <> 'schema_migrations'
          ) AS found`);
        if (existing.rows[0]?.found) {
          throw new MigrationSafetyError(
            "MIGRATION_UNTRACKED_SCHEMA_BASELINE_REQUIRED",
          );
        }
      }
      verifyMigrationLedger(ledger, migrations);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const done = new Set(ledger.map((row) => row.id));
    let applied = 0;
    for (const migration of migrations) {
      if (done.has(migration.id)) continue;
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO public.schema_migrations (id, checksum) VALUES ($1, $2)",
          [migration.id, migration.checksum],
        );
        await client.query("COMMIT");
        applied += 1;
      } catch {
        await client.query("ROLLBACK");
        throw new MigrationSafetyError("MIGRATION_APPLY_FAILED");
      }
    }
    return { applied, skipped: done.size, total: migrations.length };
  } finally {
    await client.query("SELECT pg_advisory_unlock(1936744802, 1)");
  }
}
