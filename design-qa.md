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
