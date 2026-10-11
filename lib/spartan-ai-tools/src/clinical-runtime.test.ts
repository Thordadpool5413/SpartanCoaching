import { describe, expect, it } from "vitest";
import {
  PHI_READINESS_REQUIREMENTS,
  clinicalBaasConfirmed,
  clinicalRuntimeReadiness,
  isPhiClinicalOperationMode,
  resolveClinicalOperationMode,
} from "./clinical-runtime";
import { syntheticPhiEnvironment } from "./clinical-runtime.test-fixtures";

describe("shared canonical clinical runtime", () => {
  it("has one complete tested control manifest", () => {
    expect(PHI_READINESS_REQUIREMENTS.map((c) => c.name).sort()).toEqual(
      Object.keys(syntheticPhiEnvironment).sort(),
    );
    expect(new Set(PHI_READINESS_REQUIREMENTS.map((c) => c.name)).size).toBe(
      PHI_READINESS_REQUIREMENTS.length,
    );
  });
  it("defaults to deidentified education", () => {
    expect(resolveClinicalOperationMode({})).toBe("deidentified");
    expect(isPhiClinicalOperationMode({})).toBe(false);
    expect(clinicalBaasConfirmed({})).toBe(false);
  });
  it("does not infer activation from vendor confirmations", () => {
    const {
      HIPAA_PHI_ENABLED,
      CLINICAL_OPERATION_MODE,
      CLINICAL_PATIENT_REVIEW_ENABLED,
      ...vendors
    } = syntheticPhiEnvironment;
    expect(clinicalBaasConfirmed(vendors)).toBe(true);
    expect(resolveClinicalOperationMode(vendors)).toBe("deidentified");
    expect(isPhiClinicalOperationMode(vendors)).toBe(false);
  });
  it("honors explicit deidentified override", () => {
    expect(
      resolveClinicalOperationMode({
        ...syntheticPhiEnvironment,
        CLINICAL_OPERATION_MODE: "deidentified",
      }),
    ).toBe("deidentified");
  });
  it("reports an incomplete PHI request while remaining deidentified", () => {
    const result = clinicalRuntimeReadiness({ CLINICAL_OPERATION_MODE: "phi" });
    expect(result.ready).toBe(false);
    expect(result.operationMode).toBe("deidentified");
    expect(result.missingControls).toContain("OPENAI_RETENTION_MODE");
  });
  it("enables mode only with full explicit ZDR and runtime configuration", () => {
    expect(resolveClinicalOperationMode(syntheticPhiEnvironment)).toBe("phi");
    expect(isPhiClinicalOperationMode(syntheticPhiEnvironment)).toBe(true);
  });
  it.each(PHI_READINESS_REQUIREMENTS)(
    "fails closed when $name is missing",
    ({ name }) => {
      const env: NodeJS.ProcessEnv = { ...syntheticPhiEnvironment };
      delete env[name];
      expect(isPhiClinicalOperationMode(env)).toBe(false);
      expect(clinicalRuntimeReadiness(env).missingControls).toContain(name);
    },
  );
  it("never accepts a legacy generic/Modified Retention assertion as ZDR", () => {
    const env = {
      ...syntheticPhiEnvironment,
      OPENAI_RETENTION_MODE: "modified",
      OPENAI_MODIFIED_RETENTION_CONFIRMED: "true",
    };
    expect(clinicalBaasConfirmed(env)).toBe(false);
    expect(isPhiClinicalOperationMode(env)).toBe(false);
  });
});
