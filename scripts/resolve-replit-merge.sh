#!/usr/bin/env bash
# Resolve a stuck Replit merge (e.g. subrepl-* vs origin/main on AiTool.tsx).
# Prefer GitHub origin/main as the source of truth for product code.
#
# Usage (Replit Shell):
#   bash scripts/resolve-replit-merge.sh
#   # or finish merge keeping main's AiTool.tsx only:
#   bash scripts/resolve-replit-merge.sh --keep-ours

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP_OURS=0
if [[ "${1:-}" == "--keep-ours" ]]; then
  KEEP_OURS=1
fi

echo "== Git status =="
git status -sb || true

if [[ -f .git/MERGE_HEAD ]]; then
  echo "Merge in progress (MERGE_HEAD present)."
  if [[ "$KEEP_OURS" -eq 1 ]]; then
    if [[ -f artifacts/spartan-coaching/src/pages/AiTool.tsx ]]; then
      # Current branch (usually main) wins for AiTool.tsx
      git checkout --ours -- artifacts/spartan-coaching/src/pages/AiTool.tsx || true
      # Strip any leftover conflict markers just in case
      # Real markers: <<<<<<< / >>>>>>> / ======= (exactly 7 equals on its own line)
      if grep -qE '^(<<<<<<<|>>>>>>>|=======)$' artifacts/spartan-coaching/src/pages/AiTool.tsx 2>/dev/null \
        || grep -qE '^(<<<<<<< |>>>>>>> )' artifacts/spartan-coaching/src/pages/AiTool.tsx 2>/dev/null; then
        echo "Conflict markers still present — falling back to origin/main version."
        git show origin/main:artifacts/spartan-coaching/src/pages/AiTool.tsx \
          > artifacts/spartan-coaching/src/pages/AiTool.tsx
      fi
      git add -- artifacts/spartan-coaching/src/pages/AiTool.tsx
    fi
    # If other conflicted paths exist, take ours for all
    if git diff --name-only --diff-filter=U 2>/dev/null | grep -q .; then
      git diff --name-only --diff-filter=U | while read -r f; do
        git checkout --ours -- "$f" || true
        git add -- "$f" || true
      done
    fi
    if git diff --cached --quiet 2>/dev/null && ! git diff --name-only --diff-filter=U | grep -q .; then
      echo "Nothing staged; aborting merge instead."
      git merge --abort
    else
      git commit -m "resolve(merge): keep origin/main product code (AiTool.tsx)" || git merge --abort
    fi
  else
    echo "Aborting merge and resetting to origin/main..."
    git merge --abort || true
  fi
fi

# Also clear a stuck rebase if present
if [[ -d .git/rebase-merge || -d .git/rebase-apply ]]; then
  git rebase --abort || true
fi

echo "Fetching origin..."
git fetch origin --prune

echo "Checking out main and hard-resetting to origin/main..."
git checkout main 2>/dev/null || git checkout -B main origin/main
git reset --hard origin/main
git clean -fd

# Real git conflict markers only (not decorative ===== comment banners in routes.ts).
# Matches: "<<<<<<< anything", ">>>>>>> anything", or a line that is exactly "======="
if git grep -nE '^(<<<<<<<|>>>>>>>|=======)$' -- \
  ':(glob)artifacts/**/*.{ts,tsx}' ':(glob)lib/**/*.{ts,tsx}' 2>/dev/null \
  | head -20; then
  # Also check markers with a label after the chevrons (<<<<<<< HEAD)
  if git grep -nE '^(<<<<<<< |>>>>>>> )' -- \
    ':(glob)artifacts/**/*.{ts,tsx}' ':(glob)lib/**/*.{ts,tsx}' 2>/dev/null \
    | head -20; then
    echo "WARNING: real conflict markers still found after reset — investigate."
    exit 1
  fi
fi

if git grep -nE '^(<<<<<<< |>>>>>>> )' -- \
  ':(glob)artifacts/**/*.{ts,tsx}' ':(glob)lib/**/*.{ts,tsx}' 2>/dev/null \
  | head -5; then
  echo "WARNING: real conflict markers still found after reset — investigate."
  exit 1
fi

echo "OK: clean tree at $(git rev-parse --short HEAD) ($(git log -1 --format=%s))"
echo "(Decorative ===== comment lines in source are NOT merge conflicts.)"
git status -sb
