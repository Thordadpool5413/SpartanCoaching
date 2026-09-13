---
name: Browser appearance assertions
description: How browser regressions should validate saved appearance across route-scoped public and workspace surfaces
---

Browser appearance coverage should assert the saved mode, accent, background, and preset directly. The appearance sync record also contains a write timestamp that changes during normal initialization, so it is not stable test state.

**Why:** Theme initialization may refresh synchronization metadata without changing the member’s selected appearance. Treating that timestamp as part of the saved appearance makes a valid refresh look like data loss.

**How to apply:** When testing public-to-workspace transitions, normalize the sync record to its semantic appearance fields and separately reject writes that contain route-scoped public values.