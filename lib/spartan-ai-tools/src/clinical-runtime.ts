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
] as const;

export type ClinicalOperationMode = "deidentified" | "phi";

/** True when every vendor BAA / HIPAA confirmation env is explicitly `true`. */
export function clinicalBaasConfirmed(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return PHI_CONFIRMATION_GATES.every((name) => environment[name] === "true");
}

/**
 * Resolve clinical operation mode.
 * - Explicit `deidentified` always wins (education / fail-soft).
 * - Explicit `phi` requests PHI mode.
 * - Unset / other values auto-enable PHI when all BAA confirmation gates are true.
 */
export function resolveClinicalOperationMode(
  environment: NodeJS.ProcessEnv = process.env,
): ClinicalOperationMode {
  const explicit = environment.CLINICAL_OPERATION_MODE?.trim().toLowerCase();
  if (explicit === "deidentified") return "deidentified";
  if (explicit === "phi") return "phi";
  return clinicalBaasConfirmed(environment) ? "phi" : "deidentified";
}

export function isPhiClinicalOperationMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveClinicalOperationMode(environment) === "phi";
}
