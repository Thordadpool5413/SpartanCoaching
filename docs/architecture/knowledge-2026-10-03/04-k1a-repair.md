# Final K1A-REPAIR architecture decision

2026-10-04 · Spartan Hospice AI · Thordadpool5413/SpartanCoaching

**Architecture decision: GO for bounded K1A-REPAIR implementation only. K1B remains blocked pending implemented repair, green main, and a fresh independent review in a different conversation.**

## Repository truth and findings revalidated

| Field | Refreshed value |
|---|---|
| CURRENT_MAIN_SHA | `7b5a1cbff2086f0b5dffca744882efb66ea04ee0` |
| K1A_MERGE_SHA | `7b5a1cbff2086f0b5dffca744882efb66ea04ee0` |
| LATEST_MAIN_CI_RUN_ID | `37159495581` |
| LATEST_MAIN_CI_RESULT | Completed, success; all seven jobs successful |
| Ancestry | Reference merge equals current main; no intervening changes |
| Repository state | Clean; no repository file modified in this architecture pass |
| PR #186 | Merged; all eight inline discussions remain unresolved |

The requested status, remote, fetch/prune, checkout, ff-only pull, SHA and status sequence completed. Governing documents and the complete implementation were read during the preceding review in this same conversation; unchanged content was reused, and affected contracts, middleware, lifecycle, publication, resolver, future protocol, CI and all eight discussions were rechecked for this decision. This is not a claim of a new independent review.

The preceding 15 adversarial scenarios were rerun against this unchanged SHA: all completed without unexpected errors. Historical qualifications, backdated delegation, impossible publication, LKG timing/witness loss, five 101-assignment invalidation failures, invalid expiry output and conflicting rights revision identities remain reproducible. The named-route HTTP reproduction remains applicable because both middleware and Express configuration are unchanged. H7 remains a verified specification gap rather than an observed database failure; no knowledge persistence exists.

[PR #186](https://github.com/Thordadpool5413/SpartanCoaching/pull/186) · [Exact-main CI](https://github.com/Thordadpool5413/SpartanCoaching/actions/runs/37159495581)

## Architecture decision table

| Finding | Final decision | Exact semantic rule | Required code area | Required test |
|---|---|---|---|---|
| H1 | Match Express's case-insensitive reserved namespace before any legacy early return | ASCII-case-insensitive exact base or slash-delimited descendant; unsafe cookie mutation always requires trusted Origin | requestSecurity.ts/tests | Named routes, case/path/credential/origin matrix |
| H2 | Historical AND current eligibility | Exact grant/qualification eligible at attestation T and now N; current revocation blocks; LKG pins both grants | authority, contracts, lifecycle, resolver | Before/equal/after attestation; expiry/due equality; revocation/membership |
| H3 | Atomic, verified, non-backdated delegated issuance | createdAt = verifiedAt = trusted issuance I; effectiveFrom ≥ I and parent start/verification; expiry ≤ parent expiry; one exact parent supplies all delegated authority and knowledge.grants | authority/contracts/tests | Active issuance context, temporal containment, multi-generation and later departure |
| H4 | Enforce publication causality separately from service dates | publishedAt ≤ retrievedAt ≤ reviewedAt ≤ assignment.createdAt ≤ N; refresh creates a new assignment after renewed review | publication/authority/lifecycle/resolver | Ordered/equal/reversed pairs and legitimate retrospective service applicability |
| H5 | **Option C: level-triggered authority invalidation** | Event identifies exact authority aggregate; no affected-assignment list, hints, count or checksum; consumers reconcile canonical dependencies | contracts/lifecycle/future/tests | 100, 101, 4,000 assignments; no lost invalidation; strict final-output parsing |
| H6 | Generalized witnesses; revision-qualified rights aggregate | All necessary capability/domain witnesses retained; VERSION ID is version ID; RIGHTS_REVISION ID identifies one immutable terms revision and its overlay | contracts/authority/lifecycle/future/resolver | Separate LKG grants; multi-domain grants; aggregate identity; expiry dedup; two rights revisions |
| H7 | One 5,000 ms overall command budget; one mutated knowledge scope | Budget starts before first command DB operation, includes pool/auth/locks/receipt/work/commit attempt; no timer reset; compatible ordered writer locks; confirmed abort differs from unknown commit outcome | future.ts/tests and architecture documentation only | Deadline arithmetic/order/error/rollback/retry contracts; future real DB races explicitly required |

**Remaining architecture blockers: none for this bounded repair.** The following packet fixes the choices and their limits. It does not claim the existing code is repaired or permit persistence implementation.

# K1A-REPAIR
## Authorization, Temporal, Invalidation, Audit and Transaction Contract Corrections

### OBJECTIVE

Implement the precise H1–H7 corrections below in the disconnected K1A foundation. Correct authorization timing, issuance provenance, publication chronology, invalidation scale, event identity/witnesses and the future transaction protocol. Preserve canonical reviewed material, tenant isolation, clinical-runtime disconnection and all mandatory gates.

### STARTING REQUIREMENTS

Refresh main using the mandated Git sequence; record its SHA and latest exact-main CI. Preserve uncommitted human work. Create `fix/k1a-repair-contracts` or another descriptive feature branch; no substantial work on main. If main advanced, review intervening K1A changes and reconcile this packet without silently changing its semantics.

This is one implementation packet. Sol implements these decisions; Sol does not choose a fanout model, rights identity model, deadline policy or issuance policy. If repository evidence makes a stated rule unsafe or impossible, record ARCHITECTURE BLOCKER with evidence/options and stop only dependent work. A blocker prevents completion/merge claims.

### IN SCOPE

Pure schemas, authority predicates, trusted issuance validation, publication/reducer/resolver semantics, strict event/result contracts, future protocol declarations/pure deadline calculations, namespace guard and committed regressions. Append corrective evidence to the active ExecPlan and commit this architecture as `docs/architecture/knowledge-2026-10-03/04-k1a-repair.md` during implementation. No repository modification is authorized or performed by the present architecture pass.

### OUT OF SCOPE

Database tables/migrations; durable knowledge grants, qualifications, rights, approvals, health, publication, audit, outbox or receipts; knowledge admin routes; production issuance/bootstrap; source ingestion; clinical AI integration; FHIR; web/iOS changes; PHI; new auth/DB/job systems; packages/lockfile churn; global legacy-auth redesign; production activation.

### GOVERNING ARCHITECTURE

Read AGENTS.md, .agent/PLANS.md, the active K1A ExecPlan, knowledge mandate/design/corrective packet and relevant clinical-cloud ADRs. This packet narrowly supersedes the following K1A-CORRECT details: case-sensitive namespace matching; missing attestation-time checks; incomplete grant issuance metadata; assignment chronology; enumerated invalidation IDs; single grant audit fields; logical RIGHTS aggregate identity; and the unbounded-first-lock retry protocol. Other authority, duties, rights purposes, provenance, canonicalization and scope policies remain in force.

Contract compatibility is explicit because these synthetic contracts have no durable or clinical consumers:

- Registry contract becomes `knowledge-foundation-v3`; old v1/v2 registry input is rejected without silent upgrade.
- Event schema becomes `knowledge-event-v3`; old event payloads are rejected. Command fingerprint envelope becomes `knowledge-command-fingerprint-v3` because REGISTER embeds changed operational contracts.
- Keep `k1a-c14n-v1`, `knowledge-review-manifest-v2`, `knowledge-runtime-manifest-v2` and `kb2:`. Reviewed material and runtime-manifest layout do not change. Rights revision identity is derived from existing manifest-bound values, not new reviewed material. Preserve both existing literal golden vectors and their hashes.
- Update synthetic fixtures explicitly. Do not translate nonexistent production records or invent a migration.

### FILES TO INSPECT

All current foundation files: contracts.ts, canonical.ts, authority.ts, publication.ts, resolver.ts, lifecycle.ts, future.ts and foundation.test.ts. Also requestSecurity.ts/test, auth/middleware.ts/test, sessionSecurityContract.test.ts, app.ts, API package.json, root package.json, .github/workflows/ci.yml, governing documents, ExecPlan and all eight PR #186 discussions. Search consumers before changing exported types.

### FILES EXPECTED TO CHANGE

Under `artifacts/api-server/src/knowledge/foundation/`: authority.ts, contracts.ts, lifecycle.ts, future.ts, publication.ts, resolver.ts and foundation.test.ts. Under `src/security/`: requestSecurity.ts and requestSecurity.test.ts. Documentation: active ExecPlan and the new architecture clarification above; .agent/PLANS.md may be updated only to point to this approved repair while retaining historical links.

Canonical serializer implementation should not change. No auth middleware, app route mounting, CI policy, database, client, package dependency or lockfile change is expected. Existing test files are already mandatory CI; avoid unnecessary registration changes. If tests are split, explicitly register every new file in the same mandatory API command.

### H1 RESERVED-NAMESPACE SECURITY FIX

Compute the reserved-path predicate on the original `req.path` using ASCII A–Z to a–z folding only. Match exactly `/api/knowledge-control` or a prefix `/api/knowledge-control/`. Do not decode percent escapes, collapse slashes, Unicode-normalize, change req.path, or change Express routing settings.

Evaluation order is mandatory:

1. Safe methods retain current handling and must never host mutations.
2. Classify the reserved namespace, including `/API/...`, **before** the current case-sensitive `!req.path.startsWith('/api')` early return and before Bearer/iOS exemptions.
3. For unsafe reserved requests with the same nonempty-string cookie predicate as loadSession, require allowed Origin; otherwise 403 CSRF_ORIGIN_REJECTED. Cookie plus any Bearer or iOS header gets the same rule.
4. Reserved Bearer-only requests pass origin classification, then actual session authentication; invalid tokens remain 401. Cookie A plus Bearer B remains A, and an invalid cookie cannot switch to B.
5. For nonreserved paths, run existing legacy behavior unchanged, including exact lookalike prefixes.

Future knowledge mutations must mount only under this namespace with this middleware ordering. No external alias or alternative route mount is permitted. Proxy routing must not rewrite an unguarded path into this namespace after the guard. K1A adds no routes.

### H2 ATTESTATION-TIME AUTHORITY FIX

For attestation timestamp T and trusted evaluation timestamp N, require T ≤ N. Check the **same referenced** credential at both T and N, rather than substituting a newer credential:

- Grant: exact subject/scope/domain/capability; createdAt ≤ instant; effectiveFrom ≤ instant; verifiedAt ≤ instant; instant < expiresAt.
- Qualification: exact subject/scope/required class/domain/jurisdiction coverage; effectiveFrom ≤ instant; verifiedAt ≤ instant; instant < expiresAt and instant < reviewDueAt. SYNTHETIC_TEST remains barred outside synthetic context.
- Current member and organization eligibility remain required; current non-null grant/qualification revocation always blocks runtime use, even if T preceded revocation. Historical audit can describe an act valid at T without granting new use at N.
- Historical membership at issuance/attestation is established by the authenticated, locked command context and its audit, not by claiming a current boolean proves a past session existed. K1A does not invent historical membership intervals or accept client attestations as authenticated facts.

Apply to approvals at reviewedAt, approved rights at verifiedAt, and LKG at approvedAt. Approval reviewDueAt must not exceed the referenced grant expiry, qualification expiry or qualification reviewDueAt, including imported approved records. Current validation failures preserve existing resolver states: NOT_APPROVED, LICENSE_NOT_PERMITTED or SOURCE_UNAVAILABLE as appropriate, subject to existing higher-state precedence.

Add required `healthGrantId` to lkgSchema. LKG must pin the health grant and review grant separately; both belong to its reviewerMemberId. Both grants must be eligible at T and N for their respective capabilities, plus the exact review qualification at T and N. The same grant may fill both capability roles but yields two capability witnesses. LKG.until must be > approvedAt and ≤ health hard expiry, both grant expiries, qualification expiry and qualification reviewDueAt. Preserve existing limitations on health state and independent rights/approval checks. Do not add new medical or professional-role substitution rules.

Include healthGrantId in reference validation, revocation dependency recognition, authorized projection and expiry evaluation. Never synthesize a missing health grant from the review grant. Imported records without the new required field fail strict validation.

### H3 DELEGATION / ISSUANCE CONTRACT

**Chosen model: one atomic creation-and-verification act by one authenticated delegator, different from the recipient.** Creation time and verification time are distinct concepts with equal timestamps in this protocol. A delayed independent verification workflow is not part of this model. Existing no-self-grant/no-self-verification rules concern the recipient; the grantor may be the verifier, as the current contract already permits.

Add immutable `createdAt` and `issuance` to grantSchema. `issuance` is a strict discriminated union:

| kind | Fields beyond kind | Meaning |
|---|---|---|
| DELEGATED | parentGrantId: id; parentGrantRevision: revision; requestId: id | Exact parent and its observed revision at issuance |
| SYNTHETIC_SEED | reference: id | Explicit fixture/test root; usable only with synthetic server context |
| OWNER_BOOTSTRAP | reference: id | Future owner-authorized audited root; cannot be produced by the delegated validator or inferred from an app role |

No issuance variant grants authority by itself. Roots enter only trusted fixture construction or a separately authorized future owner seed. Do not implement the latter. Runtime must not accept SYNTHETIC_SEED when actor.synthetic is false. References are opaque metadata, never credentials or documents.

Replace the old positional validator with this exact conceptual contract, retaining the exported name:

`validateGrantDelegation(partitionInput, childInput, trustedIssuanceContextInput) -> { grant, authorizationWitnesses }`

It returns parsed owned metadata and witnesses, changes no partition, appends nothing and performs no network/DB work. The strict trusted context is:

`{ actor: Actor, now: UTC stamp, parentGrantId: id, expectedParentRevision: revision, newGrantId: id, requestId: id }`

The caller is a future server adapter, not an HTTP payload. actor carries server-verified session, member and organization state. Exact member/organization identity and active booleans must also agree with the target partition's canonical member record. Resolve the exact parent from this partition; do not trust a supplied parent body. Authorization of scope precedes examination of private administrative payload. Reject duplicate IDs or missing/foreign references.

Let I = context.now and P be the parent. All of these are mandatory:

1. Actor is HUMAN, sessionVerified, membershipActive and organizationActive, with canonical active membership and exact tenant organization when scope is TENANT. GLOBAL requires explicit global authority; no role shortcut.
2. P belongs to this scope and actor. P.revision equals expectedParentRevision; P is currently unrevoked, verified, effective and unexpired at I. Its issuance provenance is valid. The parent must itself contain knowledge.grants.
3. One parent supplies every child capability and domain. Child capability set ⊆ P.capabilities; child domain set ⊆ P.domains. The parent is eligible for knowledge.grants and each delegated capability in each delegated domain. Do not assemble broader parent authority from multiple grants.
4. Child.id = context.newGrantId and is unused; child.subjectMemberId differs from actor and has active canonical membership in the exact scope (global uses its canonical active organization); child.grantedByMemberId = child.verifiedByMemberId = actor.memberId. No client-selected issuer/verifier is accepted.
5. Child.createdAt = child.verifiedAt = I. Child.effectiveFrom ≥ max(I, P.createdAt, P.effectiveFrom, P.verifiedAt); child.effectiveFrom < child.expiresAt ≤ P.expiresAt. Child.revision = 1 and revokedAt = null. Future-effective child grants are allowed but confer no authority before their start.
6. Child.issuance is DELEGATED and exactly matches P.id, P.revision and context.requestId. Existing verificationRef must be a bounded trusted verification evidence reference; it is not proof of authority by itself.
7. A new issuance requiring more than 2,000 grant records is rejected with the explicit capacity error before any output is accepted. Do not evict history to make space.

For every grant variant, createdAt ≤ verifiedAt ≤ effectiveFrom < expiresAt. Delegated issuance fixes the first two equal. Root fixtures must have explicit non-backdated metadata, distinct grantor/verifier versus recipient, and the same finite validity constraints.

**Multiple generations.** Every edge records its exact parent and obeys these subset/window rules. Detect self-parent, cycles, duplicate parent identity, missing parent and cross-scope parent. Traverse iteratively with at most the partition's 2,000 grants; no hidden unlimited recursion. At issuance, each immediate parent must currently be valid; immutable ancestor edges must remain historically valid. Audit/provenance cannot be erased by issuing another child.

**Later departure/revocation.** After valid issuance, child runtime validity does not require the original grantor's current membership or the parent's current eligibility. Explicit child revocation controls the child. A later departure or parent revocation does not transitively revoke an independently recorded child. It does prevent further issuance using that now-ineligible parent. Immutable ancestry is retained and validated without treating ancestor current status as child current authority. When checking historical parent eligibility, a revocation at or before child creation denies; a later revocation does not invalidate the original act. The child's own current grant, recipient membership and expiry still govern new use.

Authorized projection must include any same-scope immutable grant ancestry needed to validate referenced grant provenance; do not expose it in runtime bundle metadata or let irrelevant ancestor current status alter eligibility/hash. No cross-tenant ancestry lookup is allowed.

### H4 PUBLICATION CAUSALITY CONTRACT

Validate normalized UTC instants, including imports and final command outputs:

`version.publishedAt ≤ version.retrievedAt ≤ pinnedApproval.reviewedAt ≤ assignment.createdAt ≤ evaluationNow`

Equality is permitted for adjacent instants. Approval.reviewedAt must also be ≤ now and within its own review/credential windows. Rights verifiedAt and LKG approvedAt retain their separate H2 rules; neither is silently rewritten to fit publication history.

ServiceFrom/serviceTo remain half-open calendar-date applicability. They may precede retrieval, review or assignment creation when covered by the reviewed artifact. They are never substituted for publication-act timestamps.

REAPPROVE appends a new attestation at server now, after retrieval, without rewriting the prior approval or publication. REFRESH_APPROVAL creates a new assignment at server now, after/equal to the new review, preserving the old interval/applicability/uses; it retires the old assignment at that same now. The retired assignment keeps its old approval and creation fields. Supersession/rollback history segments retain a valid pinned approval and use the actual new record creation time; predecessor creation/retirement cannot be later than successor creation. No timestamp repair or backfill is automatic.

Centralize these checks in reusable publication/approval validators used by reducer and authorized resolver projection. Malformed authorized chronology raises the bounded chronology code; inaccessible tenant history is not validated on another tenant's read.

### H5 INVALIDATION FANOUT CONTRACT

**Choose Option C exclusively.** Authority change is authoritative; the delivery event names what must be reconciled. Remove affectedAssignmentIds from event v3, along with reducer accumulation of assignment IDs for this field. Do not replace it with a 100-ID hint, truncation flag, count, checksum, child events or fanout chunks.

Retain the event's `invalidation` enum NONE/PUBLICATION/ELIGIBILITY and `contentRemoval` flag. An invalidating event's `(scopeId, aggregateKind, aggregateId, newRevision)` is the complete reconciliation instruction:

| Aggregate kind | Canonical reconciliation target |
|---|---|
| VERSION | Every publication depending on that exact version in that scope, including pinned approvals and health/LKG eligibility |
| RIGHTS_REVISION | Every version/publication referencing that exact terms revision and overlay |
| GRANT | Every publication whose pinned approval, rights verification or LKG health/review authority references that exact grant |
| QUALIFICATION | Every publication whose pinned approval, rights or LKG verification references that exact qualification |
| PUBLICATION | Current publication set for that exact scope, including changed or removed assignments |

Consumers reconcile canonical state, including removal of cached entries no longer present. They do not replay the old command, infer current eligibility from the event, or use an event as permission to read another tenant. Global events reconcile global authority; tenant consumers independently recompute their own authorized global+tenant view.

Immutable audit records the mutation, target, actor/witnesses, revisions, references and decision—not a snapshot of every impacted publication. Exact impacted IDs/count/checksum are **not required** in audit. A later historical impact analysis must join retained versioned publication/authority history as of the event; this packet does not implement that analysis. assignmentId/previousAssignmentId and approval references remain where they identify the directly changed publication records, not fanout completeness.

Normal authoritative command: at most one event, atomically coupled to state, audit, outbox and receipt in future K1B. Exact duplicate registration or receipt replay produces no new event. Expiry evaluation may produce multiple independently keyed authority-condition intents; no mutation or fanout transaction occurs in K1A. Future persistence inserts at most one expiry-condition event per transaction, rechecking its current canonical condition/references under the specified locks and atomically inserting its deduplicated audit/outbox records. No human command receipt is required for this deterministic system intent. Separate expiry-intent transactions are safe because time-based canonical denial already applies without them; this is not partial commit of a human authority mutation.

Canonical selection checks current rights/health/credentials immediately, regardless of delayed delivery. A safety revocation must succeed at any otherwise valid 4,000-assignment partition size; event construction must not enumerate those assignments. Shared rights revocation still updates every same-scope copy of the exact overlay and validates all touched version CAS values.

No draft operation invalidates unrelated publication. Existing required invalidation operation classes stay intact; a version-only event for an unpublished candidate has no publication dependencies to reconcile. This does not authorize treating scope revisions or administrative changes as runtime bundle inputs.

### H6 AUTHORIZATION-WITNESS CONTRACT

Replace event top-level grantId/qualificationId with required `authorizationWitnesses`, a deterministic strict array. Do not keep ambiguous parallel legacy fields. Each witness has exactly:

- witnessType: ACTOR_CAPABILITY, REVIEW_ATTESTATION, RIGHTS_ATTESTATION, LKG_HEALTH_ATTESTATION or LKG_REVIEW_ATTESTATION;
- actorMemberId, scopeId, domain, capability;
- grantId and grantRevision;
- qualificationId and qualificationRevision, both null or both non-null;
- attestationId and attestedAt, both null for ACTOR_CAPABILITY and both required for the other variants.

Use existing safe ID, integer/revision, domain, capability and UTC stamp contracts. No bodies, credential files, URLs, descriptions, arbitrary objects or patient/source content. A witness is server-produced evidence of a successful check, never an input that grants authority. Capture credential revisions and witness values before mutating any operational overlay; never retain a shared reference that changes the authorization witness to the post-mutation revision.

Select the ordinal-smallest eligible grant for each required capability/domain predicate and the ordinal-smallest eligible qualification where required, preserving existing deterministic selection. If a predicate requires a single grant to cover multiple domains, select the smallest grant satisfying that whole predicate; never substitute a union of partial grants. Emit one witness per distinct materially required predicate; deduplicate only exact identical records. Sort by witnessType, scopeId, numeric actorMemberId, domain, capability, grantId, numeric grantRevision, qualificationId/null-first, qualificationRevision/null-first, attestationId/null-first, attestedAt/null-first. Same actor or same grant does not collapse different capabilities/domains.

Witness requirements:

| Operation/check | Required witnesses |
|---|---|
| REGISTER/SUBMIT/REVOKE/RECORD_HEALTH | Actor's register/submit/revoke/health capability for source domain |
| APPROVE/REAPPROVE/REJECT_REVIEW | Actor's review capability with required qualification attached |
| ACTIVATE/SUPERSEDE/REFRESH_APPROVAL | Actor activate capability; pinned REVIEW_ATTESTATION; RIGHTS_ATTESTATION for target artifact |
| ROLLBACK | Same dependencies as activation, with actor rollback capability |
| APPROVE_LKG | Actor health capability AND actor review capability with qualification; supporting valid review and rights attestations used to permit the act |
| REVOKE_RIGHTS | Actor license capability for **every distinct domain of every version sharing the exact rightsRevisionId in the partition**; not only the supplied version's domain |
| REVOKE_GRANT | Actor knowledge.grants per target domain, plus each target capability's authority predicate already required by revocation policy; each capability witness grant must cover all target domains where the existing predicate requires it |
| REVOKE_QUALIFICATION | Actor knowledge.grants for every target domain |
| Delegated issuance validator | One ACTOR_CAPABILITY witness per distinct domain/capability in child authority plus knowledge.grants, all referencing the exact parent |
| SYSTEM expiry / trusted PIPELINE | Empty human witness array; keep the existing distinct trusted actor variants |

Referenced-attestation witnesses identify their actual attesting human, exact pinned grant/qualification, record ID and timestamp, not the current command actor. Rights attestationId is rightsRevisionId. Review attestationId is approvalId. LKG attestationId is LKG ID; health witness qualification is null, review witness qualification is required. When a supporting approval is selected for LKG creation, choose the ordinal-smallest eligible approval and record that exact choice in the witness. Existing qualification class/domain and duties rules remain authoritative.

Human events require the operation's complete witness set; known SYSTEM/PIPELINE variants prohibit fabricated human witnesses. The pure producer verifies records against state/context. Public strict schema validates structural/operation-consistency invariants; a serialized witness alone cannot prove cryptographic authenticity or database authorization.

Maximum 256 witnesses per event. The largest current requirement is at most 19 domains × 10 distinct capabilities = 190 actor predicates for grant revocation/issuance; operations with supporting attestations require far fewer. At most four supporting attestation witnesses are allowed by current operation profiles. No operation can combine arbitrary bulk commands to exceed this bound. Add a test proving the requirement generator cannot exceed the bound and cannot silently omit a required predicate.

### H6 EVENT AGGREGATE IDENTITY

Retain previousRevision/newRevision in audit; **newRevision is the aggregate revision carried by outbox.aggregateRevision**. Do not introduce a second independently mutable event revision field. Identity is always keyed with scope.

| aggregateKind | aggregateId | Revision source |
|---|---|---|
| VERSION | Actual version.id; must equal non-null event.versionId | Version operational revision |
| RIGHTS_REVISION | Derived rightsRevisionId below | Exact rights revision's operational overlay revision |
| GRANT | Actual target grant.id | Grant overlay revision |
| QUALIFICATION | Actual target qualification.id | Qualification overlay revision |
| PUBLICATION | Exact scopeId | Scope/publication parent revision |

Add nullable event metadata logicalRightsId and rightsTermsRevision; both required only for RIGHTS_REVISION, both null otherwise. VERSION events require the correct sourceId/versionId. Credential/rights events use null sourceId/versionId rather than choosing an arbitrary referencing version. Publication events keep their directly changed version/source/assignment/approval identifiers. Strict schema plus state-aware final validation rejects mismatches.

Approval expiry is a VERSION event: aggregateId = version.id, approvalId = expiring approval.id. Never label an approval ID as a version. Health/LKG changes use VERSION identity; there is no second competing health revision counter in this repair.

Human/pipeline state-change events increment their declared aggregate by exactly one. SYSTEM expiry events do not mutate canonical state: previousRevision = newRevision = observed aggregate revision. Multiple distinct conditions at the same revision are valid; revision equality is not event deduplication. Other touched version/scope revisions retain their existing CAS semantics even when the one root event belongs to RIGHTS_REVISION or PUBLICATION; consumers reread canonical state for those dependent objects.

**Stable identity and expiry deduplication.** Human event id is the server-generated unique ID persisted with the command receipt; replay reuses the committed event/result. No new ID is generated for successful receipt replay.

Add `expiryCondition`, null for non-expiry events, and required for SYSTEM EVALUATE_EXPIRY:

`{ kind, referenceId, deadline }`

Kinds are exactly RIGHTS_END, GRANT_END, QUALIFICATION_END, QUALIFICATION_REVIEW_DUE, APPROVAL_REVIEW_DUE, HEALTH_WARNING, HEALTH_HARD_END, LKG_END. References are respectively rightsRevisionId, grantId, qualificationId, qualificationId, approvalId, versionId, versionId and LKG ID. Emit the earlier qualification deadline only; on equality choose QUALIFICATION_REVIEW_DUE. Emit each applicable health warning/hard/LKG boundary distinctly. Existing reason codes remain RIGHTS_EXPIRED/GRANT_EXPIRED/QUALIFICATION_EXPIRED/APPROVAL_EXPIRED/HEALTH_EXPIRED.

Dedup digest is canonical SHA-256 of the exact object:

`{ schemaVersion: 'knowledge-expiry-intent-v3', scopeId, aggregateKind, aggregateId, aggregateRevision: newRevision, conditionKind, conditionReferenceId, deadline }`

Event id and requestId are `expiry:<digest>`. Event occurredAt is the condition deadline, not polling time; outbox.availableAt later records first delivery availability. This makes repeated evaluation at different N ≥ deadline produce the same immutable body for the same condition/revision. Approval identity is in both approvalId and conditionReferenceId. Sort final intents by event id. Do not coalesce distinct conditions merely because deadlines coincide. Do not generate one event per assignment.

Consumers deduplicate by event id; exact duplicate = no second effect. Same event id with a different immutable body is a contract/integrity error, never last-write-wins. Any new condition, including one at an already seen revision, triggers canonical reconciliation. Older events may trigger a reread but never roll state back; revision gaps require reread. Cached state can advance only to canonical results, not an event's old payload.

### H6 RIGHTS AGGREGATE MODEL

**Choose revision-qualified rights aggregates (Option A).** Existing manifest `rights.id` is the logicalRightsId; `rights.revision` is the immutable terms revision number. Keep these manifest fields unchanged. Define:

`rightsRevisionId = 'krr:' + canonicalDigest({ schemaVersion: 'knowledge-rights-revision-identity-v1', scopeId, logicalRightsId: rights.id, termsRevision: rights.revision })`

This derived 68-character safe ID is the durable identity of exactly one immutable terms revision in one scope. A changed terms body under the same tuple is KNOWLEDGE_IDENTITY_CONFLICT, not a new hash-derived identity. IDs do not confer authorization. There is no logical-series event stream in this repair.

Add rightsRevisionId to the strict operational rightsOverlay schema and validate it against the helper. Retain existing rightsId/rightsRevision references there as compatibility labels, with exact equality to the immutable terms. Every same-scope version using that tuple must have identical terms and an identical operational overlay; a mutation increments the overlay once logically and copies that identical new overlay to every referencing version. Reject inconsistent copies.

REVOKE_RIGHTS selects the revision through the authorized target version; it affects only that exact rightsRevisionId, never other revisions of the logical series or another scope. Check license authority across all referencing domains as above. Keep expectedRightsRevision as the **overlay** CAS value, not the terms number. Retain all touched version CAS checks. Two terms revisions may both have overlay revision 2 without collision because their aggregate IDs differ.

Rights expiry identifies the same revision-specific aggregate without incrementing overlay revision. Content removal instructions target that exact revision and its dependent retained/cached content; they never delete immutable provenance/audit by implication. No content-removal worker is implemented now.

### H7 END-TO-END TRANSACTION DEADLINE

This section specifies future adapter behavior and pure contract tests only. No DB timeout implementation is added now.

**One budget: 5,000 milliseconds per command attempt, with no extension or stacked receipt timer.** Start from a server monotonic clock at the reserved-namespace command dispatch boundary, before pool acquisition or any DB operation used by that command's authentication/preauthorization. In future K1B this budget must be initialized before the existing global loadSession middleware performs knowledge-command DB work; starting it only inside a downstream route handler is forbidden. This repair changes the future contract only and adds no middleware or route for that timer. General HTTP upload/body limits are outside this budget; knowledge commands remain bounded metadata.

Order:

`START_DEADLINE → AUTHENTICATE → DERIVE_ACTOR_SCOPE → PREAUTHORIZE → ACQUIRE_CONNECTION/BEGIN → SET_LOCAL_SECURITY_CONTEXT_AND_TIMEOUTS → LOCK → CLAIM/CHECK_RECEIPT → REAUTHORIZE_CURRENT_CONTEXT → REPLAY_COMMITTED_RESULT_OR_VERIFY_CAS → APPLY → AUDIT → OUTBOX → RECEIPT → COMMIT_ATTEMPT`

Pool/auth reads consume the same budget even if the connection is acquired earlier to authenticate. No external network/source calls occur inside the transaction. The deadline covers acquisition, computation, every statement and commit attempt; “acquisition timeout” is not permission to run unbounded mutation work afterwards.

Let D = startMonotonic + 5000 and R = floor(D − monotonicNow). Before every blocking phase and again before dispatching COMMIT, recompute R. If R < 2 ms, stop and abort; never send a zero timeout because zero disables PostgreSQL timeouts. Pool waits and driver calls must be cancellable/bounded by D. A client-side watchdog covers SQL-setting round trips and application work; it does not reset on retry or on acquiring a new lock.

For each transactional business statement, set transaction-local statement_timeout = R ms and lock_timeout = max(1, R − 1) ms using the remaining budget. Recompute after setting them; if no budget remains, abort before dispatching work. The monotonic watchdog is the overall bound; PostgreSQL lock_timeout alone applies per acquisition and statement_timeout alone per statement. No server-version upgrade or transaction_timeout setting is assumed; current CI uses PostgreSQL 16. Keep idle_in_transaction_session_timeout = 5000 ms as a cleanup backstop, not a fresh work allowance. All settings are transaction-local; no pooled-session timeout contamination.

Timeout, deadlock or serialization abort before COMMIT dispatch: rollback the whole transaction; no mutation, audit, outbox or receipt commits. Return 409 COMMAND_IN_PROGRESS with Retry-After: 1 and the instruction to retry the **same key and identical payload**. This code includes confirmed command contention/budget abort, not proof that an identical request exists. No automatic hidden transaction rerun. Connection/service unavailability is 503 COMMAND_UNAVAILABLE, not a fabricated conflict.

Cleanup may use at most 1,000 ms outside the work deadline to cancel/drain/rollback. That allowance permits no mutation work or commit. Return a connection to the pool only after known clean transaction/protocol state; otherwise destroy it. This is not a promise that every network response arrives within exactly five seconds.

**Commit uncertainty is explicitly separate.** Once COMMIT is dispatched, lost acknowledgement or deadline/cancellation racing with COMMIT cannot safely be labeled rollback. If success is confirmed, return the committed receipt. If abort is confirmed, return the bounded retry result. Otherwise return 503 COMMAND_OUTCOME_UNKNOWN, Retry-After: 1, and retry only the original key/payload so the next attempt checks the receipt under current authorization. Never tell the caller to use a new key, never claim “nothing committed,” and never execute a second mutation merely because the response was lost. No architecture can guarantee an already-dispatched remote commit did not finish solely from a client timeout.

Use server monotonic duration for D/R. For authoritative timestamps use one fresh UTC database clock sample after locks and current reauthorization for the command decision; do not use transaction-start time captured before waiting. Recheck time-sensitive eligibility before commit if the work crossed a relevant expiry; abort if already expired. Runtime reads always evaluate fresh current eligibility. Audit records the actual authorized decision time, not a promise that authority remains valid after commit/response. Pure K1A receives trusted now and does not invent a clock.

Completed receipt replay requires current authenticated membership and current operation authority, but not old expected revisions or old target transition preconditions. Same key/same fingerprint returns historical result without new mutation/audit/outbox; different fingerprint returns 409 IDEMPOTENCY_CONFLICT. An unauthorized actor receives authorization denial without learning receipt contents. No independently committed “processing” placeholder and no automatic receipt TTL/reuse.

### H7 LOCK ORDER / WRITER PARTICIPATION

Use READ COMMITTED plus explicit row locks and existing CAS, not an assumed global serializable snapshot. Hold locks through commit/rollback. The revised canonical order is:

1. One canonical knowledge scope row, FOR UPDATE.
2. Canonical organization rows needed for actor/attestor/recipient eligibility, ascending numeric organization ID.
3. All needed canonical member rows, ascending numeric member ID; then all needed separate membership rows in numeric organization/member order if such rows exist. Do not interleave these two groups.
4. Session rows, ascending numeric session ID, including the acting session. Current repository session IDs are numeric. No token values enter logs or lock metadata.
5. Source/document keys, ordinal source ID then document ID.
6. Version IDs, ordinal.
7. Grant IDs, ordinal, including exact parents/authority dependencies required by the operation.
8. Qualification IDs, ordinal.
9. rightsRevisionIds, ordinal.
10. Health rows by version ID, ordinal, if later stored separately.
11. Receipt key, ordered tuple `(scopeId, actorMemberId, operation, keyHash)`.

Use FOR UPDATE for these needed authority rows in the future adapter; a shared row used only for reading eligibility is still locked against mutation. Missing rows fail closed; scope parent locking protects creation/absence races for knowledge children. Do not add/update/delete an authority row based on a pre-lock read. Discover candidate IDs, acquire the complete ordered dependency set, then re-read/validate. If discovering a missing earlier-order dependency after taking later locks, rollback and return bounded retry; never acquire backwards or partially release/reacquire.

Organization/member-before-session is an explicit narrow revision of the previous order, to align parent identity rows before dependent session rows and include organization-active status in the protected decision. K1B must inventory actual foreign keys/cascades and all identity writers before implementation. The repair only declares this contract.

| Writer | Mandatory participation |
|---|---|
| Knowledge mutation, grant/qualification/rights/health change, publication | Scope lock first, then required rows in the order above, reauthorization and exact CAS |
| Organization/member disable/offboarding/delete/status change | Lock the same canonical identity rows in organization/member/session order; never subsequently acquire a knowledge scope in that transaction |
| Session logout/revoke/reset/prune | Lock any required identity rows before session rows; session-only writers may take the ordered subset and must not later acquire an earlier lock |
| Pure identity read | No mutation authority; cannot replace locked reauthorization |
| Expiry notification insertion | Same scope/aggregate ordering for inserting its deduplicated audit/outbox intent; no fabricated aggregate revision increment |
| Outbox delivery | Lease/token CAS on delivery state only; never mutate authoritative eligibility or acquire identity/knowledge locks afterwards |

Direct UPDATE/DELETE naturally conflicts with a held row lock, but every writer must also avoid reverse-order cascades and revalidate conditions after waiting. Identity-only writers do not need to acquire every tenant/global scope: the shared locked canonical identity rows are the serialization boundary. They must not acquire scope after identity. A workflow requiring both identity and knowledge mutation in one transaction is prohibited in this phase; use separate commands and fail-closed reads. No CAS-only replacement for these authorization locks is approved here.

Authorization time is a linearized decision, not eternal permission: if an approval/activation commits before a subsequent revocation, it may succeed, and subsequent new use is denied when revocation wins. If revocation wins the relevant locks first, the pending command must see it and fail. Test both orderings later with separate connections.

### H7 MULTI-SCOPE RULE

A K1B knowledge command may mutate **exactly one** knowledge scope. Cross-scope targets, grants, rights or assignments are rejected. No atomic multi-tenant bulk command, simultaneous global+tenant mutation, or scope-lock promotion is allowed. The contract rejects more than one scope before any lock acquisition.

Global invalidation is one global authority event. Consumers reconcile independently authorized scopes in separate transactions, never a giant multi-scope transaction. If a future owner-approved design genuinely needs multi-scope mutation, it must use ordinal scope ordering before any other locks and receive a separate architecture packet. That is not an implementation option in this repair. Tests now assert rejection, not pretend to exercise an unapproved multi-scope algorithm.

### ERROR CODES

Keep errors content-free: no validator trees, rejected bodies, credential URLs, SQL/SDK errors or stack traces. HTTP mappings below are the future adapter contract; K1A's pure functions retain bounded code errors/state results and add no endpoint.

| Condition | Exact code / result | Mapping |
|---|---|---|
| Reserved cookie origin denied | CSRF_ORIGIN_REJECTED | Existing 403 |
| Missing/invalid authentication | UNAUTHENTICATED | Existing 401 |
| Inactive issuance actor/member/org or wrong scope | KNOWLEDGE_SCOPE_DENIED | 403; no private record disclosure |
| Missing ordinary required capability | KNOWLEDGE_PERMISSION_DENIED | 403 |
| Parent/child timing, subsets, knowledge.grants, issuer mismatch or invalid lineage | KNOWLEDGE_DELEGATION_DENIED | 403 after safe schema/scope validation |
| Parent/grant/version/scope/overlay expected revision mismatch | KNOWLEDGE_REVISION_CONFLICT | 409 |
| Historically invalid referenced approval / rights / LKG in runtime read | NOT_APPROVED / LICENSE_NOT_PERMITTED / SOURCE_UNAVAILABLE | Existing resolver states and precedence; no new duplicate state name |
| Mutation lacks eligible review/rights/health | Existing QUALIFIED_REVIEW_REQUIRED, ACTIVATION_REVIEW_REQUIRED, ACTIVATION_RIGHTS_OR_INTERVAL_REQUIRED, ACTIVATION_HEALTH_REQUIRED or KNOWLEDGE_LKG_INVALID as applicable | Existing pure failure categories; 409 for eligible-state precondition, 403 for absent required qualification |
| Impossible authorized publication chronology | KNOWLEDGE_PUBLICATION_CHRONOLOGY_INVALID | 409, new specific semantic code |
| Growth operation would exceed an explicit collection bound | KNOWLEDGE_CAPACITY_EXCEEDED | 409, new expected capacity code |
| Malformed schema, invalid witness shape/coverage or aggregate identity, invalid final output | KNOWLEDGE_CONTRACT_INVALID | 400 for caller-invalid input; 500 only for internal producer invariant failure, sanitized |
| Unknown/foreign target after scope authorization | KNOWLEDGE_REFERENCE_INVALID | 409; preserve bounded response |
| Same immutable identity with different terms | KNOWLEDGE_IDENTITY_CONFLICT | 409 |
| Same idempotency key, different fingerprint | IDEMPOTENCY_CONFLICT | 409 |
| Confirmed abort for contention/deadline/deadlock/serialization | COMMAND_IN_PROGRESS | 409, Retry-After: 1, same key/payload |
| DB/connection unavailable before commit uncertainty | COMMAND_UNAVAILABLE | 503, Retry-After: 1 |
| Commit dispatched, outcome unconfirmed | COMMAND_OUTCOME_UNKNOWN | 503, Retry-After: 1, same key/payload only |

Malformed fields use CONTRACT_INVALID before semantic errors once scope disclosure checks pass. There is no fanout-overflow code under Option C: 101 or 4,000 impacted assignments is not an error. Invalid internal event construction cannot be reported as successful mutation.

### OUTPUT-SCHEMA CLOSURE

Parse the **final** constructed state and outputs after all aggregation, normalization and revisions, before returning. No validation-then-append pattern. Successful outputs and bounded failures form the contract; a growth command at capacity may fail explicitly, but never return an invalid state. No capacity error may prevent a non-growing security revocation on a valid partition.

| Collection | Bound / closure rule |
|---|---|
| Source metadata records per partition | 500 including history. REGISTER requiring record 501 fails before success |
| Versions per partition | 2,000. New version 2,001 fails; exact duplicate registration can still return existing identity without event |
| Assignments per partition | 4,000 including retired history. ACTIVATE/REFRESH reserve +1; SUPERSEDE/ROLLBACK reserve +1 or +2 when creating a historical split. Never discard retired records |
| Approvals per version | 100. APPROVE/REAPPROVE requiring 101 fails capacity before mutation; no automatic pruning or credential backdating |
| Grants/qualifications/members per partition | 2,000 each. Delegated issuance checks space; current repair adds no durable issuance/qualification/member command |
| Existing set/string/ID/URL limits | Preserve; no aggregation through a 100-item generic set when the domain permits more |
| expectedVersionRevisions | At most 2,000 distinct safe-ID keys; all touched versions required; unrelated missing/extra foreign identities fail rather than expand the scope |
| Event witnesses | 256 maximum; requirements generated from at most 190 capability/domain predicates, with bounded supporting attestations as above |
| Invalidation assignment list | Absent; no fanout bound coupled to assignment count |
| Event body | At most 524,288 canonical UTF-8 bytes; safe ASCII ID/reference limits plus witness maximum make generated event metadata fit. No free-form strings beyond existing bounded fields |
| Normal reducer eventIntents | 0 for exact duplicate/no-op return, otherwise exactly 1 |
| Receipt result | ≤2,000 version IDs, ≤4,000 assignment IDs, ≤1 event ID for these commands; sorted unique IDs; no source/clinical body; receipt is not an invalidation fanout payload |
| Expiry output per partition | ≤16,000 events: ≤2,000 rights + 6,000 health boundaries + 4,000 pinned approval deadlines + 2,000 referenced grants + 2,000 referenced qualification deadlines |
| Authorized resolver output | At most two scopes (global and exact tenant); ≤8,000 published decisions/manifest entries/selected records; configurations retain their per-scope bounds |

The expiry bound counts unique conditions actually referenced by nonretired publication, not every historical approval. Each version has at most warning, hard-end and LKG-end boundaries. At most 4,000 distinct approval pins can be referenced by 4,000 current assignments. Dedup before final validation; do not truncate if an invariant is violated.

Add public strict schemas for final transition result and expiry intent array; use the public event and partition schemas inside them. For resolver outputs, add strict schemas matching the existing manifest/result fields and enforce the two-scope/8,000-entry bounds without changing canonical layout/order. Authorization witnesses get their own strict schema. Validate semantic reference consistency as well as Zod shape. Returned copies must not share mutable input references.

Preflight safe integer arithmetic as well as collection growth; revision overflow is KNOWLEDGE_CAPACITY_EXCEEDED with no mutation, never a malformed success or wraparound. This numeric exhaustion condition is distinct from assignment fanout and is not an excuse to reject security mutations at valid assignment capacity. Preflight the net growth for operations that append history. At full capacity, non-growing REVOKE/REVOKE_RIGHTS/REVOKE_GRANT/REVOKE_QUALIFICATION/blocking health/expiry must still return valid results; REAPPROVE or publication-history growth may return the explicit capacity error without changes. Larger immutable-history retention/pagination is a later architecture, not permission to erase history or raise limits silently now.

Foreign-inventory cloning optimization remains future hardening. These bounds apply to authorized partition processing; this packet does not validate another tenant's inaccessible payload on the caller's read.

### TESTS

Commit regression tests in mandatory suites. First reproduce baseline defects locally, record evidence, then replace with expected safety assertions. Do not publish an intentionally broken intermediate branch merely to prove a bug.

**H1:** Named real Express routes with actual cookieParser → guard → loadSession → requireAuth ordering and mocked synthetic sessions. Cover lowercase/uppercase/mixed case, base/trailing slash/child/query; cookie only, cookie+valid/invalid/arbitrary Bearer, cookie+iOS, trusted/missing/hostile Origin; cookie A/token B; invalid cookie plus valid token; Bearer-only valid/invalid; safe methods; nonmatches knowledge-controlx/knowledge-controls; double slash and percent-encoded variants dispatch or reject consistently with Express. Explicitly catch the uppercase `/API` early-return bypass.

**H2:** For review/rights/LKG, independently vary each required grant/qualification effectiveFrom and verifiedAt before/equal/after T, expiry at T, qualification reviewDueAt at T, current expiry/revocation and inactive membership. Test exact LKG health grant separately, missing healthGrantId, until exceeding either grant, and subsequent health-grant revocation/expiry. Ensure invalid history remains auditable but cannot authorize runtime use; no substitution of a later valid credential.

**H3:** Trusted actor/member/org/session negatives; parent start/verified after child; child created/verified/effective before issuance; expiry beyond parent; wrong scope; missing parent; reused ID; self grant/verification; capability/domain expansion; missing knowledge.grants; revoked/expired parent; expected revision conflict; inactive recipient; synthetic root in nonsynthetic context. Valid future-effective child stays inactive before start. Test A→B→C→D: no scope/domain/capability/expiry expansion, no time reversal, exact parent provenance, cycles rejected. Later grantor departure or parent revocation does not invalidate a valid child; child's own revocation does. Test maximum valid ancestry iteratively.

**H4:** Every causal pair ordered/equal/reversed, UTC offsets, imported impossible history, creation in future, reapproval/refresh pins and preserved retired fields, supersession/rollback splits. Prove serviceFrom before assignment creation is valid when within the reviewed artifact's interval.

**H5:** For 100, 101 and 4,000 valid disjoint publications, exercise REVOKE, REVOKE_RIGHTS, REVOKE_GRANT, REVOKE_QUALIFICATION, blocking RECORD_HEALTH and expiry. Each successful command yields one complete authority-level event, zero assignment fanout payload, schema-valid final state, deterministic identity, and denied fresh selection where required. Test shared rights across multiple domains and failure if actor lacks license authority for one affected domain. Verify no current or cached-dependent publication is omitted by the declared reconciliation target through a synthetic reconciliation model, not a database worker.

**H6:** Different LKG health/review grants, one grant with both capabilities, multi-domain/multi-capability revocation, deterministic witness choice, missing/extra-invalid witnesses, attestor versus command actor, same actor with distinct grants retained. VERSION approval-expiry identity; two terms revisions sharing logical ID but changing overlays independently; cross-scope tuples; conflicting terms under same tuple. Same expiry condition at different poll times yields byte-identical events; coincident different deadlines/conditions remain distinct; same revision with distinct conditions still reconciles; stale/duplicate/gap scenarios reread canonical truth. Every final event parses; serialized size maximum fits. Keep no-PHI sentinel and strict unknown-field rejection.

**H7:** Pure protocol tests assert deadline starts before first DB/pool/auth wait, one absolute budget, decreasing remaining duration, no zero timeout, no reset between scopes/locks/receipt/statements, <2 ms abort, timeout/deadlock/serialization mapping, rollback/no new writes, cleanup connection disposition, confirmed success versus unknown commit outcome, same-key retry/replay and no re-execution, current authorization before replay without old CAS preconditions. Assert ordered identity/knowledge writers and reject multiple mutated scopes before locking. These are semantic protocol tests, not claimed PostgreSQL concurrency tests.

**Closure/general:** Boundary and boundary+1 for every bounded collection, all appended-history paths, safe non-growing mutations at maximum size, final public output parsing after aggregation, immutability, input permutations with multiple actual records, source metadata pinning, tenant/global isolation, source/AI/human distinctions, independent rights, duty conflicts, temporal health precedence, missing-knowledge semantics and clinical disconnection. Keep canonical unit/full-manifest golden literals unchanged. Ensure new error metadata never contains synthetic secret/PHI sentinel payloads.

Eventual K1B must test actual PostgreSQL multi-connection first-scope-lock contention, duplicate receipt races, response loss after commit, abort before commit, unknown commit reconciliation, statement/pool deadlines, session/member/org revocation races, grant/qualification/rights/health races, direct non-owner constraints and lease CAS. Do not implement these integrations during this repair.

### TEST-TO-CI REQUIREMENTS

| Suite | Mandatory command | Required CI job |
|---|---|---|
| foundation/foundation.test.ts, including H2–H7 and closure | pnpm --filter @workspace/api-server test | Application typecheck, test, and build → aggregate |
| security/requestSecurity.test.ts, including H1 named routes | Same | Same |
| auth/middleware.test.ts | Same | Same |
| auth/sessionSecurityContract.test.ts | Same; retain explicit registration | Same |

Refresh current workflow and scripts at implementation start. Preserve all seven gates: full-history secret scan; application checks; P02 migration equivalence; P03 independent recovery; dependency audit including policy/regressions/attestation; browser release gate; aggregate verification. No skipped new tests, allow-failure substitution, disabled scans or relaxed exceptions.

### LOCAL VERIFICATION

Use repository-pinned pnpm and current workflow Node version (baseline pnpm 10.26.1, Node 24). Run and report exact outcomes:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts src/security/requestSecurity.test.ts src/auth/middleware.test.ts src/auth/sessionSecurityContract.test.ts
pnpm --filter @workspace/spartan-ai-tools test
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/spartan-coaching test
pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand
pnpm run build
pnpm run test:e2e
pnpm run release-gate
pnpm audit --audit-level high
```

Run the existing approved dependency policy/attestation and regression commands from current CI as well; a raw audit failure must be reported honestly, and only existing exact-artifact policy may disposition it. Do not modify exception scope/hash/expiry. Run DB P02/P03 through existing gates where the environment supports them; no DB change is authorized. Document absent local infrastructure/credentials and rely only on identified successful CI evidence for tests not run locally. No Terraform verification applies without an authorized infra change. Clinical AI evaluations are not required for disconnected contract changes; any unexpected AI integration change is a scope blocker.

### PR REQUIREMENTS

Review git status and every diff before intentional staging. Remove debug/temp/generated artifacts and any non-synthetic content. Scoped commits and one PR against main; no force-push main or bypass. Explain the defects, exact repairs, remaining intentional disconnection and verification limits.

Include this disposition ledger, completed with actual commit/file/test evidence:

| PR #186 discussion ID | Required repair |
|---|---|
| 4175208372 | H2 dual-time qualification/attestation checks |
| 4175208376 | H3 bounded verified issuance |
| 4175208382 | H6 VERSION expiry identity |
| 4175208386 | H1 route/guard matching |
| 4175208391 | H4 publication chronology |
| 4175208397 | H6 complete LKG witnesses and H2 health grant pin |
| 4175208400 | H5 authority-level invalidation replacing enumerated fanout |
| 4175208404 | H7 first-operation-inclusive deadline |

Mark each FIXED or ARCHITECTURALLY_DISPOSITIONED with the exact approved rule, implementation evidence and regression. Option C disposition still requires its code/test change; discussion alone is not closure. Resolve an original thread only when its specific evidence is complete and repository permission permits. No GitHub messages/comments are posted during this architecture pass.

### CI FAILURE RECOVERY

Wait for current PR-head CI. Read failing job logs, reproduce where practical and fix implementation-caused failures within scope. Rerun affected checks and let mandatory gates execute. For infrastructure-only failures, identify exact unavailable evidence; do not present partial runs as green. Do not “repair” unrelated failures by weakening tests/security policies. Escalate scope/architecture conflicts through the ExecPlan while continuing unrelated safe work.

### PRE-MERGE MAIN REFRESH

Fetch main immediately before merge, prove branch ancestry and inspect intervening changes. Update the feature branch safely if main advanced; rerun affected local checks and require fresh CI for the updated head. Use a normal PR merge only when authorized and every required check/review condition passes. This architecture decision does not bypass existing merge permissions or branch protection.

### POST-MERGE MAIN VERIFICATION

Record merge SHA and check the exact resulting main workflow. Because cancel-in-progress is true, if that run is superseded solely by a later main push, a fully green descendant is acceptable only with proven ancestry and inspection showing the repair was not reverted/altered. Otherwise exact-main verification remains outstanding. Include seven job outcomes and URLs. Never claim completion based solely on PR green.

### ACCEPTANCE CRITERIA

H1 bypass closed; H2 later credentials cannot heal earlier acts; H3 explicit active issuance, immutable parent provenance and non-broadening generations; H4 impossible history denied without corrupting service dates; H5 valid 4,000-publication revocation produces complete bounded authority invalidation; H6 every required witness and aggregate identity is coherent, rights overlays cannot collide and expiry events are stable; H7 one pre-DB deadline, timeout/commit-uncertainty semantics, compatible writer locks and one-scope policy are fully encoded as future contracts.

All final outputs validate; capacity failures are explicit and atomic; new regressions execute in mandatory CI; original review threads are explicitly dispositioned. No persistence, PHI, clinical integration, client behavior change, dependency or lockfile change. PR and resulting main are green with exact evidence. ExecPlan contains completed work, decisions, tests/results, unexpected findings, commits/PR/CI, blockers, owner actions and next boundary.

### STOP CONDITIONS

Stop after this repair's authorized implementation/PR/merge/verification workflow. If any material rule cannot be safely met, record ARCHITECTURE BLOCKER; do not substitute architecture. If merge is not authorized, stop with a verified reviewable PR and clear remaining owner action. If relevant verification remains unavailable, label it outstanding and do not claim complete.

After green repair, a **fresh independent Astra adversarial review in a different implementation conversation** is required. Only its explicit GO for K1B permits issuing K1B-PERSIST. This architecture GO is not a persistence GO.

### OWNER-ONLY OPERATIONS

Production Terraform apply; destructive production migrations; secret rotation; patient-data migration; PHI enablement; rollout; material App Store/TestFlight submission; licensing/contracts; real reviewer credential approval; production root grant appointment/bootstrap. None is needed for this packet and none is authorized here. Code merge and production activation remain separate.

### EXPLICIT NON-GOALS

No K1B/K2; no persistence/API/worker rollout; no clinical or legal sufficiency claim; no new source-class hierarchy, role authority or automatic diagnosis; no full platform rewrite. Foreign inventory performance work, broad fuzzing infrastructure and richer multi-fault diagnostics remain SAFE_FUTURE_HARDENING. Correct false completion claims now, but avoid unrelated documentation rewrites.

## Technical grounding and limits

The timeout policy is an architectural choice grounded in the repository's PostgreSQL 16 baseline. PostgreSQL documents statement_timeout per statement and lock_timeout per lock attempt, with zero disabling these timeouts; an overall command budget therefore requires additional coordination. Cancellation is not a guaranteed acknowledgement that an already-issued command failed. These facts motivate the explicit deadline and unknown-commit rules; they are not claims that the future adapter has been tested.

Primary references: [PostgreSQL 16 client defaults](https://www.postgresql.org/docs/16/runtime-config-client.html), [protocol message flow and cancellation](https://www.postgresql.org/docs/16/protocol-flow.html), [explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html). No real PHI, production credentials or external clinical information was used.

This pass created this architecture deliverable only. Existing code remains unrepaired. The review's current K1B NO-GO remains in effect until the separate implementation and independent review finish.

GO — K1A-REPAIR is architecture-complete and ready for bounded Sol implementation
