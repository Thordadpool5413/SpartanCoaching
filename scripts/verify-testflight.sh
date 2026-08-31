#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-testflight}"
if [[ "$PROFILE" != "preview" && "$PROFILE" != "testflight" && "$PROFILE" != "testflight-applinks" && "$PROFILE" != "testflight-no-applinks" && "$PROFILE" != "production" && "$PROFILE" != "production-applinks" && "$PROFILE" != "production-no-applinks" ]]; then
  echo "Usage: bash scripts/verify-testflight.sh [preview|testflight|testflight-applinks|testflight-no-applinks|production|production-applinks|production-no-applinks]" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export EXPO_NO_TELEMETRY=1
export EXPO_HOME="${EXPO_HOME:-/tmp/spartan-expo}"
export COREPACK_HOME="${COREPACK_HOME:-/tmp/spartan-corepack}"
PNPM=(corepack pnpm)
MOBILE="artifacts/spartan-coaching-mobile"
PRODUCTION_URL="https://spartanhospicecoaching.com"

if git show-ref --verify --quiet refs/remotes/origin/main; then
  BEHIND_ORIGIN_MAIN="$(git rev-list --count HEAD..origin/main)"
  if [[ "$BEHIND_ORIGIN_MAIN" -gt 0 ]]; then
    echo "FAIL: this checkout is $BEHIND_ORIGIN_MAIN commit(s) behind origin/main." >&2
    echo "Fetch and reconcile the local branch before creating an EAS release." >&2
    exit 1
  fi
fi

echo "[1/9] Install locked dependencies"
"${PNPM[@]}" install --frozen-lockfile

echo "[2/9] Typecheck libraries and release applications"
"${PNPM[@]}" exec tsc --build
"${PNPM[@]}" --filter @workspace/api-server run typecheck
"${PNPM[@]}" --filter @workspace/spartan-coaching-mobile run typecheck

echo "[3/9] Verify schema, migration safety, and membership pricing"
"${PNPM[@]}" --filter @workspace/db test
"${PNPM[@]}" --filter @workspace/field-kit-catalog test

echo "[4/9] Verify Coach privacy, Apple billing, universal links, and AI safety"
"${PNPM[@]}" --filter @workspace/api-server exec vitest run \
  src/billing/appleBillingContract.test.ts \
  src/billing/entitlementMap.test.ts \
  src/clinical/clinicalProductContract.test.ts \
  src/routes/coachPrivacyContract.test.ts \
  src/routes/companySeatTransitionContract.test.ts \
  src/routes/memberPersonalRecoveryContract.test.ts \
  src/routes/associatedDomainsContract.test.ts \
  src/clinical/deidentification.test.ts \
  src/ai/uncertaintyBoundaries.test.ts

echo "[5/9] Run the complete mobile test suite"
"${PNPM[@]}" --filter @workspace/spartan-coaching-mobile exec jest --runInBand

echo "[6/9] Check shell and diff integrity"
bash -n scripts/verify-testflight.sh "$MOBILE/scripts/start-dev.sh"
git diff --check

echo "[7/9] Resolve the exact Expo public configuration"
PROFILE_SKIP_ASSOCIATED_DOMAINS="$(node - "$MOBILE/eas.json" "$PROFILE" <<'NODE'
const fs = require("node:fs");
const [file, profileName] = process.argv.slice(2);
const eas = JSON.parse(fs.readFileSync(file, "utf8"));
const seen = new Set();
function resolveProfile(name) {
  if (seen.has(name)) throw new Error(`Circular EAS profile inheritance: ${name}`);
  const profile = eas.build?.[name];
  if (!profile) throw new Error(`Unknown EAS build profile: ${name}`);
  seen.add(name);
  const parent = profile.extends ? resolveProfile(profile.extends) : {};
  return { ...parent, ...profile, env: { ...(parent.env || {}), ...(profile.env || {}) } };
}
const value = resolveProfile(profileName).env?.EAS_SKIP_ASSOCIATED_DOMAINS;
if (value !== "0" && value !== "1") {
  throw new Error(`${profileName} must explicitly set EAS_SKIP_ASSOCIATED_DOMAINS to 0 or 1`);
}
process.stdout.write(value);
NODE
)"
export EAS_SKIP_ASSOCIATED_DOMAINS="$PROFILE_SKIP_ASSOCIATED_DOMAINS"
export EXPO_PUBLIC_API_URL="$PRODUCTION_URL"
export EXPO_PUBLIC_DOMAIN="spartanhospicecoaching.com"
CONFIG_JSON="$(mktemp)"
(cd "$MOBILE" && "${PNPM[@]}" exec expo config --type public --json) > "$CONFIG_JSON"
node - "$CONFIG_JSON" "$PROFILE" "$PROFILE_SKIP_ASSOCIATED_DOMAINS" <<'NODE'
const fs = require("node:fs");
const [file, profile, skipAssociatedDomains] = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(file, "utf8"));
if (config.ios?.bundleIdentifier !== "com.spartancoaching.fieldkit") throw new Error("Wrong iOS bundle identifier");
const router = config.plugins?.find((item) => Array.isArray(item) && item[0] === "expo-router");
if (router?.[1]?.origin !== "https://spartanhospicecoaching.com") throw new Error("Wrong Expo Router production origin");
const domains = config.ios?.associatedDomains || [];
const requestsAssociatedDomains = skipAssociatedDomains === "0";
if (requestsAssociatedDomains && !domains.includes("applinks:spartanhospicecoaching.com")) throw new Error("Associated Domains missing");
if (!requestsAssociatedDomains && domains.length) throw new Error("This profile must omit Associated Domains");
console.log(JSON.stringify({ bundleIdentifier: config.ios.bundleIdentifier, routerOrigin: router[1].origin, associatedDomains: domains }));
NODE

echo "[8/9] Verify production health and optional AASA"
echo "Checking production API health"
if ! HEALTH_JSON="$(curl --fail --silent --show-error --max-time 20 "$PRODUCTION_URL/api/health")"; then
  echo "FAIL: production API health is unavailable at $PRODUCTION_URL/api/health" >&2
  exit 1
fi
node -e 'const v=JSON.parse(process.argv[1]); if(v.status!=="ok") throw new Error("Production health is not ok")' "$HEALTH_JSON"

echo "Checking production AI readiness"
AI_READY=0
AI_HEALTH_JSON=""
for attempt in 1 2 3 4 5 6; do
  AI_HEALTH_JSON="$(curl --silent --show-error --max-time 20 "$PRODUCTION_URL/api/healthz/ai" || true)"
  if node -e 'const v=JSON.parse(process.argv[1]); if(v.ok!==true || v.status!=="ready") process.exit(1)' "$AI_HEALTH_JSON" 2>/dev/null; then
    AI_READY=1
    break
  fi
  if [[ "$attempt" -lt 6 ]]; then
    echo "AI is not ready yet (attempt $attempt/6); retrying in 10 seconds"
    sleep 10
  fi
done
if [[ "$AI_READY" -ne 1 ]]; then
  echo "FAIL: production AI is not verified at $PRODUCTION_URL/api/healthz/ai" >&2
  echo "Response: ${AI_HEALTH_JSON:-<empty>}" >&2
  echo "Republish the API and confirm the live provider probe passes before creating TestFlight." >&2
  exit 1
fi

echo "Checking production Apple billing health"
if ! APPLE_HEALTH_JSON="$(curl --fail --silent --show-error --max-time 20 "$PRODUCTION_URL/api/billing/apple/health")"; then
  echo "FAIL: Apple billing API is not deployed at $PRODUCTION_URL/api/billing/apple/health" >&2
  echo "Apply migration 0017 and deploy the API before creating the private QA build." >&2
  exit 1
fi
node -e 'const v=JSON.parse(process.argv[1]); if(v.status!=="ok"||v.configured!==true) throw new Error("Production Apple billing verification is not configured")' "$APPLE_HEALTH_JSON"
if [[ "$PROFILE_SKIP_ASSOCIATED_DOMAINS" == "0" ]]; then
  AASA_JSON="$(curl --fail --silent --show-error --max-time 20 "$PRODUCTION_URL/.well-known/apple-app-site-association")"
  node -e 'const v=JSON.parse(process.argv[1]); const ids=v.applinks?.details?.flatMap(x=>x.appIDs||[])||[]; if(!ids.includes("65C25YHCX9.com.spartancoaching.fieldkit")) throw new Error("Production AASA appID missing")' "$AASA_JSON"
fi

echo "[9/9] Verify EAS identity and production environment"
if [[ "${SKIP_EAS_REMOTE:-0}" != "1" ]]; then
  (cd "$MOBILE" && "${PNPM[@]}" dlx eas-cli@21.0.2 whoami)
  (cd "$MOBILE" && "${PNPM[@]}" dlx eas-cli@21.0.2 env:list --environment production)
else
  echo "Remote EAS checks skipped by SKIP_EAS_REMOTE=1"
fi

echo "PASS: $PROFILE is ready for the next EAS build gate."
