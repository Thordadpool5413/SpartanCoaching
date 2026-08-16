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
  return {
    operationMode,
    ready: true,
    missingControls: [],
    baasConfirmed,
  };
}
