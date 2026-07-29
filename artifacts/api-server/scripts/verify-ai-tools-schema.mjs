import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to verify the AI tool schema");
}

const requiredTables = [
  "ai_tool_organization_flags",
  "ai_tool_runs",
  "clinical_permissions",
  "clinical_audit_events",
  "coverage_snapshots",
  "clinical_ephemeral_sessions",
  "clinical_ephemeral_objects",
];
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(
    `
      SELECT name, to_regclass('public.' || name) AS relation
      FROM unnest($1::text[]) AS name
    `,
    [requiredTables],
  );
  const missing = result.rows
    .filter((row) => row.relation === null)
    .map((row) => row.name);
  if (missing.length) {
    throw new Error(
      `AI tool database schema is incomplete: ${missing.join(", ")}`,
    );
  }
  console.log(`AI tool schema verified (${requiredTables.length} tables)`);
} finally {
  await pool.end();
}
