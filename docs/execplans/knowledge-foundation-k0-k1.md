# K0/K1 authoritative knowledge foundation ExecPlan

## Packet and authority

Owner supplied `docs/architecture/knowledge-2026-10-03/00-mandate.md` on
2026-10-03. First execution is explicitly K0 plus safe K1 only. Starting main
`3ac00d6a6edcdae63bb599f4c7d3fdf0f936b3de`; clean checkout, status/remotes,
fetch-prune, main checkout, ff-only pull, SHA and status completed. Branch
`feat/knowledge-k0-k1-foundation`. No human changes discarded.

Objective: establish repository truth and a tested, stable semantic foundation
for claim authority, applicability, registry metadata, licensing, approval,
activation, health and uncertainty.

In scope: K0 inventory/mapping through K23; mandate/permanent rules; existing
backend namespace extended with disconnected contracts, immutable in-memory
registry/resolver, pure control-plane transition reducer, synthetic safety tests.
Out of scope: K2–K23 integrations, real clinical knowledge or licensed datasets,
live reasoning changes, API routes/UI, external calls, new auth/DB/client systems,
production activation. Persistent registry schema is designed, not deployed.

Dependencies/inspection: existing AGENTS/PLANS absent; clinical-cloud ExecPlan,
ADRs 001–005, P10 and target/security docs; patient-review/security/production
runbooks, historical repository audit, replit.md, package/workspace; canonical
knowledge/clinical/routes, AI registry/prompt/schema/runtime, coverage DB schema
and migrations, market intelligence and CI/release/security scripts.

Required implementation/security: strict metadata schemas and safe errors,
claim/domain boundaries, explicit states, exact versions/dates/scope, rights and
health, no implicit approval from CMS label or educational baseline, no
cross-tenant result metadata; no PHI, credentials or dependency changes. Actor
inputs are trusted server context only; this reducer is not an auth service.

Acceptance: targeted negative and positive scenarios pass; canonical suites
remain intact; inventory distinguishes implementation/design/configuration/rights;
plan and architecture document what remains. Required CI must pass before merge.
Stop: K0 and this safe K1 slice only. Return durable stewardship/auth/clinical
content decisions before implementation; no production or external-license acts.

## Completed work

- Added K0 audit and all K0–K23 classifications, evidence paths and preserved
  canonical capabilities; identified legacy confidence, snapshot mutability,
  missing approval/licensing/temporal semantics and stale operational headline.
- Added permanent AGENTS rules and plan index; preserved the full user mandate.
- Added contracts for 17 claims, domain matrix, license/version/approval/health,
  lifecycle and distinct unknown states. No model confidence field introduced.
- Added deterministic applicability with date windows, payer/jurisdiction/MAC and
  optional setting/provider/benefit/code/product/population dimensions.
- Added immutable registry bundle/hash, exact-version selection, historical
  supersession, overlap/conflict escalation, bounded LKG and tenant filtering.
- Added explicit human-role/action/scope/revision transition checks; approval is
  separate from activation, rollback cannot undo revocation, invalidation event
  intent recorded. Durable CAS/audit/outbox/admin authentication remain future.
- Wired synthetic K1 tests into the existing API test command. No removed checks.
- Designed canonical DB extension referencing existing coverageSnapshots, without
  applying schema changes or auto-approving old snapshots. No new dependencies,
  lockfile changes, infrastructure, model/prompts/clinical output/UI changes.

## Verification and findings

Pinned pnpm 10.26.1; `pnpm install --frozen-lockfile` passed, unchanged lockfile.
Initial target run exposed Zod 3 versus 4 API mismatch; fixed to existing Zod 3
without dependency changes. Final `pnpm --filter @workspace/api-server exec
vitest run src/knowledge/foundation/foundation.test.ts`: 61 passed, 0 failed.
`pnpm run typecheck`: passed across workspace after correction.
`pnpm --filter @workspace/spartan-ai-tools test`: 94 passed.

Initial API pretest could not bind a Supertest local socket (sandbox EPERM).
Authorized rerun with socket access passed pretests, then 375 API tests passed
and one pre-existing live NPI network test failed with EAI_AGAIN resolving
npiregistry.cms.hhs.gov. No test removed/mocked merely to hide that environment
failure. CI provides independent confirmation. Existing main previously passed
315 API tests; the new 61 scenarios account for the 376 current total.

`node scripts/security/patched-audit.mjs` fetched raw findings and FAILED CLOSED:
1 low, 20 moderate, 3 high. Existing exact forge mitigation remains intact.
Additional findings are GHSA-ch52-4w7c-c8xp (http-cache-semantics 4.2.0 through
Expo ngrok/got/cacheable-request) and GHSA-vfj7-8cjw-p6xm (braces 3.0.3 through
mockup-sandbox fast-glob/micromatch). Both reports list patched_versions <0.0.0.
No dependency was changed by K1. These pre-existing dependency findings are a
separate security-remediation dependency, not permission to expand K1, change
attestation hashes, ignore vulnerabilities or merge red. Raw report stays in
ignored test-results, never treated as a green raw registry audit.

`git diff --check` passed. Broader web/mobile/build/browser/release/DB/recovery/
secret checks run in existing CI; exact commit/run results recorded in PR handoff.
No independently adjudicated clinical eval suite exists in inspected repository.
These are engineering safety tests, not clinical gold standards. Live clinical
behavior is unchanged; the new resolver must remain disconnected until reviewed
applicability/source content and appropriate clinical evaluations are approved.

## Architecture and external boundaries

No replacement architecture invented. Safe K1 contract implementation is not
blocked; production connection is blocked by existing P04 explicit-authorization,
P07/P08 ingestion/deletion, P13 device and P10 clinical/rights/staging evidence.
Durable K1 needs reviewed public/tenant steward mapping, credential verification,
transaction/CAS constraints and outbox integration. Record these decisions before
persistence/admin route implementation. Do not claim lifecycle simulation is a
production approval service, or hashes alone are source authenticity evidence.

Owner actions: appoint qualified clinical/physician/pharmacist/coder/compliance
reviewers; approve rights and supported jurisdictions/payers; provide covered
staging/API/retention evidence outside Git. UMLS/SNOMED, pharmacology, CPT/NUBC and
scales require rights review. No credentials/contracts requested into this chat.

Next bounded packet: K1 persistence and authenticated control plane, with
version-controlled migrations, existing coverage FK reuse, source immutability,
negative tenant/RLS/permission tests, concurrent activation and durable audit/
invalidation verification. Requires its own bounded approval. K2–K23 not started.
Current merge blocker: two additional high dependency findings; exact results
and subsequent PR CI state must remain explicit in the final report.

Final review corrected resolver aggregation: known but inapplicable versions now
return NOT_APPLICABLE, separately from absent SOURCE_UNAVAILABLE. Added a targeted
regression; foundation suite now 62 tests. Prior CI runtime ee2a470 passed API
376 including its live NPI check, confirming the local DNS issue was environmental;
that run is superseded by the aggregation fix. New runtime CI must be checked.
