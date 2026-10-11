/**
 * Canonical, dependency-free PHI readiness contract. Runtime, mode selection,
 * health and the offline verifier all use this evaluator. Never return env values.
 * The legacy OPENAI_MODIFIED_RETENTION_CONFIRMED flag is deliberately not evidence
 * of ZDR and cannot satisfy any requirement here.
 */
import { isUsableOpenAiApiKey } from "./provider-key-contract.js";

export const PHI_READINESS_REQUIREMENTS = Object.freeze(
  [
    { name: "HIPAA_PHI_ENABLED", expected: "true" },
    { name: "CLINICAL_OPERATION_MODE", expected: "phi" },
    { name: "CLINICAL_PATIENT_REVIEW_ENABLED", expected: "true" },
    { name: "OPENAI_BAA_CONFIRMED", expected: "true", confirmation: true },
    { name: "OPENAI_RETENTION_MODE", expected: "zdr", confirmation: true },
    {
      name: "OPENAI_HIPAA_RETENTION_CONFIRMED",
      expected: "true",
      confirmation: true,
    },
    {
      name: "GOOGLE_CLOUD_BAA_CONFIRMED",
      expected: "true",
      confirmation: true,
    },
    { name: "PHI_STORAGE_BAA_CONFIRMED", expected: "true", confirmation: true },
    {
      name: "CLINICAL_SCANNER_BAA_CONFIRMED",
      expected: "true",
      confirmation: true,
    },
    { name: "OPENAI_API_KEY", usableOpenAiKey: true },
    { name: "DATABASE_URL" },
    { name: "AI_TOOL_ENCRYPTION_KEY" },
    { name: "CLINICAL_EPHEMERAL_GCS_BUCKET" },
    { name: "CLINICAL_FILE_SCANNER_URL" },
    { name: "CLINICAL_FILE_SCANNER_TOKEN" },
  ].map((control) => Object.freeze(control)),
);

export const PHI_CONFIRMATION_GATES = Object.freeze(
  PHI_READINESS_REQUIREMENTS.filter((control) => control.confirmation).map(
    (control) => control.name,
  ),
);

function satisfied(control, environment) {
  const value = environment[control.name];
  if (control.usableOpenAiKey) return isUsableOpenAiApiKey(value);
  return control.expected === undefined
    ? Boolean(value?.trim())
    : value === control.expected;
}

export function clinicalBaasConfirmed(environment = process.env) {
  return PHI_READINESS_REQUIREMENTS.filter(
    (control) => control.confirmation,
  ).every((control) => satisfied(control, environment));
}

export function clinicalRuntimeReadiness(
  environment = process.env,
  { requirePhi = false } = {},
) {
  // Explicit education is an intentional override. Other activation flags without
  // a mode still represent an incomplete PHI request and must not appear healthy.
  const phiRequested =
    requirePhi ||
    environment.CLINICAL_OPERATION_MODE === "phi" ||
    (environment.CLINICAL_OPERATION_MODE !== "deidentified" &&
      (environment.HIPAA_PHI_ENABLED === "true" ||
        environment.CLINICAL_PATIENT_REVIEW_ENABLED === "true"));
  const missingControls = phiRequested
    ? PHI_READINESS_REQUIREMENTS.filter(
        (control) => !satisfied(control, environment),
      ).map((control) => control.name)
    : [];
  const ready = missingControls.length === 0;
  return {
    operationMode: phiRequested && ready ? "phi" : "deidentified",
    ready,
    missingControls,
    baasConfirmed: clinicalBaasConfirmed(environment),
  };
}

export function resolveClinicalOperationMode(environment = process.env) {
  return clinicalRuntimeReadiness(environment).operationMode;
}

export function isPhiClinicalOperationMode(environment = process.env) {
  return resolveClinicalOperationMode(environment) === "phi";
}
