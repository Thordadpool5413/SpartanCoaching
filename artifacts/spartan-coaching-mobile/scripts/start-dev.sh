#!/usr/bin/env bash
# Replit-safe Expo/Metro start.
# - On Replit: ALWAYS use tunnel (phone is not on Replit's LAN).
# - Locally: LAN by default; set EXPO_CONNECTION=tunnel to force tunnel.
# TestFlight does NOT use this script — use EAS: pnpm run build:ios:testflight
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-1}"
export CHOKIDAR_INTERVAL="${CHOKIDAR_INTERVAL:-2000}"
export EXPO_NO_METRO_LAZY="${EXPO_NO_METRO_LAZY:-1}"
export WATCHMAN_DISABLE="${WATCHMAN_DISABLE:-true}"

# Replit cloud indicators
ON_REPLIT=0
if [[ -n "${REPL_ID:-}" || -n "${REPLIT_DEV_DOMAIN:-}" || -n "${REPLIT_DOMAINS:-}" ]]; then
  ON_REPLIT=1
fi

# API host for the app (where /api/* lives). Prefer explicit secrets; else Replit domain.
if [[ -z "${EXPO_PUBLIC_API_URL:-}" && -z "${EXPO_PUBLIC_DOMAIN:-}" ]]; then
  if [[ -n "${REPLIT_DEV_DOMAIN:-}" ]]; then
    export EXPO_PUBLIC_DOMAIN="$REPLIT_DEV_DOMAIN"
    export EXPO_PUBLIC_API_URL="https://${REPLIT_DEV_DOMAIN}"
  elif [[ -n "${SITE_URL:-}" ]]; then
    export EXPO_PUBLIC_API_URL="${SITE_URL%/}"
  else
    # Safe default for device testing against production backend
    export EXPO_PUBLIC_API_URL="https://spartanhospicecoaching.com"
    export EXPO_PUBLIC_DOMAIN="spartanhospicecoaching.com"
  fi
fi

if [[ -n "${REPL_ID:-}" ]]; then
  export EXPO_PUBLIC_REPL_ID="${EXPO_PUBLIC_REPL_ID:-$REPL_ID}"
fi

PORT="${PORT:-8081}"

# Connection mode: Replit cannot use LAN to a phone. Force tunnel there.
CONNECTION_MODE="${EXPO_CONNECTION:-}"
if [[ -z "$CONNECTION_MODE" ]]; then
  if [[ "$ON_REPLIT" -eq 1 ]]; then
    CONNECTION_MODE="tunnel"
  else
    CONNECTION_MODE="lan"
  fi
fi

# Expo tunnel owns its public URL. A Replit hostname here can corrupt Metro URLs.
if [[ "$CONNECTION_MODE" == "lan" && -n "${REPLIT_DEV_DOMAIN:-}" ]]; then
  export REACT_NATIVE_PACKAGER_HOSTNAME="${REACT_NATIVE_PACKAGER_HOSTNAME:-$REPLIT_DEV_DOMAIN}"
else
  unset REACT_NATIVE_PACKAGER_HOSTNAME
fi

echo "[mobile-dev] project=$ROOT"
echo "[mobile-dev] on_replit=$ON_REPLIT connection=$CONNECTION_MODE port=$PORT"
echo "[mobile-dev] EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL:-unset}"
echo "[mobile-dev] EXPO_PUBLIC_DOMAIN=${EXPO_PUBLIC_DOMAIN:-unset}"
echo "[mobile-dev] metro watchFolders:"
node -e "const c=require('./metro.config.js'); console.log((c.watchFolders||[]).join('\n')||'(none)')" || true

# Drop stale Metro cache that may still list deleted pnpm _tmp_ paths
rm -rf "$ROOT/.metro-cache" \
  "$ROOT/node_modules/.cache/metro" \
  /tmp/metro-* 2>/dev/null || true

EXTRA_ARGS=()
case "$CONNECTION_MODE" in
  tunnel)
    EXTRA_ARGS+=(--tunnel)
    echo "[mobile-dev] Using Expo tunnel (required on Replit — phone is not on the same LAN)."
    echo "[mobile-dev] Wait for a exp://… URL or QR code, then open in Expo Go."
    echo "[mobile-dev] Note: TestFlight builds do NOT need this server — use EAS instead."
    ;;
  lan)
    EXTRA_ARGS+=(--lan)
    echo "[mobile-dev] Using LAN. Phone must be on the same Wi‑Fi as this machine."
    ;;
  localhost)
    EXTRA_ARGS+=(--localhost)
    ;;
  *)
    echo "[mobile-dev] Unknown EXPO_CONNECTION=$CONNECTION_MODE (use tunnel|lan|localhost)" >&2
    exit 1
    ;;
esac

exec pnpm exec expo start "${EXTRA_ARGS[@]}" --port "$PORT" --clear
