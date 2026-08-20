import { describe, expect, it } from "vitest";
import {
  clinicalBaasConfirmed,
  clinicalRuntimeReadiness,
  resolveClinicalOperationMode,
} from "./runtimeReadiness";

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
} satisfies NodeJS.ProcessEnv;

const baasOnlyEnvironment = {
  HIPAA_PHI_ENABLED: "true",
  OPENAI_BAA_CONFIRMED: "true",
  OPENAI_MODIFIED_RETENTION_CONFIRMED: "true",
  GOOGLE_CLOUD_BAA_CONFIRMED: "true",
  PHI_STORAGE_BAA_CONFIRMED: "true",
} satisfies NodeJS.ProcessEnv;

describe("clinical runtime readiness", () => {
  it("keeps ephemeral de-identified education mode ready by default", () => {
    expect(clinicalRuntimeReadiness({})).toEqual({
      operationMode: "deidentified",
      ready: true,
      missingControls: [],
      baasConfirmed: false,
    });
  });

  it("keeps deidentified mode when legacy BAA flags are present", () => {
    expect(resolveClinicalOperationMode(baasOnlyEnvironment)).toBe("deidentified");
    expect(clinicalBaasConfirmed(baasOnlyEnvironment)).toBe(true);
    const readiness = clinicalRuntimeReadiness(baasOnlyEnvironment);
    expect(readiness.operationMode).toBe("deidentified");
    expect(readiness.ready).toBe(true);
    expect(readiness.missingControls).toEqual([]);
  });

  it("allows explicit deidentified override even when BAAs are confirmed", () => {
    expect(
      resolveClinicalOperationMode({
        ...baasOnlyEnvironment,
        CLINICAL_OPERATION_MODE: "deidentified",
      }),
    ).toBe("deidentified");
    expect(
      clinicalRuntimeReadiness({
        ...baasOnlyEnvironment,
        CLINICAL_OPERATION_MODE: "deidentified",
      }).ready,
    ).toBe(true);
  });

  it("ignores an explicit legacy PHI request", () => {
    const readiness = clinicalRuntimeReadiness({
      CLINICAL_OPERATION_MODE: "phi",
      OPENAI_API_KEY: "configured",
    });
    expect(readiness.operationMode).toBe("deidentified");
    expect(readiness.ready).toBe(true);
    expect(readiness.missingControls).toEqual([]);
  });

  it("remains deidentified when every legacy PHI dependency exists", () => {
    expect(clinicalRuntimeReadiness(readyPhiEnvironment)).toEqual({
      operationMode: "deidentified",
      ready: true,
      missingControls: [],
      baasConfirmed: true,
    });
  });

  it("does not expose legacy PHI readiness controls", () => {
    const readiness = clinicalRuntimeReadiness({
      ...readyPhiEnvironment,
      OPENAI_API_KEY: "ci-placeholder-no-network-calls",
    });
    expect(readiness.operationMode).toBe("deidentified");
    expect(readiness.missingControls).toEqual([]);
  });
});
