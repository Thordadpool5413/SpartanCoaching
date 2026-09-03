---
name: Mobile continuity privacy
description: Privacy boundaries for generated Field Kit results and commitment continuity on iPhone.
---

Generated field-tool inputs and outputs are session-only on iPhone. They must not be placed in draft caches, offline retry queues, member continuity storage, analytics payloads, URL parameters, or durable Role-Play tables. Role-Play may hold an active transcript only in bounded process memory and must discard it after feedback. A network failure means no result was created: prompt the member to reconnect and submit again rather than retrying from persisted input.

Commitment text is allowed in local/member continuity only after it passes the sensitive-content check. Reject unsafe text before any device write or queue operation; validating only inside the sync queue is too late because local storage may already contain the payload.

**Why:** Prompts and commitments can include names, email addresses, account context, or clinical details. Durable retry and cross-device restoration would contradict the app's privacy promise; validating after a local write still creates a PHI-at-rest exposure.

**How to apply:** New generated-result flows may track static tool/action identifiers and route to static native destinations. Any user-entered text approved for continuity must be checked at the persistence boundary before AsyncStorage, database, or queue writes. Keep Copy, Share, reminders, and download language specific to their actual device behavior. On upgrades, remove legacy generated-result caches and issue empty-payload deletion records for any prior server continuity rows before they can be restored. Historical Role-Play database records are intentionally retained by user decision, but current member and admin API paths must not restore them.