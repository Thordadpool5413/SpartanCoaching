/**
 * Safe database backup + restore drill (HSP-45).
 *
 * Creates a logical snapshot of public table names + row counts (no row payloads / no PHI),
 * restores that snapshot into an ephemeral schema, verifies integrity, then drops the schema.
 *
 * Usage:
 *   DATABASE_URL=... pnpm --filter @workspace/db run backup-restore-drill
 *
 * Safety:
 * - Refuses when DATABASE_URL looks like production unless ALLOW_PROD_RESTORE_DRILL=true
 * - Never drops public tables
 * - Never prints row contents
 *
 * Exit codes: 0 ok, 1 drill failed, 2 misconfigured
 */
import pg from "pg";

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

if (looksProduction(databaseUrl) && process.env.ALLOW_PROD_RESTORE_DRILL !== "true") {
  console.error(
    "Refusing restore drill against a production-looking DATABASE_URL. Use CI/staging, or set ALLOW_PROD_RESTORE_DRILL=true only with an explicit freeze window.",
  );
  process.exit(2);
}

type TableCount = { table: string; count: number };

const schemaName = `restore_drill_${Date.now()}`;
const pool = new pg.Pool({ connectionString: databaseUrl });

async function listPublicTables(client: pg.PoolClient): Promise<string[]> {
  const res = await client.query<{ tablename: string }>(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename`,
  );
  return res.rows.map((r) => r.tablename);
}

async function countTable(client: pg.PoolClient, table: string): Promise<number> {
  // Identifier only from pg_tables — still quote safely
  const res = await client.query<{ c: string }>(
    `SELECT count(*)::text AS c FROM public.${quoteIdent(table)}`,
  );
  return Number(res.rows[0]?.c ?? 0);
}

function quoteIdent(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe table name skipped: ${name}`);
  }
  return `"${name}"`;
}

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log("[backup-restore-drill] starting");
    const tables = await listPublicTables(client);
    if (tables.length === 0) {
      console.error("No public tables found — is the schema applied?");
      process.exit(1);
    }

    // Logical backup artifact (counts only)
    const snapshot: TableCount[] = [];
    for (const table of tables) {
      try {
        const count = await countTable(client, table);
        snapshot.push({ table, count });
      } catch (err) {
        console.warn(`SKIP count ${table}: ${(err as Error).message}`);
      }
    }
    console.log(`[backup-restore-drill] snapshot tables=${snapshot.length}`);

    // Restore into ephemeral schema
    await client.query(`CREATE SCHEMA ${quoteIdent(schemaName)}`);
    await client.query(
      `CREATE TABLE ${quoteIdent(schemaName)}.table_counts (
        table_name text PRIMARY KEY,
        row_count bigint NOT NULL
      )`,
    );
    for (const row of snapshot) {
      await client.query(
        `INSERT INTO ${quoteIdent(schemaName)}.table_counts (table_name, row_count) VALUES ($1, $2)`,
        [row.table, row.count],
      );
    }

    // Verify restore
    const restored = await client.query<{ table_name: string; row_count: string }>(
      `SELECT table_name, row_count::text FROM ${quoteIdent(schemaName)}.table_counts ORDER BY table_name`,
    );
    if (restored.rows.length !== snapshot.length) {
      throw new Error(
        `Restore row count mismatch: expected ${snapshot.length} got ${restored.rows.length}`,
      );
    }
    const byName = new Map(snapshot.map((s) => [s.table, s.count]));
    for (const r of restored.rows) {
      const expected = byName.get(r.table_name);
      if (expected === undefined || expected !== Number(r.row_count)) {
        throw new Error(`Mismatch for ${r.table_name}`);
      }
    }

    // Second-pass live verify: re-count a sample of tables still matches snapshot
    const sample = snapshot.slice(0, Math.min(5, snapshot.length));
    for (const s of sample) {
      const live = await countTable(client, s.table);
      if (live !== s.count) {
        console.warn(
          `[backup-restore-drill] WARN live count drift for ${s.table}: snapshot=${s.count} live=${live} (ok if concurrent writes)`,
        );
      }
    }

    console.log("[backup-restore-drill] PASS restore verified");
    console.log(
      JSON.stringify({
        ok: true,
        schema: schemaName,
        tablesSnapshotted: snapshot.length,
        at: new Date().toISOString(),
      }),
    );
  } catch (err) {
    console.error("[backup-restore-drill] FAIL", (err as Error).message);
    process.exitCode = 1;
  } finally {
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${quoteIdent(schemaName)} CASCADE`);
      console.log(`[backup-restore-drill] cleaned schema ${schemaName}`);
    } catch (err) {
      console.error("cleanup failed", (err as Error).message);
    }
    client.release();
    await pool.end();
  }
}

await main();
