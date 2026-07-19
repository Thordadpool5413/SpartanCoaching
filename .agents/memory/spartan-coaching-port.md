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

## Zod v3/v4 dual API with drizzle-zod
drizzle-zod 0.8 returns zod v4 schema objects; files that pair `createInsertSchema` with `z.infer` must import `z` from "zod/v4", not "zod" (zod 3.25.x ships both APIs).

**How to apply:** Any new schema file using drizzle-zod should `import { z } from "zod/v4"`.

## Dynamic imports in api-server routes
`src/routes/routes.ts` dynamic-imports must use `../resend`, `../openai` (files live in src/, not src/routes/). Wrong relative paths typecheck-fail AND crash at runtime when the endpoint is hit.

## Branch engine lives in a shared lib
The branch profitability engine (engine, presets, content claim registry) now lives in `lib/branch-engine` (`@workspace/branch-engine/engine|presets|content`) — one canonical copy imported by both web and api-server. Do NOT recreate copies under artifact `src/shared/`.

**Why:** The duplicated copies drifted silently; a workspace lib with only pure code (no DB imports) is safe for the frontend to import.

## Duplicate vite type instances after lockfile changes
After pnpm add/remove in artifacts, typecheck can fail in an unrelated Vite artifact with "Plugin<any> is not assignable to PluginOption" caused by two vite instances keyed on different jiti versions. Fix: `pnpm dedupe jiti`.

## Hero video source
The homepage hero background (`public/hero-video.mp4` + mobile + poster) is the first ~22.5s of the user-attached fiery logo animation `attached_assets/Spartan_Logo_Hero_1761587167656.mp4` (rest of that file is black), trimmed/re-encoded with ffmpeg. Re-trim from that source if the hero clip needs changes; don't use the black tail.
