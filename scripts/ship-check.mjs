/**
 * One-shot ship readiness: health + public parity (+ auth if credentials set).
 *
 * Usage:
 *   node scripts/ship-check.mjs https://spartanhospicecoaching.com
 *
 * Optional auth (same as smoke-parity-auth):
 *   PARITY_EMAIL=… PARITY_PASSWORD=… node scripts/ship-check.mjs https://…
 *   PARITY_SKIP_AI=1 …
 *
 * Exit 0 only if all invoked checks pass.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] || process.env.SITE_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/ship-check.mjs <SITE_URL>");
  process.exit(1);
}

const root = path.join(__dirname);
const email = (process.env.PARITY_EMAIL || process.env.SMOKE_EMAIL || "").trim();
const password = process.env.PARITY_PASSWORD || process.env.SMOKE_PASSWORD || "";

function run(label, script, args = []) {
  console.log(`\n══ ${label} ══\n`);
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    stdio: "inherit",
    env: process.env,
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    console.error(`\nship-check: ${label} failed (exit ${code})\n`);
    process.exit(code);
  }
}

console.log(`Ship check → ${base}`);
run("Health", "smoke-health.mjs", [base]);
run("Public parity", "smoke-parity.mjs", [base]);

if (email && password) {
  run("Auth parity (same seat)", "smoke-parity-auth.mjs", [base, email, password]);
} else {
  console.log(`
══ Auth parity ══
SKIP — set PARITY_EMAIL and PARITY_PASSWORD to prove an entitled seat.
Manual next: TestFlight + web /portal with the same login.
`);
}

console.log(`
════════════════════════════════════════
Ship check passed for ${base}
Next (human):
  1. Replit HEAD == origin/main + Publish if code changed
  2. TestFlight: store/testflight-smoke.md
  3. App Store listing: store/screenshot-shot-list.md
  4. Sign-off: docs/ship-readiness.md
════════════════════════════════════════
`);
process.exit(0);
