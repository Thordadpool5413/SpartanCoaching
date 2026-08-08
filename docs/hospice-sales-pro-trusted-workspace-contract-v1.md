# Hospice Sales Pro trusted-workspace contract

**Version:** 1.0  
**Status:** Repository-grounded requirements and acceptance contract  
**Audience:** Product, engineering, clinical/compliance, QA, enterprise operations  
**Last reviewed:** 2026-08-08  

## 1. Purpose, scope, and reading rules

Hospice Sales Pro is the tools-and-resources product in the Spartan Coaching
portfolio. This contract makes its trusted-workspace expectations observable:
what is authorized, where facts live, what may persist, how the web and iOS
surfaces relate, and how a release is verified.

This is a contract, not a certification, deployment attestation, or change to
product behavior. It does not claim HIPAA certification, a BAA, production
readiness, backup restoration, or operational evidence unless indicated as
current behavior with repository evidence. It does not merge the three tool
systems or introduce a schema/API migration.

Every statement is labeled:

| Label | Meaning |
|---|---|
| **CURRENT** | Implemented or documented in the repository; its evidence is linked. |
| **REQUIRED** | Required for the trusted workspace but not fully evidenced today. |
| **DECISION** | Requires explicit product, security, clinical, or operations owner approval before implementation or reliance. |

**Priority:** P0 prevents unsafe access/data exposure; P1 is required for a
reliable trusted workspace; P2 improves usability or operational maturity.

## 2. Vocabulary and boundaries

| Term | Contract definition | Status |
|---|---|---|
| **Hospice Sales Pro** | Subscription product providing sales workflow, Field tools, Advanced AI, and learning resources on web and iOS. | CURRENT |
| **Organization** | The tenant that owns membership, entitlement, operations data, and Command Center facts. A personal organization is a one-seat tenant. | CURRENT |
| **Rep** | A member using daily sales workflows. In Command Center authorization, an access-control `member` maps to runtime `rep`. | CURRENT |
| **Organization administrator** | Access-control role `org_admin`; administers seats within its organization and maps to Command Center `manager`. | CURRENT |
| **Platform administrator** | Access-control role `platform_admin`; operates platform administration and maps to Command Center `manager`, without cross-organization workflow access. | CURRENT |
| **Account** | A sales target/entity in the durable Command Center ledger; not a login account. | CURRENT |
| **Next conversation** | A human-approved next action or scheduled follow-up resulting from a completed account interaction. It is not an AI-autonomous action. | CURRENT |
| **Sales workspace** | The durable, tenant-scoped Command Center lifecycle: account → call → plan/practice → outcome → debrief → approved next action/history. | CURRENT |
| **Classic Field tools** | Fast daily, primarily request/response tools in the Field Kit catalog. | CURRENT |
| **Advanced AI** | Typed tools in the Spartan AI manifest, including non-clinical and clinical tools with separate safety rules. | CURRENT |
| **Command Center** | Durable sales workflow API/UI with shared web/iOS business facts. | CURRENT |
| **De-identified mode** | Default clinical education mode requiring user confirmation and server-side identifier screening; results are ephemeral. | CURRENT |
| **PHI mode** | Controlled clinical operating mode only when the documented runtime gates are configured and verified. It is not established by setting a mode value alone. | CURRENT |

### 2.1 System boundary rule

The following systems coexist intentionally and must remain distinct unless an
approved product decision changes this contract.

| System | Primary job | Source of truth/persistence | Handoff rule | Delivery |
|---|---|---|---|---|
| A. Classic Field tools | One-shot daily prep and practice | Field Kit catalog; selected role-play/drill data persists, many runs do not | User may copy/share a result; no implied durable Command Center write | Web and iOS catalog; native, secured WebView, or dedicated mobile route |
| B. Advanced AI | Typed content, territory, and clinical tools | AI tool manifest; non-PHI runs may use `ai_tool_runs`; clinical results are ephemeral | Clinical tools never auto-handoff to durable sales/content history | Web and iOS native library |
| C. Sales Command Center | Durable account workflow | `sales_workflow_*` tenant-scoped entities via `/api/v1/sales-workflow/*` | Only explicit, human-reviewed completion/approval creates durable workflow facts | Web full surface; documented iOS subset using same API |

**Evidence:** [tool architecture](tool-architecture.md),
[Command Center parity](command-center-parity.md),
[clinical controls](clinical-security-controls.md).

## 3. Personas and authority

| Persona | Can accomplish | Authority model | Status |
|---|---|---|---|
| Unauthenticated visitor | View public product/learning surfaces, request access, self-register, log in; preview selected locked experiences | No protected-data authority | CURRENT |
| Individual rep | Use entitled tools, maintain their owned Command Center work, review/copy/share allowed outputs, complete onboarding | Access-control `member`; Command runtime `rep` | CURRENT |
| Organization administrator | All entitled member work plus invite/disable seats, view organization usage, and perform in-org manager Command actions | Access-control `org_admin`; Command runtime `manager` | CURRENT |
| Platform administrator | Platform Access Desk, organization/access operations, platform analytics, and in-org manager behavior; bootstrap is one-time | Access-control `platform_admin`; Command runtime `manager`; tenant boundaries still apply | CURRENT |
| Clinical-authorized user | Use clinical education tools only when entitled, permissioned, and the relevant operating mode/runtime checks pass | Clinical authorization is tenant-scoped and independent of paid sales membership | CURRENT |

### 3.1 Authority versus personalization — owner decision required

**D-001 — Role semantics.** Access-control roles are exactly `member`,
`org_admin`, and `platform_admin`. They grant authority. Job roles (`rep`,
`director`, `vp`, `owner`, `other`) are onboarding/profile values that currently
personalize checklists, labels, and recommended tools. They do **not** grant
server authority, subscription access, administrative access, or tenant access.

This resolves the contract rule now: every protected workflow must authorize
using the access-control role and server-derived organization/member identity;
job role is personalization only. The product owner must decide whether leader
tool visibility should stay advisory or become a separately authorized
capability. Until then, labels such as “For directors & leaders” must not be
read as access control.

**Evidence:** `client_members.role` and `job_role` in
[`auth.ts`](../lib/db/src/schema/auth.ts); mobile mission personalization in
[`useMission.ts`](../artifacts/spartan-coaching-mobile/lib/useMission.ts);
workflow role tests in
[`workflowTenantAuthz.test.ts`](../artifacts/api-server/src/auth/workflowTenantAuthz.test.ts).

## 4. Workflow contract

All workflows below require an active session and entitlement where stated.
“Safe failure” means no durable write occurs unless the successful operation
and the required explicit user approval have completed.

| Workflow | Current system of record/ownership | Platform responsibility | Success and safe failure acceptance |
|---|---|---|---|
| Request access, self-registration, login, recovery | `access_requests`, personal org/member/session/token records; org owns entitlement | Web supports full path; iOS uses bearer login and opens registration on web | **FR-001 P0:** request-access requires terms and no-PHI confirmation; credentials/tokens are not exposed. **FR-002 P0:** expired/disabled/invited sessions deny protected APIs with 401/403 and show a recoverable UI path. **FR-003 P1:** reset password invalidates existing sessions. |
| Invitation and organization seats | Org invite/member records owned by inviting organization | Org administration is web-operational; iOS Account displays member-facing access state | **FR-004 P0:** only org/platform administrators may invite or disable within their organization; seat limits are enforced server-side. **FR-005 P1:** invited, revoked, expired, and accepted states are visible and cannot yield active access before password setup. |
| Entitlement, billing, and access lifecycle | Organization status/billing fields; Stripe webhook is the billing event source where configured | Web Account has checkout/portal; iOS opens verified Stripe URLs and refreshes status | **FR-006 P0:** Field/AI/Command protected routes evaluate server entitlement, not a client gate. **FR-007 P1:** trial expiry, cancellation-period end, suspension, failed configuration, and inaccessible payment URL give a clear action/error rather than a blank or unlocked state. |
| Account record and pre-visit plan | Command Center tenant-owned workflow entities | Web: full ledger and planning. iOS: schedule call and build plan against same API | **FR-008 P0:** API derives actor/org from session, rejects foreign tenant identifiers, and records facts only under the derived organization. **FR-009 P1:** iOS and web may have different UI depth but never alternate write APIs for the same Command fact. |
| Practice and role-play | Classic role-play sessions are member + organization owned; Command plan role-play belongs to Command workflow | Classic role-play exists in both tool ecosystems; Command workflow role-play is web-only today | **FR-010 P0:** classic role-play and Command role-play remain distinct pathways and do not silently merge history. **FR-011 P1:** unowned legacy role-play records are never listed, continued, or mutated. |
| Visit outcome, debrief, and next conversation | Command Center call/debrief/coaching/next-action entities | Web and iOS support AI draft debrief, complete call, and approve next actions | **FR-012 P0:** AI debrief returns a draft only; it never writes durable workflow rows without human review/edit/complete. **FR-013 P1:** an approved next action is visibly associated with its account/call and survives refresh on both clients. |
| Daily Field tool result | Tool-specific request/response; no universal durable history | Web Tools and iOS Tools catalog use shared catalog metadata | **FR-014 P1:** result review offers only supported copy/share/export behavior and must state any unsupported persistence. **FR-015 P0:** a daily result is not presented as a Command Center record until an explicit approved workflow write exists. |
| Advanced AI, resources, and downloads | AI manifest / resource sources; non-PHI and clinical persistence differ | Web and iOS Advanced library; Learn provides articles/podcasts/resources | **FR-016 P0:** catalog namespaces remain separate; a Field Kit tool ID cannot be treated as an Advanced AI ID. **FR-017 P1:** resources are discoverable on both platforms, with entitlement behavior and download/share behavior explicit per resource. |
| Clinical education | Ephemeral result/session; retained policy snapshots/audit metadata only as documented | Web and iOS clinical UI where enabled | **FR-018 P0:** de-identified mode screens direct identifiers before model submission and blocks uploads. **FR-019 P0:** PHI mode fails closed unless documented runtime controls, authorization, and recent MFA/device verification requirements are satisfied. |
| Organization and platform operations | Auth/org/access-request/timeline/audit event records | Web Access Desk/Admin are operational surfaces | **FR-020 P0:** org admin operations are organization-scoped; platform admin session is required for platform operations. **FR-021 P1:** operators can review access lifecycle, organization state, usage, audit events, and support recovery without using client-side secret gates. |

## 5. Navigation and parity contract

| Surface | Required path/outcome | Status |
|---|---|---|
| Web | Subscriber can reach Portal/Command, Tools, Learn, and Account from the authenticated shell in one navigation action. | CURRENT for shell routes; **REQUIRED** QA coverage |
| iOS Command | Subscriber reaches Command from its primary tab and opens/schedules the full workflow in one action. Logged-out and locked states show sign-in/account recovery. | CURRENT |
| iOS Tools | Subscriber reaches Command Center as the pinned tool and a daily tool in one or two actions. Catalog delivery is native, WebView, or dedicated route; `missing` is release-blocking. | CURRENT |
| iOS Learn | Visitor/member can reach articles, podcasts, resources, and web-parity shortcuts; locked resources explain the access path. | CURRENT |
| iOS Account | Member can view access/billing state, update profile personalization, and start supported billing recovery in one or two actions. | CURRENT |
| Responsive web | Private shells remain usable at 375, 390, 768, 1024, and 1280 px; primary actions and focus states remain reachable. | REQUIRED |

## 6. Trust, privacy, and platform requirements

| ID | Requirement and verification method | Status |
|---|---|---|
| NFR-001 P0 | Tenant isolation: derive organization/member from authenticated session; reject forged foreign organization IDs and cross-org resource access. Verify authorization unit/integration tests, including manager cases. | CURRENT |
| NFR-002 P0 | Client gates are usability controls only. All Field Kit, Advanced AI, Command, org-admin, and platform-admin APIs enforce server authorization. Verify unauthenticated/expired/disabled/unauthorized API smoke tests. | CURRENT |
| NFR-003 P0 | Clinical outputs/input, filenames, model output, and PHI must not enter logs, analytics, crash reports, push notifications, support tools, offline queues, or durable sales history. Verify code review plus clinical privacy test and production leak-scan drill before PHI operation. | CURRENT policy; REQUIRED operational evidence |
| NFR-004 P0 | Clinical responses use `Cache-Control: no-store`; de-identified outputs are ephemeral. PHI temporary objects are deleted and deletion verified; PHI failure/cancellation follows the same purge path. | CURRENT design/code documentation; REQUIRED production verification |
| NFR-005 P0 | PHI operation remains fail-closed until BAA/eligible services, storage, scanning, encryption, MFA, audit, retention, deletion, and runtime health gates are configured and evidenced. | CURRENT policy; DECISION/operations evidence required |
| NFR-006 P1 | Offline storage defaults to deny. Only reviewed Classic Field generation requests may queue after network/5xx failures; Advanced AI, clinical, Command, transcribe, and role-play are never queued. Verify mobile offline-queue tests. | CURRENT |
| NFR-007 P1 | Sync/conflict: Command writes use the shared API and its version/conflict behavior; no client invents local durable workflow truth. A failed/offline Command write remains visibly unsaved. Verify web+iOS same-seat conflict test. | REQUIRED |
| NFR-008 P1 | Accessibility: keyboard navigation, visible focus, semantic labels, screen-reader names, color contrast, ≥44 px mobile primary targets, and responsive layouts are checked for all changed private workflows. Verify automated checks plus manual web/iOS audit. | REQUIRED |
| NFR-009 P1 | Reliability: authentication/network/Stripe/API failures produce an explicit error, retry/recovery action, and no false success. Verify route tests, mobile error-state tests, and production smoke. | CURRENT in selected paths; REQUIRED coverage baseline |
| NFR-010 P1 | Observability: security-relevant access, authorization denials, lifecycle job outcome codes, and clinical audit metadata are available without retaining prohibited content. Alerting and operator ownership must be documented and exercised. | CURRENT partial audit/job design; REQUIRED operational runbook evidence |
| NFR-011 P1 | Backup/recovery: restore must be successfully exercised before workflow schema migrations; legacy unowned role-play archive requires encrypted, admin-only export and verified recovery before deletion. | REQUIRED; security release gate records this as pending operator evidence |
| NFR-012 P1 | Release readiness: changes pass typecheck/tests, protected-route smoke, parity smoke, responsive web checks, iOS native checks, and applicable clinical/manual verification before publication. | REQUIRED |

## 7. Contradictions and decisions register

| ID | Topic | Current evidence/conflict | Required resolution |
|---|---|---|---|
| D-001 | Access roles vs job roles | Job roles drive mobile leadership language/checklist; access roles grant authorization. | Resolved by §3.1: job role personalizes only. Product owner decides future leader-capability model before any gate is added. |
| D-002 | Three email paths | Classic Email Templates, Advanced Email Optimizer, and Command next-action email draft have similar names but separate ownership. | Keep separate names in UI/docs; require each output to name source, persistence, and send state. Command email remains draft-only. |
| D-003 | Two role-play paths | Classic `/api/roleplay/*` is tenant-owned practice; Command plan role-play is workflow-specific and web-only. | Do not combine history or imply parity. Any bridge needs an explicit approved handoff and retention decision. |
| D-004 | Catalog namespaces | Field Kit catalog IDs and Advanced AI IDs are separate and test-enforced. | New tools must declare exactly one namespace and delivery/retention/authorization metadata. |
| D-005 | Client gates vs API authorization | Web/mobile provide paywalls/previews; only API middleware is authoritative. | All new protected routes require server authorization and negative tests; no UI gate may be accepted as proof. |
| D-006 | Clinical activation | Environment can select a mode, while PHI operation requires broader controls and evidence. | Clinical/compliance owner must record activation approval and evidence; otherwise preserve de-identified behavior/fail closed. |
| D-007 | Legacy unowned role-play | Legacy rows without ownership are deliberately hidden; archive/deletion is an operator procedure. | Do not infer ownership. Operations must approve, encrypt/archive, test recovery, and document deletion under retention policy. |
| D-008 | Mobile leadership catalog | “For directors & leaders” is shown even where job role does not authorize it. | Product owner chooses advisory visibility, hide-for-nonleaders, or a new capability model; QA must test the chosen behavior. |
| D-009 | Sales debrief fallback | Documentation says unavailable OpenAI can yield heuristic draft defaults. | Product owner/compliance owner must approve the labeling, confidence, and retry/review behavior before it is represented as a trusted coaching recommendation. |

## 8. Migration and backward compatibility

No migration is introduced by this document. Future database/API changes affecting
identity, entitlement, tenant IDs, workflow ownership, retention, or clinical
controls must meet all of the following:

1. **Design:** identify source of truth, tenant ownership, retention, API
   compatibility, client parity, authorization, and rollback before code merge.
2. **Compatibility:** add fields/endpoints before removing old ones; keep web/iOS
   readers compatible during staged release; version or feature-flag behavior
   that cannot be safely inferred.
3. **Data safety:** do not change the canonical integer-to-workflow UUID mapping
   without an explicit migration of all `sales_workflow_*` records. Never infer
   ownership for legacy records.
4. **Schema rollout:** use reviewed/versioned migration paths for destructive or
   multi-environment changes; schema apply precedes smoke tests. `push` remains
   a release blocker while it is the active operational path.
5. **Rollback:** deploy backward-compatible code first; take and verify a
   restoration point before destructive changes; prove rollback against an
   environment that represents production data shape. PHI/clinical changes need
   explicit clinical/security rollback approval.

**Evidence:** [schema operations](schema-ops.md),
[security foundation](security-foundation.md).

## 9. Requirement traceability matrix

“Evidence” is repository evidence, not proof that production operations have
been completed. Impact abbreviations: **W** web, **I** iOS, **A** API, **D** DB.

| ID | Priority/audience | System of record | Impact | Security/privacy | Acceptance test and current evidence |
|---|---|---|---|---|---|
| FR-001–003 | P0/P1 visitor, member | Auth/org/session/token | W/I/A/D | Auth, no-PHI intake | API auth tests and `authRoutes.ts`; add session-expiry UI test. |
| FR-004–005 | P0/P1 org admin | Invite/member/org | W/A/D | Tenant authorization | Middleware/entitlement tests; add invitation lifecycle integration test. |
| FR-006–007 | P0/P1 member, ops | Organization entitlement/billing | W/I/A/D | Server gate, payment safety | `entitlement.test.ts`, billing tests, mobile account billing tests; add expired/network UI smoke. |
| FR-008–009 | P0/P1 rep/admin | Command Center | W/I/A/D | Tenant isolation | `workflowTenantAuthz.test.ts`, `command-center-parity.md`, parity smoke. |
| FR-010–011 | P0/P1 rep, platform ops | Role-play ownership | W/I/A/D | Tenant isolation, legacy data | `security-foundation.md`; role-play ownership route/integration tests. |
| FR-012–013 | P0/P1 rep | Command Center | W/I/A/D | Human approval, no PHI | `sales-workflow.md`; add durable approve-next-action web/iOS test. |
| FR-014–015 | P0/P1 rep | Tool-specific/Command | W/I/A | Safe handoff | `tool-architecture.md`; manual copy/share/persistence acceptance. |
| FR-016–017 | P0/P1 rep | Catalog/AI manifest/resources | W/I/A/D | Namespace, entitlement | `stack-boundaries.test.ts`, mobile catalog; add resource/download matrix test. |
| FR-018–019 | P0 clinical user | Ephemeral clinical runtime | W/I/A/D | PHI/no-store/delete | de-identification/storage tests; manual PHI gate and deletion drill required. |
| FR-020–021 | P0/P1 admins/ops | Org/access/audit records | W/A/D | Admin auth/audit | Admin middleware tests; Access Desk and recovery smoke required. |
| NFR-001–002 | P0 all protected users | Server auth | W/I/A/D | Authorization | `workflowTenantAuthz.test.ts`, middleware/entitlement suites, `smoke-parity.mjs`. |
| NFR-003–006 | P0/P1 clinical/member | Clinical runtime/device queue | I/A/D | PHI/no-store/retention | clinical controls, offline queue tests, manual privacy verification. |
| NFR-007–012 | P1 product/QA/ops | Shared API/ops evidence | W/I/A/D | Reliability/accessibility/recovery | Required tests and release checks in §10. |

## 10. Verification plan and release evidence

| Layer | Required verification | Evidence status |
|---|---|---|
| Unit and integration | Auth/entitlement/admin middleware; tenant/owner workflow authorization; catalog namespace boundaries; clinical input/storage/delete rules; mobile billing/offline queue. | CURRENT partial suites; extend coverage for each changed requirement. |
| API and production smoke | Health, public feeds, unauthenticated 401/403 protected routes, billing health, and Command parity smoke. | CURRENT scripts/docs; run against published host for release. |
| Responsive web | Test authenticated Command/Tools/Learn/Account at 375/390/768/1024/1280; keyboard/focus/error/empty/expired states. | REQUIRED manual or automated evidence. |
| Native iOS | Test logged-out, locked, entitled, no-network, billing-link failure, native/secured-WebView tool paths, Command same-seat data, and privacy view when clinical UI is active. | CURRENT partial account/offline tests; REQUIRED release evidence. |
| Cross-surface | Same seat: web and iOS see matching entitlement, onboarding and Command facts after refresh; conflict/error leaves no false local durable state. | REQUIRED. |
| Clinical/privacy | De-identified identifier rejection; PHI runtime fail-closed; no-store and ephemeral purge; app-switcher privacy; no PHI in analytics/logs/support/export; deletion/leak-scan drill before PHI operation. | CURRENT design/test evidence only; REQUIRED clinical/operations sign-off. |
| Operations/recovery | Confirm scheduler/job alerts, backup restore, schema rollout, admin recovery, and legacy-data procedure under named owners. | REQUIRED operational evidence. |

Recommended existing commands and checks:

```sh
pnpm run typecheck
pnpm --filter @workspace/api-server run test
node scripts/smoke-health.mjs https://YOUR_HOST
node scripts/smoke-parity.mjs https://YOUR_HOST
# authenticated parity only in an approved secure environment:
node scripts/smoke-parity-auth.mjs
```

For publication, use the wider [production verification checklist](production-verification.md),
[mobile parity checklist](mobile-web-parity.md), and
[operator checklist](operator-checklist.md). A release record must name the
requirements verified, omitted checks with approved risk acceptance, environment,
time, and responsible owner. It must never include credentials or PHI.

## 11. Evidence baseline

This contract was grounded in the repository documents and code that define the
current boundaries: `replit.md`, the tool architecture and clinical/security
documents, auth/org schema and routes, workflow tenant authorization tests, web
route/auth/Command UI, iOS Command/Tools/mission UI, parity/offline/schema
documents, and their referenced test/smoke assets. Where those sources describe
a future operator action or production condition, this contract deliberately
labels it **REQUIRED** or **DECISION** rather than claiming it is complete.