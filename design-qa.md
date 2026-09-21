# Core UI rebuild design QA

## Scope

- Web: Home shell, Command Center, Tools index and tool workspaces, Resources, Coach.
- iOS: Home, Command Center, Tools, Resources/Library, Coach, shared screen shell.
- References: the five user-provided desktop captures supplied with this task.

## Implemented checks

- Decorative brand mark is separated from content, hidden from assistive technology, and limited to 3.5% opacity.
- Every core view has a visible forward action; automated REQ-UX-001 contracts cover web and iOS.
- Resource titles and previews wrap, shrink, clamp, and remain scrollable without horizontal overflow.
- Web layouts collapse at 1024px and 480px; primary actions become full width on small screens.
- iOS tab and action targets use a 44pt minimum and explicit accessibility labels.
- Production build and performance budgets pass.

## Manual viewport matrix

| Surface | Size | Verify |
| --- | --- | --- |
| Web small | 390 x 844 | One-column panels, no resource overflow, full-width primary actions, backdrop remains decorative. |
| Web medium | 768 x 1024 | Two-column content where useful, readable cards, Command actions remain visible. |
| Web large | 1440 x 1000 | Balanced grid density, clear hierarchy, Coach next action above the fold. |
| iOS SE | 375 x 667 | Dynamic Type at 100% and 135%, 44pt targets, wrapping Resource cards, scrollable content. |
| iPhone 13 | 390 x 844 | Command sections, tab labels, Tool and Coach next actions, decorative backdrop. |

## Capture status

The Vite preview starts successfully on port 4173, but the required cloud-browser surface returns `ERR_CONNECTION_REFUSED` for `terminal.local:4173`. No local screenshot is being represented as browser verification.

Final result: blocked — cloud-browser capture is unavailable in this workspace. Automated accessibility, action, type, test, build, and performance gates pass; the viewport matrix above remains the required manual visual check.

---

# Homepage visual QA — Photo 1 fidelity

Reference: `generated_images/exec-26480ed7-e2ad-48fd-adf5-8340c26006b9.png`

Target route: `/`

## Fidelity checklist

- Hero message and media behavior preserved.
- Hero restored to the large two-column editorial composition.
- Video frame enlarged and given the broader Photo 1 aspect ratio.
- White editorial canvas restored across problem, audience, method, engagement, founder, results, and process sections.
- Full-width black audience band removed.
- Oversized Plus Jakarta display hierarchy and red accent words restored.
- Consulting content organized into thin-rule horizontal grids.
- Founder block restored to a large image-and-statement composition.
- Closing statement contained inside the page frame with a separate trust strip.
- Hospice Sales Pro remains confined to site navigation and its dedicated route.

## Responsive and interaction checks

- Desktop: multi-column editorial grids and large hero media.
- Tablet: hero remains split; four-column grids collapse to two columns.
- Mobile: all sections collapse to one readable column without horizontal overflow.
- Hero video retains autoplay, pause, retry, reduced-motion, poster, and source fallback behavior.
- CTA links retain their existing analytics events and destinations.

## Verification

- TypeScript: passed after workspace package build.
- Unit/contract tests: 324 passed.
- Production build: passed.
- Performance budget: passed.
- Static public-site audit: passed.
- Browser release gate: passed for desktop and mobile customer journeys.
- CI visual evidence: inspected at desktop and iPhone dimensions; the first pass exposed mobile hero overflow, which was corrected before merge.

## Severity review

- P0 blockers: none found.
- P1 visual/functional regressions: mobile hero overflow found in CI evidence and fixed.
- P2 polish items: none blocking release.

## 2026-09-20 recurrence correction

- Root cause: later Replit publication commits replaced the approved Photo 1 `Home.tsx` with the retired product-led homepage and removed the `field-intelligence.css` import that supplies the Photo 1 layout. A theme refactor also changed the homepage display font from Plus Jakarta Sans to Anton.
- Correction: restored the approved consulting-first homepage, its scoped visual-system import, and its Photo 1 typography on top of current `main`, preserving all newer iOS startup and shared-layout work. The public header identity and Calendly recovery behavior removed by the same overwrite were restored as well.
- Regression protection: added a dedicated Photo 1 release contract that fails if the retired two-path/product-led homepage returns, if consulting sections disappear, if the Photo 1 stylesheet or fonts are disconnected, or if mobile hero guardrails are removed.
- Verification: 63 web test files and 326 tests passed; TypeScript, production build, migrations, API tests, native iOS contracts, security scan, performance budgets, and release-gate suites passed.
- Visual verification: GitHub browser evidence from CI run #818 was inspected at desktop and iPhone dimensions. The hero scale, two-column desktop composition, mobile stack, consulting paths, founder treatment, results, and closing section match the approved Photo 1 direction with no horizontal overflow.

Final result: passed.

---

# Consulting conversion and iOS startup QA — 2026-09-21

## Reference defects

- Homepage screenshot: the display headline crossed into the video column and the video read as a small floating card.
- Contact screenshot: the generic three-column explanation was compressed inside a narrow form container, producing one- and two-word text columns.
- Consulting screenshot: twelve similarly weighted service cards created a long catalog with weak decision guidance.
- Header screenshot: navigation, utilities, and the primary CTA competed for one crowded desktop row.
- TestFlight report: the release build could terminate before the recoverable React interface appeared.

## Corrections verified

- Homepage hero uses a bounded 690px headline, a wider media column, and responsive single-column mobile rules; the original message and film are unchanged.
- Alternating paper-tone sections restore visible rhythm without introducing decorative containers or changing the approved editorial system.
- Contact briefing now uses a readable two-column desktop layout and a single-column mobile layout; the form stays constrained independently below it.
- Consulting now guides buyers from growth symptom to one of three engagement levels, with explicit fit, format, outcome, and included work.
- Desktop navigation begins at the `xl` breakpoint with tighter label spacing; narrower widths use the mobile menu before the row can collide.
- The iOS root no longer mounts `react-native-keyboard-controller`, configures splash animation synchronously, or imports notifications eagerly before the first frame.

## Verification evidence

- Web TypeScript: passed.
- Web unit and contract tests: 63 files and 326 tests passed.
- Web production build: passed.
- Mobile TypeScript: passed.
- Mobile Jest suite: 59 suites and 291 tests passed.
- Expo Doctor: 21 of 21 checks passed.
- iOS production bundle: 2,258 modules bundled; 4,867,044-byte output produced.
- Release gate: every automated critical suite passed; database-backed and live/device checks remain environment-dependent.
- Managed browser preview was unavailable because the monorepo preview sandbox could not resolve its hoisted Vite dependency and direct preview access was blocked. Responsive layout contracts and production rendering tests were used for this pass.

## Severity review

- P0 blockers: none in automated checks.
- P1 issues fixed: hero/media collision risk, unreadable contact explainer, crowded header, eager optional native startup modules.
- P2 issues fixed: page rhythm and consulting decision clarity.

Final result: passed.
