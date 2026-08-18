# Spartan Coaching iOS redesign visual QA

## Evidence

- Source visual truth: `/workspace/scratch/b30826574356/visual-target/Spartan coaching field guide home.png`
- Source Library identity: `/Spartan coaching field guide home.png`
- Source pixels: `853 x 1844`
- Intended iOS viewport: modern 6.1 inch iPhone portrait, concept reference normalized by proportion rather than treated as a pixel exact device capture
- Implementation route: `artifacts/spartan-coaching-mobile/app/(tabs)/index.tsx`
- Implementation screenshot: unavailable
- Implementation CSS size and density: unavailable because no browser or simulator capture could be produced
- State: authenticated individual member with active access, light appearance, no saved commitment required for the reference state

## Verification completed

- The selected Field Guide composition is implemented as the authenticated Home decision surface.
- The exact distressed Spartan Coaching stamp is used as the brand identity.
- The helmet remains a compact action icon and is not used as the primary logo.
- Home, Coach, Tools, Library, and Account are the persistent authenticated tabs.
- The guided tour is a native four step route with fictional examples and a no PHI boundary.
- TypeScript project build passes.
- Mobile typecheck passes.
- Mobile tests pass: 24 suites and 105 tests.
- Expo web production export completes successfully.
- Repository diff integrity passes.

## Full view comparison evidence

Blocked. The source visual was opened and inspected at `853 x 1844`. The implementation could not be opened in the cloud browser because that browser cannot access the local Expo port. This Linux workspace also has no `xcrun` or iOS Simulator, so a native implementation screenshot could not be captured.

## Focused region comparison evidence

Blocked for the same reason. The intended focused checks are the distressed stamp crop, midnight header depth, Home title wrapping, red primary action, secondary row spacing, bottom tab labels, and the light and dark theme transitions.

## Findings

- [P1] Rendered fidelity is not yet proven
  - Location: authenticated Home, launch experience, guided tour, and tab bar.
  - Evidence: source target is available, but no implementation screenshot exists for a same viewport comparison.
  - Impact: typography wrapping, vertical rhythm, safe area behavior, asset scale, and bottom tab fit could still differ on a real iPhone even though type and bundle checks pass.
  - Fix: capture the authenticated Home and tour on the registered iPhone or an iOS Simulator in both light and dark appearances, then compare them with the source target in one combined image.

## Primary interactions tested

- Route contracts and button destinations are covered by automated tests.
- Guided tour progression is covered by source contract tests.
- Apple purchase and restore actions remain in Account and are covered by tests.
- Direct browser clicking could not be completed because the local preview was unreachable from the cloud browser.

## Console errors checked

- Expo production export completed without application compile errors.
- No browser console was available because the preview could not be opened in the cloud browser.
- Expo reported patch level compatibility recommendations for six dependencies. These are maintenance warnings and were not changed during the visual redesign.

## Comparison history

- Pass 1: source reference recovered and opened. Browser render blocked by local port isolation.
- Recovery: Expo local preview started successfully after assigning a writable Expo cache directory.
- Pass 2: cloud browser remained unable to reach the preview. iOS Simulator fallback was unavailable because the workspace is Linux and has no Apple simulator runtime.
- Result: no visual fixes were claimed from unobserved evidence.

## Implementation checklist

1. Pull the redesign branch into Replit.
2. Open the app on the registered iPhone using a development or internal preview build.
3. Capture authenticated Home, guided tour step one, Tools, Coach, Library, Account, and the launch screen in light appearance.
4. Repeat the same captures in dark appearance.
5. Compare Home and tour against the selected Field Guide visual at the same crop.
6. Correct any P0, P1, or P2 mismatch before creating the next TestFlight build.

## Final result

final result: blocked

Blocker: browser rendered and native simulator evidence are unavailable in this Linux workspace.
