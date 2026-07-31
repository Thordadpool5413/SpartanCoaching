import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativeUrl: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativeUrl, import.meta.url)),
    "utf8",
  );
}

describe("ephemeral clinical source contracts", () => {
  const routes = source("./aiToolRoutes.ts");
  const cleanup = source("../clinical/ephemeral.ts");
  const jobs = source("../auth/opsJobs.ts");
  const web = source("../../../spartan-coaching/src/pages/AiTool.tsx");
  const native = source(
    "../../../spartan-coaching-mobile/components/ai-tool-screen.tsx",
  );

  it("never persists text-based clinical inputs or outputs in ai_tool_runs", () => {
    const start = routes.indexOf('"/api/ai-tools/:toolId/ephemeral-runs"');
    const end = routes.indexOf('"/api/ai-tools/:toolId/runs"', start);
    const ephemeralRoute = routes.slice(start, end);

    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    expect(ephemeralRoute).not.toContain(".insert(aiToolRuns)");
    expect(ephemeralRoute).not.toContain("encryptPhi(");
    expect(ephemeralRoute).not.toContain("inputHash");
    expect(ephemeralRoute).toContain("setNoStore(response)");
    expect(ephemeralRoute).toContain("retainedClinicalContent: false");
    expect(ephemeralRoute).toContain(
      "findPotentialIdentifiers(envelope?.input)",
    );
    expect(ephemeralRoute).toContain("POTENTIAL_PHI_DETECTED");
  });

  it("requires verified deletion before returning a medical-record result", () => {
    const start = routes.indexOf(
      '"/api/clinical/ephemeral-sessions/:sessionId/finalize"',
    );
    const end = routes.indexOf(
      '"/api/clinical/ephemeral-sessions/:sessionId"',
      start + 1,
    );
    const finalizeRoute = routes.slice(start, end);
    const purge = finalizeRoute.indexOf("purgeEphemeralClinicalSession(");
    const response = finalizeRoute.indexOf("exposeEphemeralResult(");

    expect(purge).toBeGreaterThan(0);
    expect(response).toBeGreaterThan(purge);
    expect(finalizeRoute).toContain("deletionVerified: true");
  });

  it("keeps abandoned sessions within the 60-minute application ceiling", () => {
    expect(cleanup).toContain("EPHEMERAL_CLINICAL_TTL_MS = 55 * 60 * 1000");
    expect(jobs).toContain("EPHEMERAL_CLEANUP_INTERVAL_MS = 5 * 60 * 1000");
    expect(jobs).toContain(
      "setInterval(ephemeralCleanupTick, EPHEMERAL_CLEANUP_INTERVAL_MS)",
    );
  });

  it("keeps the web clinical workflow off persistent case and export APIs", () => {
    expect(web).toContain("/ephemeral-runs");
    expect(web).toContain("/api/clinical/ephemeral-sessions");
    expect(web).not.toContain('"/api/clinical/cases"');
    expect(web).not.toContain("/api/clinical/runs/");
    expect(web).toContain("URL.revokeObjectURL");
  });

  it("keeps the native clinical workflow memory-only and privacy protected", () => {
    expect(native).toContain("/ephemeral-runs");
    expect(native).toContain("/api/clinical/ephemeral-sessions");
    expect(native).not.toContain('"/api/clinical/cases"');
    expect(native).not.toContain("/api/clinical/runs/");
    expect(native).toContain("FileSystem.deleteAsync");
    expect(native).toContain("clinicalScreenObscured");
  });

  it("sends PDF extracts as application/pdf data URLs without placeholder prefixes", () => {
    expect(routes).toContain("data:application/pdf;base64,");
    expect(routes).not.toContain("PDF attachment removed");
    // Image path already used data URLs; PDF must match that pattern.
    const pdfDataUrlCount = (
      routes.match(/data:application\/pdf;base64,/g) ?? []
    ).length;
    expect(pdfDataUrlCount).toBeGreaterThanOrEqual(2);
  });

  it("does not label the educational coverage seed as CMS_MCD", () => {
    const bootstrap = source("../clinical/coverageBootstrap.ts");
    expect(bootstrap).toContain('EDUCATIONAL_BASELINE_SOURCE = "EDUCATIONAL_BASELINE"');
    expect(bootstrap).toContain("source: EDUCATIONAL_BASELINE_SOURCE");
    expect(bootstrap).not.toMatch(
      /source:\s*"CMS_MCD"[\s\S]{0,80}SPARTAN-HOSPICE-BASELINE/,
    );
  });
});
