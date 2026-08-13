/**
 * Org admin workspace panels — static contract for Slice B depth (pass 4).
 * Full auth-gated render needs API mocks; this locks panel test ids + copy.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "OrgAdmin.tsx"),
  "utf8",
);

describe("OrgAdmin workspace panels", () => {
  it("loads profile, members, invites, usage, and audit surfaces", () => {
    for (const id of [
      "org-admin-profile",
      "org-admin-members",
      "org-admin-invites",
      "org-admin-usage",
      "org-admin-audit",
    ]) {
      expect(source).toContain(`data-testid="${id}"`);
    }
  });

  it("fetches usage aggregates without free-text content claims", () => {
    expect(source).toContain('/api/org/usage');
    expect(source).toMatch(/Aggregate tool activity only/i);
  });

  it("supports invite role selection member | org_admin", () => {
    expect(source).toContain('inviteRole');
    expect(source).toContain('value="org_admin"');
  });
});
