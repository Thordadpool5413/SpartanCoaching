/**
 * HSP-48 final release gate runner (plain Node — no TS import).
 *
 * Usage (repo root):
 *   node scripts/release-gate.mjs
 *   node scripts/release-gate.mjs https://your-host.example
 *   SITE_URL=… PARITY_EMAIL=… PARITY_PASSWORD=… node scripts/release-gate.mjs
 *
 * Exit 0: all automated suites passed.
 * Exit 1: automated suite failed.
 * Never claims production-ready while live/device/external critical paths remain open.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const site = (process.argv[2] || process.env.SITE_URL || "").replace(/\/$/, "");

/** Mirrors lib/field-kit-catalog/src/release-gate.ts AUTOMATED_SUITES */
const AUTOMATED_SUITES = [
  {
    id: "db_ops",
    label: "DB ops readiness + migration safety",
    critical: true,
    cwd: "lib/db",
    command: "pnpm",
    args: ["exec", "vitest", "run", "src/ops-readiness.test.ts", "src/migration-safety.test.ts"],
  },
  {
    id: "catalog",
    label: "Field-kit catalog (includes release-gate matrix tests)",
    critical: true,
    cwd: "lib/field-kit-catalog",
    command: "pnpm",
    args: ["exec", "vitest", "run"],
  },
  {
    id: "api_security_entitlement",
    label: "API auth, entitlement, tenant isolation, security",
    critical: true,
    cwd: "artifacts/api-server",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/auth/crypto.test.ts",
      "src/auth/entitlement.test.ts",
      "src/auth/middleware.test.ts",
      "src/auth/workflowTenantAuthz.test.ts",
      "src/security/requestSecurity.test.ts",
      "src/security/tenantRoleplay.test.ts",
      "src/security/phiEncryption.test.ts",
      "src/routes/aiToolIsolation.integration.test.ts",
      "src/routes/deleteAccount.test.ts",
      "src/billing/entitlementMap.test.ts",
    ],
  },
  {
    id: "api_product",
    label: "API resources, search, personalization, notifications, health",
    critical: true,
    cwd: "artifacts/api-server",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/resources/resourceArchitecture.test.ts",
      "src/resources/executableResources.test.ts",
      "src/resources/resourceLifecycle.test.ts",
      "src/resources/providerResourceLibrary.test.ts",
      "src/search/universalSearch.test.ts",
      "src/personalization/personalizationEngine.test.ts",
      "src/notifications/notificationEngine.test.ts",
      "src/routes/health.test.ts",
      "src/delivery/featureFlags.test.ts",
      "src/observability/reliabilityTargets.test.ts",
      "src/ai/uncertaintyBoundaries.test.ts",
    ],
  },
  {
    id: "web_contracts",
    label: "Web a11y + membership contracts",
    critical: true,
    cwd: "artifacts/spartan-coaching",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/lib/a11y.contract.test.ts",
      "src/lib/complianceCopy.test.ts",
      "src/lib/workspaceShell.test.ts",
      "src/pages/FieldKitMembership.eliteCopy.test.tsx",
    ],
  },
  {
    id: "mobile_contracts",
    label: "iOS product quality + App Store readiness",
    critical: true,
    cwd: "artifacts/spartan-coaching-mobile",
    command: "pnpm",
    args: [
      "exec",
      "jest",
      "--runInBand",
      "__tests__/ios-product-quality.test.ts",
      "__tests__/app-store-readiness.test.ts",
      "__tests__/account-billing.test.tsx",
    ],
  },
];

const results = [];

function runSuite(suite) {
  console.log(`\n══ ${suite.label} (${suite.id}) ══\n`);
  const cwd = path.join(root, suite.cwd);
  const r = spawnSync(suite.command, suite.args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  const code = r.status ?? 1;
  const status = code === 0 ? "PASS" : "FAIL";
  results.push({
    id: suite.id,
    label: suite.label,
    critical: suite.critical,
    status,
    exitCode: code,
  });
  return code === 0;
}

console.log("HSP-48 Final Trusted Workspace Release Gate");
console.log(`Repo root: ${root}`);
console.log(`Time: ${new Date().toISOString()}`);

let automatedOk = true;
for (const suite of AUTOMATED_SUITES) {
  const ok = runSuite(suite);
  if (!ok && suite.critical) automatedOk = false;
}

if (site) {
  console.log(`\n══ Live smoke-health (${site}) ══\n`);
  const h = spawnSync(process.execPath, [path.join(root, "scripts/smoke-health.mjs"), site], {
    stdio: "inherit",
    env: process.env,
  });
  results.push({
    id: "live_health",
    label: "Live smoke-health",
    critical: true,
    status: (h.status ?? 1) === 0 ? "PASS" : "FAIL",
    exitCode: h.status ?? 1,
  });
  if ((h.status ?? 1) !== 0) automatedOk = false;

  const email = (process.env.PARITY_EMAIL || process.env.SMOKE_EMAIL || "").trim();
  const password = process.env.PARITY_PASSWORD || process.env.SMOKE_PASSWORD || "";
  if (email && password) {
    console.log(`\n══ Live smoke-parity-auth ══\n`);
    const a = spawnSync(
      process.execPath,
      [path.join(root, "scripts/smoke-parity-auth.mjs"), site, email, password],
      { stdio: "inherit", env: process.env },
    );
    results.push({
      id: "live_auth",
      label: "Live smoke-parity-auth",
      critical: true,
      status: (a.status ?? 1) === 0 ? "PASS" : "FAIL",
      exitCode: a.status ?? 1,
    });
    if ((a.status ?? 1) !== 0) automatedOk = false;
  } else {
    results.push({
      id: "live_auth",
      label: "Live smoke-parity-auth",
      critical: true,
      status: "UNVERIFIED",
      note: "Set PARITY_EMAIL and PARITY_PASSWORD",
    });
  }
} else {
  results.push({
    id: "live_health",
    label: "Live smoke-health",
    critical: true,
    status: "UNVERIFIED",
    note: "Pass SITE_URL or argv to run",
  });
  results.push({
    id: "live_auth",
    label: "Live smoke-parity-auth",
    critical: true,
    status: "UNVERIFIED",
    note: "Requires SITE_URL + PARITY_EMAIL + PARITY_PASSWORD",
  });
}

console.log("\n════════════════════════════════════════");
console.log("EVIDENCE REPORT");
console.log("════════════════════════════════════════");
for (const r of results) {
  const tag = r.critical ? "CRITICAL" : "optional";
  console.log(`  [${r.status}] (${tag}) ${r.id}: ${r.label}${r.note ? ` — ${r.note}` : ""}`);
}

const fails = results.filter((r) => r.status === "FAIL");
const unverified = results.filter((r) => r.status === "UNVERIFIED");

console.log("\n── Confirmed defects (this run) ──");
if (fails.length === 0) console.log("  None in suites executed this run.");
else fails.forEach((f) => console.log(`  DEFECT: ${f.id} exit=${f.exitCode}`));

console.log("\n── Recommendations (not defects) ──");
console.log("  • Re-run with SITE_URL after every deploy: node scripts/release-gate.mjs <url>");
console.log("  • Prove entitled seat: PARITY_EMAIL + PARITY_PASSWORD");
console.log("  • TestFlight physical smoke: artifacts/spartan-coaching-mobile/store/testflight-smoke.md");
console.log("  • ASC App Privacy + subscription storefront review (HSP-46 risk item)");
console.log("  • Staging backup drill + OPS_LAST_RESTORE_DRILL_ISO (HSP-45)");

console.log("\n── Production-ready claim ──");
console.log("  productionReadyClaimAllowed: false");
console.log(
  "  Reason: Critical live_env (health + entitled seat), manual_device (TestFlight), and external (ASC/EAS) paths remain UNVERIFIED unless proven outside this runner. Automated PASS is necessary but not sufficient.",
);
console.log(`  UNVERIFIED live steps this run: ${unverified.map((u) => u.id).join(", ") || "none"}`);

console.log("\n════════════════════════════════════════");
if (!automatedOk) {
  console.error("RELEASE GATE FAILED — fix automated defects before ship.");
  process.exit(1);
}
console.log(
  "RELEASE GATE AUTOMATED SUITES PASSED — do NOT call the product production-ready until live + device + external critical paths are proven.",
);
process.exit(0);
