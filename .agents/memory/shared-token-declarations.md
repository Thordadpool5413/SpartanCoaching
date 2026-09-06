---
name: Shared token declarations
description: Composite TypeScript package declarations can lag source exports in this pnpm monorepo.
---

When a shared design-token export is added for another workspace package, rebuild the design-token composite project before running that consumer's typecheck.

**Why:** The consumer may resolve the package's generated declaration files rather than the updated source index, producing a false "no exported member" error even though the source export is present.

**How to apply:** Rebuild the affected composite library, then run the consumer and root typechecks. Do not duplicate shared tokens in the consumer to work around stale declarations.