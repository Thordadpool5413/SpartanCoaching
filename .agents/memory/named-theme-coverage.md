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

Shared public chrome must define its own card and muted tokens; otherwise a Mamba root card token can paint header controls purple while their inherited foreground disappears. Route-wide guards must target `.page-persuasion` wrappers, not only `main.page-persuasion`, because many public screens use a div shell.

**Why:** The second visual pass exposed blank mobile search/menu controls and purple-on-purple public resource/tool labels even though the main page screenshots looked readable.

**How to apply:** Keep public header tokens isolated from workspace tokens, make phone filter groups wrap instead of clipping, and audit the actual wrapper element used by each route before trusting a selector.

Mamba purple is a dark-mode surface role, not a universal foreground or card color. Light Mamba uses silver/off-white surfaces with ink text; gold is the readable accent on dark or purple fills.

**Why:** Unconditional Mamba card and label overrides caused light mode to render silver text on silver/gray panels while leaving workspace chrome dark, making the saved light setting functionally unreadable.

**How to apply:** Scope Mamba card, sidebar, topbar, and utility overrides by `data-theme-mode`; preserve purple fills for selected/primary states, and pair each surface with its semantic foreground instead of raw purple text.