import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  libDbPackageRoot,
  listMigrationEntries,
  looksProductionDatabaseUrl,
  stripSqlTransactionWrappers,
} from "./migrate-manifest";

const libDbRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("stripSqlTransactionWrappers", () => {
  it("removes outer BEGIN/COMMIT used by sales_workflow SQL", () => {
    const raw = `BEGIN;
CREATE TABLE IF NOT EXISTS t (id int);
COMMIT;`;
    const out = stripSqlTransactionWrappers(raw);
    expect(out).not.toMatch(/^\s*BEGIN/i);
    expect(out).not.toMatch(/COMMIT\s*;\s*$/i);
    expect(out).toContain("CREATE TABLE IF NOT EXISTS t");
  });

  it("leaves plain additive SQL unchanged in substance", () => {
    const raw = `CREATE TABLE IF NOT EXISTS foo (id serial PRIMARY KEY);`;
    const out = stripSqlTransactionWrappers(raw);
    expect(out).toContain("CREATE TABLE IF NOT EXISTS foo");
  });
});

describe("listMigrationEntries", () => {
  it("includes numbered lib/db SQL then sales_workflow external", () => {
    const entries = listMigrationEntries(libDbRoot);
    expect(entries.length).toBeGreaterThanOrEqual(13);
    expect(entries[0]?.id).toMatch(/^0001_/);
    expect(entries.some((e) => e.id === "0012_roleplay_assessments_analytics.sql")).toBe(
      true,
    );
    const sales = entries.find((e) => e.id === "0013_sales_workflow.sql");
    expect(sales).toBeDefined();
    expect(sales?.source).toBe("external");
    expect(sales?.repoPath).toContain("hospice-sales-runtime");
    expect(existsSync(sales!.absPath)).toBe(true);
    // Ordered: lib/db first, external last
    expect(entries.at(-1)?.id).toBe("0013_sales_workflow.sql");
  });

  it("sales_workflow file is readable after strip", () => {
    const entries = listMigrationEntries(libDbRoot);
    const sales = entries.find((e) => e.id === "0013_sales_workflow.sql")!;
    const sql = stripSqlTransactionWrappers(readFileSync(sales.absPath, "utf8"));
    expect(sql).toMatch(/sales_workflow_entities/i);
    expect(sql).not.toMatch(/^\s*BEGIN/i);
  });
});

describe("looksProductionDatabaseUrl", () => {
  it("flags production host patterns", () => {
    expect(looksProductionDatabaseUrl("postgres://u:p@db.spartanhospicecoaching.com/x")).toBe(
      true,
    );
    expect(looksProductionDatabaseUrl("postgres://ci:ci@localhost:5432/ci")).toBe(false);
  });
});

describe("libDbPackageRoot", () => {
  it("resolves to lib/db", () => {
    expect(path.basename(libDbPackageRoot())).toBe("db");
  });
});
