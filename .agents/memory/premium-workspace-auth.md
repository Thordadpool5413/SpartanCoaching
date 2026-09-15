---
name: Premium workspace authentication
description: Auth boundary for premium workspace pages that also have public tool previews
---

Premium workspace destinations must be explicitly included in the anonymous redirect policy, even when their server APIs already require membership. Public tool previews can remain available only on routes intentionally designed for preview; they must not be used as the access boundary for premium workspace screens.

**Why:** API authorization prevents data and mutations from leaking, but an unguarded client route can still expose the paid workspace UI and make the product appear open to everyone.

**How to apply:** When adding a premium destination, update the shared web route-auth policy and add a route-level regression. Keep the public `/tools` landing and intentionally previewable tool routes separate from premium workspace routes.