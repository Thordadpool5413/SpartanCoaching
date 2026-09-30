/**
 * Shared clinical operation-mode helpers used by the API runtime and the
 * tool runner. Keep this pure (env in → flags out) so the two sides cannot drift.
 */

export const PHI_CONFIRMATION_GATES = [
  "HIPAA_PHI_ENABLED",
  "OPENAI_BAA_CONFIRMED",
  "OPENAI_MODIFIED_RETENTION_CONFIRMED",
  "GOOGLE_CLOUD_BAA_CONFIRMED",
  "PHI_STORAGE_BAA_CONFIRMED",
  "CLINICAL_SCANNER_BAA_CONFIRMED",
] as const;

export type ClinicalOperationMode = "deidentified" | "phi";

/** True when every vendor BAA / HIPAA confirmation env is explicitly `true`. */
export function clinicalBaasConfirmed(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return PHI_CONFIRMATION_GATES.every((name) => environment[name] === "true");
}

/** Patient records use a separate, explicitly activated covered workflow. */
export function resolveClinicalOperationMode(
  environment: NodeJS.ProcessEnv = process.env,
): ClinicalOperationMode {
  return environment.CLINICAL_OPERATION_MODE === "phi" &&
    clinicalBaasConfirmed(environment) &&
    environment.CLINICAL_PATIENT_REVIEW_ENABLED === "true"
    ? "phi"
    : "deidentified";
}

export function isPhiClinicalOperationMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveClinicalOperationMode(environment) === "phi";
}
