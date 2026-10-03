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
