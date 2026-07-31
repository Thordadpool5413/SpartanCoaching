const PHI_CONFIRMATION_GATES = [
  "HIPAA_PHI_ENABLED",
  "OPENAI_BAA_CONFIRMED",
  "OPENAI_MODIFIED_RETENTION_CONFIRMED",
  "GOOGLE_CLOUD_BAA_CONFIRMED",
  "PHI_STORAGE_BAA_CONFIRMED",
] as const;

const PHI_RUNTIME_CONFIGURATION = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "AI_TOOL_ENCRYPTION_KEY",
  "CLINICAL_EPHEMERAL_GCS_BUCKET",
  "CLINICAL_FILE_SCANNER_URL",
] as const;

/** Optional for readiness — live CMS sync uses this when present; baseline seed covers first boot. */
export const PHI_OPTIONAL_CONFIGURATION = ["CMS_COVERAGE_API_TOKEN"] as const;

export type ClinicalOperationMode = "deidentified" | "phi";

export type ClinicalRuntimeReadiness = {
  operationMode: ClinicalOperationMode;
  ready: boolean;
  missingControls: string[];
  baasConfirmed: boolean;
};

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

export function clinicalRuntimeReadiness(
  environment: NodeJS.ProcessEnv = process.env,
): ClinicalRuntimeReadiness {
  const baasConfirmed = clinicalBaasConfirmed(environment);
  const operationMode = resolveClinicalOperationMode(environment);
  if (operationMode === "deidentified") {
    return {
      operationMode,
      ready: true,
      missingControls: [],
      baasConfirmed,
    };
  }

  const missingControls = [
    ...PHI_CONFIRMATION_GATES.filter(
      (name) => environment[name] !== "true",
    ),
    ...PHI_RUNTIME_CONFIGURATION.filter(
      (name) => !environment[name]?.trim(),
    ),
  ];
  return {
    operationMode,
    ready: missingControls.length === 0,
    missingControls,
    baasConfirmed,
  };
}
