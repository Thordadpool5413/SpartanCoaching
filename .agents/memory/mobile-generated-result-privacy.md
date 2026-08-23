---
name: Mobile generated-result privacy
description: Privacy and behavior boundary for generated Field Kit results on iPhone.
---

Generated field-tool inputs and outputs are session-only on iPhone. They must not be placed in draft caches, offline retry queues, member continuity storage, analytics payloads, URL parameters, or durable Role-Play tables. Role-Play may hold an active transcript only in bounded process memory and must discard it after feedback. A network failure means no result was created: prompt the member to reconnect and submit again rather than retrying from persisted input.

**Why:** Prompts can include names, email addresses, account context, or clinical details. Durable retry and cross-device restoration would contradict the app's privacy promise and can also produce results when the originating screen is no longer present to show them.

**How to apply:** New generated-result flows may track static tool/action identifiers and route to static native destinations. Keep Copy, Share, reminders, and download language specific to their actual device behavior. On upgrades, remove legacy generated-result caches and issue empty-payload deletion records for any prior server continuity rows before they can be restored. Historical Role-Play database records are intentionally retained by user decision, but current member and admin API paths must not restore them.