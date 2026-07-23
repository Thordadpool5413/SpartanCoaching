#!/usr/bin/env bash
# capture-screenshots.sh
# Captures 5 App Store screenshots from the iPhone 16 Pro Max simulator.
#
# Prerequisites:
#   - Mac with Xcode 16+
#   - Expo dev server running in a separate terminal:
#       cd artifacts/spartan-coaching-mobile && pnpm run dev
#   - App open in the simulator (press 'i' in Expo CLI, or run:
#       pnpm exec expo run:ios --simulator "iPhone 16 Pro Max")
#
# Usage — run from the repo root:
#   bash artifacts/spartan-coaching-mobile/store/capture-screenshots.sh
#
# Or from inside artifacts/spartan-coaching-mobile/:
#   bash store/capture-screenshots.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/screenshots"
REQUIRED_W=1320
REQUIRED_H=2868
DEVICE_NAME="iPhone 16 Pro Max"

echo "=== Spartan Coaching Field Kit — Screenshot Capture ==="
echo "Output: $OUT_DIR"
echo

# --------------------------------------------------------------------------
# 1. Find a booted iPhone 16 Pro Max simulator
# --------------------------------------------------------------------------
# grep exits 1 when no lines match; wrapping it in { grep ... || true; } keeps
# the brace group's exit code at 0 so pipefail does not abort the script.
BOOTED_UDID=$(xcrun simctl list devices booted 2>/dev/null \
  | { grep "$DEVICE_NAME" || true; } \
  | head -1 \
  | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

if [[ -z "$BOOTED_UDID" ]]; then
  echo "No booted '$DEVICE_NAME' found. Attempting to boot one..."
  UDID=$(xcrun simctl list devices available 2>/dev/null \
    | { grep "$DEVICE_NAME" || true; } \
    | head -1 \
    | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

  if [[ -z "$UDID" ]]; then
    echo "ERROR: '$DEVICE_NAME' simulator not found."
    echo "Install it via Xcode → Settings → Platforms → iOS."
    exit 1
  fi

  echo "Booting $DEVICE_NAME ($UDID)..."
  xcrun simctl boot "$UDID"
  open -a Simulator
  echo "Waiting 10 s for simulator to finish booting..."
  sleep 10
  BOOTED_UDID="$UDID"
fi

echo "Using simulator: $DEVICE_NAME ($BOOTED_UDID)"
echo

# --------------------------------------------------------------------------
# 2. Helper: capture one screenshot and verify dimensions
# --------------------------------------------------------------------------
capture_screen() {
  local slot="$1"  # e.g. "01-checklist"
  local label="$2" # human-readable description
  local out="$OUT_DIR/${slot}.png"

  echo "-------------------------------------------------------"
  echo "Slot: $slot — $label"
  echo
  echo "Navigate to this screen in the simulator, then press ENTER to capture."
  echo "(Make sure content is fully loaded before pressing ENTER.)"
  read -r

  xcrun simctl io "$BOOTED_UDID" screenshot "$out"

  # Verify dimensions
  W=$(sips -g pixelWidth  "$out" 2>/dev/null | awk '/pixelWidth/{print $2}')
  H=$(sips -g pixelHeight "$out" 2>/dev/null | awk '/pixelHeight/{print $2}')

  if [[ "$W" == "$REQUIRED_W" && "$H" == "$REQUIRED_H" ]]; then
    echo "Saved: $out (${W}×${H}) ✓"
  else
    echo "WARNING: $out is ${W}×${H}, expected ${REQUIRED_W}×${REQUIRED_H}."
    echo "Make sure the simulator is set to iPhone 16 Pro Max (not scaled)."
    echo "You can resize manually in Preview → Tools → Adjust Size before uploading."
  fi
  echo
}

# --------------------------------------------------------------------------
# 3. Capture each screen in order
# --------------------------------------------------------------------------
echo "You will be prompted to navigate to each screen and press ENTER."
echo "Tip: log in with your test account before starting."
echo

capture_screen "01-checklist"       "Checklist / Home — show a sample day with 2-3 tasks checked"
capture_screen "02-scenario-coach"  "AI Scenario Coach — show an active coaching conversation with a response visible"
capture_screen "03-branch-calculator" "Branch Calculator — show the staffing table with sample ADC numbers filled in"
capture_screen "04-drills"          "Objection Handler — show a fully generated field-ready response"
capture_screen "05-login"           "Login screen — log out first so the portal login screen is visible"

# --------------------------------------------------------------------------
# 4. Final summary
# --------------------------------------------------------------------------
echo "======================================================="
echo "All 5 screenshots saved to: $OUT_DIR"
echo
echo "Dimension check:"
for f in "$OUT_DIR"/0{1,2,3,4,5}-*.png; do
  [[ -f "$f" ]] || continue
  W=$(sips -g pixelWidth  "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
  H=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
  STATUS="✓"
  [[ "$W" != "$REQUIRED_W" || "$H" != "$REQUIRED_H" ]] && STATUS="⚠ WRONG SIZE"
  printf "  %-35s %s×%s %s\n" "$(basename "$f")" "$W" "$H" "$STATUS"
done

echo
echo "Next: upload to App Store Connect."
echo "See store/README.md → 'How to upload to App Store Connect'."
