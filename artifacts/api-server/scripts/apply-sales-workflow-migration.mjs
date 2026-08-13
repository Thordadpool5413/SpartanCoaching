/**
 * Apply Sales Command Center schema.
 *
 * Prefer the unified migrate runner (pass 3):
 *   pnpm db:migrate
 *
 * This script remains for post-merge / legacy hooks and applies the same SQL
 * file as migration id `0013_sales_workflow.sql` without schema_migrations
 * tracking. Prefer `pnpm db:migrate` in new deploy paths.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to apply the sales workflow migration");
}

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
  here,
  "../../../lib/hospice-sales-runtime/migrations/001_sales_workflow.sql",
);
const raw = await readFile(migrationPath, "utf8");
// Match migrate runner: strip outer BEGIN/COMMIT if present
const sql = raw
  .replace(/^\uFEFF/, "")
  .trim()
  .replace(/^BEGIN\s*;\s*/i, "")
  .replace(/\s*COMMIT\s*;\s*$/i, "")
  .trim();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql.endsWith(";") ? sql : `${sql};`);
  console.log(
    "Sales workflow migration applied (legacy script). Prefer: pnpm db:migrate",
  );
} finally {
  await pool.end();
}
