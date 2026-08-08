# Offline & device storage (iOS)

## Offline generate queue

**Module:** `artifacts/spartan-coaching-mobile/lib/offlineQueue.ts`  
**Storage:** AsyncStorage key `hsp_offline_generate_queue_v1`  
**Purpose:** Retry classic Field tool generates after network/5xx failures.

### Allowed (may be stored on device)

| Path | Tools |
|------|--------|
| `/api/objections` | Objection Handler |
| `/api/playbooks` | Playbook Generator |
| `/api/research` | Grounded Research |
| `/api/email-templates` | Email Templates |
| `/api/cold-call-script` | Cold Call Script |
| `/api/weekly-plan-builder` | Weekly Plan Builder |

### Never queued (blocked)

- All `/api/ai-tools/*` (advanced library, including clinical)
- `/api/v1/sales-workflow/*` (Command Center; debrief notes stay in memory/session flow only)
- `/api/transcribe*`, roleplay session posts
- Clinical tool ids even if path were misconfigured

Disallowed entries are purged on `listQueuedGenerates` / flush after upgrade.

### Rules for new tools

1. Default: **do not** enqueue.  
2. Classic Field only after privacy review (no PHI by design).  
3. Clinical / vault: never device-queue; keep ephemeral server-side.  
4. Call `isOfflineQueueAllowed` before any new enqueue site.

## Tool draft / last-result cache

**Module:** `toolDraftCache.ts`  
Uses the same blocked clinical tool id list. Drafts/results for vault tools are not written to AsyncStorage.

## See also

- `docs/tool-architecture.md`  
- `docs/clinical-security-controls.md`  
- Offline tests: `__tests__/offline-queue.test.ts`
