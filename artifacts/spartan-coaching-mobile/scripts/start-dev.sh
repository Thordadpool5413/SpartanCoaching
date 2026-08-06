#!/usr/bin/env bash
# Replit-safe Expo/Metro start — avoids watching pnpm ephemeral dirs under .local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-1}"
export CHOKIDAR_INTERVAL="${CHOKIDAR_INTERVAL:-2000}"
export EXPO_NO_METRO_LAZY="${EXPO_NO_METRO_LAZY:-1}"
# Prevent Metro/watchman from treating the monorepo root as a crawl root when possible
export WATCHMAN_DISABLE="${WATCHMAN_DISABLE:-true}"

# Ensure API host for Replit web preview / Expo Go
if [[ -n "${REPLIT_DEV_DOMAIN:-}" ]]; then
  export EXPO_PUBLIC_DOMAIN="${EXPO_PUBLIC_DOMAIN:-$REPLIT_DEV_DOMAIN}"
  export REACT_NATIVE_PACKAGER_HOSTNAME="${REACT_NATIVE_PACKAGER_HOSTNAME:-$REPLIT_DEV_DOMAIN}"
fi
if [[ -n "${REPL_ID:-}" ]]; then
  export EXPO_PUBLIC_REPL_ID="${EXPO_PUBLIC_REPL_ID:-$REPL_ID}"
fi

PORT="${PORT:-8081}"

echo "[mobile-dev] project=$ROOT"
echo "[mobile-dev] EXPO_PUBLIC_DOMAIN=${EXPO_PUBLIC_DOMAIN:-unset}"
echo "[mobile-dev] metro watchFolders (from config):"
node -e "const c=require('./metro.config.js'); console.log((c.watchFolders||[]).join('\n')||'(none)')"

# Drop stale Metro cache that may still list deleted pnpm _tmp_ paths
rm -rf "$ROOT/.metro-cache" \
  "$ROOT/node_modules/.cache/metro" \
  /tmp/metro-* 2>/dev/null || true

exec pnpm exec expo start --lan --port "$PORT" --clear
