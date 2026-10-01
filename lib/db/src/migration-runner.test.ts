import { MIGRATION_LEDGER_PLAN, assertMigrationPlanComplete } from "./migration-safety";
import { describe, expect, it } from "vitest";
import { libDbPackageRoot, listMigrationEntries } from "./migrate-manifest";
import { prepareMigrations, verifyMigrationLedger } from "./migration-runner";

const migrations = prepareMigrations(listMigrationEntries(libDbPackageRoot()));
describe("migration ledger preflight", () => {
  it("documents the additive ledger expansion without historical backfill", () => {
    expect(assertMigrationPlanComplete(MIGRATION_LEDGER_PLAN)).toEqual([]);
    expect(MIGRATION_LEDGER_PLAN.dropsLegacyObjects).toBe(false);
  });
  it("prepares every catalogued migration in stable external-last order", () => {
    expect(migrations).toHaveLength(30);
    expect(migrations.at(-1)?.id).toBe("0013_sales_workflow.sql");
    for (const row of migrations)
      expect(row.checksum).toMatch(/^[a-f0-9]{64}$/);
  });
  it("permits empty replay and unchanged ledger", () => {
    expect(() => verifyMigrationLedger([], migrations)).not.toThrow();
    expect(() => verifyMigrationLedger(migrations, migrations)).not.toThrow();
  });
  it("rejects unknown history before new work", () => {
    expect(() =>
      verifyMigrationLedger([{ id: "unknown", checksum: "a" }], migrations),
    ).toThrow("MIGRATION_UNKNOWN_APPLIED_ID");
  });
  it("never launders a historical ledger into current checksums", () => {
    expect(() =>
      verifyMigrationLedger(
        [{ id: migrations[0]!.id, checksum: null }],
        migrations,
      ),
    ).toThrow("MIGRATION_BASELINE_EVIDENCE_REQUIRED");
  });
  it("rejects changed historical SQL", () => {
    expect(() =>
      verifyMigrationLedger(
        [{ ...migrations[0]!, checksum: "0".repeat(64) }],
        migrations,
      ),
    ).toThrow("MIGRATION_CHECKSUM_MISMATCH");
  });
});
