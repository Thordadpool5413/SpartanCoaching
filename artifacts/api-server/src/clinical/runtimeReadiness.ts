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
  "CMS_COVERAGE_API_TOKEN",
] as const;

export type ClinicalRuntimeReadiness = {
  operationMode: "deidentified" | "phi";
  ready: boolean;
  missingControls: string[];
};

export function clinicalRuntimeReadiness(
  environment: NodeJS.ProcessEnv = process.env,
): ClinicalRuntimeReadiness {
  const operationMode =
    environment.CLINICAL_OPERATION_MODE === "phi" ? "phi" : "deidentified";
  if (operationMode === "deidentified") {
    return { operationMode, ready: true, missingControls: [] };
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
  };
}
