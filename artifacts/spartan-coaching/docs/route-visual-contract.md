# Spartan Coaching route visual contract

`src/lib/routeVisualContracts.ts` is the machine-readable matrix for the web
router. Each App route has one entry describing its family, anonymous and
authenticated shell surfaces, authentication expectation, themes, responsive
breakpoints, and loading/empty/error/ready states.

## Surface boundaries

- **public** uses the Spartan light presentation and marketing chrome.
- **auth** is the light sign-in/onboarding shell.
- **workspace** is authenticated product chrome and may honor the member's
  persisted appearance. Optional-auth product previews use the public surface
  while signed out and switch to the workspace surface after sign-in.
- **redirect** means a signed-out visitor is sent to sign-in with the requested
  return path before the product surface mounts.
- **print** is a light, document-oriented surface and is only used by printable
  assessment/result routes.

`App.tsx` remains the runtime routing source of truth. The contract test
extracts every explicit route (including the not-found route) and compares it
with the matrix, so route additions cannot silently skip visual review.

CSS treatments that are specific to a shell must be scoped beneath
`html[data-route-surface="public"]` or
`html[data-route-surface="workspace"]`. Literal high-visibility colors are
reserved for print rules and explicit brand/hero imagery allowlists; use
semantic theme tokens for normal UI.