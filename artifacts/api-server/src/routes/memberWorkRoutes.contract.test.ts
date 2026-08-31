import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/routes/memberWorkRoutes.ts"), "utf8");

describe("member work route contract", () => {
  it("scopes every read and write to the authenticated owner", () => {
    expect(source).toContain("eq(memberWorkItems.organizationId, context.organizationId)");
    expect(source).toContain("eq(memberWorkItems.memberId, context.memberId)");
    expect(source).toContain("requireAuth");
  });

  it("creates immutable history records instead of overwriting a tool slot", () => {
    expect(source).toContain("id: randomUUID()");
    expect(source).not.toContain("onConflictDoUpdate");
  });

  it("rejects detected identifiers and preserves workflow context", () => {
    expect(source).toContain("findPotentialIdentifiers");
    expect(source).toContain("POTENTIAL_PHI_DETECTED");
    expect(source).toContain("nextAction");
    expect(source).toContain("accountId");
  });
});
