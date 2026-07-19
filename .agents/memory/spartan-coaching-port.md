---
name: Spartan Coaching port
description: Key decisions and gotchas from porting the Spartan Coaching app into the pnpm monorepo
---

## Express 5 wildcard routes
Legacy routes used `/:param(*)` syntax — Express 5 (path-to-regexp v8) rejects this. Must use `/{*param}` instead. Found in `/objects/{*objectPath}` route.

**Why:** Express 5 upgraded path-to-regexp to v8 which is strict about wildcard syntax.

**How to apply:** Any time a legacy route is copied, grep for `(\*)` and replace with `{*param}`.

## Shared schema in frontend
Frontend imports types from `@shared/schema` — these are Drizzle `$inferSelect` types. Solution: copy the shared files to `src/shared/`, add a `@shared` vite alias, and install `drizzle-orm` + `drizzle-zod` as devDeps in the frontend artifact.

**Why:** Can't import from `@workspace/db` in the frontend — it triggers DB connection code at import time.

## react-icons v5 removed SiLinkedin
react-icons v5 dropped `SiLinkedin` from `react-icons/si`. Replaced with `Linkedin` from `lucide-react`.

## Tailwind v3 in monorepo
The frontend uses Tailwind v3 (from the original app). The scaffold defaults to Tailwind v4 (`@tailwindcss/vite`). The copy script installs tailwindcss@3, postcss, autoprefixer and removes `@tailwindcss/vite`. Must update vite.config.ts to use `css.postcss.plugins` instead of the vite plugin.

## shared/schema.ts models/chat import
The copied `lib/db/src/schema/schema.ts` had `export * from "./models/chat"` but `chat.ts` was copied to `lib/db/src/schema/chat.ts` (not into a models/ subdirectory). This broke drizzle-kit push. Fixed by removing that re-export line from schema.ts (the index.ts already exports chat.ts directly).

## decimal.js missing
`branchProfitabilityEngine.ts` imports `decimal.js` — must install it as a devDep in the frontend artifact.

## Expo Go must use tunnel mode
The Replit expo dev domain / shared path-proxy returns empty 404 for Expo-Go-flavored requests for this hand-ported mobile artifact, regardless of port or artifact.toml config. Fix: dev script runs `expo start --tunnel` (@expo/ngrok devDep); phone connects via the exp.direct URL/QR in the workflow console.

**Why:** The artifact was ported by hand, and platform routing never registers an Expo route for it; Metro on 8081 (mockup-sandbox moved to 8082) didn't help.

**How to apply:** Don't revert the dev script to `--localhost + EXPO_PACKAGER_PROXY_URL`. The tunnel URL rotates on restart — user must re-scan the QR from the expo workflow output after each restart.
