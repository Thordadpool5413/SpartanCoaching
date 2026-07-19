---
name: Mobile jest setup
description: Gotchas for running jest tests in the Expo mobile artifact under pnpm
---

## jest-expo needs jest 29
jest-expo ~54 breaks with jest 30 (`this._moduleMocker.clearMocksOnScope is not a function`). Pin `jest@~29.7.0` in the mobile artifact.

## transformIgnorePatterns must handle pnpm's .pnpm layout
Paths look like `node_modules/.pnpm/expo-modules-core@X_.../node_modules/...`, so the standard Expo pattern never matches. Use an optional `(\.pnpm/)?` prefix and allow `@|/|$` after each package name; also allowlist `expo-.*` (expo-modules-core etc.), `react-native-.*`, and `+`-encoded scoped names. See `artifacts/spartan-coaching-mobile/jest.config.js`.

## @testing-library/react-native version
v14 fails to resolve a `test-renderer` module under this setup; use `~13.3.3` with `react-test-renderer@19` matching the React version.

## Expo typed routes are stale until the dev server runs
Adding a new `app/*.tsx` route fails typecheck (`router.push("/new")` not in Href union) because `.expo/types/router.d.ts` only regenerates on `expo start`. Safe to hand-edit that file to add the route; the next dev-server run regenerates it identically.

## Metro monorepo fix (workspace package exports)
When a workspace lib (e.g. `@workspace/branch-engine`) uses package.json `exports` pointing to `.ts` source files and has `"type": "module"`, Metro fails to resolve sub-path imports (e.g. `@workspace/branch-engine/engine`) without explicit config.

Fix: update `artifacts/spartan-coaching-mobile/metro.config.js` to:
- `watchFolders: [workspaceRoot]` — lets Metro watch the lib directory
- `resolver.nodeModulesPaths` — include both project and workspace root `node_modules`
- `resolver.unstable_enablePackageExports: true` — enables `exports` field resolution

**Why:** Metro's default config is single-package; it ignores the monorepo root and doesn't follow `exports` fields without the flag. Any new workspace lib imported by the mobile app will need this config in place.
