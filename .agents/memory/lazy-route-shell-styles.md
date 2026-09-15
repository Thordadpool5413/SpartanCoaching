---
name: Lazy-route shell styles
description: Why shared route-family CSS must load with its owning shell instead of through a lazy page.
---

Import CSS required by a persistent route-family shell from the shell component or an earlier non-lazy boundary. Do not rely on the default landing page to load it.

**Why:** Client navigation from the landing page can hide a missing shell import because the landing page’s chunk leaves the CSS in memory. A fresh deep link to another lazy route then renders the shell without its navigation and layout rules, even though the DOM and route content are correct.

**How to apply:** For authenticated shells, admin shells, and other shared route families, verify at least one fresh direct deep link that does not pass through the default child route. Keep child-specific CSS in the child, but keep shell navigation, top bar, layout, and responsive rules with the shell owner.