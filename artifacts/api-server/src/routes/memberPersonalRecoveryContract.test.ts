import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const authRoutes = fs.readFileSync(path.resolve(import.meta.dirname, "authRoutes.ts"), "utf8");
const migration = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../../lib/db/migrations/0018_member_offboarding_lifecycle.sql"),
  "utf8",
);

describe("member personal recovery contract", () => {
  it("allows a disabled identity to be reactivated into a new personal account", () => {
    expect(authRoutes).toContain('existingMember.status !== "disabled"');
    expect(authRoutes).toContain("Re-enable a previously disabled account onto the new org");
    expect(authRoutes).toContain("eq(clientMembers.id, existingMember.id)");
    expect(authRoutes).toContain('type: "personal"');
    expect(authRoutes).toContain('status: "active"');
  });

  it("moves preserved commitments into the personal account only inside the recovery window", () => {
    expect(migration).toContain("now() + interval '30 days'");
    expect(migration).toContain("OLD.status = 'disabled'");
    expect(migration).toContain("OLD.organization_id IS DISTINCT FROM NEW.organization_id");
    expect(migration).toContain("target_org_type = 'personal'");
    expect(migration).toContain("preserve_until >= now()");
    expect(migration).toContain('SET "organization_id" = NEW.organization_id');
    expect(migration).toContain("AND \"category\" = 'commitment'");
  });

  it("does not restore raw Coach conversations after company offboarding", () => {
    expect(migration).toContain('DELETE FROM "coach_conversations"');
    expect(migration).toContain('DELETE FROM "coach_preferences"');
    expect(migration).toContain("AND \"category\" <> 'commitment'");
  });
});
