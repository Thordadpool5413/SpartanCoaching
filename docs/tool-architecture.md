# Tool architecture ownership

Three AI/tool stacks coexist by design. Do **not** merge them without an explicit product decision.

| Stack | Package / routes | Job | Persistence |
|-------|------------------|-----|-------------|
| **A. Classic Field tools** | `routes/routes.ts` (`/api/objections`, playbooks, …) + Field Kit catalog | Fast daily rep tools (web Tools + mobile tabs) | Light (roleplay sessions, drills); many are request/response only |
| **B. Advanced AI library** | `@workspace/spartan-ai-tools` + `/api/ai-tools/*` | Deep typed tools (content, territory, clinical vault) | `ai_tool_runs` (non-PHI); clinical ephemeral only |
| **C. Sales Command Center** | `@workspace/hospice-sales-runtime` + `/api/v1/sales-workflow/*` | Durable account workflow (plan → practice → complete → next) | `sales_workflow_*` entities (org UUID tenant) |

## When to use which

| Need | Use |
|------|-----|
| One-shot objection / email / weekly plan on Tools tab | **A — Classic** |
| Multi-step content / LCD / territory discovery with handoffs | **B — Advanced** |
| Account history, call outcome, approved next step | **C — Command Center** |
| Connected pre-call plan + in-workflow roleplay | **C** (not classic role-play alone) |

## Naming collisions to avoid

- Classic **Email Templates** (`email-templates`) ≠ Advanced **Email Optimizer** (`email-optimizer`) ≠ Command Center email draft action.
- Classic **Role-Play** (`/api/roleplay/*`) ≠ Command Center plan roleplay (`/plans/:id/roleplay`).
- Catalog `FIELD_KIT_TOOLS` ids and `SpartanAiToolId` values are **separate namespaces** (enforced by tests).

## Rate limits

All AI stacks share `standardAiLimit` / `heavyAiLimit` / `globalDailyAiCap` (and clinical-specific limits where registered). Adding a new generator must attach the appropriate limiter.

## Safety

- Clinical tools (`containsPhi` / `clinical:use`) never auto-handoff into durable sales/content history.
- Command Center debrief draft never auto-saves workflow rows.
- AI never sends email, writes CRM, or makes admission decisions without human approval.

## Inventory sources of truth

| Inventory | Source |
|-----------|--------|
| Membership tool grid (web + mobile) | `@workspace/field-kit-catalog` |
| Advanced AI manifest | `SPARTAN_AI_TOOLS` in `@workspace/spartan-ai-tools` |
| Command Center UI depth | `COMMAND_CENTER_CAPABILITIES` + `docs/command-center-parity.md` |
| Handoff graph (advanced) | `docs/tool-connection-map.md` + `connections.ts` |

See also: `docs/api-contract.md`, `docs/repository-truth-audit.md`.
