---
name: Browser appearance assertions
description: How browser regressions should validate saved appearance across route-scoped public and workspace surfaces
---

Browser appearance coverage should assert the saved mode, accent, background, and preset directly. The appearance sync record also contains a write timestamp that changes during normal initialization, so it is not stable test state.

**Why:** Theme initialization may refresh synchronization metadata without changing the member’s selected appearance. Treating that timestamp as part of the saved appearance makes a valid refresh look like data loss.

**How to apply:** When testing public-to-workspace transitions, normalize the sync record to its semantic appearance fields and separately reject writes that contain route-scoped public values.

The route layout is the authority for the live appearance after navigation; the provider must not reapply the saved workspace appearance from a mount effect after the route has selected a public surface.

**Why:** A provider mount re-application can run after the public route effect on the first load, leaving the route marker public while the document still has the saved dark workspace attributes.

**How to apply:** Keep saved appearance initialization before React paints, and apply route-scoped values with persistence and notification disabled from the route layout.

Cross-tab storage rehydration must apply the saved appearance with persistence and same-tab notification disabled; the storage event is already the external update signal.

**Why:** Re-persisting a storage event creates a write-back loop and can make route-scoped consumers observe a second, synthetic theme change.

**How to apply:** Dispatch each saved appearance key in provider tests, assert mode/accent/background/preset, and collect `spartan-theme-change` events during rehydration; the expected count is zero.