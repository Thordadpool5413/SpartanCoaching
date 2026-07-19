---
name: Mobile jest setup
description: Gotchas for running jest tests in the Expo mobile artifact under pnpm, Metro monorepo fix, and Expo Go phone connection fix
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
When a workspace lib (e.g. `@workspace/branch-engine`) uses package.json `exports` pointing to `.ts` source files and has `"type": "module"`, Metro fails to resolve sub-path imports without explicit config.

Fix: update `artifacts/spartan-coaching-mobile/metro.config.js` to:
- `watchFolders: [workspaceRoot]` — lets Metro watch the lib directory
- `resolver.nodeModulesPaths` — include both project and workspace root `node_modules`
- `resolver.unstable_enablePackageExports: true` — enables `exports` field resolution

**Why:** Metro's default config is single-package; it ignores the monorepo root and doesn't follow `exports` fields without the flag.

## Expo Go phone connection — multi-artifact setup (web + mobile at /mobile)

### Root cause of 404
In a multi-artifact project (web app at `/`, Expo at `/mobile`), Expo Go connects via the janeway URL. The URL hits the Replit shared proxy at port 80 with path `/`. The Replit proxy routes `/` to the web app (Vite). Vite's dev server returns **404** for requests with `Accept: application/expo+json` — it doesn't serve HTML to non-HTML clients.

`--tunnel` fails: ngrok throws `TypeError: Cannot read properties of undefined (reading 'body')` in this environment.

### The fix (3 parts)

**1. Register Expo service at `/` in artifact.toml**
```toml
[[services]]
name = "expo"
paths = [ "/", "/mobile" ]   # was just ["/mobile"]
localPort = 8081
```
Replit's proxy does content-type-based routing: requests with `Accept: application/expo+json` at `/` now route to Metro; normal HTML requests still go to the web app.

**2. Set REACT_NATIVE_PACKAGER_HOSTNAME in mobile dev script (package.json)**
```
REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN pnpm exec expo start --lan --port $PORT
```
Makes Metro embed `<janeway-dev-domain>:8081` in `launchAsset.url` of the manifest. Expo Go can reach this URL because Replit routes `<dev-domain>:8081` directly to Metro.

**3. Expo proxy middleware in web app vite.config.ts**
A `configureServer` Vite plugin proxies Metro-specific requests from the web app's port to Metro (8081):
- Requests with `Accept: application/expo+json` or `multipart/mixed`
- URLs with `.bundle?platform=`, `/_expo/`, or Metro asset patterns
Ensures bundle/asset requests that reach the web app are forwarded to Metro.

### Verification (curl tests from within the server)
```
GET / (normal)              → 200 web app HTML ✓
GET / (expo accept headers) → 200 Metro manifest JSON ✓
GET /_expo/manifest         → 200 ✓
```

### User scanning instruction
Scan QR from the **Replit URL bar** (mobile artifact selected in preview dropdown), not from the Expo console. The Expo console shows `exp://172.24.0.2:8081` (LAN IP, not reachable from a phone).
