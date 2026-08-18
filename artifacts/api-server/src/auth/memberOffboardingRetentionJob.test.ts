import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const opsJobs = fs.readFileSync(path.resolve(import.meta.dirname, "opsJobs.ts"), "utf8");
const migration = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../../lib/db/migrations/0018_member_offboarding_lifecycle.sql"),
  "utf8",
);

describe("member offboarding retention scheduler contract", () => {
  it("defines the database retention routine for commitments and shared summaries", () => {
    expect(migration).toContain("spartan_run_member_offboarding_retention");
    expect(migration).toContain("commitment_preserve_until");
    expect(migration).toContain("shared_summary_retain_until");
    expect(migration).toContain("retention_hold = false");
  });

  it("executes the retention routine from scheduled jobs", () => {
    expect(opsJobs).toContain("runMemberOffboardingRetentionSweep");
    expect(opsJobs).toContain("SELECT * FROM spartan_run_member_offboarding_retention()");
    expect(opsJobs).toContain("memberOffboardingRetention = await runMemberOffboardingRetentionSweep()");
    expect(opsJobs).toContain("memberOffboardingRetention,");
  });

  it("runs the lifecycle sweep on the background scheduler and surfaces deletions", () => {
    expect(opsJobs).toContain("void runMemberOffboardingRetentionSweep()");
    expect(opsJobs).toContain("r.commitmentsDeleted || r.sharedSummariesDeleted");
    expect(opsJobs).toContain('console.log("[jobs] member offboarding retention", r)');
    expect(opsJobs).toContain('console.error("[jobs] member offboarding retention failed", err)');
  });
});
