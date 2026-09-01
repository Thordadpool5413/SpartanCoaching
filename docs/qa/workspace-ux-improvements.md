# Workspace UX improvements manual QA

The feature is off by default. Enable it locally with:

- Web: `VITE_UX_WORKSPACE_IMPROVEMENTS=true`
- Expo: `EXPO_PUBLIC_UX_WORKSPACE_IMPROVEMENTS=true`

## Web

- At 320px, 480px, 768px, 1024px, and 1440px, confirm Home, Command, Tools, and Resources have no horizontal scrolling or clipped controls.
- On Home, dismiss the guide and confirm each of its three links opens the named destination.
- On Command, verify the how-it-works example appears and the existing Tools, Coach, and My Work actions remain keyboard reachable.
- On Tools, search by a job phrase, open a result, and confirm the page still provides a related Resource or Coach action.
- On Resources, test loading, error, empty, filtered-empty, and populated states. Each must offer retry, clear filters, Tools, My Work, or support.
- Open a long resource description. Verify Show more/Show less works by mouse and keyboard and preserves text wrapping.
- Tab through each page. Confirm a visible focus ring, sensible heading order, and no keyboard trap.

## iOS

- Test iPhone SE and iPhone 13 sizes with default and one larger Dynamic Type setting.
- On Home, dismiss the guide and open Tools, Command, and Resources.
- In Command, confirm the how-it-works card wraps and the primary next action is visible without overlap.
- In Library > Use, simulate error and empty responses. Confirm Retry or Open Tools is available.
- Confirm every new press target is at least 44x44 points and VoiceOver reads a useful label.

## Regression

- Disable both environment variables and confirm the existing UI renders unchanged.
- Confirm authentication, data fetching, AI execution, persistence, routes, and backend requests are unchanged.
