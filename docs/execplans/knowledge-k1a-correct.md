# K1A-CORRECT execution plan

## Authority and status

The owner supplied the K1A architecture/packet-authoring instruction on 2026-10-03.
Architecture decisions and the sole implementation packet are in
`../architecture/knowledge-2026-10-03/03-k1a-correct.md`.
The authoring evidence below is historical. Runtime implementation, local verification
and publication are recorded in the reconstruction sections at the end; terminal
merge/main CI evidence is maintained in the linked PR publication ledger.
K0/K1 history remains in `knowledge-foundation-k0-k1.md`.

Starting main: `c1812b3ceca80a1a03cf9cf91a460c6fa355c9ee`.
Status/remotes/fetch-prune/main checkout/ff-only pull/SHA/status verified clean.
Latest completed push CI for that exact main: `37117283612`, success, all seven
jobs successful. Branch metadata reports protection disabled; manually enforce
every required gate. Documentation branch: `docs/k1a-correction-packet`.

## Objective, scope and dependencies

Correct the disconnected in-memory knowledge foundation before encoding it in SQL.
Scope: foundation contracts/resolver/lifecycle/tests, narrowly scoped future
knowledge mutation-origin guard, architecture and project orchestration documents.
Out of scope: persistence tables/migrations, HTTP control routes, external sources,
clinical reasoning integration, PHI, licenses/corpora, FHIR, deployment and K2–K23.
No migration number is reserved. No dependency/security-policy change is authorized.

Reuse current sessions/organization identities, Zod, crypto, Express and tests.
Inspect the exact file list and implement the normative decisions in the packet.
All nine findings have explicit dispositions; implementation must not invent
alternative role, digest, publication, overlap or transaction semantics.

## Progress

- [x] Recheck current main/CI and current source evidence for all nine findings.
- [x] Resolve architecture and author the bounded packet in version control.
- [x] Preserve history and replace temporary first-run AGENTS orchestration text.
- [x] Implement foundation v2 contracts and pure transitions.
- [x] Reproduce/invert specified regressions; retain valid behavior in v2.
- [x] Implement and test narrow knowledge-control origin protection.
- [x] Run local verification; record exact commands/results and limitations.
- [ ] Verify exact final implementation PR head and current-main integration.
- [ ] Merge authorized implementation and verify exact resulting main push CI.
- [ ] Obtain a fresh independent Astra review; do not automatically start K1B.

## Findings and decisions

Approval currently binds only version ID/normalized hash; bundle hashing precedes
tenant projection; blocked candidates affect publication; supersession takes an
unvalidated target; ACTIVATE omits invalidation intent; rights lack derived-output,
start/revocation fields; role strings are not credential verification. Current
cookie-first session loading differs from the Bearer-based origin exemption.
Mobile sends Bearer tokens and may carry native cookies: apply the stricter rule
only to the reserved future `/api/knowledge-control` namespace in K1A.
Existing routes remain unchanged; their mixed-credential behavior is not certified
as fixed by this packet. The packet requires the correct future boundary.

The design uses an internal v2 contract, immutable review manifests, explicit
published assignment timelines, server-derived scoped capabilities, independently
verified qualifications and separate activation authority. Database guarantees
are specified for K1B; K1A does not claim to implement database atomicity or delivery.

## Verification record

Packet authoring is documentation-only. Main's exact-SHA seven-job status was
queried afresh. Runtime tests from prior work are not presented as new local runs.
Before committing this handoff, validate packet section coverage, references,
decision coverage, whitespace and changed-file scope. Record publication evidence
in the PR and append concrete implementation evidence here during Sol's work.

Authoring validation: all 31 required packet headers present exactly once; all nine
findings have explicit dispositions; Markdown fences and plan targets checked;
`git diff --check` passed. Independent Python hashlib calculation pins the serializer
unit vector in the packet. Only five Markdown files changed; no runtime/dependency/
database/security-policy change. Required implementation tests are instructions, not
claimed results. Publication PR/CI evidence belongs to this documentation handoff;
it does not satisfy K1A implementation acceptance.

## Stop conditions and owner actions

Stop architecture-dependent work if the normative packet cannot be safely applied;
record ARCHITECTURE BLOCKER with evidence/options/recommendation here. Continue
unrelated safe work. No automatic K1B/K2, real source content or PHI promotion.
Actual reviewer appointment/verification, rights approval, bootstrap authority,
production migration/activation and customer/store rollout remain owner-only.
Synthetic authority fixtures do not appoint a reviewer or grant a production right.

## Handoff acceptance

Packet readiness is separate from implementation completion. K1A is complete only
after required regressions/local checks pass, exact final PR head is fully green,
normal authorized merge occurs, and the exact resulting main push run is fully
green. Record implementation starting SHA, files, tests, commit/PR, CI run IDs,
merged SHA, unverified items and follow-up. Clinical evaluation is not certified;
the foundation must remain disconnected from live reasoning and patient data.

## Runtime reconstruction checkpoint — 2026-10-03

The execution environment was replaced after disconnecting. Previous uncommitted
runtime changes and local logs are unavailable. Historical local results reported
in conversation are not evidence for this reconstruction. No implementation had
been published or merged. Restored clean main and repeated status/remotes/fetch/
main/ff-only pull/SHA/status; starting SHA remains
`04dac293251b20955fadefe51582670ec3f98149`. Current exact-main push run
`37143710026` is successful. Branch `fix/k1a-foundation-contracts`.
Node 24.19.0; installed global pnpm 11.25.0 is not used. Use pinned corepack pnpm
10.26.1; frozen installation in progress. No lockfile/dependency changes authorized.

Consumer inventory repeated over entire repository: foundation imports and v1
contract references occur only in foundation implementation/tests, package test
registration and historical architecture/ExecPlans. No live product consumer found.

### Working normative compliance matrix

Every item is pending reconstruction and verification until concrete evidence below.

| Packet section | Implementation target | Required regression evidence | Status |
|---|---|---|---|
| Claims/authority | contracts authorityMatrix | all 17 mappings, forbidden patient provenance | Superseded by final matrix |
| Permission | authority.ts | exact scope/capability, membership, grant validity/delegation | Superseded by final matrix |
| Qualification | authority.ts | class, jurisdictions, validity, verified synthetic context | Superseded by final matrix |
| Duties | lifecycle/authority | reviewer differs registrar/submitter; independent activator | Superseded by final matrix |
| Artifact identity | contracts/lifecycle | immutable tuple conflicts and duplicates | Superseded by final matrix |
| Review manifest | contracts/authority | independently mutate every bound field | Superseded by final matrix |
| Canonical digest | canonical.ts | unit/full literal vectors, invalid JSON, set normalization | Superseded by final matrix |
| Tenant-safe manifest | resolver | complete foreign mutation equality, malformed foreign opacity | Superseded by final matrix |
| Publication | publication/lifecycle | drafts/unadopted approvals cannot alter runtime | Superseded by final matrix |
| Temporal semantics | contracts/authority | inclusive starts, exclusive ends, strict real dates | Superseded by final matrix |
| Supersession | publication/lifecycle | split/history, missing/foreign/unrelated/self/cycles | Superseded by final matrix |
| Rollback | lifecycle | previously published target, eligibility, terminal revoke | Superseded by final matrix |
| License | authority | six independent purposes/current verification/revocation | Superseded by final matrix |
| Health | authority/lifecycle | NOT_CHECKED, chronology, fresh activation, constrained LKG | Superseded by final matrix |
| Resolver | resolver | fixed precedence/permutations/missing context/conflicts | Superseded by final matrix |
| Request security | requestSecurity.ts/test | real Express/auth chain, paths/methods/principals | Superseded by final matrix |
| Future transaction | future.ts | atomic order, no persistent claim/network | Superseded by final matrix |
| Idempotency | future.ts | versioned fingerprint, authorization before replay | Superseded by final matrix |
| Concurrency | future.ts/lifecycle | scope/version CAS, parent revision, lock ordering | Superseded by final matrix |
| Audit | contracts/lifecycle | strict variants/reasons, invalidations/expiry dedup | Superseded by final matrix |
| Outbox | future.ts | strict metadata-only delivery, lease/retry/CAS intent | Superseded by final matrix |
| Disconnection | foundation.test.ts | static imports/routes/client boundary | Superseded by final matrix |

No K1B/K2, database persistence, source integration, PHI or production operation.

Frozen install completed successfully (6m05s), pnpm 10.26.1; lockfile unchanged.
Reconstruction pre-fix/safety command:
`corepack pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts src/security/requestSecurity.test.ts src/auth/middleware.test.ts src/auth/sessionSecurityContract.test.ts`: four files, 122 tests passed, 1.11s.
Includes eight deterministic v1 probes reproducing raw hash/parser/retrievedAt/edition
nonbinding, foreign inventory fingerprint change, draft poisoning, missing target
supersession and missing ACTIVATE invalidation. V1 probe assertions are temporary
and will be inverted into v2 safety scenarios; no deliberately red commit published.

Reconstructed origin guard is implemented with real Express request.path, cookieParser,
requireTrustedMutationOrigin/loadSession/requireAuth and mocked persistence only.
All namespace/lookalike/query/safe/unsafe method, cookie A + Bearer B principal and
invalid bearer denial scenarios pass. Existing session-security contract is now
registered in mandatory app-checks API test command, solely permitted package change.
Foundation v2 helpers are being reconstructed; not complete/merge-ready.

## Reconstructed implementation and final local acceptance

No normative architecture changes were made. No live v1 consumers appeared on
refreshed main. V1 fixtures/signatures are intentionally replaced because v2 rejects
silent upgrade. Existing meaningful cases remain: claim eligibility, human review,
education exclusion, missing versus no-known-issue, temporal/historical selection,
rights, conflicts, injection-as-data, revocation, provenance and immutability.
Role-derived authority, v1 inventory-wide hash, bare LKG boolean and supersededBy
assertions are replaced with the approved credential/assignment contracts.

Synthetic RECORD_STAGE commands use a separate trusted PIPELINE server context
and metadata-only typed PIPELINE event variant; no human can claim a stage and no
model can act. It records evidenceRef and synthetic-pipeline identity rather than
misattributing pipeline evidence to a human. Human/expiry variants are strictly
separate. This is a disconnected synthetic reducer, not an ingester or auth adapter.

Shared rights revisions retain a single consistent operational overlay; registration
reuses the existing overlay rather than clearing revocation. Scoped referenced
publication must not contain inconsistent rights terms/overlays. Revoked artifacts
remain terminal even when their assignment is replaced. Historical assignment
creation fields remain intact; replacements/splits are appended with acyclic lineage.
Only the published approval pin affects read authority: renewal is adopted explicitly.

### Final normative compliance matrix

All runtime evidence below is in `foundation.test.ts` unless identified otherwise.
Pure semantics are locally verified; durable K1B semantics remain contracts only.

| Normative section | Implementation | Concrete evidence/status |
|---|---|---|
| OBJECTIVE | Disconnected foundation v2 and reserved guard | Runtime changes and regressions implemented; publication gates pending |
| IN SCOPE | Foundation helpers, origin guard, synthetic tests | Changed-file classification below matches packet |
| OUT OF SCOPE | No DB/HTTP/ingestion/clinical adapter | Static disconnection and scope diff checks pass |
| FILES TO INSPECT | Repeated consumer/source audit on unchanged baseline | AGENTS/PLANS/packet/architecture/ADRs/auth/mobile/DB/CI/security inspected; no live consumer |
| FILES EXPECTED TO CHANGE | Seven foundation modules plus tests/security/ExecPlan | Only permitted package test-registration exception; no normative docs changed |
| CLAIM/AUTHORITY CHANGES | contracts.authorityMatrix/sourceSchema | 17 mappings preserved; inference provenance separated; patient domains rejected |
| PERMISSION CONTRACT | actorInScope/requireCapability/grantEligible/validateGrantDelegation | Admin/model/role strings denied; membership, scope, grant validity and delegation negatives pass |
| QUALIFICATION CONTRACT | qualificationEligible/requireQualification/hasCurrentApproval | Exact class/domain/jurisdiction, current member, pinned credentials, verification and synthetic-only mode pass |
| SEPARATION-OF-DUTIES CONTRACT | transitionKnowledge/hasCurrentApproval/evaluateApplicability | Registrar/submitter cannot review; reviewer cannot activate; imported same-person assignment denied; independent path and unilateral revoke pass |
| ARTIFACT IDENTITY | versionIdentity/REGISTER/validateState | Same edition/new artifact revision works; exact duplicate returns identity without writes; changed immutable identity conflicts |
| CANONICAL REVIEW MANIFEST | buildReviewManifest/reviewManifestSchema | Every artifact/applicability/source/rights bound field independently mutated; unchanged approval rejects |
| DIGEST ALGORITHM | canonical.assertJson/canonicalBytes/canonicalDigest | Unit and independent full literal vectors; ordinal sets, UTC instants, sequences and invalid values pass |
| TENANT-SAFE MANIFEST/BUNDLE RULES | resolver.project/createKnowledgeRegistry | Complete foreign source/version/license/health/grant/qualification/draft/audit/malformed metadata equality; no public inventory fingerprint; independent global/tenant projection |
| CANDIDATE VS PUBLISHED AUTHORITY | assignmentSchema/project/transitionKnowledge | All eight unpublished states and unadopted malformed approvals leave complete output/hash unchanged |
| TEMPORAL SEMANTICS | day/stamp/intervalSubset/authority helpers | Real dates, UTC normalization, inclusive start/exclusive end/null end; expiry/current validity pass |
| SUPERSESSION / ROLLBACK | publication helpers and aggregate reducer | Missing/foreign/unrelated/self target, cycles/invalid lineage and overlap reject; split/rollback/history and revoked/expired/unapproved/unhealthy/rights-invalid target cases pass |
| LICENSE CONTRACT | rightsSchema/rightsOverlaySchema/licenseAllows | Six independent purposes, future/expired/revoked/unverified/noncommercial rights, every activation enabled use; termination content-removal intent only |
| HEALTH CONTRACT | healthSchema/healthState/RECORD_HEALTH/APPROVE_LKG | NOT_CHECKED, chronology/future timestamps, explicit digest LKG, hard expiry/rights/revocation dominance, fresh activation; no fabricated terminal health |
| REQUEST-SECURITY CORRECTION | requireTrustedMutationOrigin + real middleware harness | 35 security tests: exact/slash/descendant/query/lookalike paths, safe/unsafe methods, origin matrix, A-cookie/B-token selection and invalid bearer 401 |
| FUTURE K1B TRANSACTION CONTRACT | futureTransactionOrder/futureProtocol | Auth/security/lock/re-read/CAS/audit/outbox/receipt/commit order; no separately committed placeholder/network/persistence |
| IDEMPOTENCY CONTRACT | receiptKey/requestFingerprint/receiptSchema/futureProtocol | Strict versioned canonical command fingerprint rejects server IDs/time; raw key absent; bounded receipt; authorization-before-replay and no old state recheck specified |
| CONCURRENCY CONTRACT | scope/version expected revisions + futureLockOrder | Parent and every touched version CAS negatives; exact-row/non-owner/scope-first lock order contract; no actual PostgreSQL locking claim |
| AUDIT CONTRACT | eventSchema/transitionKnowledge/evaluateExpiryIntents | Typed operation/reason/actor variants; all publication/eligibility invalidations; stable expiry identity, shared-rights deduplication, no free content/error leakage |
| OUTBOX CONTRACT | outboxSchema/retryDelaySeconds/futureProtocol | Strict metadata-only/lease pair/retry cap tests; at-least-once, event dedup/CAS/re-read intent; no dispatcher |
| TESTS | 208 foundation + 35 security regressions | Required synthetic scenarios and pure input/snapshot ownership pass |
| LOCAL VERIFICATION | Commands/results below | Fresh reconstruction results only; local environmental omissions explicit |
| CI REQUIREMENTS | Existing seven mandatory gates unchanged | Starting exact-main run green; implementation PR run pending |
| ACCEPTANCE CRITERIA | Matrix, scope review, regression/CI inventory | Pure local acceptance complete; not merge-ready before current PR gates |
| STOP CONDITIONS | This live ExecPlan | No architecture blocker established; stop before K1B/K2; retain failing-gate recovery loop |
| OWNER-ONLY ACTIONS | No production operations | Real qualification/rights/bootstrap/source/PHI/deployment/rollout remains separately owner-authorized |
| EXPLICIT NON-GOALS | Static import/route test and changed-file review | No knowledge persistence, external sources, patient/FHIR/OpenAI/UI/mobile integration or clinical certification |

### Serializer vectors

Unit literal: `{"a":null,"b":["A","B"],"v":"k1a-c14n-v1"}`; SHA-256
`dbe3dbbca0c536d939464856a8bd5c57a25e0f642b4d770526bcced325476ce8`.
Full manifest: 1789 UTF-8 bytes; SHA-256
`aff00a044e86e71706c65f0fe0ae4589f97a6e2e55cf1c7edcb3c77c79b3b856`.
Full literal was independently authored from the normative field list using Python
stdlib json/hashlib, without importing/running the TS serializer; literal bytes and
digest are pinned in the test. It is a synthetic fixture, never clinical evidence.

### Test-to-mandatory-CI execution map

| File | Fresh targeted count | Mandatory workflow path |
|---|---:|---|
| knowledge/foundation/foundation.test.ts | 208 | app-checks -> pnpm --filter @workspace/api-server test (already explicit) |
| security/requestSecurity.test.ts | 35 | Same explicit API suite |
| auth/middleware.test.ts | 11 | Same explicit API suite, retained unchanged |
| auth/sessionSecurityContract.test.ts | 6 | Same API suite, newly registered existing file |

No new unregistered test file was created. All helpers are exercised through the
existing mandatory foundation test entry. JSON reporter verified 260/260, four
files, zero failures. Full API verbose output confirms session-security execution.

### Fresh local commands/results

All pnpm commands use corepack pnpm 10.26.1 or its /tmp/k1a-bin/pnpm shim; Node24.19.0.
All commands below exit zero except stated environmental failures.

| Command | Result |
|---|---|
| pnpm install --frozen-lockfile | Passed, 6m05s, unchanged lockfile |
| pnpm --filter @workspace/api-server exec vitest run foundation/security/middleware/sessionSecurityContract files | Four files, 260/260 passed; JSON reporter confirms per-file inventory above |
| pnpm run typecheck | Passed after final source changes |
| pnpm --filter @workspace/spartan-ai-tools test | 8 files, 94/94, 616ms |
| pnpm --filter @workspace/field-kit-catalog test | 10 files, 97/97, 777ms |
| pnpm --filter @workspace/api-server test | 50 files, 558/558 (final revision repair; duration recorded in PR ledger); live NPI unchanged and passed |
| pnpm --filter @workspace/api-server exec vitest run src/delivery/featureFlags.test.ts src/routes/health.test.ts src/routes/orgAdmin.test.ts | 3 files, 18/18, 2.72s |
| pnpm --filter @workspace/spartan-coaching test | 63 files, 328/328, 19.25s |
| pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand | 60 suites, 298/298, 29.936s; existing open-handle warning, exit0 |
| pnpm --filter @workspace/db test | 45 passed, 9 integration tests skipped without synthetic PostgreSQL; 7 passed files/1 skipped, 1.55s |
| pnpm --filter @workspace/db exec vitest run src/ops-readiness.test.ts | 6/6, 505ms |
| CI=1 PORT=5000 BASE_PATH=/ EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid OPENAI_API_KEY=ci-placeholder-no-network-calls pnpm run build | Passed; latest API-server build rerun after final changes also passed |
| node scripts/performance-budget.mjs | All budgets within limits |
| node scripts/release-gate.mjs | Automated suites passed; live/device/external production checks unverified |
| pnpm exec playwright install chromium webkit | Browser binaries installed successfully |
| pnpm exec playwright install --with-deps chromium webkit | APT setgroups/seteuid restrictions; exit100; browser-only installation supported actual Chromium test projects |
| CI=1 pnpm run test:e2e | Exit0; 50 passed, one passed on retry (desktop navigation keyboard case), one skipped under existing configuration, 1.4m |
| node scripts/forge-security.test.mjs | 2/2 passed, 751ms |
| node scripts/security/dependency-regression.test.mjs | 8/8 passed, 34ms |
| node scripts/security/patched-audit.test.mjs | 39/39 passed, 358ms |
| node scripts/security/patched-audit.mjs | pass-with-verified-source-mitigation; raw 1 low/20 moderate/3 high/0 critical, unchanged approved exact-artifact policy and 2026-11-01 expiry |
| pnpm --filter @workspace/db run migrate (DATABASE_URL unset) | TSX IPC listen EPERM before DB use; unavailable locally, no production database used |
| pnpm --filter @workspace/db run count-simulation (DATABASE_URL unset) | DATABASE_URL required, exit2; no isolated synthetic PostgreSQL/client available |
| git diff --check | Passed |

P02/P03 and migration application/count require current implementation CI services.
No clinical model/prompt/schema changed; AI-tool contracts passed. No independent
clinical evaluation certification is claimed; no established clinical suite to run
for this disconnected metadata-only foundation.

### Changed-file classification and publication checkpoint

EXPECTED K1A: foundation contracts.ts, resolver.ts, lifecycle.ts, foundation.test.ts;
new canonical.ts, authority.ts, publication.ts and future.ts (pure types/intents).
Request-security implementation/test only. DOCUMENTATION: this ExecPlan only.
TEST REGISTRATION: API-server package.json existing session test addition only.
UNEXPECTED: none. No migrations/schema/API generation/lockfile/security-policy/
OpenAI/FHIR/client/infrastructure changes. Full diff reviewed, formatting limited
to these TS files; no debug code/temporary scripts/actual clinical content committed.

The first reconstructed safety checkpoint was published through the GitHub connector
because git push has no local HTTP credential. Reviewed tree
`33f4cf455c626f0d7df2a9756e74e73354f4b9f2` matched local and remote exactly.
Remote checkpoint commit `092db92c31276c9416899766f42466e5175643e1` has starting-main
parent. Local branch ref was aligned to this identical tree without changing index
or working files. No human work was discarded. Implementation PR publication,
current-head/base CI and merge/main evidence will be recorded below and in the PR.

Exact pinned local Gitleaks 8.24.3 full-history command
`gitleaks detect --source . --verbose --redact --exit-code 1` passed: 1508 commits,
54.70 MB scanned, 6.63s, no leaks. Binary extraction required --no-same-owner in this
container; scanner/version/flags were not changed. No security exception was added.

## Implementation publication ledger

PR: https://github.com/Thordadpool5413/SpartanCoaching/pull/186
Branch: `fix/k1a-foundation-contracts`; base `main`.
Safety checkpoint: `092db92c31276c9416899766f42466e5175643e1`.
Runtime implementation commit: `a324b825da120d32f14c3060009f5fdec72bb9f2`.
Base at publication: `04dac293251b20955fadefe51582670ec3f98149`.
Reviewed/published runtime tree: `861f3e00699947668cd262f4cf2acc8e07185e3b`.
The remote commit/tree was read back and matches the reviewed local tree. Local
ref alignment preserved all files/index; git push lacks a local credential, so
connector publication is used with exact tree checks and fast-forward updates only.

Initial PR workflow: https://github.com/Thordadpool5413/SpartanCoaching/actions/runs/37158526377
It was in progress when this record was written. This evidence-recording commit
changes the PR head, so that initial run is historical, not final merge evidence.
Require a fresh full run for the updated current head/base.

The linked PR body is the publication ledger for final current PR_HEAD_SHA,
PR_BASE_SHA, CI_RUN_ID, synthetic CI_TESTED_SHA/parents, seven individual gate
results, K1A_MERGE_SHA and exact post-merge push CI/run/SHA. These values are only
known after this version-controlled record is committed and its gates execute.
Read that linked ledger together with this plan to continue without the conversation;
never infer success from a pending checkbox or substitute the initial run.
Immediately before merge refresh origin/main and integrate/retest if it advanced.
No required gate was removed or weakened. No production operation is authorized.

Local acceptance is complete; terminal PR/main verification is pending at this
record's timestamp. No unresolved architecture blocker. Remaining environmental
items: real synthetic PostgreSQL migration/equivalence/recovery proof comes from
current CI; live/device/external release checks are not verified by this packet.
Owner-only production/reviewer/rights actions were not performed.
After verified merge stop; next action is fresh independent Astra adversarial review
of K1A, with no automatic K1B/K2 authorization.

Final pre-merge adversarial review found an additional source revision isolation
edge: domain visibility was classified by stable source ID before matching the
artifact's pinned metadataRevision. A new unpublished revision could therefore
poison an older inaccessible publication. Targeted pre-fix reproduction
`vitest run foundation.test.ts -t 'unpublished source metadata revision'` failed
locally with KNOWLEDGE_REFERENCE_INVALID (not pushed as a red assertion).
Visibility now matches exact version/source metadata revision before payload
validation. The permanent test proves complete result equality. No architecture
change or scope expansion; current PR CI must be refreshed for this repair.
Repair validation: JSON inventory 260/260 targeted (foundation 208, security 35,
middleware 11, session 6); full API 558/558 across 50 files, 6.89s. Final typecheck
and API build passed. Prior unchanged web/mobile/browser/security checks remain
valid. This is an implementation defect correction; prior PR runs are stale after
this commit and cannot authorize merge.

## K1A-REPAIR implementation — 2026-10-04

Approved packet: `docs/architecture/knowledge-2026-10-03/04-k1a-repair.md`.
Starting main: `7b5a1cbff2086f0b5dffca744882efb66ea04ee0`.
Starting exact-main CI: `37159495581`, all seven jobs successful.
Feature branch: `fix/k1a-repair-contracts`. Main was clean and unchanged from review.
User authorizes this bounded repair through normal PR merge and verified main.
No production activation, persistence, K1B/K2 or clinical integration is authorized.

Prior completion claims are corrected by the adversarial review: eight unresolved
PR #186 findings map to seven HIGH defects. Fifteen external synthetic review
scenarios reproduced the current failures before editing, plus the named Express
route casing probe. The governing mandate/ADRs/ExecPlan and complete implementation
were read in this conversation; current affected code, package/CI registration and
approved packet were rechecked. No alternative architecture is selected here.

### Implemented repair and acceptance evidence

H1–H7 implementation and local acceptance are complete. PR/main verification is
pending until the publication ledger below records the exact current runs. This
checkpoint is not a completion claim from local tests alone.

| Requirement | Implementation | Committed regression evidence |
|---|---|---|
| H1 | `requestSecurity.ts` ASCII-folds reserved path before legacy early return; cookie-first Origin rule preserved | `requestSecurity.test.ts`: named real Express routes, actual cookieParser/guard/loadSession/requireAuth chain, uppercase/mixed/base/child/trailing/query and credential/origin matrix; encoded/double slash/lookalike/safe method behavior |
| H2 | `authority.ts`: same exact credentials at attestation T and now N; current revocation and membership; bounded approval/LKG windows. `contracts.ts` and resolver require distinct LKG health pin | `H2 exact credential history and current authority`: before/equal/after effective/verified times, expiry/due equality, no replacement credential, membership, missing health pin, health revocation/expiry |
| H3 | Strict trusted-context validator, atomic creation/verification, exact parent revision/provenance, finite subset windows, iterative ancestry, context-bound synthetic roots | `H3 trusted atomic delegated issuance`: actor/session/org/recipient negatives, A→B→C→D, 2,000 records, cycles, historical parent revocation and later departure, synthetic descendant denial |
| H4 | `publication.ts` causal instant ordering; service dates independent; reducer and authorized resolver validate imported/current assignments | `H4 publication causality remains separate from service dates`: ordered/equal/reversed adjacent pairs, retrospective coverage, reapproval/refresh history; existing UTC and supersession/rollback regressions retained |
| H5 | Option C only: authority-level events; no assignment list/hints/chunks/count; fresh canonical eligibility denies without notification delivery | `H5 authority reconciliation at 100, 101 and 4,000 publications`: all six required operations, complete synthetic reconciliation targets, schema-valid outputs, unchanged inputs and fresh denial |
| H6 | Sorted exact witnesses, pre-mutation revisions, actual attestors; revision-qualified rights IDs/overlays; stable condition-specific expiry IDs/time; final state/event/reference validation | `H6 witnesses, revision-specific rights and stable expiry`: separate/same LKG grants, all 190 predicates, multi-domain licensing, distinct terms revisions, conflict rejection, duplicate/stale/gap reconciliation, body limit, invalid witness/aggregate/output rejection |
| H7 | `future.ts`: 5,000 ms before authentication DB/pool; remaining-budget arithmetic; 1,000 ms cleanup only; confirmed abort vs unknown commit; current-authorized receipt replay; ordered FOR UPDATE writer participation; exactly one scope | `H7 future adapter deadline and writer contract (no database implementation)`: boundary math, no zero/reset, cause/outcome mapping, replay order, multi-scope denial, numeric identity lock order. Actual PostgreSQL races remain future K1B work |

Strict public transition/expiry/resolver/witness schemas parse final constructed
outputs. Capacity tests cover source 500, version/grant/qualification/member 2,000,
assignment 4,000 (including retired history), approval 100, expected-revision 2,000,
witness 256, receipt 2,000/4,000/1, expiry 16,000 and authorized resolver 8,000/two
scopes, including boundary+1 rejection. Growth commands preflight every history
append and safe revision arithmetic. Security revocations work at assignment
capacity. Final state-aware validation rejects missing domain predicates and
misidentified credential revisions/references. Whole-domain grants predicates are
not duplicated into competing partial witnesses; maximum generation remains 190.
Canonical command actors are checked against current canonical membership even
when a whole-domain grant supplies every predicate.

Compatibility: registry/event/fingerprint v3; review/runtime manifest v2, `kb2:`
and `k1a-c14n-v1` unchanged. Both literal canonical golden vectors still pass.
`canonical.ts`, auth middleware, route mounts, CI, dependency policy, package files
and lockfile are unchanged. No new dependencies. All 12 changed files are the
nine expected implementation/test files, this plan, `.agent/PLANS.md` and the
verbatim approved repair document (SHA-256
`244f07f67284419b7514b39fab8724c25b18a508cfc2c9f597952daec81ca6e3`).

### Eight PR #186 discussions

Each disposition must be posted with the repair commit and PR link before resolving
its original thread. No discussion is considered repaired merely by this table.

| Original discussion | Disposition | Specific evidence |
|---|---|---|
| 4175208372 | FIXED — H2 | `hasCurrentApproval`, `licenseAllows`, `healthState`; dual-time matrices for exact qualifications and grants |
| 4175208376 | FIXED — H3 | `validateGrantDelegation`, `validateGrantAncestry`, strict issuance metadata; backdating/window/context/lineage regressions |
| 4175208382 | FIXED — H6 | `evaluateExpiryIntents` VERSION aggregate equals actual version ID; approval remains condition/reference; stable-body/identity regression |
| 4175208386 | FIXED — H1 | ASCII path folding before `/api` early return; named uppercase route now 403 for unsafe untrusted cookie requests |
| 4175208391 | FIXED — H4 | `validateAssignment` full chronology; every adjacent pair equality/reversal plus imported/refresh history tests |
| 4175208397 | FIXED — H2/H6 | Required healthGrantId plus complete actor health/review witnesses and supporting actual attestors; distinct and shared grant tests |
| 4175208400 | FIXED — approved H5 Option C | No enumerated invalidation payload; all six operations succeed/reconcile at 100/101/4,000; strict final event/state parsing |
| 4175208404 | ARCHITECTURALLY_DISPOSITIONED AND IMPLEMENTED — H7 future contract | Deadline starts before first auth DB/pool/lock; arithmetic, error/uncertainty/replay/order regressions. No persistence implementation claimed |

### Exact local verification

Node v24.19.0; repository pnpm 10.26.1. A temporary Corepack shim at the front of
PATH ensures nested scripts also use pinned pnpm (the machine fallback is 11.25.0).
Commands below use that pinned binary; no repository tool/dependency changes.

| Command | Actual result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS, lockfile unchanged |
| `pnpm run typecheck` | PASS; also rerun by successful final full build |
| `pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts src/security/requestSecurity.test.ts src/auth/middleware.test.ts src/auth/sessionSecurityContract.test.ts` | PASS: 497/497, 4 files (foundation 390, guard 90, middleware 11, session 6) |
| `pnpm --filter @workspace/spartan-ai-tools test` | PASS: 94/94, 8 files |
| `pnpm --filter @workspace/api-server test` | PASS: 795/795, 50 files; generated/openapi pretests also pass |
| `pnpm --filter @workspace/spartan-coaching test` | PASS: 328/328, 63 files |
| `pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand` | PASS: 298/298, 60 suites |
| `CI=true PORT=5000 BASE_PATH=/ EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid pnpm run build` | PASS: complete workspace including iOS/Android static bundles; synthetic build only, no deploy |
| `CI=true pnpm run test:e2e` | PASS: 51 passed, 1 existing project-conditional skip, 52 total |
| `pnpm run release-gate` | PASS automated suites; 3 existing PostgreSQL integration skips; live health/parity/auth, device and external checks explicitly UNVERIFIED |
| `pnpm audit --audit-level high` | EXIT 1: 24 findings (3 high, 20 moderate, 1 low); not represented as raw-audit success |
| `node scripts/forge-security.test.mjs` | PASS: 2/2 |
| `node scripts/security/dependency-regression.test.mjs` | PASS: 8/8 |
| `node scripts/security/patched-audit.test.mjs` | PASS: 39/39 |
| `node scripts/security/patched-audit.mjs` | PASS with existing exact-artifact mitigation; all three approved high advisories attested, unchanged expiry 2026-11-01 |
| `pnpm exec prettier --check` on all nine changed TypeScript files | PASS |
| `git diff --check` | PASS |

Unexpected environment findings: initial unconfigured build failed for missing
EXPO_PUBLIC_DOMAIN; with the synthetic domain but without CI, Expo Bonjour hit
`uv_interface_addresses` unavailable in this container. Re-running with the same
CI settings as GitHub succeeded without code changes. Initial audit-policy command
spawned pnpm 11 fallback and rejected its incompatible `muted` report field; pinned
pnpm 10.26.1 passed the unchanged policy. Playwright download retried a truncated
mirror response successfully; browser tests then passed. These initial failures
are retained here and not concealed as code repairs.

Local P02/P03 PostgreSQL integration/recovery and full-history gitleaks were not
run: PostgreSQL server/client, Docker and gitleaks are absent. Require the exact PR
and post-merge GitHub jobs for this evidence. H7 actual multi-connection database
races are intentionally not implemented/tested in K1A. No Terraform or clinical AI
evaluation applies: no infrastructure, prompts, models, clinical schemas/retrieval
or clinical integration changed.

### Mandatory CI and publication ledger

All 237 new regressions are in the existing mandatory foundation and request
security files. The API `test` script explicitly includes both plus middleware and
sessionSecurityContract; `.github/workflows/ci.yml` runs that script in Application
typecheck, test, and build, which is required by the aggregate job. No test was
split, skipped, deregistered or made optional. All seven original CI jobs remain.

The repair PR against `main` is the terminal publication ledger. Its body records
actual implementation commit/head/tree, original-thread disposition links, exact
PR CI job results and synthetic tested SHA, pre-merge main refresh, merge SHA and
post-merge main run/job results. Those values are only available after this
checkpoint is committed. Read that PR ledger with this plan; a green PR alone is
insufficient and no prior/historical run authorizes this repair's merge.

Complete diff and file inventory reviewed before intentional staging: no app/client,
database, migration, dependency/lockfile, CI policy, production URL/secret, runtime
integration or canonical serializer changes. No debug or generated artifacts staged.
No architecture blocker. No owner-only operation is required for this code repair
or has been performed. Clinical runtime remains disconnected. No K1B, K2,
persistence, PHI, clinical/FHIR integration or production activation started.
After authorized merge and green main, stop. The next permitted step is a fresh
independent Astra adversarial review in a different conversation before K1B.

### K1A-REPAIR publication checkpoint

Repair PR: https://github.com/Thordadpool5413/SpartanCoaching/pull/187
Implementation commit: `c917a54659b7a3651d2b08fdb02bcd95055ce0b1`.
Verified implementation tree: `9110169d623751ffb9dbb72dc9c37090538fbe34`.
Local git push lacked credentials; the connected GitHub app published the exact
reviewed tree. Each uploaded blob matched its local Git SHA; the full remote tree
and starting parent were verified before local branch alignment. No file/index
changes or human work were discarded, and no protected/main ref was pushed.
This follow-up is documentation only and records the durable handoff link. The PR
body is the terminal ledger for its final head, required CI, all eight thread
resolutions, authorized merge and post-merge main verification. Require a current
full run after this checkpoint; do not substitute the initial PR run.

### PR #187 review follow-up (same approved packet)

The initial final-head PR run `37224580579` passed all seven jobs, but the automatic
code review of implementation commit `c917a546` then found two additional H2/H3/H6
contract gaps. That green run does not authorize merging the updated code.

- Discussion `4178823627`: final-result validation checked individual witness
  domains but could accept a union of partial grants for a whole-domain revocation
  predicate. The public result schema now requires one identical referenced grant
  covering every target domain for each target capability, matching the producer.
- Discussion `4178823630`: rejecting any synthetic ancestor in the entire authorized
  partition hid the required per-publication denial states. The resolver now checks
  read ancestry before inspecting publication payloads, filters ineligible read
  authority, and leaves referenced attestation eligibility to the exact review,
  rights and health predicates. Same-scope bounded ancestry validation is shared;
  malformed/cyclic provenance still fails closed. This does not authorize a
  nonsynthetic reader through a synthetic ancestor or change bundle precedence.

Five focused regressions failed before the fixes (0 pass / 5 fail), then passed.
The three attestation variants now also retain an independently valid publication
in the decision set. Existing tenant isolation and canonical golden vectors pass.
The new cases stay in mandatory `foundation.test.ts`; total new regressions = 242.
Latest targeted verification: 502/502 (foundation 395, guard 90, middleware 11,
session 6). Full API rerun passes 800/800 across 50 files (49.13s), including generated
contract/OpenAPI pretests. Root typecheck and API build pass after these fixes. The broader client,
mobile, browser, policy and workspace-build results above remain unchanged; no
related files changed. Fresh seven-job PR/main evidence is required before completion. No architecture change, scope expansion or new owner
authorization is needed for these corrections.

## PR #187 seven-finding follow-up — 2026-10-04

This is a bounded implementation correction under the unchanged approved
`04-k1a-repair.md`, explicitly authorized through normal PR merge and verified
post-merge main. Do not restart K1A or begin the next packet.

Starting main: `8f1afddf990a37e67656ceca78502efcbf227cef`.
Latest starting main CI: `37226336418`, completed successfully with all seven
required jobs. Branch: `fix/k1a-repair-seven-review-findings`.
The transient checkout had been cleared between turns; it was restored from
the committed main tree into the same workspace, then fetched, checked out and
fast-forward synchronized. No human changes were present or discarded.

All seven unresolved comments against PR #187 head `781f558e` were read before
editing. Governing instructions, current ExecPlan, relevant unchanged packet
sections, implementation and mandatory test registration were inspected.
Scope is exactly these findings:

| Finding | Observed root cause | Required correction |
|---|---|---|
| 4178885928 | Ancestry accepts every parent revision below current | Exact issuance revision, accounting for one later revocation |
| 4178885930 | Final resolver schema trusts caller's aggregate state | Derive state using existing context/configuration/blocking precedence |
| 4178885932 | Duplicate-registration output returns after shape checks | Reuse full reducer semantic state validation before accepting no-op |
| 4178885936 | Warning evaluation is gated on CURRENT health | Emit due warning boundary for already-stale applicable publications |
| 4178885940 | Publication references are validated only when non-null | Require each operation's direct new/predecessor publication references |
| 4178885945 | Authorized scope check accepts supersets | Exact deterministic configuration scope set |
| 4178885949 | Supplied CAS keys need only exist in the partition | Exact touched-version keys, including empty no-op/credential sets |

Initial regression cases are in the existing mandatory `foundation.test.ts`;
implementation and fresh verification evidence will be recorded below.
No changes to H5 Option C, witnesses, rightsRevisionId, H7 policy, canonical
serialization, manifest formats, tenant/rights-purpose models, CI policy,
dependencies, lockfile, database, clients, clinical integrations or production
configuration are authorized. No architecture blocker has been identified.

### Follow-up implementation and reproduction evidence

All seven defects reproduced before production edits: the focused run had
61 failures and 6 passing controls across 67 cases. After implementation all
67 pass. The original 395 foundation cases remain enabled and pass as well.

| Finding | Small implementation correction | New committed cases (before → after) |
|---|---|---|
| 4178885928 | Historical parent revision must equal current revision when unrevoked, or current minus the single later revocation; at/before-issuance revocation still denies | 6 ancestry/runtime cases: 3 fail + 3 controls → 6 pass; valid child survives later parent departure/revocation |
| 4178885930 | Producer and public schema share the existing aggregate-state calculation and precedence in `deriveResolverState`; schema compares the serialized state | 16 precedence/context/configuration/empty/denial-tampering cases: 16 fail → 16 pass |
| 4178885932 | Duplicate/no-op result schema invokes the same full `validateState` as the reducer; semantic exceptions become schema rejection | 12 shape-valid dangling/cross-scope/duplicate/rights/lineage/overlap/chronology/ancestry corruptions: 12 fail → 12 pass |
| 4178885936 | Warning boundary is evaluated for every nonretired publication carrying it; no CURRENT-only gate | 3 health states: 2 fail + 1 control → 3 pass; before/equal/after deadline, stable identity and no mutation |
| 4178885940 | Public event schema requires direct source/version/assignment/approval and operation-specific predecessor references before state-aware target checks | 18 ACTIVATE/SUPERSEDE/ROLLBACK/REFRESH_APPROVAL cases: 18 fail → 18 pass |
| 4178885945 | Authorized scope IDs must exactly equal sorted unique configuration scopes; duplicate configurations fail | 5 extra/missing/duplicate/order/configuration cases with recomputed hash: 3 fail + 2 controls → 5 pass |
| 4178885949 | Existing `touch` CAS checks record touched IDs; unrelated supplied entries fail before normal or duplicate success | 7 operation classes: 7 fail → 7 pass; current/stale extras, missing/stale required versions, shared rights, predecessor versions and empty credential/registration/no-op maps |

`stateValidation.ts` only extracts the existing ancestry and reducer semantic
checks for reuse without circular schema initialization. The existing ancestry
export remains available from `authority.ts`. `blockingPrecedence` retains its
existing values/order and resolver export. No new authority model or validator
policy is introduced. The fixture transition helper now supplies exact mutation
targets; negative CAS cases use explicit maps independently of that helper.
Every new case is under `PR187 seven-finding follow-up` in the existing mandatory
`foundation.test.ts`, explicitly run by the unchanged API `test` script and
Application typecheck, test, and build CI job, required by the aggregate gate.

### Follow-up local verification

Node 24.19.0 and pinned pnpm 10.26.1. A temporary Corepack PATH shim ensures nested
scripts use the same pinned package manager. Exact commands and final outcomes:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; 7m31s restore, no lockfile/dependency changes |
| `pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts -t 'PR187 seven-finding follow-up'` | Baseline: 61 fail / 6 pass; fixed: 67/67 pass; other tests excluded only by this reproduction filter |
| `pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts src/security/requestSecurity.test.ts src/auth/middleware.test.ts src/auth/sessionSecurityContract.test.ts` | PASS 569/569, no skips: foundation 462, guard 90, middleware 11, session 6 |
| `pnpm --filter @workspace/api-server test` | PASS 867/867, 50 files; generated/OpenAPI pretests also pass |
| `pnpm run typecheck` | PASS, root and all workspace targets |
| `pnpm --filter @workspace/spartan-ai-tools test` | PASS 94/94, 8 files |
| `pnpm --filter @workspace/spartan-coaching test` | PASS 328/328, 63 files |
| `pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand` | PASS 298/298, 60 suites |
| `CI=true PORT=5000 BASE_PATH=/ EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid pnpm run build` | PASS complete workspace, including native static bundles; no deployment |
| `CI=true pnpm run test:e2e` | PASS: 50 passed, 1 flaky passed on existing retry, 1 existing project-conditional skip; unchanged desktop navigation focus assertion at `e2e/public-site.spec.ts:892` |
| `pnpm run release-gate` | PASS automated suites; 3 PostgreSQL integration skips; live/device/external paths UNVERIFIED |
| `pnpm audit --audit-level high` | EXIT 1: 24 findings, 3 high / 20 moderate / 1 low |
| `node scripts/forge-security.test.mjs` | PASS 2/2 |
| `node scripts/security/dependency-regression.test.mjs` | PASS 8/8 |
| `node scripts/security/patched-audit.test.mjs` | PASS 39/39 |
| `node scripts/security/patched-audit.mjs` | PASS existing exact-artifact mitigations; unchanged scope/hashes/2026-11-01 expiry |
| `pnpm exec prettier --check` on all six changed/new TypeScript files | PASS |
| `node scripts/performance-budget.mjs` | PASS |
| `git diff --check` | PASS |

Environment observations: a test startup attempted before dependency installation
completed could not resolve `convert-source-map`; it ran no tests and is not the
baseline reproduction. The complete pinned install resolved this. Playwright's
download mirrors retried truncated archives and installation completed successfully.
The existing browser retry policy and test remain unchanged. PostgreSQL server,
psql, pg_dump, Docker and gitleaks are absent locally; require current PR and main
P02/P03/full-history-secret jobs rather than claiming local verification. No
Terraform or clinical AI evaluation is applicable to these disconnected changes.

### Follow-up publication and stop boundary

Complete diff reviewed: six foundation TypeScript files (including the shared
validator) and this ExecPlan only. No source outside the bounded seven findings,
test deregistration, generated artifacts, secrets or real clinical content staged.
The follow-up PR for `fix/k1a-repair-seven-review-findings` is the terminal ledger
for exact commit/head/tree, seven discussion replies/resolutions, current-head CI,
immediate pre-merge main refresh, normal merge SHA and exact post-merge main jobs.
These publication identifiers are recorded there after this checkpoint commits;
the old PR #187 green run is not verification of this follow-up.

No architecture blocker or owner-only action is required. Do not claim completion
until the follow-up is merged and all seven post-merge jobs pass. No K1B, K2,
persistence, migrations, production knowledge API, PHI, FHIR/clinical AI integration
or production activation has started. Stop after this repair is green on main.

### PR #188 review closure within the same seven findings

The first follow-up commit `1d5f2e5c7297dfab8e37d4e22152e870b0e396a7`
passed all seven jobs in run `37243977661`. Before merging, automatic review
reported three residual cases within the original seven-finding scope. They are
fixed in the same PR #188; the earlier green run is not final-head verification.

| Review refinement | Original finding | Correction and regression evidence |
|---|---|---|
| 4179796452 | 4178885930 | Per-publication `SCOPE_DENIED` is impossible after authorized projection and is rejected by the entry contract; top-level empty-inventory denial remains valid. Two single/mixed entry cases reproduce acceptance with recomputed hashes. Existing precedence is unchanged. |
| 4179796454 | 4178885940 | A replacement cannot identify itself as predecessor. Direct event references must match the new assignment's predecessor, source/document/scope and creation event/time, and the actual predecessor's retirement event/time. Twenty-one cases cover self/unrelated/source/document/unretired/creation/retirement mismatches across SUPERSEDE, ROLLBACK and REFRESH_APPROVAL. |
| 4179796458 | 4178885932 | Shared semantic validation closes approval, rights and LKG grant/qualification/member references and their subject identity. Twenty-three missing/wrong-subject/removed-member cases plus one valid revoked/inactive historical-authority control. Historical provenance does not require current credential eligibility. |

Focused command:
`pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts -t 'review closure'`.
Before these source edits: **46 fail / 1 passing control**. After: **47/47 pass**.
Total new regressions in this follow-up: **114** (67 original + 47 review closure).
All run through the unchanged mandatory API command and Application CI job;
no new test registration or CI policy change was needed.

Final local reruns after review closure:

- The same targeted foundation/security/auth command: **616/616**, no skips
  (foundation 509, guard 90, middleware 11, session 6).
- `pnpm --filter @workspace/api-server test`: **914/914**, 50 files, 54.96s;
  generated-contract, normalization and OpenAPI pretests also pass.
- `pnpm run typecheck`: **PASS**, root and all workspace targets.
- `CI=true PORT=5000 BASE_PATH=/ EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid pnpm run build`:
  **PASS**, full workspace and native static bundles; no deployment.
- Formatting of all six TypeScript files, `git diff --check`, and performance
  budgets: **PASS**.

Only contracts, shared state validation, regressions and this ExecPlan changed
since the first follow-up commit. The broader AI/web/mobile/browser/security
results and local infrastructure limitations above remain recorded; fresh
current-head CI must rerun every mandatory job before merge. The PR body records
the final build result, final head, all seven original discussion resolutions
and these three refinements, exact current-head CI and post-merge main evidence.
There is no architecture change, new packet, owner-only action or blocker.

### October 8 continuation of PR #188

The saved head `8924e40e5713aa8b23ec7715013b35345d41e603` passed all seven
jobs in `37245036190`, but review completed with two residual cases. This
continues the same branch/PR and does not restart K1A or its architecture work.

Refreshed main on resumption: `2941c8775f9e459019282616685e3d60ecf362e6`.
Its latest push CI `37664485304` was cancelled: secret scan, dependency audit,
application, browser and P02 passed; P03 was cancelled and the aggregate failed.
PRs #189/#190 added container verification and dependency repairs in six files;
the governing packet and foundation were unchanged. Those exact main changes
are merged into the existing repair branch without modification or conflicts.
Relative to current main, this PR still changes only the six foundation files
and this ExecPlan. Current-head CI must also pass the new API-container workflow.
The transient checkout was restored from the saved Git objects; no human work
was overwritten and no implementation was recreated.

| Review refinement | Original finding | Root cause and bounded correction |
|---|---|---|
| 4179840038 | 4178885930 | Per-entry state denial was rejected, but contradictory reason codes remained accepted. Bind the single reason code to the evaluated state, matching the existing producer exactly. No manifest format or precedence change. |
| 4179840042 | 4178885940 | Split-cutover history shares the predecessor and creation event with the replacement. Require the publication target's version to be ACTIVE and its interval to retain the predecessor's end, distinguishing the replacement from the history sibling. No publication algorithm or event format change. |

Eight regressions are added under `final review reason and replacement closure`
inside the mandatory foundation suite: empty/denied/mixed/contradictory reasons,
and SUPERSEDE/ROLLBACK history retargeting with consistent event references and
witnesses, including forged ACTIVE state. Valid producer results are controls.

The focused command
`pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts -t 'final review reason and replacement closure'`
reproduced **8 fail / 0 pass** before source edits, then **8/8 pass**. Total new
regressions for the seven findings are now **122**: 6 / 22 / 36 / 3 / 43 / 5 / 7
in the table's original finding order. All remain in the unchanged mandatory API
test command. Targeted foundation/security/auth rerun: **624/624**, no skips
(foundation 517, guard 90, middleware 11, session 6). Full API: **922/922**, 50
files, 67.27s; generated/OpenAPI pretests pass. Root typecheck passes.

Frozen installation with pinned pnpm 10.26.1 passes (4m52.9s), with no changes to
main's dependency files. AI tools: **94/94**; web: **328/328**. The first mobile
run passed 297/298, with the unchanged production-screen Sales Workflow probe
exceeding 5 seconds during concurrent local suites; no timeout/test/product edit
was made. The final mobile rerun and broader results are recorded below.

Raw `pnpm audit --audit-level high`: exit 1, **3 high / 24 moderate / 1 low**.
Current main's existing exact-artifact policy passes with its existing three
source mitigations and unchanged scope/expiry; this repair does not renew or
edit attestation hashes. Forge, dependency regression and audit-policy rejection
suites pass (2/2, 8/8, 39/39). All six changed TypeScript files pass formatting;
`git diff --check` passes. No Docker/PostgreSQL/gitleaks binary is available
locally, so exact current-head CI must supply those existing checks.

The full mobile suite rerun without competing builds passes **298/298**, all
60 suites, 10.856s, using the unchanged command and five-second timeout. Full
workspace build (including native static bundles), performance budgets and the
automated release gate pass. The release gate retains three local PostgreSQL
skips (162 pass / 3 skip in its security suite); live/device/external checks are
unverified and outside this repair. No deployment or production activation ran.

`CI=true pnpm run test:e2e` passes: **50 passed, 1 flaky passed on its existing
retry, 1 existing project-conditional skip**, 1.4m. The same unchanged desktop
navigation focus assertion at `e2e/public-site.spec.ts:892` retried; no browser,
client or retry-policy changes were made. The full workspace build used
`CI=true PORT=5000 BASE_PATH=/ EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid pnpm run build`.

The complete diff against refreshed main remains seven files. The two source
checks, eight regressions and this continuation record are the only new edits
since the saved PR head. All inherited main files were compared byte-for-byte.
The final commit includes current main as a merge parent and preserves the
existing feature history. PR #188 remains the terminal ledger for final head,
fresh CI (all seven required jobs plus the existing container workflow), review
resolutions, immediate pre-merge refresh, merge SHA and post-merge main evidence.
No architecture blocker, owner-only operation or next-packet work is introduced.
