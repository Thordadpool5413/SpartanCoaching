import {
  clinicalBaasConfirmed,
  resolveClinicalOperationMode,
  type ClinicalOperationMode,
} from "@workspace/spartan-ai-tools";

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
  const missingControls = operationMode === "phi"
    ? [
        "DATABASE_URL",
        "OPENAI_API_KEY",
        "CLINICAL_EPHEMERAL_GCS_BUCKET",
        "CLINICAL_FILE_SCANNER_URL",
        "CLINICAL_FILE_SCANNER_TOKEN",
      ].filter((name) => !environment[name]?.trim())
    : [];
  return {
    operationMode,
    ready: missingControls.length === 0,
    missingControls,
    baasConfirmed,
  };
}
