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
