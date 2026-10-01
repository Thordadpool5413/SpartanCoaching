# Clinical cloud implementation ExecPlan

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
| P01 | Documentation implemented; publish and CI verification pending |
| P02 | Next packet; synthetic PostgreSQL replay and complete catalog comparison required. No psql, pg_dump, Docker or PostgreSQL binaries initially present. Production equivalence additionally needs owner-supplied sanitized in-cloud discrepancy evidence. |
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
