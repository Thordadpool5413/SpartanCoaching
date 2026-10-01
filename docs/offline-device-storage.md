# Offline and device storage contract

Checked at `708b0522af3534a0066134d646f21f2a3cb8747c` (2026-10-01).

AI generation requires a network connection. Generated classic-tool inputs and results are session-only. No clinical content may enter AsyncStorage, ordinary offline queues, analytics, push payloads, or crash reports.

## Inspected implementation

- `artifacts/spartan-coaching-mobile/lib/offlineQueue.ts`: compatibility API only. Enqueue returns null, list returns an empty array, and flush erases legacy storage without transmitting bodies. The remaining path allowlist is historical metadata; it does not enable persistence or replay.
- `artifacts/spartan-coaching-mobile/lib/generatedToolPrivacy.ts`: erases legacy generated drafts/results, saved responses, and scoped/unscoped generate queues by enumerating keys.
- `artifacts/spartan-coaching-mobile/lib/toolDraftCache.ts`: rejects generated Field IDs and sensitive clinical IDs. `CONTINUITY_TOOL_IDS` is empty. Other generic helpers still exist; this is not a blanket proof that all device storage is safe.
- `artifacts/spartan-coaching-mobile/lib/memberSync.ts`: separate member continuity subsystem. Its existence does not authorize clinical storage.

## Known description mismatch

`offlineArchitecture.ts` still labels generated workflows as queued/cacheable and its classifier still returns `queued_write` for historical allowlisted paths. Those descriptions are superseded by the runtime evidence above. P01 changes only its explanatory comment; changing helper outputs requires a separately scoped runtime correction with caller/compatibility tests. Do not restore the retired queue to satisfy the old matrix.

Historical claims about automatic retries, persistent classic-tool drafts/results, and queue preservation on 401 are withdrawn. This is documentation of existing privacy behavior, not a new persistence policy.

Device filesystem, backup exclusion, app-switcher privacy, interrupted upload cleanup and late-response protection require P13 verification on the installed app. No native-device assurance is claimed here.
