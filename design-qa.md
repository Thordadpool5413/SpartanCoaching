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
- Condensed oversized display hierarchy and red accent words restored.
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
- Browser console and CI visual artifact: pending pull-request CI because the managed local preview could not access this monorepo's workspace dependencies.

## Severity review

- P0 blockers: none found.
- P1 visual/functional regressions: none found in source, tests, or production build.
- P2 polish items: final CI screenshot comparison pending.
