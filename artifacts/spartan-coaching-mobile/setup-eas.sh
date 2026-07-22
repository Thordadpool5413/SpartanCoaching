#!/usr/bin/env bash
# setup-eas.sh — One-time EAS + App Store configuration for Spartan Field Kit
# Run from artifacts/spartan-coaching-mobile/ after getting an Expo account
# and Apple Developer Program membership.
#
# Usage:
#   chmod +x setup-eas.sh
#   ./setup-eas.sh
#
# What this does:
#   1. Logs you in to Expo and links an EAS project
#   2. Collects Apple Developer credentials
#   3. Prints the Replit Secrets you must set so builds/submits work
#   4. Handles APNs key via `eas credentials`

set -e

BOLD="\033[1m"
RESET="\033[0m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"

echo ""
echo -e "${BOLD}Spartan Field Kit — EAS Setup${RESET}"
echo "---------------------------------------"
echo "This script collects your Expo and Apple Developer credentials"
echo "and tells you which Replit Secrets to set so builds work."
echo ""

# ── Step 1: EAS login + init ──────────────────────────────────────────────────
echo -e "${BOLD}Step 1: Log in to Expo and initialize EAS project${RESET}"
pnpm exec eas login

echo ""
echo "Linking EAS project (creates one if it doesn't exist)..."
pnpm exec eas init --non-interactive 2>/dev/null || pnpm exec eas init

PROJECT_ID=$(pnpm exec eas project:info --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || true)

if [ -z "$PROJECT_ID" ]; then
  echo ""
  echo -e "${YELLOW}Could not auto-detect project ID.${RESET}"
  read -rp "Paste your EAS Project ID (from expo.dev/projects): " PROJECT_ID
fi

EXPO_SLUG=$(pnpm exec eas whoami 2>/dev/null | tr -d '[:space:]' || true)
if [ -z "$EXPO_SLUG" ]; then
  read -rp "Your Expo account username/slug (shown at expo.dev/accounts): " EXPO_SLUG
fi

# ── Step 2: Apple Developer identifiers ───────────────────────────────────────
echo ""
echo -e "${BOLD}Step 2: Apple Developer credentials${RESET}"
echo "Find these at developer.apple.com → Certificates, Identifiers & Profiles"
echo ""
read -rp "Apple ID email (e.g. nick@spartanhospicecoaching.com): " APPLE_ID_VAL
read -rp "Apple Team ID (10-char, e.g. A1B2C3D4E5): " APPLE_TEAM_ID_VAL
echo ""
echo "App Store Connect App ID: open App Store Connect → My Apps → your app → numeric ID in the URL"
read -rp "App Store Connect App ID (numeric, e.g. 6478123456): " ASC_APP_ID_VAL

# ── Step 3: Print Replit Secrets to set ───────────────────────────────────────
echo ""
echo -e "${BOLD}Step 3: Set these values as Replit Secrets${RESET}"
echo -e "Open ${CYAN}Tools → Secrets${RESET} in Replit and add the following:"
echo ""
echo -e "  ${GREEN}EAS_PROJECT_ID${RESET}       = ${PROJECT_ID}"
echo -e "  ${GREEN}EXPO_ACCOUNT_SLUG${RESET}    = ${EXPO_SLUG}"
echo -e "  ${GREEN}APPLE_ID${RESET}             = ${APPLE_ID_VAL}"
echo -e "  ${GREEN}APPLE_TEAM_ID${RESET}        = ${APPLE_TEAM_ID_VAL}"
echo -e "  ${GREEN}ASC_APP_ID${RESET}           = ${ASC_APP_ID_VAL}"
echo ""
echo -e "${YELLOW}Do not put these in .env files or commit them — Replit Secrets are encrypted.${RESET}"

# ── Step 4: APNs key (push notifications) ─────────────────────────────────────
echo ""
echo -e "${BOLD}Step 4: Apple Push Notification key${RESET}"
echo "EAS can manage your APNs key automatically."
read -rp "Set up APNs credentials now? [y/N] " SETUP_APNS
if [[ "$SETUP_APNS" =~ ^[Yy]$ ]]; then
  pnpm exec eas credentials --platform ios
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Setup complete!${RESET}"
echo ""
echo "After setting the Replit Secrets above, you can build and submit:"
echo ""
echo "  pnpm run build:ios:preview    — TestFlight internal build"
echo "  pnpm run build:ios            — production App Store build"
echo "  pnpm run submit:ios           — submit latest build to App Store"
echo ""
echo "See store/README.md for App Store Connect metadata and screenshot guidance."
