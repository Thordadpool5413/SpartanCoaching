#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-testflight}"
if [[ "$PROFILE" != "preview" && "$PROFILE" != "testflight" && "$PROFILE" != "testflight-applinks" && "$PROFILE" != "production" && "$PROFILE" != "production-applinks" ]]; then
  echo "Usage: bash scripts/verify-testflight.sh [preview|testflight|testflight-applinks|production|production-applinks]" >&2
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
  src/routes/associatedDomainsContract.test.ts \
  src/clinical/deidentification.test.ts \
  src/ai/uncertaintyBoundaries.test.ts

echo "[5/9] Run the complete mobile test suite"
"${PNPM[@]}" --filter @workspace/spartan-coaching-mobile exec jest --runInBand

echo "[6/9] Check shell and diff integrity"
bash -n scripts/verify-testflight.sh "$MOBILE/scripts/start-dev.sh"
git diff --check

echo "[7/9] Resolve the exact Expo public configuration"
if [[ "$PROFILE" == *"-applinks" ]]; then
  export EAS_SKIP_ASSOCIATED_DOMAINS=0
else
  export EAS_SKIP_ASSOCIATED_DOMAINS=1
fi
export EXPO_PUBLIC_API_URL="$PRODUCTION_URL"
export EXPO_PUBLIC_DOMAIN="spartanhospicecoaching.com"
CONFIG_JSON="$(mktemp)"
(cd "$MOBILE" && "${PNPM[@]}" exec expo config --type public --json) > "$CONFIG_JSON"
node - "$CONFIG_JSON" "$PROFILE" <<'NODE'
const fs = require("node:fs");
const [file, profile] = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(file, "utf8"));
if (config.ios?.bundleIdentifier !== "com.spartancoaching.fieldkit") throw new Error("Wrong iOS bundle identifier");
const router = config.plugins?.find((item) => Array.isArray(item) && item[0] === "expo-router");
if (router?.[1]?.origin !== "https://spartanhospicecoaching.com") throw new Error("Wrong Expo Router production origin");
const domains = config.ios?.associatedDomains || [];
if (profile.endsWith("-applinks") && !domains.includes("applinks:spartanhospicecoaching.com")) throw new Error("Associated Domains missing");
if (!profile.endsWith("-applinks") && domains.length) throw new Error("This profile must omit Associated Domains");
console.log(JSON.stringify({ bundleIdentifier: config.ios.bundleIdentifier, routerOrigin: router[1].origin, associatedDomains: domains }));
NODE

echo "[8/9] Verify production health and optional AASA"
HEALTH_JSON="$(curl --fail --silent --show-error --max-time 20 "$PRODUCTION_URL/api/health")"
node -e 'const v=JSON.parse(process.argv[1]); if(v.status!=="ok") throw new Error("Production health is not ok")' "$HEALTH_JSON"
APPLE_HEALTH_JSON="$(curl --fail --silent --show-error --max-time 20 "$PRODUCTION_URL/api/billing/apple/health")"
node -e 'const v=JSON.parse(process.argv[1]); if(v.status!=="ok"||v.configured!==true) throw new Error("Production Apple billing verification is not configured")' "$APPLE_HEALTH_JSON"
if [[ "$PROFILE" == *"-applinks" ]]; then
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
