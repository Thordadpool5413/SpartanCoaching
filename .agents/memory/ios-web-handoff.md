---
name: iPhone web handoff
description: Durable constraints for getting users from the public website into Hospice Sales Pro on iPhone.
---

Standard TestFlight and production builds must include the Associated Domains entitlement for the public host. Keep a separately named no-Associated-Domains profile only as an explicit emergency path, never as the default release flow.

**Why:** An Apple App Site Association file cannot open the installed app unless the shipped binary carries the matching entitlement. Also, Safari typically keeps a Universal Link on the same domain inside Safari, even when the app is installed.

**How to apply:** Use the canonical HTTPS `/app?open=…` route for shareable Universal Links and AASA coverage. On that public page itself, use the registered custom scheme for the explicit “open app” action and leave clear App Store and browser fallbacks. Preserve only validated internal targets through native sign-in, then apply entitlement checks before opening paid tools.