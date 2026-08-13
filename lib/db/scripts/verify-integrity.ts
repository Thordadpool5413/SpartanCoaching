/**
 * Post-migrate integrity runner for production / staging.
 *
 * Usage:
 *   DATABASE_URL=... pnpm --filter @workspace/db run verify-integrity
 *
 * Exits 0 when all applicable checks return zero violation rows.
 * Skips checks whose required tables are missing (partial environments).
 * Prints only check ids and violation counts (no row payloads / PII).
 */
import pg from "pg";
import { INTEGRITY_CHECKS } from "../src/migration-safety";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(2);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function tableExists(client: pg.PoolClient, name: string): Promise<boolean> {
  const result = await client.query<{ reg: string | null }>(
    `SELECT to_regclass($1) AS reg`,
    [`public.${name}`],
  );
  return result.rows[0]?.reg != null;
}

let failed = 0;
let skipped = 0;
let passed = 0;

try {
  const client = await pool.connect();
  try {
    for (const check of INTEGRITY_CHECKS) {
      let missing = false;
      for (const table of check.requiredTables) {
        if (!(await tableExists(client, table))) {
          missing = true;
          break;
        }
      }
      if (missing) {
        skipped += 1;
        console.log(`SKIP ${check.id} (required table missing)`);
        continue;
      }
      const result = await client.query(check.sql);
      const n = result.rowCount ?? result.rows.length;
      if (n > 0) {
        failed += 1;
        console.error(
          `FAIL ${check.id} [${check.category}] violations=${n} — ${check.description}`,
        );
      } else {
        passed += 1;
        console.log(`PASS ${check.id}`);
      }
    }
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}

console.log(
  `Integrity summary: passed=${passed} failed=${failed} skipped=${skipped}`,
);
process.exit(failed > 0 ? 1 : 0);
