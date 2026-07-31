import {
  clinicalBaasConfirmed,
  resolveClinicalOperationMode,
  PHI_CONFIRMATION_GATES,
  type ClinicalOperationMode,
} from "@workspace/spartan-ai-tools";

const PHI_RUNTIME_CONFIGURATION = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "AI_TOOL_ENCRYPTION_KEY",
  "CLINICAL_EPHEMERAL_GCS_BUCKET",
  "CLINICAL_FILE_SCANNER_URL",
] as const;

/** Optional for readiness — live CMS sync uses this when present; baseline seed covers first boot. */
export const PHI_OPTIONAL_CONFIGURATION = ["CMS_COVERAGE_API_TOKEN"] as const;

export type { ClinicalOperationMode };

export type ClinicalRuntimeReadiness = {
  operationMode: ClinicalOperationMode;
  ready: boolean;
  missingControls: string[];
  baasConfirmed: boolean;
};

export { clinicalBaasConfirmed, resolveClinicalOperationMode };

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
