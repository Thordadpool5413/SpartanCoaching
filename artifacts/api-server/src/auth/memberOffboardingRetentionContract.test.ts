import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../../lib/db/migrations/0018_member_offboarding_lifecycle.sql"),
  "utf8",
);

const authRoutes = fs.readFileSync(
  path.resolve(import.meta.dirname, "../routes/authRoutes.ts"),
  "utf8",
);

describe("member offboarding retention contract", () => {
  it("revokes company access through the existing disabled member transition", () => {
    expect(authRoutes).toContain('.set({ status: "disabled" })');
    expect(migration).toContain("OLD.status IS DISTINCT FROM 'disabled' AND NEW.status = 'disabled'");
  });

  it("hard deletes raw Coach work immediately while preserving only commitments temporarily", () => {
    expect(migration).toContain('DELETE FROM "coach_conversations"');
    expect(migration).toContain('DELETE FROM "coach_preferences"');
    expect(migration).toContain('DELETE FROM "coach_memory_items"');
    expect(migration).toContain("AND \"category\" <> 'commitment'");
    expect(migration).toContain("interval '30 days'");
  });

  it("moves preserved commitments only into a personal account during the thirty day window", () => {
    expect(migration).toContain("IF target_org_type = 'personal' THEN");
    expect(migration).toContain('SET "organization_id" = NEW.organization_id');
    expect(migration).toContain("IF preserve_until >= now() THEN");
    expect(migration).toContain("AND \"category\" = 'commitment'");
  });

  it("retains explicitly shared summaries for twelve months with a retention hold escape hatch", () => {
    expect(migration).toContain("interval '12 months'");
    expect(migration).toContain('DELETE FROM "coach_shared_summaries"');
    expect(migration).toContain("s.shared_at <= l.offboarded_at");
    expect(migration).toContain("l.retention_hold = false");
  });

  it("runs retention cleanup from the existing scheduled session cleanup heartbeat", () => {
    expect(migration).toContain("spartan_run_member_offboarding_retention");
    expect(migration).toContain("spartan_member_offboarding_retention_tick");
    expect(migration).toContain("NEW.\"type\" = 'job_session_cleanup'");
  });
});
