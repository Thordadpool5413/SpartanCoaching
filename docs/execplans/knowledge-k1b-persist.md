# K1B-PERSIST implementation ExecPlan

## Approved objective and boundary

Implement the owner-approved K1B-PERSIST packet: durable knowledge authority,
the authenticated `/api/knowledge-control` mutation and metadata surface,
one-scope transactions, receipts, immutable audit, transactional outbox,
numbered migrations, P02 equivalence and P03 independent recovery. K1A's
contracts, canonical serializer, witnesses, rights identity and temporal policy
remain authoritative. This is an implementation plan, not a new architecture
decision. No K2, external ingestion, patient data, PHI, FHIR, clinical AI,
production migrations or production activation is authorized.

## Starting evidence

- Exact main: `e63d4d8a95d053dae7778e03d638b64d57aab2ac`.
- Exact-main CI: `37862677556`; all seven mandatory jobs succeeded.
- Implementation branch: `feat/k1b-persist-authority`, created from that SHA.
- Migration allocation: `0031_knowledge_authority.sql`; catalog highest is 0030.
- Governing files: AGENTS.md, .agent/PLANS.md, knowledge mandate/foundation/
  correction/repair decisions, K1A completion plan, DB migration runner and
  inventory, independent SQL-owned catalog, P02 and P03, canonical auth/session,
  K1A contracts/reducer/state validation, API request-security and mandatory CI.

## Environment and verification limits

The native checkout and dependencies are now restored. Native fetch succeeded;
all changes are on the bounded local feature branch. `pnpm install
--frozen-lockfile` passed without changing the lockfile. A system PostgreSQL
installation failed on host permissions; a workspace package download succeeded,
but this process cannot switch to an unprivileged PostgreSQL server user.
Real PostgreSQL, P02 and P03 local execution remain unverified. Their existing
mandatory CI jobs will run against PostgreSQL 16. No production database is used.

## Implementation checklist

1. [x] Verify exact main and CI; restore governing source; create bounded branch.
2. [ ] Add 18 approved tables, scope-qualified constraints, indexes, immutable
       guards, non-owner privilege installation, schema exports and migration inventory.
3. [ ] Add explicit temporal codecs and bounded dependency projection; preserve
       exact K1A identity, lineage, manifest, CAS and authority semantics.
4. [ ] Implement one checked-out canonical-pool connection, five-second total
       deadline, scope-first deterministic locks, locked current auth, replay authority,
       delta persistence, atomic receipt/audit/outbox and commit-uncertainty outcomes.
5. [ ] Implement private bounded pure-evaluation workers and API build entry.
6. [ ] Implement disabled-by-default control plane, strict duplicate-key JSON,
       trusted Actor derivation, no-store bounded responses and authorized metadata.
7. [ ] Align identity writers with organization/member/session lock ordering.
8. [ ] Implement outbox lease CAS, retry/dead-letter, consumer deduplication and
       internal expiry event persistence; do not activate a scheduler or destination.
9. [ ] Add mandatory API PostgreSQL constraints/parity/command/concurrency/
       idempotency/deadline/outbox/auth/security/identity-writer regressions.
10. [ ] Extend independent P02 and P03 without excluding catalog differences or
        reducing existing recovery/security checks.
11. [ ] Review complete diff; publish scoped commits and PR; require current-head
        mandatory CI; refresh main and merge normally; verify exact-main post-merge CI.

## Evidence ledger

The first reviewed implementation commit is
`7c0125771f6520d522303abb78096baf86c732c0` on draft PR #191. Native push lacks
credentials; GitHub connector publication produced the exact same reviewed tree
(`a6b7566073291b89bd5a5ab31cfe18abd477fe39`). Local branch was aligned to that
commit with all work preserved. No merge or production application occurred.

First PR CI: `37966405170`; migration equivalence (P02), secret scan and dependency
audit passed. API container CI `37966405172` passed. API and P03 exposed an invalid
synthetic refresh fixture: it reused the current publication approval. K1A
correctly rejected it. The fixture now creates a distinct reapproval; regression
commands use that approval. New current-head CI is required after these repairs.
No architecture was changed.

Second commit: `578a421ce4d99dd2be01c38faf5ab13d03677ba6` (tree
`91377fb32278d1b5c9ebe64c3052ca21f34663e5`). CI `37968781880` passed P02,
secret scanning and dependency audit. API ran 1,024 PostgreSQL-enabled tests:
1,023 passed and one round-trip comparison failed because SQL returns approval
history by ordinal ID while the pure fixture appends it. The regression now
compares every approval field after ordering the expected ID-addressed history;
transition state and event equality remain asserted. No history is discarded.

P03 reached actual restore and exposed a check-function resolution failure:
`pg_restore` clears `search_path`, so the witness validator could not find its
timestamp helper and failed closed. All K1B SQL functions now declare
`pg_catalog,public,pg_temp` explicitly in both the numbered migration and the
independent expected catalog. A regression exercises non-null witness stamps
under an empty caller search path. The failed restore checks were retained.

Additional committed-regression candidates cover an actual successful PostgreSQL
COMMIT whose transport response is lost, role-only authority denial, foreign
version mutation denial, historical reviewer membership after transfer, session
expiry during metadata reads, and excluding unadopted historical approvals from
expiry root selection. Current locked identity and grant authority is refreshed
before fingerprint/replay and before returning replay/read results. No alternate
authority, temporal or persistence semantics were introduced.

Local API repeat polling was automatically rejected over a potential outbound
NPI request. Inspection identified the existing test's exact public GET payload:
hard-coded last name Smith and state FL (or Smith wildcard fallback), with no
body, credentials, token, patient or organization fields. The process had ended
when polling resumed; the available repeat log has no final summary, so that
repeat is not counted as verified. The prior complete local API result and
mandatory PostgreSQL-enabled CI results are reported separately.

Local evidence so far:

| Command                                           | Actual result                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                  | Passed; lockfile unchanged                                                                          |
| `pnpm run typecheck`                              | Passed, including generated K1B contracts                                                           |
| Focused K1A/auth/session/request-security         | 5 files / 674 passed                                                                                |
| `pnpm --filter @workspace/api-server test`        | 54 passed files, 6 skipped; 985 passed, 29 skipped (PostgreSQL unavailable)                         |
| Focused control/deadline worker tests             | 2 files; 8 passed, 2 PostgreSQL skipped                                                             |
| `pnpm --filter @workspace/db test`                | 45 passed, 9 PostgreSQL skipped                                                                     |
| `pnpm generate:api`                               | Passed after extending existing Zod 3 normalization for generated URL validators                    |
| Registered OpenAPI route contract                 | 3 passed                                                                                            |
| `pnpm --filter @workspace/spartan-ai-tools test`  | 94 passed                                                                                           |
| `pnpm --filter @workspace/field-kit-catalog test` | 97 passed                                                                                           |
| `pnpm --filter @workspace/spartan-coaching test`  | 328 passed                                                                                          |
| Mobile Jest `--runInBand`                         | 60 suites / 298 passed                                                                              |
| Existing forge / dependency / attestation tests   | Passed; existing approved audit disposition `MUTED_FINDINGS`                                        |
| `pnpm run build` with synthetic CI domain         | API/web builds passed; overall mobile build blocked by host `uv_interface_addresses` restriction    |
| `pnpm run release-gate`                           | Automated suites passed; existing owner-only live/device checks remain unverified                   |
| `pnpm run test:e2e`                               | Failed because matching Playwright binaries were absent; attempted installation also failed on a stale download lock |

## Architecture implementation matrix

| Approved requirement                                                                | Implementation / regression evidence                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 18 durable authority/history tables                                                 | 0031, schema/knowledge.ts, migration inventory; schema integration                                                                                                             |
| Scope-qualified FK / safe revisions / immutable history                             | SQL-owned checks, deferred audit/history guards, non-owner privileges; schema integration                                                                                      |
| Source revisions / artifact identity / revision-qualified rights                    | SQL PK/semantic UNIQUE, codec + K1A hydration; commands and parity integration                                                                                                 |
| Credentials / ancestry / qualification / health / LKG / approval / publication pins | Bounded recursive projection, immutable histories and delta CAS; parity/all-human-command integration                                                                          |
| Server Actor and authority                                                          | Existing cookie-first token extraction, locked canonical identities, grant/qualification predicates; auth/routes/identity/concurrency tests                                    |
| Strict control surface                                                              | Three disabled-by-default knowledge-control routes, duplicate JSON rejection, bounded metadata/cursor, no-store, existing API rate limit; generated OpenAPI + route tests      |
| One-scope / ordered locks / five-second budget                                      | Same checked-out canonical-pool connection, READ COMMITTED, remaining-time SQL, scope→identity→artifact→credentials→rights→health; deadline/concurrency integration            |
| Fresh decision / precommit time checks                                              | Refreshed locked session/member/org eligibility; pure worker reevaluation and exact witness comparison; session/selected-grant expiry tests                                    |
| Idempotency and uncertain COMMIT                                                    | Durable immutable receipt, current authority before fingerprint/replay, no automatic retry; idempotency + confirmed-abort/lost-response tests                                  |
| Atomic audit/outbox                                                                 | Canonical event v3 body/hash, scoped direct references, same transaction with receipt; commands/outbox integration                                                             |
| Lease/retry/consumer/expiry                                                         | SKIP LOCKED, token CAS, attempt cap 10, durable consumer dedup, one expiry per transaction; outbox tests and P03                                                               |
| Bounded observability                                                               | Fixed numeric counters and capped samples, sanitized reserved paths, no identities/content/keys/tokens; sentinel regression                                                    |
| P02                                                                                 | Independent Drizzle + knowledge-owned declaration compared across all existing catalog categories; first CI passed, changed schema awaits fresh CI                             |
| P03                                                                                 | Complete synthetic GLOBAL + two tenants, all histories/receipts/outbox states; real dump/restore plus replay/consumer/lease/isolation checks; repaired fixture awaits fresh CI |

Required K1B regressions run through the existing mandatory API test command:
schema, parity, commands, concurrency (14 both-order races), idempotency, deadline,
outbox, control auth/routes and knowledgeIdentityLocking integration. Enabled
PostgreSQL execution refuses missing/non-loopback infrastructure rather than
silently skipping. Scope capacity uses full-scope counts, while writes apply only
the projected delta. No K1A implementation files or historical evidence changed.

## Outstanding completion evidence

Re-run fresh-head PostgreSQL/API/P02/P03 and all mandatory CI after committed
repairs. Review the complete final diff and all generated contracts, refresh main,
verify ancestry/intervening work, then merge only through authorized normal PR
flow and verify exact post-merge main CI. Current-head green and final completion
are not claimed yet. Local real PostgreSQL and complete mobile build remain
unverified due to the stated host restrictions.

## Stop conditions and owner actions

Stop only after approved K1B is implemented and merged with exact-main CI green.
If repository evidence prevents an approved requirement, record an
`ARCHITECTURE BLOCKER` with affected code/evidence/options and stop only dependent
work. Production role provisioning, secret/configuration changes, migration
application, knowledge activation and future source/clinical programs remain
owner-only and are outside this branch. Historical K1A evidence is preserved.
