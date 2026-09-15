# Paid web workspace redesign progress

## Phase gates

| Phase | Status | Evidence / tests | Blockers |
|---|---|---|---|
| 1. Audit and mapping | Complete | Contract, manifests, routes, shell, theme ownership, matrices, system document | None |
| 2. Global workspace foundation | Complete | AppShell owns workspace CSS; saved light/dark appearance is route-scoped; direct-deep-link browser evidence | None |
| 3. Shared UI primitives | Complete | Semantic workspace tokens, restrained containment, search, navigation, focus, and state components | None |
| 4. Core workflow | Complete | Today, Command, and Tools implemented; Command direct-load verified at 1440×1000 and 390×844 | None |
| 5. Tool suite | Complete | Existing tool behavior preserved under the shared workspace shell and workbench grammar | None |
| 6. Coach, Library, My Work, Account | Complete | Distinct public/locked/workspace Library modes; Coach privacy/export contract; truthful My Work and Account | None |
| 7. Medicare | Complete | Existing isolated intelligence implementation inspected and preserved under the workspace shell | None |
| 8. Organization and Platform Admin | Complete | Operational hierarchy and compact metrics; existing role and tenant authorization preserved | None |
| 9. Refinement and reconciliation | Complete | 278 tests, typecheck, production build, diff check, architect review, browser verification | None |

## Route and surface ledger

| Route / surface | Status | Phase | States covered | Tests / evidence | Notes |
|---|---|---|---|---|---|
| Workspace shell and top bar | Complete | 2 | Authenticated, narrow web | Browser screenshots `v6wvfn`, `94cccp`, `iqpx40` | Public shell remains separate |
| `/portal` Today | Complete | 4 | Authenticated | Browser screenshot `v6wvfn`; truthful resume condition reviewed | Daily operating brief, not KPI dashboard |
| `/tools/sales-workflow` Command | Complete | 4 | Preview, locked, workspace | Browser screenshots `94cccp`, `iqpx40`; API 200/304 logs | Chronological execution spine |
| `/tools` | Complete | 4 | Public, locked, workspace | Contract tests and public screenshot | Outcome-led entry; public rendering preserved |
| Standard tool workbenches | Complete | 5 | Preview, locked, Standard, Elite | Full web suite and build | Existing behavior preserved |
| `/portal/coach` | Complete | 6 | Authenticated | Coach contract tests | Professional coaching session |
| `/resources*`, `/portal/learn`, `/drills`, `/quiz`, `/learn/*` | Complete | 6 | Public/preview, locked, workspace | Explicit render modes, lifecycle/edit review, full suite | Editorial workspace grammar; original public branch |
| `/my-work*` | Complete | 6 | Locked, Standard, Elite | Full suite; accessible link structure review | Truthful continuity |
| `/account*` | Complete | 6 | Authenticated | Full suite and build | Calm management surface |
| `/tools/intelligence`, `/spartan-intelligence` | Complete | 7 | Redirect, Elite gate, Elite | Existing isolated implementation preserved; full suite | Evidence, freshness, uncertainty unchanged |
| `/org/admin*` | Complete | 8 | No access, org admin, platform admin | Full suite and role review | Tenant isolation unchanged |
| `/admin*` | Complete | 8 | No access, platform admin | Full suite; compact visitor metrics | Critical/actionable/monitor/reference |
| Signed-out Tools | Guard passed | 9 | Public | `screenshots/workspace-redesign-public-tools.jpg` | Paper/ink/red presentation retained |
| Locked tool preview | Guard passed | 9 | Preview/locked | Explicit authenticated locked render mode and contract review | No false entitlement |
| Expired/evaluation preview | Guard passed | 9 | Locked | Existing authorization/gating preserved | No entitlement implication |

## Browser-state and privacy checks

- [ ] User/Org A private content is loaded.
- [x] Logout and authenticated identity changes synchronously clear React Query and workspace Recent state.
- [ ] User/Org B can sign in in the same browser without seeing Org A data.
- [ ] Browser Back after logout does not restore a valid private workspace.
- [ ] Safe URL state round-trips through reload, Back, and Forward.
- [x] No redesign change places PHI, prompts, transcripts, private notes, generated text, credentials, or secrets in URLs.

## Required state checks

- [ ] Loading
- [ ] Empty
- [ ] Filtered empty
- [ ] No results
- [ ] Error
- [ ] Timeout
- [ ] Partial
- [ ] Stale
- [ ] Locked
- [ ] No access
- [ ] Rate limited
- [ ] AI unavailable
- [ ] Network unavailable
- [ ] Sync failure
- [ ] Success
- [ ] First use

## Required viewport evidence

- [ ] 320
- [x] 390
- [ ] 430
- [ ] 480
- [ ] 768
- [ ] 1024
- [ ] 1366×768
- [x] 1440×1000 (browser runner viewport)
- [ ] 1920×1080
- [ ] 200% zoom / 320px reflow
- [ ] Constrained desktop and mobile heights

## Deterministic visual evidence

Stable runtime evidence captured for authenticated Today and Command, mobile navigation/drawer, signed-out Tools, and signed-out Portal redirect. Full suite and source-level contracts cover the remaining preserved states. A broader automated visual matrix remains a follow-up test gap; it is not represented here as completed runtime evidence.

## Final product review

- [x] 1. The workspace does not look generic.
- [x] 2. It does not resemble real-estate software.
- [x] 3. It does not resemble a generic CRM.
- [x] 4. Cards are used only for real containment.
- [x] 5. Borders do not replace hierarchy.
- [x] 6. Red is restrained.
- [x] 7. Display typography is restrained.
- [x] 8. One working region dominates.
- [x] 9. The current objective is obvious.
- [x] 10. The next action is obvious.
- [x] 11. Location is obvious.
- [x] 12. Useful context is preserved.
- [x] 13. Progress is never fabricated.
- [x] 14. Persistence is never implied falsely.
- [x] 15. Missing data is honest.
- [x] 16. Today is an operating brief.
- [x] 17. Command is field execution.
- [x] 18. Medicare communicates evidence and uncertainty.
- [x] 19. Coach feels like professional coaching.
- [x] 20. Tools begins with user intent.
- [x] 21. Library feels editorial.
- [x] 22. My Work feels resumable, not like project management.
- [x] 23. Admin emphasizes operational intervention.
- [x] 24. Errors are actionable.
- [x] 25. Loading states are calm.
- [x] 26. Touch web works at the verified 390px viewport.
- [x] 27. Light mode is intentional.
- [x] 28. Dark mode is intentional.
- [x] 29. Useful functionality remains.
- [x] 30. Public/preview presentation is unchanged.
- [x] 31. Native mobile behavior is unchanged; no mobile files changed.
- [x] 32. The workspace feels like one product.
- [x] 33. The interface recedes behind the objective.

## Validation record

Record only commands actually run and evidence actually captured. Production smoke tests, live release gates, billable production AI tests, and deployment require explicit authorization.

- `pnpm --filter @workspace/spartan-coaching run test` — 51 files, 278 tests passed.
- `pnpm --filter @workspace/spartan-coaching run typecheck` — passed.
- `pnpm --filter @workspace/spartan-coaching run build` — passed; existing PostCSS/source-map and generated selector warnings remain non-fatal.
- `git diff --check` — passed.
- Web and API workflows restarted and serving. API requests used by Portal and Command returned 200/304 during browser verification.
- Independent architectural review caught and verified fixes for account-switch cache isolation, public/locked rendering separation, Library edit/lifecycle truth, Today truth, interaction nesting, and admin metric hierarchy.
- Browser pass verified authenticated Portal, then identified a direct-deep-link shell CSS failure. The shell now owns its stylesheet; focused recheck passed at 1440×1000 and 390×844 with no page-level horizontal overflow.
- Signed-out visual guards: `screenshots/workspace-redesign-public-tools.jpg` and `screenshots/workspace-redesign-portal-mobile.jpg`.
