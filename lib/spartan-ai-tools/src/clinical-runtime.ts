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
 * Spartan Coaching never accepts patient PHI. The legacy union remains for
 * backward compatible types, but no environment variable can enable PHI mode.
 */
export function resolveClinicalOperationMode(
  _environment: NodeJS.ProcessEnv = process.env,
): ClinicalOperationMode {
  return "deidentified";
}

export function isPhiClinicalOperationMode(
  _environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return false;
}
