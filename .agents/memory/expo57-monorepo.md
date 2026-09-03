---
name: Expo 57 monorepo constraints
description: Non-obvious SDK 57 constraints for pnpm peer resolution, Expo Router imports, and Replit Expo session login.
---

Keep the workspace-root React and TypeScript peer contexts aligned with the mobile app's Expo SDK matrix.

**Why:** In a pnpm monorepo, mismatched root and mobile peer versions can create separate physical installations of the same Expo native module. Expo Doctor reports these as duplicate native modules even when their semantic versions match.

**How to apply:** When upgrading Expo, align the root React, React DOM, React type packages, and TypeScript with the SDK-supported mobile versions, then run the whole-workspace typecheck and Expo Doctor.

Do not import React Navigation packages directly from an Expo Router SDK 57 app.

**Why:** Expo Router's native bundler rejects direct React Navigation imports as of SDK 56, even when TypeScript and Jest pass.

**How to apply:** Use Expo Router APIs or framework-independent layout calculations, and confirm the rule with an iOS or Android Expo export.

Clear any inherited Expo token only inside the create-launch session-login subprocess.

**Why:** Replit may provide an Expo token that prevents create-launch from accepting its physical-device session credential, while the rest of the Expo startup can still use the normal environment.

**How to apply:** Run create-launch login in a subshell that unsets the Expo token, pass the session through the environment, and never print the session value.