# Sales Command Center — web ↔ mobile parity

**Product rule:** Shared business facts live on `/api/v1/sales-workflow/*`.  
Clients may differ in chrome and depth; they must not invent alternate write APIs for the same fact.

**Machine-readable matrix:** `@workspace/field-kit-catalog` → `COMMAND_CENTER_CAPABILITIES`  
**Canonical tenant IDs:** `@workspace/tenant-ids`

## Surfaces

| Surface | UI | Auth |
|---------|----|------|
| Web | Shared `SalesWorkflowPanel` (`@workspace/hospice-sales-runtime/sales-workflow/react`) | Cookie session |
| iOS | Native `app/sales-workflow.tsx` | Bearer session |

## Intentional mobile subset (current)

### Supported on mobile (same API as web)

| Capability | API |
|------------|-----|
| Day agenda | `GET /today` |
| Schedule call | `POST /cycles` |
| Build pre-call plan | `POST /plans/:id/build` |
| AI debrief draft | `POST /debrief/draft` (never auto-saves) |
| Complete call | `POST /calls/:id/complete` |
| Approve next actions | `POST /coaching/:id/approve` (human selects actions after complete) |

### Web-only for now (documented gaps)

| Capability | API | Notes |
|------------|-----|--------|
| Account ledger grid | `GET /accounts` | Mobile creates account inline on schedule |
| Workflow roleplay | `POST /plans/:id/roleplay` … | Use classic Role-Play tool on mobile |
| Schedule next from action | `POST /cycles/:id/next-call` | |
| Email draft from action | `POST /next-actions/:id/email-draft` | |
| CSV import | import routes | Org admin |
| Calendar connect | integration routes | When OAuth configured |

Closing a gap = implement UI against the **existing** API, then flip the matrix entry in `command-center.ts` and extend tests.

## Shared inventory (all tools)

- Catalog: `FIELD_KIT_TOOLS`
- Daily / leader groupings: `FIELD_KIT_DAILY_TOOL_IDS`, `FIELD_KIT_LEADER_TOOL_IDS` (web Tools + mobile Tools)
- No tool may ship as `mobile: "missing"`

## Smoke

```bash
node scripts/smoke-parity.mjs https://your-host
# Includes unauthenticated 401/403 on Command today + debrief draft
```

## Safety

- Do not put PHI in notes, transcripts, offline queues, or analytics.
- Debrief and complete-call remain human-reviewed; AI never writes workflow rows alone.
