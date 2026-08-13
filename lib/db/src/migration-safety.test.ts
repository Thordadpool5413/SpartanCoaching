import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MIGRATION_CATALOG,
  MIGRATION_VERIFICATION_CHECKLIST,
  INTEGRITY_CHECKS,
  LOCK_RISK_TABLES,
  REPRESENTATIVE_TEST_FIXTURES,
  assertMigrationPlanComplete,
  findDestructiveSql,
  getChecklistForPhase,
  getLockRiskForTables,
  isDestructiveApplyAllowed,
  orderedForwardPaths,
  simulateTenantOwnershipViolations,
  simulateVersionViolations,
  type MigrationPlan,
} from "./migration-safety";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("migration verification checklist", () => {
  it("covers all operational phases with blocking items", () => {
    const phases = new Set(MIGRATION_VERIFICATION_CHECKLIST.map((c) => c.phase));
    expect(phases).toEqual(
      new Set(["author", "predeploy", "apply", "postdeploy", "cleanup"]),
    );
    expect(MIGRATION_VERIFICATION_CHECKLIST.every((c) => c.blocking)).toBe(true);
    expect(getChecklistForPhase("predeploy").some((c) => c.id === "backup-taken")).toBe(
      true,
    );
  });
});

describe("migration catalog", () => {
  it("every catalog plan is complete and non-dropping", () => {
    for (const plan of MIGRATION_CATALOG) {
      const errors = assertMigrationPlanComplete(plan);
      expect(errors, plan.id).toEqual([]);
      expect(plan.dropsLegacyObjects, plan.id).toBe(false);
    }
  });

  it("forward SQL files exist and contain no destructive DDL", () => {
    for (const plan of MIGRATION_CATALOG) {
      const abs = path.join(repoRoot, plan.forwardPath);
      expect(existsSync(abs), plan.forwardPath).toBe(true);
      const sql = readFileSync(abs, "utf8");
      expect(findDestructiveSql(sql), plan.id).toEqual([]);
    }
  });

  it("orderedForwardPaths matches catalog order", () => {
    const paths = orderedForwardPaths();
    expect(paths[0]).toContain("0001_");
    expect(paths.at(-1)).toContain("sales_workflow");
    expect(paths).toHaveLength(MIGRATION_CATALOG.length);
  });
});

describe("assertMigrationPlanComplete gates", () => {
  const base: MigrationPlan = {
    id: "test_plan",
    title: "Test",
    forwardPath: "lib/db/migrations/example.sql",
    dataMigration: null,
    validationQueries: ["SELECT 1"],
    rollbackOrRecovery: "restore dump",
    backupExpectation: "logical_dump",
    risk: "additive",
    clientCompatibility: "none_additive",
    tables: ["client_members"],
    dropsLegacyObjects: false,
  };

  it("rejects empty validation and missing rollback", () => {
    expect(
      assertMigrationPlanComplete({
        ...base,
        validationQueries: [],
        rollbackOrRecovery: "",
      }),
    ).toEqual(
      expect.arrayContaining([
        "at least one validationQuery is required",
        "rollbackOrRecovery is required",
      ]),
    );
  });

  it("blocks legacy drops without client gate + PITR backup", () => {
    const errors = assertMigrationPlanComplete({
      ...base,
      risk: "destructive",
      dropsLegacyObjects: true,
      clientCompatibility: "none_additive",
      backupExpectation: "logical_dump",
    });
    expect(errors.some((e) => e.includes("block_until_clients_compatible"))).toBe(true);
    expect(errors.some((e) => e.includes("logical_dump_plus_point_in_time"))).toBe(true);
  });

  it("allows well-formed destructive plan with client gate and PITR", () => {
    const errors = assertMigrationPlanComplete({
      ...base,
      risk: "destructive",
      dropsLegacyObjects: true,
      clientCompatibility: "block_until_clients_compatible",
      backupExpectation: "logical_dump_plus_point_in_time",
    });
    expect(errors).toEqual([]);
  });
});

describe("destructive apply gate", () => {
  const destructive: MigrationPlan = {
    id: "drop_legacy",
    title: "Drop legacy",
    forwardPath: "x.sql",
    dataMigration: null,
    validationQueries: ["SELECT 1"],
    rollbackOrRecovery: "restore",
    backupExpectation: "logical_dump_plus_point_in_time",
    risk: "destructive",
    clientCompatibility: "block_until_clients_compatible",
    tables: ["client_members"],
    dropsLegacyObjects: true,
  };

  it("prevents apply when clients are not compatible", () => {
    expect(
      isDestructiveApplyAllowed(destructive, {
        clientsCompatible: false,
        backupCompleted: true,
      }),
    ).toBe(false);
  });

  it("prevents apply without backup", () => {
    expect(
      isDestructiveApplyAllowed(destructive, {
        clientsCompatible: true,
        backupCompleted: false,
      }),
    ).toBe(false);
  });

  it("allows only when clients + backup ready", () => {
    expect(
      isDestructiveApplyAllowed(destructive, {
        clientsCompatible: true,
        backupCompleted: true,
      }),
    ).toBe(true);
  });
});

describe("integrity and lock risk inventory", () => {
  it("includes tenant, FK, unique, and index categories", () => {
    const cats = new Set(INTEGRITY_CHECKS.map((c) => c.category));
    expect(cats.has("tenant_ownership")).toBe(true);
    expect(cats.has("foreign_key")).toBe(true);
    expect(cats.has("unique")).toBe(true);
    expect(cats.has("index")).toBe(true);
    for (const check of INTEGRITY_CHECKS) {
      expect(check.sql.length).toBeGreaterThan(20);
      expect(check.requiredTables.length).toBeGreaterThan(0);
    }
  });

  it("flags lock risk for workflow and tool-run tables", () => {
    expect(LOCK_RISK_TABLES.some((t) => t.table === "sales_workflow_entities")).toBe(
      true,
    );
    const risks = getLockRiskForTables(["sales_workflow_entities", "ai_tool_runs"]);
    expect(risks).toHaveLength(2);
  });
});

describe("representative data integrity simulation", () => {
  it("passes clean tenant fixtures and fails orphan member", () => {
    const clean = simulateTenantOwnershipViolations({
      organizations: REPRESENTATIVE_TEST_FIXTURES.organizations,
      members: REPRESENTATIVE_TEST_FIXTURES.members,
    });
    expect(clean).toEqual([]);

    const dirty = simulateTenantOwnershipViolations({
      organizations: REPRESENTATIVE_TEST_FIXTURES.organizations,
      members: [
        ...REPRESENTATIVE_TEST_FIXTURES.members,
        REPRESENTATIVE_TEST_FIXTURES.orphanMember,
      ],
    });
    expect(dirty).toEqual([
      { member_id: 99, organization_id: 99999 },
    ]);
  });

  it("detects non-positive sales workflow versions", () => {
    expect(
      simulateVersionViolations(REPRESENTATIVE_TEST_FIXTURES.salesWorkflowEntities),
    ).toEqual([]);
    expect(
      simulateVersionViolations([
        { id: "bad", version: 0 },
        { id: "ok", version: 2 },
      ]),
    ).toEqual([{ id: "bad", version: 0 }]);
  });
});

describe("findDestructiveSql", () => {
  it("flags DROP/TRUNCATE/RENAME", () => {
    expect(findDestructiveSql("CREATE TABLE IF NOT EXISTS t (id int)")).toEqual([]);
    expect(findDestructiveSql("ALTER TABLE t DROP COLUMN legacy")).not.toEqual([]);
    expect(findDestructiveSql("DROP TABLE t")).not.toEqual([]);
    expect(findDestructiveSql("TRUNCATE auth_events")).not.toEqual([]);
  });
});
