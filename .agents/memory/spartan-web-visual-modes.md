---
name: Spartan web visual modes
description: The durable relationship between public, editorial, and authenticated web presentation
---

Spartan Coaching’s web identity uses one shared editorial language with two complete surface modes: paper-white/ink/red for public and document pages, and a self-contained dark command mode for authenticated tools.

**Why:** Applying the light public tokens directly to the existing navy workspace made workspace labels and navigation unreadable. The dark workspace must define its own foreground, muted, card, popover, input, sidebar, and border semantics.

**How to apply:** New public pages should default to hard editorial paper surfaces and inherit the shared public readability scope. Keep public navigation opaque, with full desktop navigation only where it fits and explicit Search/Menu controls below that breakpoint. Render key hero copy as live HTML rather than baking it into soft video frames or low-resolution images. New authenticated screens should live inside the workspace command scope and consume semantic tokens. Preserve validated saved appearance choices across first paint and React initialization. Public-surface compatibility rules must preserve intentional Spartan-red emphasis rather than flattening it into the surrounding ink color.