---
name: Authenticated readability verification
description: How to verify workspace readability after repeated false-positive visual signoffs.
---

Readability signoff must include authenticated workspace routes, saved dark appearance modes, and screenshots at actual viewport scale. Passing contrast ratios on anonymous public pages is not sufficient.

**Why:** Automated contrast checks can pass while 9–12px utility text, low-emphasis secondary copy, and dark cards with weak surface separation remain difficult to scan. Full-page screenshots can also hide this by scaling dense pages down.

**How to apply:** Check representative signed-in dashboard, catalog, saved-work, account, and admin pages. Combine contrast measurements with viewport-scale screenshots, minimum type-size review, card/background separation, and actual click/keyboard menu interaction.

Public dark-surface helpers are not sufficient when later component CSS uses higher-specificity hard-coded light-page ink colors. Verify the final computed color inside each dark section, not just the JSX utility classes or helper marker.

**Why:** A homepage section carried the correct dark-surface marker and white/red utilities, but local editorial selectors later replaced them with dark ink, producing black-on-black labels.

**How to apply:** Audit rendered text nodes inside every intentional dark surface at both normal-text and large-text thresholds. Include component-specific CSS in the review and explicitly rebind local ink variables where light and dark bands share one stylesheet.