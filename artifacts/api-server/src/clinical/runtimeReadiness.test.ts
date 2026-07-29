import { describe, expect, it } from "vitest";
import { clinicalRuntimeReadiness } from "./runtimeReadiness";

const readyPhiEnvironment = {
  CLINICAL_OPERATION_MODE: "phi",
  HIPAA_PHI_ENABLED: "true",
  OPENAI_BAA_CONFIRMED: "true",
  OPENAI_MODIFIED_RETENTION_CONFIRMED: "true",
  GOOGLE_CLOUD_BAA_CONFIRMED: "true",
  PHI_STORAGE_BAA_CONFIRMED: "true",
  DATABASE_URL: "postgres://covered",
  OPENAI_API_KEY: "configured",
  AI_TOOL_ENCRYPTION_KEY: "configured",
  CLINICAL_EPHEMERAL_GCS_BUCKET: "covered-ephemeral",
  CLINICAL_FILE_SCANNER_URL: "https://scanner.internal",
  CMS_COVERAGE_API_TOKEN: "configured",
} satisfies NodeJS.ProcessEnv;

describe("clinical runtime readiness", () => {
  it("keeps ephemeral de-identified education mode ready by default", () => {
    expect(clinicalRuntimeReadiness({})).toEqual({
      operationMode: "deidentified",
      ready: true,
      missingControls: [],
    });
  });

  it("fails closed and reports missing PHI controls by name only", () => {
    const readiness = clinicalRuntimeReadiness({
      CLINICAL_OPERATION_MODE: "phi",
      OPENAI_API_KEY: "configured",
    });
    expect(readiness.ready).toBe(false);
    expect(readiness.missingControls).toContain("OPENAI_BAA_CONFIRMED");
    expect(readiness.missingControls).toContain(
      "CLINICAL_EPHEMERAL_GCS_BUCKET",
    );
    expect(JSON.stringify(readiness)).not.toContain("configured");
  });

  it("reports ready only when every PHI gate and runtime dependency exists", () => {
    expect(clinicalRuntimeReadiness(readyPhiEnvironment)).toEqual({
      operationMode: "phi",
      ready: true,
      missingControls: [],
    });
  });
});
