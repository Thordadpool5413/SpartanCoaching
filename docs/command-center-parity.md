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
| Account ledger | `GET /accounts` (searchable list; schedule against existing) |
| Schedule call | `POST /cycles` (new account or ledger pick) |
| Build pre-call plan | `POST /plans/:id/build` |
| Connected roleplay | `POST /plans/:id/roleplay`, `POST /roleplay/:id/continue` (ready plans) |
| AI debrief draft | `POST /debrief/draft` (never auto-saves) |
| Complete call | `POST /calls/:id/complete` |
| Approve next actions | `POST /coaching/:id/approve` (human selects actions after complete) |
| Schedule next from action | `POST /cycles/:id/next-call` (accepted `next_call` actions) |
| Email draft from action | `POST /next-actions/:id/email-draft` (preview only; never auto-sends) |
| CSV account import | `POST /imports/csv/preview` + `commit` (org_admin paste flow) |
| Calendar OAuth | `POST /integrations/calendar/:provider/connect` (partial — adapter must be configured) |

### Remaining intentional limits

| Capability | Notes |
|------------|-------|
| Calendar connect | Both web and mobile are **partial** until Google/Outlook adapters are configured in the environment |
| CSV on mobile | Paste CSV (no file picker dependency); web still uses file input |

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
