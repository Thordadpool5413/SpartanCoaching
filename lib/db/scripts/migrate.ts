/**
 * Ordered SQL migration apply runner (migrate-primary / pass 3).
 *
 * Applies:
 *   1. lib/db/migrations/*.sql (filename order)
 *   2. External packages (Sales Command Center sales_workflow)
 *
 * Tracks applied ids in schema_migrations. Never drops production data.
 *
 * Usage:
 *   DATABASE_URL=… pnpm --filter @workspace/db run migrate
 *   production: ALLOW_PROD_MIGRATE=true REQUIRE_BACKUP_DRILL=true pnpm db:migrate
 *
 * Safety:
 * - Refuses production-looking URLs unless ALLOW_PROD_MIGRATE=true
 * - Optional REQUIRE_BACKUP_DRILL=true runs backup-restore-drill first
 * - drizzle-kit push is local-only (see push-guard); not required after migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  libDbPackageRoot,
  listMigrationEntries,
  looksProductionDatabaseUrl,
  stripSqlTransactionWrappers,
} from "../src/migrate-manifest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, "..");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(2);
}

if (looksProductionDatabaseUrl(databaseUrl) && process.env.ALLOW_PROD_MIGRATE !== "true") {
  console.error(
    "Refusing migrate against production-looking DATABASE_URL. Set ALLOW_PROD_MIGRATE=true only with backup + freeze window.",
  );
  process.exit(2);
}

if (process.env.REQUIRE_BACKUP_DRILL === "true") {
  const { spawnSync } = await import("node:child_process");
  console.log("[migrate] REQUIRE_BACKUP_DRILL=true — running backup-restore-drill first…");
  const r = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "tsx", path.join(__dirname, "backup-restore-drill.ts")],
    { stdio: "inherit", env: process.env, cwd: packageRoot },
  );
  if ((r.status ?? 1) !== 0) {
    console.error("[migrate] Backup drill failed — aborting migrate");
    process.exit(1);
  }
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function ensureTracking(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function appliedSet(client: pg.PoolClient): Promise<Set<string>> {
  const res = await client.query<{ id: string }>(`SELECT id FROM schema_migrations`);
  return new Set(res.rows.map((r) => r.id));
}

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await ensureTracking(client);
    const done = await appliedSet(client);
    const entries = listMigrationEntries(libDbPackageRoot());
    if (entries.length === 0) {
      console.log("[migrate] No SQL migration files found");
      return;
    }

    let applied = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (done.has(entry.id)) {
        skipped += 1;
        console.log(`SKIP ${entry.id} (${entry.repoPath})`);
        continue;
      }
      const raw = fs.readFileSync(entry.absPath, "utf8");
      const sql = stripSqlTransactionWrappers(raw);
      console.log(`APPLY ${entry.id}… (${entry.repoPath})`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [entry.id]);
        await client.query("COMMIT");
        applied += 1;
        console.log(`OK    ${entry.id}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`FAIL  ${entry.id}:`, (err as Error).message);
        process.exitCode = 1;
        return;
      }
    }

    console.log(
      JSON.stringify({
        ok: true,
        applied,
        skipped,
        total: entries.length,
        mode: "migrate_primary",
        at: new Date().toISOString(),
      }),
    );
  } finally {
    client.release();
    await pool.end();
  }
}

await main();
