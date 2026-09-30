import { describe, expect, it } from "vitest";
import {
  clinicalBaasConfirmed,
  isPhiClinicalOperationMode,
  resolveClinicalOperationMode,
} from "./clinical-runtime";

const baas = {
  HIPAA_PHI_ENABLED: "true",
  OPENAI_BAA_CONFIRMED: "true",
  OPENAI_MODIFIED_RETENTION_CONFIRMED: "true",
  GOOGLE_CLOUD_BAA_CONFIRMED: "true",
  PHI_STORAGE_BAA_CONFIRMED: "true",
  CLINICAL_SCANNER_BAA_CONFIRMED: "true",
} satisfies NodeJS.ProcessEnv;

describe("shared clinical-runtime mode helpers", () => {
  it("defaults to deidentified without BAAs", () => {
    expect(resolveClinicalOperationMode({})).toBe("deidentified");
    expect(isPhiClinicalOperationMode({})).toBe(false);
    expect(clinicalBaasConfirmed({})).toBe(false);
  });

  it("never enables PHI even when legacy BAA flags are true", () => {
    expect(clinicalBaasConfirmed(baas)).toBe(true);
    expect(resolveClinicalOperationMode(baas)).toBe("deidentified");
    expect(isPhiClinicalOperationMode(baas)).toBe(false);
  });

  it("honors explicit deidentified override", () => {
    expect(
      resolveClinicalOperationMode({
        ...baas,
        CLINICAL_OPERATION_MODE: "deidentified",
      }),
    ).toBe("deidentified");
  });

  it("ignores an explicit legacy PHI request", () => {
    expect(
      resolveClinicalOperationMode({
        ...baas,
        CLINICAL_OPERATION_MODE: "phi",
      }),
    ).toBe("deidentified");
    expect(isPhiClinicalOperationMode({ CLINICAL_OPERATION_MODE: "phi" })).toBe(false);
  });

  it("enables the dedicated patient workflow only with every confirmation and activation", () => {
    expect(resolveClinicalOperationMode({ ...baas, CLINICAL_OPERATION_MODE: "phi", CLINICAL_PATIENT_REVIEW_ENABLED: "true" })).toBe("phi");
    expect(isPhiClinicalOperationMode({ ...baas, CLINICAL_OPERATION_MODE: "phi", CLINICAL_PATIENT_REVIEW_ENABLED: "true" })).toBe(true);
    expect(resolveClinicalOperationMode({ ...baas, GOOGLE_CLOUD_BAA_CONFIRMED: "false", CLINICAL_OPERATION_MODE: "phi", CLINICAL_PATIENT_REVIEW_ENABLED: "true" })).toBe("deidentified");
  });
});
