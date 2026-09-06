---
name: Named theme coverage
description: Requirements for making the Mamba brand theme visible across all Spartan surfaces.
---

Named themes must cover both semantic tokens and the brand utilities/components that bypass them. The palette's dominant brand hue must own the primary role; audit hard-coded gradients, CTA fills, workspace panels, and native hero treatments whenever adding a palette.

**Why:** A theme can successfully persist and update CSS variables while still looking unchanged if high-visibility surfaces continue to use literal brand colors or if the named hue is trapped in a secondary token.

**How to apply:** Add a real picker interaction test, rebind any page wrapper that locally resets token variables, and use dynamic palette inputs for workspace cards, native chrome, and mobile hero/resource actions.

Mamba is the default visual preset for fresh web sessions and fresh mobile installs. An explicitly selected Spartan or custom preset must still persist and remain respected.

**Why:** The requested purple-and-gold identity needs to be visible immediately; leaving Mamba opt-in made the shipped experience continue opening in the old Spartan treatment.

**How to apply:** Keep first-paint bootstrap fallbacks, React defaults, and native appearance hydration aligned on Mamba, while preserving an explicit-choice marker so legacy Spartan storage is migrated only when it was not intentionally selected.

Public route shells can locally reset semantic variables and legacy utility classes can bypass them; theme coverage therefore needs a late, route-wide readability layer that rebinds the shell and normalizes small labels/gray copy, not only component-level token changes.

**Why:** Resources, Tools, and Contact remained low contrast after the palette itself was correct because their shared public wrapper reintroduced red/dim gray and the kicker component read the wrapper's old primary value.

**How to apply:** After any named-theme pass, verify representative public routes at phone width and cover shell-level `text-kicker`, muted/gray utilities, and local `--primary` resets before auditing individual cards.