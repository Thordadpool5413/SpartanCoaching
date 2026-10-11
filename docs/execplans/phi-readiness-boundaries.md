# Bounded PHI-readiness corrections

## Approved packet and boundary

Implement the owner-provided `PHI-READINESS BOUNDED IMPLEMENTATION` packet
(2026-10-11): explicit tenant review authority, one shared runtime/verifier
readiness contract, explicit OpenAI ZDR, truthful health and focused synthetic
regressions. Preserve server-mediated GCS, temporary purge and human review.
No K1A/K1B redesign, K2, FHIR, Firebase application SDK, dependencies, patient
persistence, migration or production activation. Database migration: NONE.

Owner-confirmed agreements/project/storage/scanner facts are accepted as packet
inputs; repository checks do not independently attest vendor settings or activate
PHI. No production secrets, configuration, IAM, bucket or account changes.

## Starting evidence and governing sources

- Main `4e66375cfee6e6dc7a2f9e8c30691b1fdb34a442`, clean after fetch/prune,
  checkout/pull --ff-only. Exact-main push CI `38166525188`: all seven jobs green.
- Branch `fix/phi-readiness-boundaries` created from that SHA.
- Read AGENTS.md, .agent/PLANS.md, active K1B plan and relevant clinical-cloud
  history, ADR-004 authority and ADR-005 retention, target/security contracts.
- Inspected shared clinical/runtime/provider helpers, control access, canonical
  membership/session rules, patient-review routes/extraction, GCS storage/purge,
  health, production verifier, tests and four directly affected operator docs.

## Implementation checklist

- [x] Refresh main, verify exact-main CI and create bounded branch.
- [x] Reproduce authorization/readiness/health/verifier defects with regressions.
- [x] Apply smallest approved fixes; preserve non-viewing clinical administration.
- [x] Verify extraction and structured calls retain store:false; preserve storage,
      purge, content-free audit and human review with runtime regressions.
- [x] Run focused tests, complete relevant local gates and review full diff.
- [x] Publish one bounded PR with reviewed code, regressions and local evidence.
- [ ] Fix any bounded review/CI defects; require fresh final-head verification.
- [ ] Refresh main, merge normally, inspect exact-main jobs and internal summaries.

## Findings and implementation evidence

Starting source confirms platform_admin contributes canAdmin and review accepts
canReview OR canAdmin. Runtime hides missing PHI controls after deidentified
fallback; verifier duplicates a weaker gate list; clinical health hardcodes ready.
Current patient extraction and structured runner already use store:false. GCS
checks and temporary retention are existing systems, not new designs.

Baseline regressions against the starting implementation: shared runtime, API
readiness/verifier and health had 59 failing / 21 passing tests in three files.
The role-only permission writer additionally failed all four new administration
boundary regressions: platform/organization roles could self-grant review, while
an explicit clinical administrator without an organization role could not manage
permissions. These failures were reproduced before the respective fixes.

### Implementation and mandatory regression mapping

| Packet requirement | Implementation and committed evidence | Mandatory CI command |
| --- | --- | --- |
| Explicit review authority | `clinical/access.ts` checks active matching server membership and nonrevoked tenant/member permission; review requires only `canReview`, never role/admin. `access.test.ts` and actual `patientReviewRoutes.test.ts` deny role-only, Elite-only, admin-only, revoked, foreign and inactive contexts and allow explicit review, including company members with `canUse=false`. | `pnpm --filter @workspace/api-server test` |
| Non-viewing administration | `aiToolRoutes.ts` permission writer requires explicit `canAdmin` instead of platform/org role; actual endpoint tests deny self-grant by roles, allow explicit admin without review/use and deny revoked/foreign targets. Existing target-member tenancy remains. | API test above |
| Recent MFA | Patient middleware checks session ID, actor member ID, live session expiry and finite nonfuture MFA age at most fifteen minutes. Missing/expired/future/invalid/foreign-session regressions. Rejected responses also use no-store. | API test above, including existing auth/session/request-security suites |
| Canonical configuration / ZDR | One dependency-free `clinical-runtime-contract.js`, TS declarations and existing wrapper: fifteen controls, explicit ZDR plus confirmation; all consumers use the same evaluator. Existing usable-key predicate moved unchanged to `provider-key-contract.js`, shared with the offline verifier. Legacy Modified Retention cannot prove ZDR. Every missing control, invalid retention, exact flags, unusable key, partial activation and intentional education override are covered. | API test above (spawns the actual offline script); `pnpm --filter @workspace/spartan-ai-tools test` |
| Truthful health / disabled acceptance | `health.ts` exposes real ready/missing names and HTTP 503 for incomplete requested PHI. Both aliases, each missing control, secret absence and ordinary education tested. Capability metadata requires review rather than admin. | API test above; existing delivery / release-gate health tests |
| OpenAI retention | Existing extraction and structured analysis remain `store:false`; PDF/PNG/JPEG calls and every structured retry have payload assertions. No model/prompt/schema/retrieval change. | API test above includes `patientExtraction.test.ts`; shared tools test includes `server.test.ts` |
| Scanner / GCS | PHI scanning explicitly rejects a missing/blank bearer token before fetch. Existing server GCS, tenant keys and bucket/deletion guards preserved. Tests exercise public prevention, uniform access, versioning, soft delete, retention, post-delete absence and authenticated scanner without document bytes/names. | API test above includes `storage.test.ts` |
| Temporary model / human review / bounded errors | Actual patient endpoints exercise required human confirmation, foreign session rejection, finalize purge before one-time result/watermark, cancel purge, model failure purge, cleanup-pending metadata and no durable synthetic patient/model/filename content. Sweep logs an outcome code rather than SDK text; sentinel tests cover errors/logging. | API test above includes `patientReviewRoutes.test.ts` |

Four newly mandatory API files are access, extraction, product contract and patient
routes. Existing mandatory readiness/storage/health/shared-runner tests remain;
no test or CI policy was removed or weakened. API package `test` registration is
the only package manifest change; dependencies and lockfile are unchanged.

### Exact local verification

Commands use repository-pinned pnpm 10.26.1 via Corepack. No production env or live
patient input was used. Tests use synthetic configuration and mocked external
PHI-path services.

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS, lockfile unchanged |
| `pnpm --filter @workspace/api-server exec vitest run src/clinical/access.test.ts src/clinical/runtimeReadiness.test.ts src/clinical/storage.test.ts src/clinical/patientExtraction.test.ts src/clinical/clinicalProductContract.test.ts src/routes/patientReviewRoutes.test.ts src/routes/health.test.ts` | PASS: 7 files, 167 tests |
| `pnpm --filter @workspace/spartan-ai-tools test` | PASS: 8 files, 112 tests |
| `pnpm --filter @workspace/api-server test` | PASS: 59 files, 1,136 tests; 5 files / 49 PostgreSQL tests skipped without local database; total 1,185 |
| `pnpm --filter @workspace/db test` | PASS: 7 files, 45 tests; 1 file / 9 real PostgreSQL migration tests skipped without database |
| `pnpm --filter @workspace/field-kit-catalog test` | PASS: 10 files, 97 tests |
| `pnpm --filter @workspace/spartan-coaching test` | PASS: 63 files, 328 tests |
| `pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand` | PASS: 60 suites, 298 tests |
| `pnpm run typecheck` | PASS, root libraries/API/web/mobile/scripts |
| `CI=true EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid pnpm run build` | PASS: API, web and both native bundles |
| `node scripts/performance-budget.mjs` | PASS, every existing budget |
| `node --test scripts/forge-security.test.mjs scripts/security/dependency-regression.test.mjs scripts/security/patched-audit.test.mjs` | PASS: 49 tests |
| `node scripts/security/patched-audit.mjs` | PASS with unchanged verified source mitigations; raw audit low 1 / moderate 24 / high 3 / critical 0; existing high attestations expire 2026-11-01, not zero vulnerabilities |
| `pnpm run release-gate` | Exit 0, all eight executable critical suites passed. Optional saved-work PostgreSQL setup failed closed without DATABASE_URL; do not count that as verified. Live health/parity/auth, device and external paths unverified. |
| `CI=true pnpm run test:e2e` | PASS: 51 tests, 1 existing skip; unchanged browser policy |

Initial full mobile tests exposed a module-format compatibility defect: the shared
dependency-free contract used `.mjs`, which the existing Expo Jest preset does not
transform. Corrected to package-native `.js` with `.d.ts`; both targeted mobile
suites (16 tests), all 60 mobile suites and native production bundles then passed.
No mobile source, Jest config or dependency change. Initial build lacked the
existing CI `EXPO_PUBLIC_DOMAIN` input; the correct CI environment passed. Initial
browser run lacked the pinned browser executable; installed matching browsers and
reran unchanged tests. Historical failures are recorded, not hidden.

### PR #193 bounded review corrections

Both posted findings were reproduced before their fixes: the filtered regression
run had 7 failing tests / 5 passing supported-key cases (112 unrelated tests
skipped by the filter). Review discussion disposition:

| Finding | Root cause and smallest fix | Committed regression evidence |
| --- | --- | --- |
| `4243154435` | Explicit administration could still update the actor's own permission row to add review. The permission writer now denies self-targeted capability additions with `CLINICAL_SELF_GRANT_DENIED`; another authorized tenant clinical admin must grant additional authority. Existing self-reduction and other-member administration remain. | Actual endpoint self-review escalation is 403 without writes and patient review remains denied. Self-reduction succeeds; previously added other-member admin and role-only/foreign/revoked regressions remain. |
| `4243154436` | Readiness checked encryption-key presence but the existing crypto decoder requires 32 bytes. The canonical control now validates the existing hex/base64 decoded length without a Node dependency in shared client-compatible code. Actual server crypto remains unchanged. | Five malformed-key cases fail both canonical readiness and real offline CLI and also fail actual `encryptPhi`; five supported hex/base64/base64url/whitespace forms pass all three. Real health rejects a malformed key with HTTP 503 and false patient acceptance. |
| `4243194096` | Existing public coverage/MFA prerequisites still required ordinary `canUse`, blocking review-only company members. A preparation guard accepts current use/review/admin capability for those existing nonpatient prerequisites; review authority is still independently required for sessions. | Actual public coverage and MFA endpoints allow review-only company members; admin-only members can obtain MFA for grant changes. Absent/revoked company authority is denied and obtaining a challenge does not authorize patient review. |
| `4243194099` | Permission writes lacked the ADR-004 recent reauthentication requirement. Reuse one current actor-bound fifteen-minute session/MFA predicate across patient review, the existing dynamic clinical guard and privilege changes. The existing email challenge can be requested by explicit admins even in education mode. | Seven missing/stale/future/invalid/foreign/expired-session grant-write cases return 403 without writes; explicit admins may step up and manage other-member grants in deidentified configuration while patient review remains separately protected. |

Post-fix focused verification: the seven clinical files now pass 180 tests; adding
the existing PHI encryption suite yields 8 files / 182 passing tests. The unchanged
shared suite passes 112 and mobile passes 60 suites / 298. Full API rerun passes
59 files / 1,149 tests with 49 local PostgreSQL skips (total 1,198). Root build
rerun, including typecheck and both native bundles, passes. Final current-head CI
is recorded in the completion companion after completion; earlier CI is historical.
All four findings remain in scope under the approved authorization/readiness packet;
no architecture, encryption algorithm, dependency or database change was introduced.

The second pair of findings was reproduced with 11 failing / 2 passing targeted
tests (49 unrelated tests filtered out), then fixed in the same PR. Final focused
verification passes 8 files / 195 tests (193 in the seven clinical files plus two
existing encryption tests). Final local API rerun passes 59 files / 1,162 tests,
with 49 PostgreSQL skips (total 1,211); root build/typecheck and both native bundles
pass again. Final CI results are in the PR completion companion. The new
prerequisite tests mock only public coverage bootstrap and email
delivery; they exercise actual server authorization, actor-bound MFA and endpoints.

Historical final-head attempt `38173963352` passed the full 1,198-test PostgreSQL
API suite and every nonbrowser job but failed one unchanged desktop navigation
focus assertion (50 passed / 1 failed / 1 existing skip). Failure/retry affected
different navigation items. The exact unchanged failing test then passed eight
local repetitions. No web/mobile product, browser test or CI policy was altered;
the subsequent bounded API correction requires an entirely fresh current-head run.

### Changed files (bounded inventory)

- Governing evidence: `.agent/PLANS.md`, `docs/execplans/phi-readiness-boundaries.md`.
- API registration: `artifacts/api-server/package.json`.
- API clinical: `artifacts/api-server/src/clinical/access.ts`, `access.test.ts`,
  `clinicalProductContract.test.ts`, `ephemeral.ts`, `patientExtraction.test.ts`,
  `runtimeReadiness.ts`, `runtimeReadiness.test.ts`, `storage.ts`, `storage.test.ts`.
- API routes: `artifacts/api-server/src/routes/aiToolRoutes.ts`, `health.ts`,
  `health.test.ts`, `patientReviewRoutes.ts`, `patientReviewRoutes.test.ts`.
- Shared tools: `lib/spartan-ai-tools/src/clinical-runtime.ts`,
  `clinical-runtime.test.ts`, `clinical-runtime-contract.js`,
  `clinical-runtime-contract.d.ts`, `clinical-runtime.test-fixtures.ts`,
  `provider-config.ts`, `provider-key-contract.js`, `provider-key-contract.d.ts`,
  `server.test.ts`.
- Offline verification: `scripts/verify-clinical-production-env.mjs`.
- Direct operator docs: `docs/clinical-security-controls.md`,
  `docs/patient-record-review.md`, `docs/operator-checklist.md`,
  `docs/ai-tools-production-runbook.md`.

Database tables/schema/constraints/migrations: UNCHANGED; migration NONE.
Infrastructure/production configuration/client product/CI policy: UNCHANGED.
No patient persistence, Firebase application code, PHI fixtures or external clinical
integration. Historical K1A/K1B documents and completion evidence are preserved.

### Publication and completion companion

Repair [PR #193](https://github.com/Thordadpool5413/SpartanCoaching/pull/193) was
created from implementation commit `4c98d32af82afa27fcbc9136bbfebe0e4e9c7257`.
Its tree was verified equal to the reviewed local staged Git tree
`b6f3b6963f8bb727ae4bfe3cd288960bbf864df2`. A scoped evidence update links this plan
to that PR; all requirements apply to the final current head after this update.

The repair PR description is the durable completion companion for the commit and
PR URL, final head, all current-head jobs and internal test summaries, review-thread
disposition, premerge ancestry, merge SHA and exact post-merge CI identifiers. Those
identifiers exist only after this evidence commit and are recorded there after
allocation; a green PR alone is not completion. Inspect all seven required jobs,
including real PostgreSQL API tests, P02, P03 and browser results. No architecture
blocker found and no production operation performed.

## Acceptance and stop

Require all packet acceptance criteria, committed mandatory regressions, fresh
current-head CI, normal authorized merge and exact resulting green main. Inspect
internal test results, not only green aggregate statuses. Stop at this packet.
Record an ARCHITECTURE BLOCKER only if repository evidence prevents the approved
boundary; do not invent alternate architecture.

## Owner-only and unverified

Production PHI activation, vendor account/settings, secrets/env, Cloud Run IAM,
bucket/scanner changes, migrations, real patient uploads and rollout remain owner
operations. Existing covered staging/deletion/leak and physical-device verification
are separate evidence; passing synthetic repository tests is not production or
clinical certification. No clinical model/prompt/schema/retrieval behavior changes
are planned, so no new clinical reasoning evaluation is authorized or required.
