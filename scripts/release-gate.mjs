/**
 * HSP-48 final release gate runner (plain Node — no TS import).
 *
 * Usage (repo root):
 *   node scripts/release-gate.mjs
 *   node scripts/release-gate.mjs https://your-host.example
 *   SITE_URL=… PARITY_EMAIL=… PARITY_PASSWORD=… node scripts/release-gate.mjs
 *   node scripts/release-gate.mjs --live-only https://your-host.example
 *   LIVE_ONLY=1 SITE_URL=https://… node scripts/release-gate.mjs
 *
 * Exit 0: all automated suites (when run) and invoked live checks passed.
 * Exit 1: automated suite or live check failed.
 * Never claims production-ready while live/device/external critical paths remain open.
 *
 * Live stack when SITE_URL (or argv host) is set:
 *   1. smoke-health.mjs
 *   2. smoke-parity.mjs  (public feeds + unauth gates + org_admin unauth)
 *   3. smoke-parity-auth.mjs when PARITY_EMAIL + PARITY_PASSWORD set
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const argv = process.argv.slice(2);
const liveOnlyFlag =
  argv.includes("--live-only") ||
  process.env.LIVE_ONLY === "1" ||
  process.env.LIVE_ONLY === "true";
const siteArg = argv.find((a) => a !== "--live-only" && !a.startsWith("-"));
const site = (siteArg || process.env.SITE_URL || "").replace(/\/$/, "");

/** Mirrors lib/field-kit-catalog/src/release-gate.ts AUTOMATED_SUITES */
const AUTOMATED_SUITES = [
  {
    id: "db_ops",
    label: "DB ops readiness + migration safety + migrate-manifest",
    critical: true,
    cwd: "lib/db",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "src/ops-readiness.test.ts",
      "src/migration-safety.test.ts",
      "src/migrate-manifest.test.ts",
    ],
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
    label: "API auth, entitlement, tenant isolation, security, org admin policy",
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
      "src/auth/orgAdminPolicy.test.ts",
      "src/auth/orgStructurePolicy.test.ts",
      "src/auth/orgOffboardPolicy.test.ts",
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
      "src/routes/coachPrivacyContract.test.ts",
      "src/routes/associatedDomainsContract.test.ts",
    ],
  },
  {
    id: "web_contracts",
    label: "Web a11y, membership, dual-schema, org admin panels",
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
      "src/shared/schema.dualSourceOfTruth.test.ts",
      "src/pages/OrgAdmin.panels.test.tsx",
    ],
  },
  {
    id: "mobile_contracts",
    label: "iOS product quality, App Store readiness, Command Center helpers",
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
      "__tests__/command-center-next-actions.test.ts",
      "__tests__/command-center-accounts.test.ts",
      "__tests__/command-center-roleplay.test.ts",
      "__tests__/command-center-integrations.test.ts",
      "__tests__/app-config.test.ts",
      "__tests__/apple-subscriptions.test.ts",
      "__tests__/deep-links.test.ts",
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

function runLiveScript(id, label, scriptName, args) {
  console.log(`\n══ ${label} ══\n`);
  const r = spawnSync(process.execPath, [path.join(root, "scripts", scriptName), ...args], {
    stdio: "inherit",
    env: process.env,
  });
  const code = r.status ?? 1;
  results.push({
    id,
    label,
    critical: true,
    status: code === 0 ? "PASS" : "FAIL",
    exitCode: code,
  });
  return code === 0;
}

console.log("HSP-48 Final Trusted Workspace Release Gate");
console.log(`Repo root: ${root}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Mode: ${liveOnlyFlag ? "live-only (skip unit suites)" : "full (automated + live when SITE_URL)"}`);
if (site) console.log(`SITE_URL: ${site}`);
else console.log("SITE_URL: (not set — live steps UNVERIFIED)");

let automatedOk = true;

if (liveOnlyFlag) {
  if (!site) {
    console.error("\n--live-only / LIVE_ONLY requires SITE_URL or a host argv.\n");
    process.exit(1);
  }
  results.push({
    id: "automated_suites",
    label: "Automated unit/integration suites",
    critical: false,
    status: "SKIPPED",
    note: "LIVE_ONLY / --live-only",
  });
} else {
  for (const suite of AUTOMATED_SUITES) {
    const ok = runSuite(suite);
    if (!ok && suite.critical) automatedOk = false;
  }
}

if (site) {
  if (!runLiveScript("live_health", `Live smoke-health (${site})`, "smoke-health.mjs", [site])) {
    automatedOk = false;
  }
  if (!runLiveScript("live_parity", `Live smoke-parity (${site})`, "smoke-parity.mjs", [site])) {
    automatedOk = false;
  }

  const email = (process.env.PARITY_EMAIL || process.env.SMOKE_EMAIL || "").trim();
  const password = process.env.PARITY_PASSWORD || process.env.SMOKE_PASSWORD || "";
  if (email && password) {
    if (
      !runLiveScript("live_auth", "Live smoke-parity-auth", "smoke-parity-auth.mjs", [
        site,
        email,
        password,
      ])
    ) {
      automatedOk = false;
    }
  } else {
    results.push({
      id: "live_auth",
      label: "Live smoke-parity-auth",
      critical: true,
      status: "UNVERIFIED",
      note: "Set PARITY_EMAIL and PARITY_PASSWORD for entitled seat proof",
    });
  }
} else {
  results.push({
    id: "live_health",
    label: "Live smoke-health",
    critical: true,
    status: "UNVERIFIED",
    note: "Pass SITE_URL or argv host to run",
  });
  results.push({
    id: "live_parity",
    label: "Live smoke-parity",
    critical: true,
    status: "UNVERIFIED",
    note: "Pass SITE_URL or argv host to run",
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
const skipped = results.filter((r) => r.status === "SKIPPED");

console.log("\n── Confirmed defects (this run) ──");
if (fails.length === 0) console.log("  None in suites executed this run.");
else fails.forEach((f) => console.log(`  DEFECT: ${f.id} exit=${f.exitCode}`));

console.log("\n── Recommendations (not defects) ──");
console.log("  • Post-deploy live only: pnpm run release-gate:live -- https://your-host");
console.log("  • Full gate: node scripts/release-gate.mjs  (+ SITE_URL for live_health + live_parity)");
console.log("  • Prove entitled seat: PARITY_EMAIL + PARITY_PASSWORD");
console.log("  • Org soft 404s until redeploy: set STRICT_ORG_GATES=1 after profile/audit/structure ship");
console.log("  • TestFlight physical smoke: artifacts/spartan-coaching-mobile/store/testflight-smoke.md");
console.log("  • ASC App Privacy + subscription storefront review (HSP-46 risk item)");
console.log("  • Staging backup drill + OPS_LAST_RESTORE_DRILL_ISO (HSP-45)");

console.log("\n── Production-ready claim ──");
console.log("  productionReadyClaimAllowed: false");
console.log(
  "  Reason: Critical live_env (health + public parity + entitled seat), manual_device (TestFlight), and external (ASC/EAS) paths remain UNVERIFIED unless proven outside this runner. Automated PASS is necessary but not sufficient.",
);
console.log(`  UNVERIFIED live steps this run: ${unverified.map((u) => u.id).join(", ") || "none"}`);
if (skipped.length) {
  console.log(`  SKIPPED this run: ${skipped.map((s) => s.id).join(", ")}`);
}

console.log("\n════════════════════════════════════════");
if (!automatedOk) {
  console.error("RELEASE GATE FAILED — fix automated/live defects before ship.");
  process.exit(1);
}
if (liveOnlyFlag) {
  console.log(
    "RELEASE GATE LIVE CHECKS PASSED — do NOT call the product production-ready until entitled seat + device + external critical paths are proven.",
  );
} else {
  console.log(
    "RELEASE GATE AUTOMATED SUITES PASSED — do NOT call the product production-ready until live + device + external critical paths are proven.",
  );
}
process.exit(0);
