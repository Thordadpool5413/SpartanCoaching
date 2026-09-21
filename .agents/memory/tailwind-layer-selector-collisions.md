---
name: Tailwind layer selector collisions
description: Prevent malformed and source-less generated CSS when custom selectors reuse Tailwind utility class names.
---

Keep custom compound or broad selectors that reuse Tailwind utility class names outside `@layer base`, `@layer components`, and `@layer utilities`.

**Why:** Tailwind 3 can register these authored selectors as definitions of the matching utility. Variant generation then rewrites the entire selector, which can concatenate element names without a combinator or create declarations without source metadata. Production minifiers may drop the malformed rules, and Vite reports missing PostCSS source filenames.

**How to apply:** When a custom selector includes a utility class such as `.bg-primary` or `.border`, place that override immediately after the relevant managed layer so cascade order is preserved without allowing Tailwind to expand it as a variant definition. Verify the processed tree has source files on every declaration and inspect the production build for malformed compound selectors.