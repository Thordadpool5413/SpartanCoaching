export type ClinicalOperationMode = "deidentified" | "phi";
export type ClinicalRuntimeReadiness = {
  operationMode: ClinicalOperationMode;
  ready: boolean;
  missingControls: string[];
  baasConfirmed: boolean;
};
export const PHI_READINESS_REQUIREMENTS: readonly Readonly<{
  name: string;
  expected?: string;
  confirmation?: boolean;
  usableOpenAiKey?: boolean;
}>[];
export const PHI_CONFIRMATION_GATES: readonly string[];
export function clinicalBaasConfirmed(environment?: NodeJS.ProcessEnv): boolean;
export function clinicalRuntimeReadiness(
  environment?: NodeJS.ProcessEnv,
  options?: { requirePhi?: boolean },
): ClinicalRuntimeReadiness;
export function resolveClinicalOperationMode(
  environment?: NodeJS.ProcessEnv,
): ClinicalOperationMode;
export function isPhiClinicalOperationMode(
  environment?: NodeJS.ProcessEnv,
): boolean;
