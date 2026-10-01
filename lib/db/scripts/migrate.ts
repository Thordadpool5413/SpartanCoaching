/** Versioned migration runner. Requires explicit environment identity.
 * Legacy ledgers without checksums require an approved evidence baseline;
 * never assign current file hashes to historical rows automatically.
 * Count simulation cannot satisfy a restore gate. No production approval implied.
 */
import pg from "pg";
import {
  libDbPackageRoot,
  listMigrationEntries,
  looksProductionDatabaseUrl,
} from "../src/migrate-manifest";

import {
  prepareMigrations,
  runMigrations,
  MigrationSafetyError,
} from "../src/migration-runner";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(2);
}

if (
  looksProductionDatabaseUrl(databaseUrl) &&
  process.env.ALLOW_PROD_MIGRATE !== "true"
) {
  console.error(
    "Refusing migrate against production-looking DATABASE_URL. Set ALLOW_PROD_MIGRATE=true only with backup + freeze window.",
  );
  process.exit(2);
}

if (process.env.REQUIRE_BACKUP_DRILL === "true") {
  console.error(
    "ACTUAL_RESTORE_EVIDENCE_REQUIRED: the count simulation is not a backup gate",
  );
  process.exit(2);
}

const environment = process.env.MIGRATION_ENVIRONMENT;
if (environment !== "synthetic" && environment !== "production") {
  console.error(
    "MIGRATION_ENVIRONMENT_REQUIRED: explicitly identify synthetic or production",
  );
  process.exit(2);
}
if (environment === "production" && process.env.ALLOW_PROD_MIGRATE !== "true") {
  console.error("PRODUCTION_MIGRATION_AUTHORIZATION_REQUIRED");
  process.exit(2);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
let client: pg.PoolClient | undefined;
try {
  const migrations = prepareMigrations(
    listMigrationEntries(libDbPackageRoot()),
  );
  client = await pool.connect();
  const result = await runMigrations(client, migrations);
  console.log(JSON.stringify({ ok: true, ...result, mode: "migrate_primary" }));
} catch (error) {
  // Raw SQL/driver errors can include row values or connection details.
  console.error(
    error instanceof MigrationSafetyError
      ? error.code
      : "MIGRATION_OPERATION_FAILED",
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
