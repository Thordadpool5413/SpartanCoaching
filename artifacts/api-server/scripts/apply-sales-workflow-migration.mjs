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
const sql = await readFile(migrationPath, "utf8");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log("Sales workflow migration applied");
} finally {
  await pool.end();
}
