---
name: Named theme coverage
description: Requirements for making an opt-in brand theme visible across all Spartan surfaces.
---

Named themes must cover both semantic tokens and the brand utilities/components that bypass them. Audit hard-coded gradients, CTA fills, workspace panels, and native hero treatments whenever adding a palette.

**Why:** A theme can successfully persist and update CSS variables while still looking unchanged if high-visibility surfaces continue to use literal brand colors.

**How to apply:** Add a real picker interaction test plus surface-level overrides or dynamic palette inputs for public pages, authenticated workspace cards, and mobile hero/resource actions.