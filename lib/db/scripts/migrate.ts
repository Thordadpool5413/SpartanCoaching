/**
 * Ordered SQL migration apply runner (Stream A / schema integrity).
 *
 * Applies lib/db/migrations/*.sql in filename order, tracking applied files
 * in schema_migrations. Additive SQL (IF NOT EXISTS) is safe to re-run only
 * for already-applied files (skipped). Never drops production data.
 *
 * Usage:
 *   DATABASE_URL=… pnpm --filter @workspace/db run migrate
 *
 * Safety:
 * - Refuses production-looking URLs unless ALLOW_PROD_MIGRATE=true
 * - Optional pre-apply backup gate: REQUIRE_BACKUP_DRILL=true runs backup-restore-drill first
 * - Does not replace drizzle push for full schema sync of tables only defined in Drizzle
 *   without SQL yet — prefer writing numbered SQL for production changes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../migrations");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(2);
}

function looksProduction(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("prod") ||
    u.includes("production") ||
    u.includes("spartanhospicecoaching") ||
    process.env.DEPLOY_ENV === "production" ||
    process.env.APP_ENV === "production"
  );
}

if (looksProduction(databaseUrl) && process.env.ALLOW_PROD_MIGRATE !== "true") {
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
    { stdio: "inherit", env: process.env, cwd: path.join(__dirname, "..") },
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

function listMigrationFiles(): string[] {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await ensureTracking(client);
    const done = await appliedSet(client);
    const files = listMigrationFiles();
    if (files.length === 0) {
      console.log("[migrate] No SQL migration files found");
      return;
    }

    let applied = 0;
    let skipped = 0;

    for (const file of files) {
      if (done.has(file)) {
        skipped += 1;
        console.log(`SKIP ${file}`);
        continue;
      }
      const full = path.join(migrationsDir, file);
      const sql = fs.readFileSync(full, "utf8");
      console.log(`APPLY ${file}…`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [file]);
        await client.query("COMMIT");
        applied += 1;
        console.log(`OK    ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`FAIL  ${file}:`, (err as Error).message);
        process.exitCode = 1;
        return;
      }
    }

    console.log(
      JSON.stringify({
        ok: true,
        applied,
        skipped,
        total: files.length,
        at: new Date().toISOString(),
      }),
    );
  } finally {
    client.release();
    await pool.end();
  }
}

await main();
