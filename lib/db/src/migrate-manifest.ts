/**
 * Ordered migration inventory for the migrate runner (Stream C / pass 3).
 *
 * Primary apply path: numbered SQL under lib/db/migrations plus external
 * packages listed here (Sales Command Center). drizzle-kit push is local-only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type MigrationEntry = {
  /** schema_migrations.id (filename for lib/db; stable id for externals) */
  id: string;
  /** Absolute path to .sql file */
  absPath: string;
  /** Repo-relative path for docs/tests */
  repoPath: string;
  source: "lib_db" | "external";
};

/**
 * Strip outer BEGIN/COMMIT wrappers so files can run inside the runner transaction.
 * sales_workflow SQL historically wrapped the whole script in BEGIN…COMMIT.
 */
export function stripSqlTransactionWrappers(sql: string): string {
  let out = sql.replace(/^\uFEFF/, "").trim();
  // Leading BEGIN;
  out = out.replace(/^BEGIN\s*;\s*/i, "");
  // Trailing COMMIT;
  out = out.replace(/\s*COMMIT\s*;\s*$/i, "");
  return out.trim() + (out.trim().endsWith(";") ? "\n" : ";\n");
}

/** Resolve package root (lib/db) from this module. */
export function libDbPackageRoot(fromUrl = import.meta.url): string {
  return path.resolve(path.dirname(fileURLToPath(fromUrl)), "..");
}

export function repoRootFromLibDb(libDbRoot: string): string {
  return path.resolve(libDbRoot, "../..");
}

/**
 * Build ordered apply list: lib/db/migrations/*.sql then external packages.
 */
export function listMigrationEntries(libDbRoot: string): MigrationEntry[] {
  const migrationsDir = path.join(libDbRoot, "migrations");
  const entries: MigrationEntry[] = [];

  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      entries.push({
        id: file,
        absPath: path.join(migrationsDir, file),
        repoPath: `lib/db/migrations/${file}`,
        source: "lib_db",
      });
    }
  }

  // External: Sales Command Center (single source file under hospice-sales-runtime)
  const salesWorkflow = path.join(
    libDbRoot,
    "..",
    "hospice-sales-runtime",
    "migrations",
    "001_sales_workflow.sql",
  );
  if (fs.existsSync(salesWorkflow)) {
    entries.push({
      id: "0013_sales_workflow.sql",
      absPath: path.resolve(salesWorkflow),
      repoPath: "lib/hospice-sales-runtime/migrations/001_sales_workflow.sql",
      source: "external",
    });
  }

  return entries;
}

/** Production-looking DATABASE_URL / env (shared by migrate + push guard). */
export function looksProductionDatabaseUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("prod") ||
    u.includes("production") ||
    u.includes("spartanhospicecoaching") ||
    process.env.DEPLOY_ENV === "production" ||
    process.env.APP_ENV === "production"
  );
}
