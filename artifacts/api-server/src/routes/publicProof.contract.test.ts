import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../../../..");
const schema = readFileSync(resolve(repoRoot, "lib/db/src/schema/schema.ts"), "utf8");
const migration = readFileSync(resolve(repoRoot, "lib/db/migrations/0028_public_proof_approval.sql"), "utf8");
const storage = readFileSync(resolve(repoRoot, "artifacts/api-server/src/storage.ts"), "utf8");
const routes = readFileSync(resolve(repoRoot, "artifacts/api-server/src/routes/routes.ts"), "utf8");

describe("public proof publication contract", () => {
  it("persists approval state, written permission reference, and approval time", () => {
    for (const field of ["approvalStatus", "approvalReference", "approvedAt"]) {
      expect(schema).toContain(field);
    }
    expect(migration).toContain('"approval_status"');
    expect(migration).toContain('"approval_reference"');
    expect(migration).toContain('"approved_at"');
  });

  it("filters the public API at storage while keeping a protected admin inventory", () => {
    expect(storage).toContain('eq(testimonials.approvalStatus, "approved")');
    expect(storage).toContain("isNotNull(testimonials.approvedAt)");
    expect(storage).toContain("isNotNull(testimonials.approvalReference)");
    expect(storage).toContain('eq(caseStudies.approvalStatus, "approved")');
    expect(storage).toContain("isNotNull(caseStudies.approvedAt)");
    expect(storage).toContain("isNotNull(caseStudies.approvalReference)");
    expect(routes).toContain("storage.getPublicTestimonials()");
    expect(routes).toContain("storage.getPublicCaseStudies()");
    expect(routes).toContain('app.get("/api/admin/testimonials", requireAdmin');
    expect(routes).toContain('app.get("/api/admin/case-studies", requireAdmin');
  });

  it("requires a written approval reference before an admin can publish", () => {
    expect(routes.match(/Written approval reference is required before publication/g)?.length).toBe(4);
  });
});