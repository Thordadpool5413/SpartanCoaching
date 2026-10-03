# K1A-CORRECT execution plan

## Authority and status

The owner supplied the K1A architecture/packet-authoring instruction on 2026-10-03.
Architecture decisions and the sole implementation packet are in
`../architecture/knowledge-2026-10-03/03-k1a-correct.md`.
This handoff records packet authoring, not completion of the runtime corrections.
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
- [ ] Implement foundation v2 contracts and pure transitions.
- [ ] Reproduce/invert every specified regression; retain valid behavior.
- [ ] Implement and test narrow knowledge-control origin protection.
- [ ] Run local verification; record exact commands/results and limitations.
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
| Claims/authority | contracts authorityMatrix | all 17 mappings, forbidden patient provenance | Pending |
| Permission | authority.ts | exact scope/capability, membership, grant validity/delegation | Pending |
| Qualification | authority.ts | class, jurisdictions, validity, verified synthetic context | Pending |
| Duties | lifecycle/authority | reviewer differs registrar/submitter; independent activator | Pending |
| Artifact identity | contracts/lifecycle | immutable tuple conflicts and duplicates | Pending |
| Review manifest | contracts/authority | independently mutate every bound field | Pending |
| Canonical digest | canonical.ts | unit/full literal vectors, invalid JSON, set normalization | Pending |
| Tenant-safe manifest | resolver | complete foreign mutation equality, malformed foreign opacity | Pending |
| Publication | publication/lifecycle | drafts/unadopted approvals cannot alter runtime | Pending |
| Temporal semantics | contracts/authority | inclusive starts, exclusive ends, strict real dates | Pending |
| Supersession | publication/lifecycle | split/history, missing/foreign/unrelated/self/cycles | Pending |
| Rollback | lifecycle | previously published target, eligibility, terminal revoke | Pending |
| License | authority | six independent purposes/current verification/revocation | Pending |
| Health | authority/lifecycle | NOT_CHECKED, chronology, fresh activation, constrained LKG | Pending |
| Resolver | resolver | fixed precedence/permutations/missing context/conflicts | Pending |
| Request security | requestSecurity.ts/test | real Express/auth chain, paths/methods/principals | Pending |
| Future transaction | future.ts | atomic order, no persistent claim/network | Pending |
| Idempotency | future.ts | versioned fingerprint, authorization before replay | Pending |
| Concurrency | future.ts/lifecycle | scope/version CAS, parent revision, lock ordering | Pending |
| Audit | contracts/lifecycle | strict variants/reasons, invalidations/expiry dedup | Pending |
| Outbox | future.ts | strict metadata-only delivery, lease/retry/CAS intent | Pending |
| Disconnection | foundation.test.ts | static imports/routes/client boundary | Pending |

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
