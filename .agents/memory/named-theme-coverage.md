---
name: Named theme coverage
description: Requirements for making an opt-in brand theme visible across all Spartan surfaces.
---

Named themes must cover both semantic tokens and the brand utilities/components that bypass them. The palette's dominant brand hue must own the primary role; audit hard-coded gradients, CTA fills, workspace panels, and native hero treatments whenever adding a palette.

**Why:** A theme can successfully persist and update CSS variables while still looking unchanged if high-visibility surfaces continue to use literal brand colors or if the named hue is trapped in a secondary token.

**How to apply:** Add a real picker interaction test, rebind any page wrapper that locally resets token variables, and use dynamic palette inputs for workspace cards, native chrome, and mobile hero/resource actions.