# Clinical cloud implementation ExecPlan

**Current status (2026-10-02):** P01 is merged into main. P02 is being reconciled onto current main in `impl/p02-reconcile-evidence`; P02 acceptance remains blocked. The dated continuation below supersedes earlier PR/dependency status statements.

## Authority and starting point

User authorized all P01–P15 sequentially; execute one packet per branch/PR. Packet source is architecture PR #174 at `3fb033fe5da32f673625bea4685587d437f37e05`, `docs/architecture/clinical-cloud-2026-10-01/05-implementation-packets.md`. Do not infer merge or production activation authority.

Starting main SHA: `708b0522af3534a0066134d646f21f2a3cb8747c`. Fetch/prune, checkout main, pull fast-forward, revision and clean status verified on 2026-10-01. Feature branch: `impl/p01-operational-truth`.

No `AGENTS.md`, `.agent/PLANS.md`, or existing ExecPlan was found in the checkout; checked ancestor AGENTS paths as well. This plan supplies a durable handoff, not invented repository policy. Read architecture ADRs 001–005 and the target/security design before changes. Existing auth, schema, migration, queue and device code was inspected before adding anything.

## Active packet P01 — Reconcile operational truth

- Objective: one evidence-backed operational contract; supersede contradictory claims.
- In scope: documentation, capability descriptions and reproducible static inventory.
- Out of scope: runtime behavior, schema, auth replacement, deployment or PHI activation.
- Dependencies: architecture audit/ADRs in PR #174.
- Inspected files: repository-truth-audit, schema-ops, clinical-security-controls, patient-record-review, offline-device-storage, replit.md, offlineArchitecture.ts; evidence sources listed in operational-evidence.json.
- Required implementation: classify assertion changes, link code evidence, distinguish count simulation from restore and retain superseded history.
- Security requirements: no PHI, credentials or production metadata.
- Required tests: document paths/links, migration inventory, capability contracts if executable file touched.
- Acceptance: production push is prohibited; deletion has no absolute deadline promise; admin PHI bypass is a blocker rather than accepted behavior.
- Stop condition: do not change runtime architecture or customer promises while reconciling docs.
- Owner-only: accept customer-facing retention and authority wording. No production operation.

## Progress and verification

- Added operational-contract.md with observed/target/unverified classifications and source evidence.
- Added deterministic static migration/table-name inventory and checker. It records 30 SQL files, 71 declared table names, 74 SQL-created names, zero declared names missing a CREATE, and 13 source paths/hashes. It does not prove catalog equivalence.
- Superseded historical audit commands, fixed current schema/development instructions, documented retired queue behavior, clinical authorization and native privacy gaps, and API-process cleanup limits.
- offlineArchitecture.ts change is comment-only. Historical helper outputs remain unchanged under P01's runtime exclusion; passing historical tests does not certify their descriptions as current.
- Database/infrastructure changes: none. Clinical AI model/prompt/schema/retrieval changes: none; no clinical evaluation impact.
- `pnpm install --frozen-lockfile`: exit 0; 21 projects, 1591 packages. Environment used pnpm 11.25.0 (repo packageManager pins 10.26.1); lockfile unchanged. Node 24.19.0. CI's pinned toolchain remains authoritative.
- `node scripts/operational-evidence.mjs --check`: exit 0; 30 migrations, 71 declared names, 74 SQL names, 13 evidence paths.
- `pnpm --filter @workspace/db test`: exit 0; 3 files, 30 tests passed.
- `pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand __tests__/offline-architecture.test.ts __tests__/offline-queue.test.ts`: exit 0; 2 suites, 16 tests passed.
- Relative document link check: exit 0; 14 links across 8 documents resolve. `git diff --check`: passed after removing a trailing-space edit.
- Full application build/typecheck/API/web/E2E/release-gate/audit and clinical evaluations were not run for this documentation/comment-only packet. These targeted checks do not establish production readiness.

## ARCHITECTURE BLOCKER — runtime does not yet satisfy approved target

Evidence: clinical/access.ts infers platform-admin clinical administration and permits review through that permission; auth/opsJobs.ts schedules cleanup inside the API process; dedicated mobile patient-review.tsx awaits deletion before clearing state and lacks the required inactive cover/local unlock. offlineQueue.ts is retired while offlineArchitecture.ts still describes durable generation retries.

Affected components: clinical authorization (P04), ingestion/deletion/jobs (P07/P08), native privacy (P13), offline capability metadata.

Why the approved approach cannot be claimed as deployed: these existing behaviors violate explicit grants, independent cleanup and immediate device-clearing requirements. Documentation cannot fix or certify them.

Options: implement the assigned bounded runtime packets and verify the target; or ask Astra for a revised architecture/release scope. Do not restore retired persistence or permit admin bypass to satisfy older descriptions.

Risks: unauthorized clinical access, orphaned objects, visible patient content after network loss/backgrounding, and misleading product promises.

Recommendation to Astra: retain the approved target and block PHI activation until the assigned fixes and evidence pass. An additional bounded runtime metadata correction is needed if changing offline helper outputs is desired. No replacement architecture was introduced.

## Dependency queue and external gates

| Packet | State / next prerequisite |
|---|---|
| P01 | Implemented in PR #175; CI run 36885703156 passed; not merged |
| P02 | Safe work in draft PR #176; synthetic runner checks passed, catalog gate reports 180 named-object differences; legacy baseline and target-schema authority decisions remain blocked |
| P03 | Depends on P02 synthetic replay; real independent restore plus covered sandbox PITR evidence |
| P04 | Depends on P01/P02; no admin bypass, scoped grants, delegation and negative tests |
| P05 | Depends on P02/P03; cloud access/budget/service coverage absent, explicit packet stop condition |
| P06 | Depends on P02/P04; durable lifecycle stays disabled pending owner terms |
| P07 | Depends on P04/P05 (+P06 retained); approved processor/scanner and enforceable limits |
| P08 | Depends on P02/P04/P05/P07 |
| P09 | Depends on P06/P07/P08; exact OCR version/region and FHIR semantics approval |
| P10 | Depends on P01/P05 and qualified clinical/coding/pharmacy reviewers and licensing evidence |
| P11 | Depends on P04/P08/P09/P10; approved model/project retention; P12 before activation |
| P12 | P09–P11 contracts and independent expert adjudicator unavailable; do not invent gold labels |
| P13 | Depends on P04/P07/P08/P11 contracts; installed-device verification required |
| P14 | Depends on P05/P07/P08/P11/P13 integration; inspect all relevant telemetry sinks |
| P15 | Depends on applicable P01–P14 evidence; no production cutover authorization |

Owner actions: provide cloud sandbox and budget authority, covered-service evidence, sanitized production discrepancy report, retention/customer wording, qualified clinical adjudicators and approved model/processor/knowledge licensing evidence. Keep actual agreements, secrets, patient documents and production dumps out of this repository and development conversation.

## Active packet P02 — migration reproducibility (in progress)

Main synchronized again before this packet: `708b0522af3534a0066134d646f21f2a3cb8747c`, clean. Branch `impl/p02-migration-evidence` is stacked on P01 commit `8299b67b3a2e7efc5bac2700ed923cfdf04fc7b2`; target its PR to `impl/p01-operational-truth` so packet diffs stay separate. P01 is draft PR #175; secret scan passed, main CI was still running when P02 began. Nothing merged.

Objective/in-scope: synthetic replay/catalog equivalence, migration ledger checksums and locking, additive corrections only if demonstrated. Out-of-scope: production data, destructive reconciliation, clinical features or cutover. Dependencies: P01 and sanitized owner evidence for a production verdict. Inspected existing manifest, runner, safety catalog, SQL, Drizzle schemas/config and CI. Security: isolated synthetic databases, non-owner RLS test, safe errors and content-free discrepancies. Required tests: empty/prefix upgrade/rerun/concurrency/tamper/partial failure/non-owner isolation/full catalog comparison. Acceptance remains no unexplained differences plus safe upgrade proof. Stop if applied SQL must be rewritten, data deleted, unknown production state inferred or push used to hide differences. Owner alone supplies covered production evidence/approves migrations.

Implemented safe work:

- Existing runner now uses original-byte SHA-256 checksums, a dedicated-connection advisory lock, full-ledger preflight and atomic per-file SQL/ledger commits. Existing stable IDs/external-last order preserved; applied SQL untouched.
- Explicit environment setting required; URL heuristic retained as an additional guard. Production needs its existing authorization flag. Raw driver/SQL errors replaced by codes.
- Legacy unknown checksums fail closed; nontransactional SQL requires a separate reviewed execution plan. Count simulation cannot satisfy REQUIRE_BACKUP_DRILL.
- Added disposable synthetic PostgreSQL integration harness: fresh replay, unchanged rerun, prefix upgrade, checksum mutation, transaction rollback, lock contention, legacy refusal, non-owner workflow tenant RLS, and independent Drizzle-source catalog comparison. No schema push.
- Added separate CI equivalence job with content-free seven-day report; existing CI test/security gates remain enabled. Local PostgreSQL was absent; `apt-get update` failed with setgroups/setegid permission errors (exit 100). No escalation or permission bypass attempted.
- Local `pnpm --filter @workspace/db test`: 35 passed; 5 PostgreSQL integration tests explicitly skipped because no test database was configured. `pnpm --filter @workspace/db run typecheck`: exit 0. Full repository checks delegated to existing CI; no production or clinical evaluation claim.

### ARCHITECTURE BLOCKER — establishing historical migration provenance

Evidence: previous `schema_migrations` has only id/applied_at; no hash or trusted applied SQL is recorded. Current repository bytes are insufficient proof of previously executed bytes. Affected components: migration runner, existing deployed ledgers, P02 upgrade acceptance, downstream P03–P15 prerequisites.

Failure mode: auto-hashing historical rows silently certifies unknown SQL, defeating tamper detection and production equivalence. The new runner therefore refuses those upgrades without changing the legacy ledger.

Viable options: (1) owner-approved baseline attestation tying historical deployment artifacts/commit hashes and verified in-cloud schema discrepancy evidence to ledger IDs; (2) owner-approved reconstruction from a trusted release/backup followed by reviewed reconciliation. Risks include misidentifying applied DDL, certifying drift, and incompatible old-client schema changes. Recommended Astra decision: define option 1's evidence format and signoff/verification process before implementing any baseline-adoption command. No baseline override, applied-SQL rewrite or destructive repair was added.

Continue safe synthetic checks; do not mark P02 complete or begin dependent feature packets while equivalence and historical upgrade decisions remain unresolved. P12's earlier fixture option also remains blocked by missing agreed contracts and qualified independent adjudication.

### CI and verification update

P01 PR #175 / commit `8299b67b3a2e7efc5bac2700ed923cfdf04fc7b2`: CI run 36885703156 completed successfully, including secret scanning, migrate, root typecheck/build, AI/API/web/native suites, release gate and browser journey job. Primary suite counts: AI 94, API 315, web 328, native 298 (60 suites), all passed. `pnpm audit --audit-level high` passed but reported 1 low and 20 moderate vulnerabilities; this is not a zero-vulnerability claim. The existing count drill also passed and still is not restore evidence.

P02 draft PR #176 / initial commit `e6014bbe0e71d34da2992d69ede2e039d0f4042f`: first PostgreSQL CI run 36887214285 passed 39 tests and failed 2 because the new default-grants catalog key concatenated PostgreSQL internal char without an explicit cast. Corrected `defaclobjtype::text`; this was an implementation bug, not schema drift. No report was produced by that failed attempt. Added actual concurrent-runner retry and content-leakage comparator tests. Latest local DB suite: 38 passed, 6 PostgreSQL tests skipped; database typecheck passed. PostgreSQL rerun required before claiming catalog results.

Additive runner ledger plan is recorded as MIGRATION_LEDGER_PLAN in migration-safety.ts. No product schema migration or historical SQL changed; no production database was contacted. The evidence JSON hashes reflect this branch's inspected source, with the original starting main SHA retained as baseline context.

### ARCHITECTURE BLOCKER — complete target-schema authority

PostgreSQL 16 CI run 36887724945, commit `e2ee66d89983a292379bf9a3be1bde0f056172ef`: **43 tests passed, one catalog equivalence test failed**. Fresh replay, rerun, prefix upgrade, two concurrent runners/retry, tamper rejection, rollback, unknown-history refusal and non-owner workflow RLS all passed. The corrected query produced [180 named-object discrepancies](p02-catalog-discrepancies.json): 91 constraints, 51 indexes, 19 columns, 8 relations, 4 policies, 3 functions, 2 triggers, 1 sequence and 1 sequence ownership. These are not 180 independently confirmed defects: names and SQL-owned objects contribute.

Evidence/affected components:

- Drizzle omits the three SQL-owned lifecycle/Medicare tables, offboarding functions/triggers, and workflow RLS policies. Those controls must not be dropped to satisfy a schema comparison.
- `member_personalization.payload` defaults differ: 0009 lacks the jurisdiction object present in `schema/memberPersonalization.ts`. No existing values were updated.
- Constraint/index names, uniqueness representations and index definitions differ. Some differences may be semantically equivalent; the gate deliberately does not guess or silently exclude them.

Why blocked: Drizzle alone cannot be the complete expected catalog without losing required SQL-owned security/lifecycle objects. Blindly making either side match would change policy or possibly remove controls. Unknown production history compounds the risk.

Options for Astra: (1) approve a complete target made from Drizzle plus explicitly versioned SQL-owned extensions, with semantic reconciliation rules that retain RLS/lifecycle controls; (2) represent those objects in one reviewed schema-definition mechanism, still preserving existing migration IDs and historical SQL. Recommend option 1 followed by individually reviewed additive corrections and historical baseline attestation. No difference allowlist, push, destructive DDL, historical rewrite or architecture replacement was introduced.

Additional safe hardening after review: existing public tables with a missing/empty ledger now fail as `MIGRATION_UNTRACKED_SCHEMA_BASELINE_REQUIRED` rather than being treated as a fresh database. A synthetic preservation/rollback test covers this. Local suite now has 38 passed, 7 PostgreSQL tests skipped; typecheck passed. Final CI must verify this additional guard.

P01 browser gate: 51 passed, 1 skipped (existing suite); no actual iPhone/TestFlight verification. P03–P15 remain unimplemented because the packet dependency graph does not permit bypassing P02; P05/P10/P11/P12 additionally require the owner/clinical/vendor inputs listed above. No unrelated dependency-ready packet remains.

## Final implementation handoff (runtime commit 13901682f5be49dbde153e5d05b82c37f682e243)

CI run 36888411574 verified the final runtime changes. PostgreSQL suite: **44 passed, 1 failed**, solely the 180-discrepancy equivalence gate. The untracked-schema preservation test, two-runner serialization/retry, historical checksum refusal, rollback, replay/upgrade/rerun and non-owner RLS tests all passed. The implementation-caused catalog-query cast failure is fixed.

Application CI and secret scan passed: frozen install, migrate, typecheck, AI tools (94), API (315), web (328), native Jest (298 across 60 suites), build, performance budget, release-gate suites, and audit-high threshold (1 low / 20 moderate remain). Browser job was still installing Playwright dependencies when this handoff was recorded; P02 browser verification is outstanding. P01's browser result remains 51 passed / 1 skipped. CI for any documentation-only handoff commit is separate; consult PR #176 required checks for its latest state. Do not interpret either the count drill or passing application suites as schema equivalence/restore/clinical approval.

Local final state before this documentation-only handoff: clean feature branch synchronized with origin; `git diff --check`, static evidence checker and ExecPlan/report links passed. No human work overwritten. Published runtime commits: P01 `8299b67b3a2e7efc5bac2700ed923cfdf04fc7b2`; P02 `e6014bbe0e71d34da2992d69ede2e039d0f4042f`, `e2ee66d89983a292379bf9a3be1bde0f056172ef`, `13901682f5be49dbde153e5d05b82c37f682e243`. PRs #175 and #176 are draft/unmerged. No final merged main SHA exists for this work.

Changed files across the two packets: operational documentation/ExecPlan/report and inventory script; mobile offlineArchitecture comment only; existing migration CLI/safety catalog plus runner/catalog modules and tests; CI and generated-report ignore rule. Database change is only the additive migration-ledger checksum mechanism; historical product SQL is unchanged. Existing product migrations ran only in disposable synthetic CI databases. Infrastructure change is a CI verification job, not cloud infrastructure. No production contact, PHI, vendor activation, clinical model/prompt/schema/retrieval change or clinical evaluation claim.

Next action belongs to Astra/owner: approve the complete expected catalog including SQL-owned security/lifecycle objects and the historical provenance-baseline process. Then resolve differences individually, obtain sanitized covered-boundary production evidence, and rerun P02 acceptance before dependent packets. P03–P15 are not complete and were not implemented. Recovery/PITR, production equivalence, real-device privacy, clinical adjudication, cloud IAM/network boundaries and vendor retention remain unverified. No owner-only production operation was performed.


## P02 continuation — 2026-10-02

Starting main SHA: `44ec75b61a42b5d992fd7e11ee1ec7c39e994bd8`. Clean checkout, fetch/prune, checkout main, fast-forward pull and status verified. PR #174 and P01 PR #175 are now merged into main. P02 PR #176 was merged into `impl/p01-operational-truth` at `f2a3809b8108ec6fafa845d1ede0939b05f25cee`, not into main. New branch `impl/p02-reconcile-evidence` brings that history forward through a clean merge; no human changes overwritten. Repository/ancestor instruction files remain absent.

Bounded additive correction: new `0030_personalization_jurisdiction_default.sql` aligns future default inserts with `schema/memberPersonalization.ts` (jurisdiction state/macRegion null). It does not rewrite historical migration 0009 or existing rows. A five-second local lock timeout limits waiting for the metadata alteration. The migration plan records logical-backup expectation and compatible rollback behavior; production apply remains owner-only. A PostgreSQL test upgrades all previous migrations including external workflow, preserves the old payload, verifies new default inserts against the existing application factory, checks plan validation queries and confirms rerun idempotency. Inventory is now 31 migrations with original IDs and external-last ordering retained.

Local verification: frozen install passed (pnpm 11.25.0 fallback; repository CI pins 10.26.1; lockfile unchanged). Database suite: 38 passed, 8 PostgreSQL tests skipped because local PostgreSQL is unavailable. DB typecheck, static inventory check and diff whitespace check passed. CI must verify the new migration and full application gates. Historical discrepancy report remains explicitly tied to its earlier source commit, not regenerated or edited to fabricate a current pass.

Latest previous P02 CI run 36890215178 at `f96d4d236b6053d2e1e2483e0efd9a5462e322bf`: application checks and secret scan passed; schema equivalence failed; browser job was cancelled during browser installation, before journey tests. Browser verification remains outstanding.

Dependency correction: the earlier statement that all P03 work requires complete P02 acceptance was too broad. The approved packet explicitly requires **P02 synthetic schema replay**, which passed in PostgreSQL 16 CI. Therefore P03 independent synthetic dump/restore work can proceed in its own branch/PR after this P02 continuation is published. Cloud PITR still requires an authorized sandbox. P04/P05 and other packets retain their listed dependencies. This is application of the approved dependency graph, not a replacement architecture.

Architecture-dependent P02 work remains stopped: Astra must approve complete catalog authority and historical provenance adoption; owner must supply sanitized in-cloud discrepancy evidence for production equivalence. No security object was dropped or ignored and the strict catalog gate remains enabled. No PHI, production operation, cloud infrastructure, clinical AI behavior or evaluation changes.


## Active packet P03 — 2026-10-02 synthetic recovery

P02 continuation published as draft PR #178, commit `e40fbcab1a73193a936482c6315e6317f1ba6ef8`. CI run 36944465367: **45 PostgreSQL/unit checks passed, 1 failed**, solely 179 remaining catalog discrepancies. The new default correction/preservation/plan-validation/rerun test passed. Secret scan passed. Application verification stopped at audit: 1 low, 20 moderate, 1 high (`node-forge`, GHSA-86w9-cpqp-85rv, no patched version reported). Browser job skipped. Dependency lockfile was not changed; this newly reported upstream issue is not caused by P02. No gate weakened; remaining application verification is outstanding.

Main synchronized again at `44ec75b61a42b5d992fd7e11ee1ec7c39e994bd8`; clean, no new instruction files. P03 branch `impl/p03-synthetic-recovery` is stacked on PR #178 to reuse the verified synthetic migration runner/catalog comparator. P02 remains architecture-blocked; P03 dependency is specifically synthetic replay, which passed.

Packet: objective actual recovery proof; scope rename count simulation, independent synthetic pg_dump/restore, Cloud SQL runbook and consistency tests. Out of scope production data/restore/live destinations/automated destructive recovery. Dependencies successful P02 replay, authorized sandbox for measured PITR. Inspected count script, ops catalog, release gate, CI, migration/catalog code, API phiEncryption and clinical ephemeral/retention/offboarding lifecycle; read ADRs and recovery/security design. No replacement encryption/database/clinical deletion system was created.

Implementation: existing backup-restore-drill command now creates disposable source and target databases, uses real private pg_dump/pg_restore, verifies 12 catalog categories/all row content/sequence positions, deliberate corruption/lost table, post-restore non-owner tenant isolation, missing/wrong/recovered key via canonical API encryption, synthetic tombstone reconciliation and preference write/default/unique-constraint behavior. Old script renamed count-simulation and explicitly labeled insufficient recovery evidence. New independent CI job uploads only a content-free short-lived report, never archives/keys/row hashes. Runbook records owner-only cloud PITR and cross-store/role/key/tombstone acceptance gates. No product schema changes in P03.

Required tests are exercised by the synthetic recovery command; configuration-negative unit tests refuse absent synthetic setting, remote host and libpq routing query. Local PostgreSQL is absent. Initial subprocess tests hit the environment's tsx CLI IPC socket restriction; switched to Node's supported --import tsx loading mode (no IPC listener) for these commands. No permission escalation. Exact final local results and CI report to be appended after verification. Clinical model/prompt/schema/retrieval/evaluation impact: none.

ARCHITECTURE BLOCKER: canonical clinical deletion-tombstone recovery authority is absent. See docs/synthetic-recovery.md for evidence, affected P07/P08 components, risks, options and Astra recommendation. The manifest used here is a synthetic drill fixture only; it cannot certify production deletion recovery. Cloud sandbox/cost authority is absent, so no measured cloud PITR or production restore may proceed. Recovery numbers are local synthetic measurements, not accepted business RPO/RTO. Count timestamps cannot satisfy REQUIRE_BACKUP_DRILL.

P03 local verification before publication: `pnpm --filter @workspace/db test` passed 41 tests with 8 PostgreSQL migration tests skipped; DB typecheck and explicit recovery-script TypeScript check passed; static evidence check passed (31 migrations, 71 declared/74 SQL table names, 14 evidence paths); `git diff --check` passed. No local restore was claimed. CI recovery job is required.


P03 verification findings: runs 36945299489, 36945529209 and 36945769431 performed actual dump/restore but stopped on eleven CHECK constraint fingerprints; cleanup passed. Literal-scrubbed diagnostics established PostgreSQL rewrites unbounded varchar-array-to-text coercion into equivalent per-element coercions. Added narrow normalization for exactly the text-enum CHECK grammar, preserving literal values/column and all validation/deferrability metadata. Bounded casts, other operators, NULL, collation and compound expressions remain unnormalized and compared strictly. No object allowlist or security exclusion. Diagnostic expression output was removed after diagnosis. Local regression suite now 45 passed / 8 PostgreSQL tests skipped; DB and recovery-script typechecks passed. Full root `pnpm run typecheck` also passed. Snapshot age now uses dump start (conservative consistency point), not dump completion. CI rerun is required for normalized catalog and the remaining restore checks.
