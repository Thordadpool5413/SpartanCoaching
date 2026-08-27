---
name: Paid campaign attribution
description: Privacy and reporting rules for Hospice Sales Pro paid-social campaign attribution.
---

Campaign attribution must accept only the published, allow-listed UTM source,
medium, campaign, and creative tokens. Persist those fixed tokens for the
current browser session only, and include them only in privacy-sanitized funnel
events.

**Why:** Campaign reporting needs to compare ad variants without collecting
visitor-provided query values, ad copy, identities, form responses, or PHI.

**How to apply:** When adding a creative, update the allow-list, the creative
link, and the documented report vocabulary together. Treat a tagged landing
arrival as an on-site proxy for a click; use the ad platforms for their raw
click totals.