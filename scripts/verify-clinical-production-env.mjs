/**
 * Offline production env verification for clinical / PHI runtime.
 *
 * Usage:
 *   node scripts/verify-clinical-production-env.mjs
 *   node scripts/verify-clinical-production-env.mjs --require-phi
 *
 * Does not print secret values — only present/missing control names.
 * Exit 0 when the selected mode is ready; exit 1 when PHI is required
 * or selected and controls are incomplete.
 */

const requirePhi = process.argv.includes("--require-phi");

const PHI_CONFIRMATION_GATES = [
  "HIPAA_PHI_ENABLED",
  "OPENAI_BAA_CONFIRMED",
  "OPENAI_MODIFIED_RETENTION_CONFIRMED",
  "GOOGLE_CLOUD_BAA_CONFIRMED",
  "PHI_STORAGE_BAA_CONFIRMED",
];

const PHI_RUNTIME_CONFIGURATION = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "AI_TOOL_ENCRYPTION_KEY",
  "CLINICAL_EPHEMERAL_GCS_BUCKET",
  "CLINICAL_FILE_SCANNER_URL",
];

const OPTIONAL = [
  "CMS_COVERAGE_API_TOKEN",
  "CLINICAL_GCS_BUCKET",
  "CLINICAL_FILE_SCANNER_TOKEN",
  "OPENAI_MODEL",
  "CLINICAL_OPERATION_MODE",
];

function isTrue(name) {
  return process.env[name] === "true";
}

function isPresent(name) {
  return Boolean(process.env[name]?.trim());
}

const baasConfirmed = PHI_CONFIRMATION_GATES.every(isTrue);
const explicit = process.env.CLINICAL_OPERATION_MODE?.trim().toLowerCase();
let operationMode = "deidentified";
if (explicit === "deidentified") operationMode = "deidentified";
else if (explicit === "phi") operationMode = "phi";
else if (baasConfirmed) operationMode = "phi";

const missingControls = [];
if (operationMode === "phi") {
  for (const name of PHI_CONFIRMATION_GATES) {
    if (!isTrue(name)) missingControls.push(name);
  }
  for (const name of PHI_RUNTIME_CONFIGURATION) {
    if (!isPresent(name)) missingControls.push(name);
  }
}

const optionalPresent = Object.fromEntries(
  OPTIONAL.map((name) => [name, isPresent(name)]),
);

const ready =
  operationMode === "deidentified" || missingControls.length === 0;

const report = {
  operationMode,
  baasConfirmed,
  ready,
  missingControls,
  optionalPresent,
  requirePhi,
};

console.log(JSON.stringify(report, null, 2));

if (requirePhi && operationMode !== "phi") {
  console.error(
    "FAIL: --require-phi was set but operation mode is deidentified. Confirm all five BAA env flags are true.",
  );
  process.exit(1);
}

if (operationMode === "phi" && !ready) {
  console.error(
    `FAIL: PHI mode selected but missing: ${missingControls.join(", ")}`,
  );
  process.exit(1);
}

if (requirePhi && !ready) {
  console.error("FAIL: PHI runtime is not ready.");
  process.exit(1);
}

console.log(
  ready
    ? operationMode === "phi"
      ? "OK: PHI clinical runtime env is ready."
      : "OK: De-identified clinical mode (education). Use --require-phi to enforce production PHI."
    : "FAIL: Clinical runtime not ready.",
);
process.exit(ready ? 0 : 1);
