#!/usr/bin/env bash
# capture-screenshots.sh
# Captures 5 App Store screenshots from the iPhone 16 Pro Max simulator (6.9")
# and optionally a second set from the iPhone 15 Plus simulator (6.7").
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
#   # 6.9" only (default):
#   bash artifacts/spartan-coaching-mobile/store/capture-screenshots.sh
#
#   # Both 6.9" and 6.7":
#   CAPTURE_67=1 bash artifacts/spartan-coaching-mobile/store/capture-screenshots.sh
#
# Or from inside artifacts/spartan-coaching-mobile/:
#   bash store/capture-screenshots.sh
#   CAPTURE_67=1 bash store/capture-screenshots.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --------------------------------------------------------------------------
# Helper: boot (or find) a named simulator; prints its UDID
# --------------------------------------------------------------------------
find_or_boot_simulator() {
  local device_name="$1"

  local booted_udid
  booted_udid=$(xcrun simctl list devices booted 2>/dev/null \
    | { grep "$device_name" || true; } \
    | head -1 \
    | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

  if [[ -z "$booted_udid" ]]; then
    echo "No booted '$device_name' found. Attempting to boot one..." >&2
    local udid
    udid=$(xcrun simctl list devices available 2>/dev/null \
      | { grep "$device_name" || true; } \
      | head -1 \
      | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

    if [[ -z "$udid" ]]; then
      echo "ERROR: '$device_name' simulator not found." >&2
      echo "Install it via Xcode → Settings → Platforms → iOS." >&2
      return 1
    fi

    echo "Booting $device_name ($udid)..." >&2
    xcrun simctl boot "$udid"
    open -a Simulator
    echo "Waiting 10 s for simulator to finish booting..." >&2
    sleep 10
    booted_udid="$udid"
  fi

  echo "$booted_udid"
}

# --------------------------------------------------------------------------
# Helper: capture one screenshot and verify dimensions
# --------------------------------------------------------------------------
capture_screen() {
  local udid="$1"
  local out_dir="$2"
  local required_w="$3"
  local required_h="$4"
  local slot="$5"   # e.g. "01-checklist"
  local label="$6"  # human-readable description
  local out="$out_dir/${slot}.png"

  echo "-------------------------------------------------------"
  echo "Slot: $slot — $label"
  echo
  echo "Navigate to this screen in the simulator, then press ENTER to capture."
  echo "(Make sure content is fully loaded before pressing ENTER.)"
  read -r

  xcrun simctl io "$udid" screenshot "$out"

  # Verify dimensions
  local W H
  W=$(sips -g pixelWidth  "$out" 2>/dev/null | awk '/pixelWidth/{print $2}')
  H=$(sips -g pixelHeight "$out" 2>/dev/null | awk '/pixelHeight/{print $2}')

  if [[ "$W" == "$required_w" && "$H" == "$required_h" ]]; then
    echo "Saved: $out (${W}×${H}) ✓"
  else
    echo "WARNING: $out is ${W}×${H}, expected ${required_w}×${required_h}."
    echo "Make sure the simulator device size is correct (not scaled)."
    echo "You can resize manually in Preview → Tools → Adjust Size before uploading."
  fi
  echo
}

# --------------------------------------------------------------------------
# Helper: run a full 5-screen pass for a given simulator + output dir
# --------------------------------------------------------------------------
run_pass() {
  local device_name="$1"
  local out_dir="$2"
  local required_w="$3"
  local required_h="$4"

  echo
  echo "======================================================="
  echo "Pass: $device_name (${required_w}×${required_h})"
  echo "Output: $out_dir"
  echo "======================================================="

  mkdir -p "$out_dir"

  local udid
  udid=$(find_or_boot_simulator "$device_name")
  echo "Using simulator: $device_name ($udid)"
  echo

  echo "You will be prompted to navigate to each screen and press ENTER."
  echo "Tip: log in with your test account before starting."
  echo

  capture_screen "$udid" "$out_dir" "$required_w" "$required_h" \
    "01-checklist"        "Checklist / Home — show a sample day with 2-3 tasks checked"
  capture_screen "$udid" "$out_dir" "$required_w" "$required_h" \
    "02-scenario-coach"   "AI Scenario Coach — show an active coaching conversation with a response visible"
  capture_screen "$udid" "$out_dir" "$required_w" "$required_h" \
    "03-branch-calculator" "Branch Calculator — show the staffing table with sample ADC numbers filled in"
  capture_screen "$udid" "$out_dir" "$required_w" "$required_h" \
    "04-drills"           "Objection Handler — show a fully generated field-ready response"
  capture_screen "$udid" "$out_dir" "$required_w" "$required_h" \
    "05-login"            "Login screen — log out first so the portal login screen is visible"

  echo "-------------------------------------------------------"
  echo "All 5 screenshots saved to: $out_dir"
  echo
  echo "Dimension check:"
  for f in "$out_dir"/0{1,2,3,4,5}-*.png; do
    [[ -f "$f" ]] || continue
    local W H STATUS
    W=$(sips -g pixelWidth  "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
    H=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
    STATUS="✓"
    [[ "$W" != "$required_w" || "$H" != "$required_h" ]] && STATUS="⚠ WRONG SIZE"
    printf "  %-35s %s×%s %s\n" "$(basename "$f")" "$W" "$H" "$STATUS"
  done
  echo
}

# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
echo "=== Spartan Coaching Hospice Sales Pro — Screenshot Capture ==="

# --- Pass 1: 6.9" iPhone 16 Pro Max → store/screenshots/ ---
run_pass "iPhone 16 Pro Max" "$SCRIPT_DIR/screenshots" 1320 2868

# --- Pass 2 (optional): 6.7" iPhone 15 Plus → store/screenshots/6.7/ ---
if [[ "${CAPTURE_67:-0}" == "1" ]]; then
  echo
  echo "CAPTURE_67=1 detected — starting 6.7\" pass."
  echo "Switch the Simulator to iPhone 15 Plus now, then press ENTER to continue."
  read -r
  run_pass "iPhone 15 Plus" "$SCRIPT_DIR/screenshots/6.7" 1290 2796
else
  echo
  echo "Tip: to also capture 6.7\" screenshots (iPhone 15 Plus), re-run with:"
  echo "  CAPTURE_67=1 bash store/capture-screenshots.sh"
fi

echo
echo "Next: upload to App Store Connect."
echo "See store/README.md → 'How to upload to App Store Connect'."
