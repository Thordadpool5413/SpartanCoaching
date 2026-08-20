# Home Design QA

## Source visual truth

`design/references/home-option-2-approved.png`

Source pixel dimensions: 853 by 1844.

Intended CSS viewport: 390 by 844.

Density normalization: the source aspect ratio matches the intended CSS viewport. A rendered implementation capture is still required before pixel normalization and comparison can be completed.

## Implementation evidence

Implementation route: `/?preview=approved-home` in development only.

Implementation screenshot path: unavailable.

State: signed in Home, light appearance, fictional preview member named Nick, no saved commitment, onboarding incomplete.

Browser capture attempt: Expo web was started on port 4173. The cloud browser could not reach `terminal.local:4173` and returned `ERR_CONNECTION_REFUSED`. The implementation therefore could not be opened or captured in the required browser surface.

Primary interactions tested in browser: blocked because the rendered route was unavailable.

Console errors checked: blocked because the rendered route was unavailable.

## Full view comparison evidence

The approved source was opened and inspected. No browser rendered implementation screenshot exists, so a valid combined comparison could not be produced. Code inspection and automated tests are not substitutes for visual evidence.

## Focused region comparison evidence

Blocked for the same reason. The required hero, logo, greeting, primary action, supporting rows, tour entry, and tab bar regions cannot be compared until the implementation is captured.

## Findings

### P1 Rendered fidelity remains unverified

Location: signed in Home screen.

Evidence: the approved source exists, but no rendered implementation screenshot could be captured.

Impact: typography, spacing, wrapping, asset crop, tab bar position, and real device behavior may still drift from the approved design.

Fix: capture the development preview at 390 by 844 or capture the same state on an iPhone, then place that capture beside the approved target and complete the visual correction loop.

## Automated verification completed

Mobile TypeScript compilation passed.

Focused Home, elite experience, and native product completeness tests passed with 12 tests across 3 suites.

Repository diff integrity passed.

## Comparison history

No valid visual comparison iteration has occurred because the implementation capture is blocked.

## Implementation checklist

1. Open the approved Home preview on a reachable rendering surface.
2. Capture the Home screen at the matching viewport and state.
3. Combine the source and implementation captures for direct comparison.
4. Correct all P0, P1, and P2 mismatches.
5. Repeat the capture and comparison until the final result passes.

final result: blocked
