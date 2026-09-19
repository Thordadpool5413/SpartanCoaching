import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../../../..");
const schema = readFileSync(resolve(repoRoot, "lib/db/src/schema/schema.ts"), "utf8");
const migration = readFileSync(resolve(repoRoot, "lib/db/migrations/0028_public_proof_approval.sql"), "utf8");
const provenanceMigration = readFileSync(resolve(repoRoot, "lib/db/migrations/0029_public_proof_provenance.sql"), "utf8");
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

  it("persists the provenance needed to qualify public outcome claims", () => {
    for (const field of [
      "approvalScope",
      "timeframe",
      "evidenceSource",
      "measurementContext",
      "verificationStatus",
      "attributionLimitations",
    ]) {
      expect(schema).toContain(field);
    }
    for (const column of [
      '"approval_scope"',
      '"timeframe"',
      '"evidence_source"',
      '"measurement_context"',
      '"verification_status"',
      '"attribution_limitations"',
    ]) {
      expect(provenanceMigration).toContain(column);
    }
  });

  it("filters the public API at storage while keeping a protected admin inventory", () => {
    expect(storage).toContain('eq(testimonials.approvalStatus, "approved")');
    expect(storage).toContain("isNotNull(testimonials.approvedAt)");
    expect(storage).toContain("isNotNull(testimonials.approvalReference)");
    expect(storage).toContain("isNotNull(testimonials.approvalScope)");
    expect(storage).toContain("isNotNull(testimonials.evidenceSource)");
    expect(storage).toContain("isNotNull(testimonials.timeframe)");
    expect(storage).toContain('eq(caseStudies.approvalStatus, "approved")');
    expect(storage).toContain("isNotNull(caseStudies.approvedAt)");
    expect(storage).toContain("isNotNull(caseStudies.approvalReference)");
    expect(storage).toContain("isNotNull(caseStudies.approvalScope)");
    expect(storage).toContain("isNotNull(caseStudies.evidenceSource)");
    expect(storage).toContain("isNotNull(caseStudies.timeframe)");
    expect(routes).toContain("storage.getPublicTestimonials()");
    expect(routes).toContain("storage.getPublicCaseStudies()");
    expect(routes).toContain('app.get("/api/admin/testimonials", requireAdmin');
    expect(routes).toContain('app.get("/api/admin/case-studies", requireAdmin');
  });

  it("returns display provenance without serializing internal approval metadata", () => {
    const testimonialPublicQuery = storage.slice(
      storage.indexOf("async getPublicTestimonials"),
      storage.indexOf("async createTestimonial"),
    );
    const caseStudyPublicQuery = storage.slice(
      storage.indexOf("async getPublicCaseStudies"),
      storage.indexOf("async createCaseStudy"),
    );

    for (const query of [testimonialPublicQuery, caseStudyPublicQuery]) {
      expect(query).toContain("evidenceSource:");
      expect(query).toContain("verificationStatus:");
      expect(query).not.toContain("approvalReference:");
      expect(query).not.toContain("approvalScope:");
      expect(query).not.toContain("approvedAt:");
      expect(query).not.toContain("createdAt:");
    }
  });

  it("requires a written approval reference before an admin can publish", () => {
    expect(routes.match(/Written approval reference is required before publication/g)?.length).toBe(4);
    expect(routes.match(/Approval scope, evidence source, and timeframe are required before publication/g)?.length).toBe(4);
  });
});