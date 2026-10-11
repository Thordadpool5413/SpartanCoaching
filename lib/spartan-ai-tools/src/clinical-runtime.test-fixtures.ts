/** Synthetic configuration only. Tests mock every external PHI-path service. */
export const syntheticPhiEnvironment = {
  HIPAA_PHI_ENABLED: "true",
  CLINICAL_OPERATION_MODE: "phi",
  CLINICAL_PATIENT_REVIEW_ENABLED: "true",
  OPENAI_BAA_CONFIRMED: "true",
  OPENAI_RETENTION_MODE: "zdr",
  OPENAI_HIPAA_RETENTION_CONFIRMED: "true",
  GOOGLE_CLOUD_BAA_CONFIRMED: "true",
  PHI_STORAGE_BAA_CONFIRMED: "true",
  CLINICAL_SCANNER_BAA_CONFIRMED: "true",
  OPENAI_API_KEY: "synthetic-provider-key",
  DATABASE_URL: "postgresql://localhost/synthetic_phi_fixture",
  AI_TOOL_ENCRYPTION_KEY: "01".repeat(32),
  CLINICAL_EPHEMERAL_GCS_BUCKET: "synthetic-ephemeral-bucket",
  CLINICAL_FILE_SCANNER_URL: "https://scanner.example.invalid/scan",
  CLINICAL_FILE_SCANNER_TOKEN: "synthetic-scanner-token",
} satisfies NodeJS.ProcessEnv;
