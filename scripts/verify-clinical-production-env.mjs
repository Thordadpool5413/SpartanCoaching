/** Offline configuration check; never prints secrets or contacts services. */
import { clinicalRuntimeReadiness } from "../lib/spartan-ai-tools/src/clinical-runtime-contract.js";

const requirePhi = process.argv.includes("--require-phi");
const report = { ...clinicalRuntimeReadiness(process.env, { requirePhi }), requirePhi };
console.log(JSON.stringify(report, null, 2));
if (!report.ready) {
  console.error(`FAIL: PHI runtime unavailable; missing controls: ${report.missingControls.join(", ")}`);
} else {
  console.log(report.operationMode === "phi"
    ? "OK: PHI runtime configuration is ready; deployment and vendor controls require separate verification."
    : "OK: Deidentified education mode. Use --require-phi to require the protected patient workflow.");
}
process.exit(report.ready ? 0 : 1);
