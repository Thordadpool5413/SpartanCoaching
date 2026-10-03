# K1A architecture decision and implementation packet

Status: architecture decisions accepted for bounded synthetic implementation,
2026-10-03, under the owner's architecture-authoring instruction. Runtime work is
not completed by this document. This is one K1A packet, not a K1B packet.

CURRENT_MAIN_SHA: `c1812b3ceca80a1a03cf9cf91a460c6fa355c9ee`.
LATEST_MAIN_CI_RUN_ID: `37117283612`.
LATEST_MAIN_CI_RESULT: `success`, completed push event for that exact SHA; all seven
jobs successful. Evidence: https://github.com/Thordadpool5413/SpartanCoaching/actions/runs/37117283612.
Refresh these values before implementation; older green evidence is insufficient.

## Part A — correction matrix

Evidence paths below are relative to the repository and inspected at CURRENT_MAIN_SHA.
The foundation directory is `artifacts/api-server/src/knowledge/foundation/`.

| Finding | Decision | Current evidence and resolution |
|---|---|---|
| B1 | ACCEPTED | `lifecycle.ts` trusts actor role/permission strings; `contracts.ts` lacks credential references. `clinical/access.ts` still gives platform admins canAdmin. Adopt explicit scoped capabilities and independent qualification records; reuse sessions, never those role elevations. |
| H2 | ACCEPTED | `approvalSchema` and `hasCurrentApproval` bind only version ID/normalized hash. Bind the complete immutable manifest with the exact algorithm below. |
| H3 | ACCEPTED | `createKnowledgeRegistry` hashes all registry JSON before visibility filtering. Project authorized published state first; no registry-wide fingerprint or revision in tenant results. |
| H4 | ACCEPTED_WITH_MODIFICATION | `decisions.find` lets drafts block authority; supersession does not validate its target; ACTIVATE invalidation is absent. Replace per-version publication pointers with explicit assignment timelines. Cycles are forbidden in assignment/supersession lineage; deliberate rollback to earlier version content is allowed as a new acyclic assignment event. |
| H5 | ACCEPTED | `purposes` omits DERIVED_OUTPUT; rights lack start/revocation. Add independent purposes, immutable rights revision, effective/expiry and revocation overlay; no content purge implementation. |
| B6 | ACCEPTED_WITH_MODIFICATION | Durable contract is deferred. Existing workflow storage commits state/audit/outbox together, but its idempotency claim/finish use separate transactions. Specify a single-transaction K1B protocol now; implement only pure contracts/intents in K1A. No imitation in-memory claim of DB atomicity. |
| M7 | ACCEPTED_WITH_MODIFICATION | `auth/middleware.ts` prefers cookie; `security/requestSecurity.ts` exempts any Bearer header. `spartan-coaching-mobile/lib/api.ts` sends Bearer without Origin; native cookies are documented in request-security tests. Strictly protect reserved future knowledge routes; preserve existing route/login transport this packet. Do not claim the legacy global mismatch is fixed. |
| M8 | ACCEPTED | CLINICAL_INFERENCE maps to HUMAN_CLINICAL_REVIEW; health lacks NOT_CHECKED; aggregation is array-order dependent. Keep inference provenance separate from attestation, add explicit unassessed health and deterministic precedence. |
| L9 | ACCEPTED | AGENTS still says current boundary is completed K0/safe K1 and plan index points there. Keep permanent rules, move active phase/progress to dedicated K1A ExecPlan, preserve history. |

Other inspected canonical systems: `lib/db/src/schema/{auth,aiTools,salesWorkflow}.ts`,
`lib/db/src/migration-safety.ts`, `lib/db/schema-contract/README.md`,
`lib/hospice-sales-runtime/dist/sales-workflow.js`, current CI/package scripts,
knowledge mandate/design/audit, clinical-cloud ADR-004 and target/security design,
foundation tests, auth/session/origin tests and `patches/README.md`/security scripts.
Workflow UUID tenants are not the canonical product integer organization IDs.
No new system or inference of production database state is needed.

# K1A-CORRECT
## Knowledge Foundation Contract Corrections

### OBJECTIVE

Repair and verify the disconnected knowledge foundation so a later independently
reviewed K1B can persist coherent contracts. Reproduce each defect before fixing
it; deliver tested v2 semantics, no clinical authority/content or persistent service.
Architectural choices in this packet are normative; return contradictions to Astra.

### IN SCOPE

Pure strict schemas, canonical manifest/digest helpers, capability/qualification
evaluation, authorized projection, deterministic resolution, aggregate publication
transitions and event intents; synthetic regressions; strict origin checks in the
reserved future knowledge namespace; ADR/design and ExecPlan reconciliation.
Use existing Zod version, Node crypto, Express and Vitest. No new dependency.

### OUT OF SCOPE

No knowledge DB table/migration/number reservation, admin HTTP endpoint, ingestion,
network fetch, source corpus, patient data, FHIR, OpenAI changes, clinical tool or
prompt/schema changes, UI/mobile changes, scheduler, search engine, broker, cloud
resource, production operation, K1B or K2–K23 integration. No source/license/reviewer
production approval. Existing sales/clinical runtime semantics stay unchanged.

### FILES TO INSPECT

- `AGENTS.md`, `.agent/PLANS.md`, both knowledge ExecPlans and this packet.
- All `docs/architecture/knowledge-2026-10-03/` documents and relevant
  `docs/architecture/clinical-cloud-2026-10-01/` ADR/design/security/packet evidence.
- Foundation `contracts.ts`, `resolver.ts`, `lifecycle.ts`, `foundation.test.ts`.
- `artifacts/api-server/src/auth/` session, admin, entitlement and tenant helpers/tests;
  `clinical/access.ts`; `security/requestSecurity.ts` and tests; middleware order in `app.ts`.
- `artifacts/spartan-coaching-mobile/lib/api.ts` and existing auth/token tests,
  read-only to confirm transport compatibility.
- `lib/db/src/schema/`, `migration-safety.ts`, migration/catalog/recovery tests;
  workflow outbox/idempotency schema and shipped implementation named above.
- `.github/workflows/ci.yml`, root/API-server package scripts, `patches/README.md`,
  `forge-attestation.json`, `scripts/forge-security.test.mjs`, `scripts/security/*`.

### FILES EXPECTED TO CHANGE

Implementation: foundation `contracts.ts`, `resolver.ts`, `lifecycle.ts`,
`foundation.test.ts`; add `canonical.ts`, `authority.ts`, `publication.ts` in that
same directory; `security/requestSecurity.ts`, `security/requestSecurity.test.ts`.
Use `foundation.test.ts` as the required test entry so regressions are actually run
by the existing enumerated API test script. Helpers may be imported by that file;
do not create silently unexecuted suites. A separate security test file requires
explicit addition to the existing API test command, without removing other tests.

Documentation: this decision packet, `02-foundation-design.md`,
`docs/execplans/knowledge-k1a-correct.md`, `.agent/PLANS.md`, `AGENTS.md`.
Preserve the historical K0/K1 ExecPlan. No lockfile, dependency policy, DB schema,
API specification/generated contract, client or infrastructure change is expected.

### CLAIM/AUTHORITY CHANGES

ADR K1A-001: preserve all 17 claim names and all existing non-patient eligibility
mappings. Replace the provenance-domain enum HUMAN_CLINICAL_REVIEW with
MODEL_INFERENCE and map CLINICAL_INFERENCE to MODEL_INFERENCE. This is a provenance
classification, never an assertion that model output is true. Keep PATIENT_EVIDENCE,
DETERMINISTIC_DERIVATION and MODEL_INFERENCE forbidden in this non-patient knowledge
registry. Human review is an attestation record, never a source domain or automatic
conversion from inference/derived fact to source fact. No model confidence field.

Use `knowledge-foundation-v2`. Reject v1 at this internal boundary rather than
silently upgrading approvals. Current repo search shows no production consumer of
these foundation helpers; update internal fixtures/signatures together. If a new
live consumer is found on refreshed main, stop that compatibility-dependent part
and record the required migration decision. Do not alter existing wire APIs.

### PERMISSION CONTRACT

ADR K1A-002: authentication, application role, knowledge capability and professional
qualification are separate. Keep canonical positive integer member/organization
IDs. Trusted actor context contains member ID, organization ID, active membership
and organization status, and verified session identity. No model actor and no
client-supplied role, organization or grant can establish authority. Pure functions
receive this context from fixtures now and a trusted adapter later; they do not
authenticate arbitrary JSON merely by parsing it.

Approve exactly: `knowledge.read`, `.register`, `.submit`, `.review`, `.activate`,
`.revoke`, `.rollback`, `.license`, `.health`, `.grants` (each fully qualified).
Each grant has immutable ID, subject member ID, scope ID, nonempty allowed domains,
nonempty capabilities, effectiveFrom, expiresAt, grantedByMemberId, verifiedByMemberId,
verificationRef and verifiedAt; revocation is a separate monotonic operational
overlay with revision/revokedAt. Timestamps obey the temporal rules below. No
perpetual grants, role-derived grants, self-grant or self-verification. Grantor
delegation cannot exceed their effective scope/domains/capabilities or expiry.

Scope is `{id,kind,organizationId}`. Choose `id="global"`, kind GLOBAL, organizationId
null; or `id="tenant:<canonical positive integer>"`, kind TENANT, that exact integer.
Reject leading zeros, mismatches and arbitrary tenant aliases. IDs are identifiers,
not credentials. Future SQL gives each scope one canonical row, kind/organization
CHECKs, unique GLOBAL and tenant entries, and non-null scope FKs on relationships.
No ordinary nullable UNIQUE is accepted as the scope constraint.

Tenant operations require actor.organizationId equal to the tenant plus explicit
matching grant/domain; GLOBAL requires an explicit global grant/domain. Global
stewardship cannot read tenant-private metadata or PHI. No platform_admin/org_admin
shortcut; no `clinical.canAdmin` or sales manager mapping. Inactive/suspended/
offboarded membership denies operations. An active trial organization may use an
explicitly granted synthetic knowledge capability; billing is not authority.

K1A has no grant-management route or production bootstrap. Synthetic fixtures use
distinct, explicitly verified actors. Future production bootstrap is an owner-
authorized audited seed of designated grant authorities, never first-user/email/
environment-role elevation. Appointing those humans is not required to test schemas.

### QUALIFICATION CONTRACT

ADR K1A-003: immutable qualification records have ID, subject member ID, exact scope,
class, permitted domains/jurisdictions, verifiedByMemberId, verification method enum
`OWNER_ATTESTATION|CREDENTIAL_CHECK|SYNTHETIC_TEST`, verificationRef, verifiedAt,
effectiveFrom, expiresAt and reviewDueAt; revocation is a monotonic overlay.
SYNTHETIC_TEST is accepted only in explicit synthetic fixtures/test-mode context,
never a production eligibility adapter. Verification references are opaque bounded
IDs, not document bodies, URLs with credentials, raw registry responses or secrets.
Verifier differs from subject; models and generic admins confer no qualification.

Classes: HOSPICE_PHYSICIAN, CLINICAL_LEADER, PHARMACIST, CODER,
COMPLIANCE_REVIEWER, WORKFLOW_REVIEWER. Required class: pharmacist for drug
terminology/label/pharmacology; coder for official coding; hospice physician for
clinical evidence/protocol; workflow reviewer for Spartan workflow; compliance
reviewer for remaining non-patient domains. CLINICAL_LEADER is modeled but grants
no substitute right to approve physician/pharmacy/coding domains. Patient-domain
review remains outside this registry.

For approval, subject equals actor; grant scope/domain and qualification scope/
domain match the artifact, and qualification jurisdictions cover every artifact
jurisdiction by exact membership (no invented geographic hierarchy). All validity
windows include server now; verifiedAt is not future; reviewDueAt cannot exceed
grant expiry, qualification expiry or qualification review due. No inference that
a class label establishes a legal professional license.

Subsequent selection/activation rechecks the approval's exact referenced grant and
qualification plus current subject membership. Revocation/expiry blocks new use;
it never rewrites historical signed review/attestation records. Do not transitively
revoke valid grants just because the original grantor later leaves; explicit target
grant revocation controls that case. Grant issuance checks delegation at issuance.

### SEPARATION-OF-DUTIES CONTRACT

ADR K1A-004: registrar and submitter may be the same person. The approving reviewer
must differ from both. Reviewer and approver are the same attesting person in K1A;
there is no second hidden review stage. Activator must differ from the selected
approving reviewer; activator may equal registrar/submitter. Actor needs the exact
operation capability; an activator does not become professionally qualified.
Rollback needs `.rollback` and the same approval/duty checks as activation.
Emergency revoke needs `.revoke` and may be performed by any otherwise authorized
actor, including the registrar/reviewer/activator. No other exceptions. REVOKED
is terminal for that internal version. Same-person approval/activation is rejected.

### ARTIFACT IDENTITY

ADR K1A-005: separate immutable source metadata revisions, immutable artifacts,
immutable approvals, mutable operational projections and immutable publication history.
Source metadata tuple: scope ID, stable source ID, positive metadataRevision,
publisher, title, official HTTPS URL without credentials, domain, claimTypes,
educationalOnly. No in-place reuse of a revision with different metadata.

Artifact tuple: internal version ID, stable source ID + metadataRevision, stable
document ID, upstream edition, positive artifactRevision, rawHash, normalizedHash,
parserId + parserVersion, sourceUrl, publishedAt, retrievedAt, service interval,
applicability, rights revision and nullable legacyCoverageSnapshotId. Hashes are
lowercase 64-character SHA-256 hex. Content/metadata identifiers remain bounded by
the existing safe ASCII ID contract. All timestamps/dates are strict and real.

Uniqueness is scope/source/document/upstreamEdition/artifactRevision; not upstream
edition alone. Material changes create a new internal version/artifactRevision
even if edition and normalized text are unchanged. Exact duplicate registration
returns the existing identity; changed payload with the same identity is conflict.
Parser/provenance/scope/rights/applicability changes require new review. Do not
mutate a source's scope or rewrite approval objects. The optional legacy snapshot
FK/UUID is lineage only; its JSON hash is never relabeled raw byte evidence and
same-version legacy upserts are not proof of immutability. No legacy authority backfill.

### CANONICAL REVIEW MANIFEST

Build a strict object with precisely these top-level keys:

```text
schemaVersion = "knowledge-review-manifest-v2"
canonicalizationVersion = "k1a-c14n-v1"
scope = {id, kind, organizationId}
source = {id, metadataRevision, publisher, title, officialUrl,
          domain, claimTypes, educationalOnly}
artifact = {id, documentId, upstreamEdition, artifactRevision,
            rawHash, normalizedHash, parserId, parserVersion,
            sourceUrl, publishedAt, retrievedAt,
            effectiveFrom, effectiveTo, legacyCoverageSnapshotId,
            registeredByMemberId, submittedByMemberId}
applicability = {payers, jurisdictions, macs, providerTypes, settings,
                 benefitPeriods, codeEditions, products, populations}
rights = {id, revision, owner, reference, status, effectiveFrom, expiresAt,
          commercialUse, permittedUses, verifiedByMemberId,
          verificationGrantId, verificationQualificationId,
          verificationRef, verifiedAt}
```

All fields are present. Only explicitly nullable fields may be null. No unknown
fields. Approvals contain ID, versionId, scopeId, reviewManifestDigest,
reviewerMemberId, reviewGrantId, qualificationId, reviewedAt and reviewDueAt.
Recompute the digest; never trust a supplied digest or copy approvals forward.
Registrar/submitter identity is immutable once recorded and digest-bound at review;
submittedByMemberId is null before first submission and non-null for approval.
Resubmission keeps the original submitting identity; it cannot erase a duty conflict.
Only that original submitter may resubmit the same artifact after rejection; another
submitter registers a new artifact revision. Registrar identity cannot be rewritten.
Health/rights revocation, lifecycle revision, events and
assignment pointers are excluded from artifact identity and checked independently.
Rights terms and verification above are immutable; revocation is an overlay.

### DIGEST ALGORITHM

ADR K1A-006: implement repository-local `canonical.ts`; no new package and no claim
of RFC 8785 compliance. Parse strict allowlisted Zod schemas first, including the
fixed schema/canonicalization versions. Reject undefined anywhere, sparse arrays,
non-JSON values, NaN/infinities, non-safe integers, negative zero and unpaired UTF-16
surrogates. Timestamps normalize to `Date.toISOString()` UTC milliseconds; dates
stay YYYY-MM-DD. Do not Unicode-normalize text; distinct code points remain distinct.

Set fields: claimTypes, permittedUses, payer/jurisdiction/MAC/provider/setting/
benefit/code/product/population values, grant capabilities/domains and qualification
domains/jurisdictions. Deduplicate and sort strings by ordinal UTF-16 code units
using explicit `<`/`>` comparisons, never localeCompare. Enumerated sets must be
nonempty unless a schema explicitly permits empty (e.g. no approved rights).
Null optional applicability means reviewed dimension independence, never missing
knowledge. Empty dimension arrays are rejected. Required payer/jurisdiction sets
cannot be null; MAC_COVERAGE requires a non-null MAC set.

Recursively sort object keys by the same ordinal comparator. Serialize keys/string
values with JSON.stringify escaping, integers as JSON decimal and booleans/null as
JSON literals. Join with commas/colons and no whitespace/newline. Encode that exact
string as UTF-8, then SHA-256, lowercase hex. Ordered arrays are preserved only for
explicit sequence contracts (event/history sequences), never included in the review
manifest. Manifest record collections sort by their documented identity keys before
serialization; never deduplicate distinct records on content or hide duplicate IDs.
Golden tests pin canonical bytes and independently computed digests; round-trip
and reorder tests cannot be the only proof. Algorithm changes require a new version.

Serializer-unit vector (a test-only allowlisted shape, not a review manifest):
canonical bytes `{"a":null,"b":["A","B"],"v":"k1a-c14n-v1"}` have SHA-256
`dbe3dbbca0c536d939464856a8bd5c57a25e0f642b4d770526bcced325476ce8`.
Also pin a full synthetic review-manifest vector; changing the serializer and its
expected digest together without independent byte comparison is not verification.

### TENANT-SAFE MANIFEST/BUNDLE RULES

ADR K1A-007: remove the public registry-wide bundleHash/bundleId property. Project
server-authorized GLOBAL and actor's exact TENANT scope, allowed domains and active
`.read` capabilities before resolving, validating referenced payloads or hashing.
Retain a private owned immutable inventory; no caller gets its counts/revision/hash.
Foreign partition payload validation failures must not make another tenant's valid
read fail. Validate administrative writes separately; at read time strictly validate
only the authorized projection and its same-scope references. A malformed authorized
reference fails closed with a bounded contract error; never fall back to a foreign ID.

Supported payer/jurisdiction configuration is explicit and scoped, not derived from
candidate inventory. A TENANT reference cannot point to GLOBAL/another TENANT artifact,
approval/grant/qualification; global assignments carry their own global references.
Combine independently authorized global and tenant publication sets at read time.

Runtime manifest keys: schemaVersion=`knowledge-runtime-manifest-v2`,
canonicalizationVersion, authorizedScopeIds, normalized request context (claim,
service date, payer, jurisdiction, optional applicability dimensions, purpose),
scoped supported configuration, and publishedEntries. Each entry contains scope,
source/document identity, assignment ID/revision/interval/applicability, version ID,
review-manifest digest and current evaluated state/reason/warning codes. Sort entries
by scope/source/document/assignment ID; sort/deduplicate code sets. Omit raw now,
unreferenced personnel details, drafts, audit and administrative sequence counters.
Compute eligibility using server now, so expiry changes evaluated state and hash.

bundleHash is SHA-256 of those canonical bytes; bundleId is `kb2:<bundleHash>`.
Results, decisions and selected entries have the same deterministic ordering.
Any future ETag is derived from this fingerprint, never a global inventory revision.
K1A adds no HTTP ETag/count/cursor route. Define future pagination/counts strictly
over this authorized projection; another tenant's valid or malformed payload change
must not alter any caller-visible metadata. Limits apply per authorized partition
(retain existing 500 source / 2000 version safety bounds), not total foreign inventory.

### CANDIDATE VS PUBLISHED AUTHORITY

ADR K1A-008: inventory/review state and publication are independent. Use explicit
assignment records, never `versions.filter(state===ACTIVE)` as publication proof.
Assignment fields: id, scopeId, sourceId, documentId, versionId, reviewManifestDigest,
approvalId, serviceFrom, serviceTo, applicability, enabledUses, createdAt,
createdByMemberId, eventId, predecessorAssignmentId nullable, revision, and retirement
event/time nullable. Retirement removes an assignment from the current publication
set, not its immutable history. Keep record creation fields immutable; retirement
is an append-only event plus projection. No current assignment may reference a draft.

Assignment interval/applicability must be a subset of its immutable reviewed version.
Enabled uses must be a nonempty subset of approved rights, including INTERNAL_STORAGE.
A resolver only evaluates nonretired assignments; it never falls back to unassigned
versions. DETECTED/PARSED/VALIDATED/REVIEW_PENDING/APPROVED-but-unpublished candidates
and changes to them have no effect on published results or hashes. A revoked published
assignment remains a blocked tombstone until explicitly replaced; an unpublished
revoked candidate cannot poison active publication.

Pure reducer signature becomes aggregate-oriented: `transitionKnowledge(state,
trustedActor, command)` returns a new owned state plus event intents, mutating no
input. Expected scope/publication revision and every touched operational version
revision are mandatory. Server context supplies now/request/event IDs; clients do
not choose authoritative timestamps or actor. K1A implements semantic atomic return,
not durable transactions or multi-process concurrency.

Lifecycle table (no generic status PATCH):

| Operation | Preconditions/result | Authority |
|---|---|---|
| REGISTER | New immutable identity -> DETECTED; duplicate identity mismatch rejects | `.register` |
| RECORD_STAGE | DETECTED -> FETCHED -> QUARANTINED -> PARSED -> DIFFED -> VALIDATED, exactly one step with typed evidence reference | Trusted synthetic pipeline context only in K1A; no human HTTP/model command |
| SUBMIT | VALIDATED -> REVIEW_PENDING; records submitter | `.submit` |
| APPROVE | REVIEW_PENDING -> APPROVED; appends digest-bound attestation | `.review` + required qualification + duties |
| REAPPROVE | APPROVED/ACTIVE/SUPERSEDED unchanged; appends renewed attestation for unchanged artifact | `.review` + required qualification + duties; no publication effect |
| REJECT_REVIEW | REVIEW_PENDING -> VALIDATED; appends rejection, no approval deleted | `.review` + required qualification; resubmission/new evidence needed |
| ACTIVATE | APPROVED -> ACTIVE; creates nonoverlapping assignment | `.activate`, approval/duties/rights/current health |
| SUPERSEDE | Replaces one assignment with eligible never-before-published APPROVED version; old latest state SUPERSEDED, new ACTIVE | `.activate`, checks below |
| ROLLBACK | Replaces an assignment with a previously published eligible version; new audited assignment, no history deletion | `.rollback`, checks below |
| REFRESH_APPROVAL | Retires/recreates same-version assignment with a new valid approval ID; interval/applicability/uses unchanged | `.activate`, all activation/duty checks; explicit republication |
| REVOKE | Any nonrevoked operational version -> REVOKED, terminal | `.revoke`; immediate publication denial |

Operational commands are also typed: RECORD_HEALTH (`.health`, chronological
observation); APPROVE_LKG (`.review` plus qualification, binds manifest/until);
REVOKE_RIGHTS (`.license`), REVOKE_GRANT and REVOKE_QUALIFICATION (`.grants`, exact
scope/domain/delegated authority, no self-grant/verification). Each requires target
and expected revisions, leaves immutable records intact and changes only its
operational overlay. There is no general grant/qualification issuance API in K1A.
Expiry intent evaluation is trusted server computation, not a human command.

Pipeline evidence is metadata only, not proof that a real parser ran; no ingester is
implemented. Human operations cannot skip stages or self-assert pipeline success.
Operational ACTIVE/SUPERSEDED describes publication history, not selection authority:
retained historical assignments may reference SUPERSEDED artifacts if still eligible.
No operation can clear a version's revoked state, rights revocation or history.
Each published assignment pins one exact approval ID. A new REAPPROVE record alone
does not change its eligibility or hash: use REFRESH_APPROVAL or a subsequent explicit
publication command to bind the new approval. This makes renewal possible without
silently turning review into activation. A retired approval remains in history.

### TEMPORAL SEMANTICS

ADR K1A-009: service intervals `[from,to)` use calendar dates; from inclusive, to
exclusive, null end unbounded. Reject invalid dates/end<=start. Never convert a
service date through local midnight. Artifact publication/retrieval, approval,
grant, qualification, rights, health and event timestamps normalize to UTC instants.
Validity is from<=now and now<end; equality at expiry denies. No future validation
or approval. Preserve publishedAt<=retrievedAt<=server now on activation/selection.
Publisher-inclusive dates require a later adapter's explicit conversion, not a
guess in the foundation. Historic signed reviews pin prior manifests; new reasoning
for an old service date still checks current revocation/rights/qualification/health.

### SUPERSESSION / ROLLBACK

ADR K1A-010: SUPERSEDE takes current assignment ID, replacement version ID and
cutover service date. Verify same scope/source/document, target exists, not self,
new target never previously published, approved/eligible, and target applicability
covers the old assignment's exact applicability. Cutover is within the current
assignment interval (start allowed, end excluded). Replacement artifact must cover
the complete resulting new segment. Partial multidimensional reshaping is not a
K1A command; reject it instead of inventing a split algorithm.

Atomically retire the old assignment. If cutover>old start, append a retained
historical assignment for old version `[oldStart,cutover)`; append a replacement
assignment `[cutover,oldEnd)`. Both carry the old applicability and enabled uses;
the new version's current rights must allow every enabled use. New IDs/event IDs,
lineage and revisions record the change; never edit artifact effectiveTo.
Both new records reference the retired predecessor; references only point to older
records. Validate imported lineage for missing/foreign/self/cyclic links. Version
`supersededBy` is removed as the authoritative publication model.

ROLLBACK uses the same split/retire algorithm, with a target demonstrably previously
published for this same scope/source/document. Its current digest-bound approval,
qualification, rights, health and duties must pass and its artifact must cover the
new segment/applicability. It may intentionally reuse old version content; it must
not create a cycle in assignment lineage. Revoked content is never eligible. Restore
an unavailable/expired target only after independently satisfying applicable fresh
review/health requirements; never override an expiry or revocation flag.

Two assignments structurally conflict when same scope/source/document, intersecting
service intervals and intersection in every applicability dimension. Null independent
dimension intersects any value; finite sets intersect by shared value. Do not require
equal serialized objects. Different sources are not ranked; declared conflicts between
current published version IDs (same scope only) produce conflict when both apply.
GLOBAL and TENANT records are separate ownership keys; neither silently overrides the
other. Replacing a global record with a tenant record is forbidden.

K1A's pure publication helper rejects overlapping current assignments on writes and
reports conflict on an authorized malformed/conflicting read snapshot. K1B will
serialize all assignment writes by scope/authority locks and enforce DB invariants;
no DB extension is needed or selected by this packet.

### LICENSE CONTRACT

ADR K1A-011: independent purposes INTERNAL_STORAGE, MODEL_INPUT, PROMPT_USE,
CUSTOMER_DISPLAY, DERIVED_OUTPUT, REDISTRIBUTION. Missing use denies; MODEL_INPUT
does not imply output/display. Rights immutable fields are exactly those in the
review manifest. Status PENDING/DENIED permits null verification fields and no use;
APPROVED requires verification member/grant/reference/time and effectiveFrom.
expiresAt null means explicitly approved nonexpiring rights, never unknown rights.
`commercialUse` must be true for Spartan commercial application use; K1A resolver
does not accept client input to relabel its use noncommercial. Public URLs confer
no rights. Verification must reference an eligible same-scope `.license` grant and
COMPLIANCE_REVIEWER qualification in the trusted rights-verification context.

Operational rights overlay has rights ID/revision, monotonic revision and revokedAt
nullable. Revocation overrides immutable APPROVED status. Future-effective, expired,
revoked, unverified or disallowed-purpose rights return LICENSE_NOT_PERMITTED.
Term changes/expanded uses/new verification require new rights revision, artifact
revision and approval. Revocation needs no replacement artifact to deny use.

License termination emits invalidation and content-removal intent. CONTENT means
source/derived bytes and caches, absent in K1A. A provenance tombstone is only minimal
IDs/digests/rights revision/event timing/reason sufficient to explain history; it is
not a copy of licensed content. No purge/store/backup deletion claim is implemented.
Actual rights and retention decisions remain owner-only; later storage packets must
define deletion without silently erasing audit or resurrecting removed content.

### HEALTH CONTRACT

ADR K1A-012: NOT_CHECKED, CURRENT, STALE_ALLOWED_WITH_WARNING, STALE_BLOCKED,
UPSTREAM_UNAVAILABLE, REVOKED. NOT_CHECKED has null checked/validated/warning/expiry
evidence and no LKG authorization; it is never CURRENT. Checked states carry checkedAt;
CURRENT requires lastValidatedAt<=checkedAt<=now and warningAt<hardExpiresAt. With
no successful validation, unavailable cannot use LKG. Hard expiry is finite.

LKG is an explicit digest-bound attestation with reviewer, same-scope review grant,
required qualification, approvedAt and until<=hardExpiresAt, not a bare boolean.
All approval/rights/qualification checks still apply. Before hard expiry, warning-
aged CURRENT or STALE_ALLOWED_WITH_WARNING/UPSTREAM_UNAVAILABLE can be applicable
only with current LKG attestation; include STALE_ALLOWED_WITH_WARNING. At/after hard
expiry or STALE_BLOCKED return SOURCE_EXPIRED; NOT_CHECKED/unavailable without LKG
return SOURCE_UNAVAILABLE. REVOKED returns SOURCE_REVOKED. No manufactured checkedAt.
Activation/rollback/supersession require fresh CURRENT before warningAt, never LKG.

Health writes require `.health`; granting LKG additionally requires `.review` and
the matching qualification. They are pure operational updates/intents in K1A, no
network monitoring or scheduler. Artifact revocation, rights revocation/expiry and
health hard expiry always defeat LKG. Event/expiry evaluation uses server time.

Deterministic resolution: authorize first; validate only visible referenced contracts;
missing core service date/payer/jurisdiction -> INSUFFICIENT_CONTEXT; unsupported scoped
payer -> PAYER_KNOWLEDGE_NOT_CONFIGURED, then unsupported jurisdiction ->
JURISDICTION_NOT_SUPPORTED. Evaluate only published assignments for eligible domains.
Known interval/dimension mismatch is NOT_APPLICABLE and does not block. Missing needed
optional dimensions are INSUFFICIENT_CONTEXT; do not infer values.

For relevant assignments, choose the first PRESENT state in this fixed precedence,
not array order: SOURCE_REVOKED, LICENSE_NOT_PERMITTED, SOURCE_EXPIRED, NOT_APPROVED,
SOURCE_UNAVAILABLE, CONFLICT_REQUIRES_REVIEW, INSUFFICIENT_CONTEXT, NOT_ACTIVE.
Include all sorted per-assignment decisions; selected=[] if any blocking state.
Otherwise APPLICABLE if eligible entries exist, NOT_APPLICABLE if only known mismatches,
SOURCE_UNAVAILABLE if no published authority exists. Required-source outage means a
relevant published assignment is unavailable; it blocks convenient substitution.
Do not invent a clinical required-domain completeness policy or promote APPLICABLE
into a patient finding. Registry reorder must leave the entire result identical.

### REQUEST-SECURITY CORRECTION

ADR K1A-013: preserve cookie-first `loadSession` and existing routes in K1A. In
`requireTrustedMutationOrigin`, before legacy Bearer/iOS exemptions, apply a strict
branch for path equal to `/api/knowledge-control` or starting `/api/knowledge-control/`.
For unsafe methods with a nonempty string session cookie (matching authentication's
cookie predicate), require an allowed Origin regardless of ANY Bearer header or iOS
header. Missing/hostile/opaque origin denies 403 CSRF_ORIGIN_REJECTED. Safe methods
do not mutate and retain existing handling. Bearer-only passes origin classification,
not authentication: `loadSession`/`requireAuth` still reject an invalid token with 401.

No route is created. A test-only Express harness combines the actual guard and
session/requireAuth middleware with a mocked DB to prove principal selection and
invalid-token denial; a fake Bearer string must never become a verified session.
Cookie A + token B selects A only after trusted-origin protection, never B's authority.
Existing iOS login exemption stays limited to `/api/auth/login`; no exemption is
available under the knowledge prefix. Test lookalike prefixes to prevent accidental
changes outside scope. Future K1B MUST mount every knowledge mutation under this
namespace/guard. This is a stricter guard, not a knowledge-route bypass. Existing
mobile endpoints are unchanged; native use of future control routes must be Bearer-only
or meet the same cookie-origin requirement. Do not globally change client transport.

### FUTURE K1B TRANSACTION CONTRACT

ADR K1A-014: specify, do not implement, this sequence for each future mutation:
authenticate; derive actor/scope; preliminary authorize; begin PostgreSQL transaction;
set transaction-local security context; lock as below; claim receipt and check canonical
request fingerprint; re-read current session/member/grant/qualification/rights/health;
verify expected revisions; apply pure command; write immutable audit; write outbox;
persist bounded response receipt; commit. No external network or source fetch inside.
Reauthorization precedes receipt replay; do not require a previously completed command's
old state precondition to hold again. Replay returns a historical command receipt,
not an assertion that its old source remains eligible now.

Reuse the existing DB pool/transaction patterns, never a new auth/DB/job system.
The sales idempotency class's separately committed claim/finish is not suitable
unchanged. K1A has no SQL adapter, RLS implementation or durable receipt claim.

### IDEMPOTENCY CONTRACT

ADR K1A-015: receipt key `(scopeId, actorMemberId, operation, SHA256(key))`;
key is bounded opaque client randomness, never logged/stored raw. Fingerprint is
versioned canonical command payload including target IDs and expected revisions,
excluding server-generated clock/event/request IDs. Same key/same fingerprint after
current authorization returns committed result with no new state/audit/event. Different
fingerprint -> 409 IDEMPOTENCY_CONFLICT. All receipt writes share mutation transaction.
Before commit crash leaves nothing; response loss after commit safely replays.
Concurrent duplicate waits at most five seconds, then returns 409 COMMAND_IN_PROGRESS
with bounded retry guidance. No independently committed processing placeholder.
Retain receipt key/fingerprint/result metadata in K1B; no automatic key reuse or TTL
deletion until a later reviewed retention protocol makes duplication impossible.

### CONCURRENCY CONTRACT

ADR K1A-016: K1B uses a non-owner app role and scope-first serialization. Every
knowledge mutation, including grant/qualification/rights/health revocation, locks
the affected canonical scope rows FOR UPDATE in ordinal scope-ID order. Then lock
session row, member rows ascending integer ID, source/document keys ordinal, version
IDs ordinal, grant IDs, qualification IDs, rights IDs, health IDs, then receipt row.
Acquire only needed rows but never invert that order. Recheck membership/qualifications
in transaction; member/session deletion/update must conflict with held row locks.
Scope serialization intentionally favors simple correctness over high write throughput.
No cross-scope target relationships are accepted; multi-scope invalidation uses sorted
locks. A future optimization requires architecture review.

Updates include scope/ID/expected revision; exactly one affected row required, else
409 KNOWLEDGE_REVISION_CONFLICT. The publication parent revision also covers assignment
insertion to prevent empty-set races. Zero-row updates are not success. Two activations
cannot both publish intersecting assignments. Approve vs credential revoke and activate
vs rights/health revoke linearize: first commit may succeed, but later revocation blocks
all subsequent new selection and emits invalidation. If revocation wins, approval/
activation fails. Rollback vs artifact revoke cannot resurrect the artifact. Do not
claim both racers always fail. K1A tests the pure preconditions/intents, not DB locks;
K1B must test two real connections and direct non-owner invariant enforcement.

### AUDIT CONTRACT

ADR K1A-017: immutable event fields: stable event ID, schema version, scope ID,
aggregate kind/ID, source/version/assignment IDs as applicable, operation, actor
member ID, grant/qualification references as applicable, previous/new revision,
occurredAt UTC, request ID, receipt reference/hash, reviewManifestDigest where applicable,
allowlisted reason code, invalidation intent and affected assignment IDs. Use typed
discriminated event variants; no free JSON payload and no source/patient text.

Reason enum: REGISTERED, VALIDATION_RECORDED, SUBMITTED, REVIEW_APPROVED,
REVIEW_REJECTED, PUBLISHED, SUPERSEDED, ROLLBACK_APPROVED, SECURITY_REVOCATION,
RIGHTS_REVOKED, RIGHTS_EXPIRED, HEALTH_BLOCKED, HEALTH_EXPIRED, GRANT_REVOKED,
QUALIFICATION_REVOKED, APPROVAL_EXPIRED. No arbitrary strings matching a regex.
The server supplies identity/time/IDs. Error returns are bounded codes, not validator
dumps/request objects/raw SQL or SDK exceptions. K1B app cannot update/delete audit
or cascade-delete history. K1A emits intent only and performs no log delivery.

ACTIVATE, SUPERSEDE, ROLLBACK and REVOKE always emit publication invalidation intent.
REFRESH_APPROVAL does too; it uses the PUBLISHED reason and identifies the old/new
assignment and approval references. REAPPROVE uses REVIEW_APPROVED and does not
invalidate publication until a publication command adopts that approval.
Rights revoked/expired, health blocked/expired, and referenced grant/qualification/
approval invalidation emit eligibility invalidation intent with affected publication
IDs. No draft mutation invalidates unrelated publication. Pure `evaluateExpiryIntents`
uses object ID/revision/deadline/type as a deterministic deduplication key; selection
denies expired state even if no sweeper ever ran. K1B will persist/deduplicate these
events; no scheduler is created now. Signed historical manifests stay unchanged.

### OUTBOX CONTRACT

ADR K1A-018: later durable event insert shares authoritative transaction. Delivery
record references stable event ID, scope/aggregate revision, availableAt, attempts,
leaseToken/leaseExpiresAt nullable, deliveredAt nullable, deadLetteredAt nullable and
allowlisted lastErrorCode. Immutable event content cannot be changed by retries.
At-least-once delivery; never exactly-once. Consumers deduplicate event ID, recompute
eligibility from canonical SQL, and use aggregate revision monotonically. An older
event may not overwrite newer state; gaps trigger canonical reread rather than
assuming all intermediate events arrived. Invalidation consumers are level-triggered:
reconcile current eligibility, do not replay an old approval command.

Future dispatcher leases are 60 seconds, attempt cap 10, retry delay
`min(300, 2^(attempt-1))` seconds; expired leases are reclaimable and success uses
lease-token CAS. Exhaustion dead-letters without changing clinical/source eligibility.
K1A defines types/negative tests only, no dispatcher/network/broker. Cached/indexed
data is never authority; canonical checks deny revoked/stale/unauthorized use even
when outbox delivery is delayed. No claim that actual clinical reviews are already
invalidated: there is no such consumer in this packet.

### TESTS

Use only synthetic metadata and distinct synthetic actors. First demonstrate the
old behavior with targeted assertions, then invert them into required safety tests;
do not commit a deliberately red intermediate branch head just to prove reproduction.
Record the reproduction command/result and final replacement evidence in ExecPlan.

1. Independently mutate raw hash, normalized hash, parser ID/version, source metadata
   revision/body, scope, document/edition/revision, provenance timestamps, interval,
   each applicability dimension and rights revision/terms: unchanged approval rejects.
   Same edition/different artifact is representable; same identity/different data conflicts.
2. Golden canonical bytes/digests; set reorder/duplicates normalize; ordered events
   preserve order; undefined, malformed dates, unsafe numbers/surrogates reject.
3. Every unauthorized tenant B change (source/version/rights/health/grant/qualification/
   draft/audit and malformed payload) leaves tenant A's result/hash identical. Unrelated
   same-tenant candidates and APPROVED-but-inactive candidates likewise have no effect.
   Authorized published global changes do affect the authorized manifest.
4. Reject no capability, admin-only actor, wrong scope/domain, expired/revoked grant/
   qualification, self-verification and all prohibited duty combinations. Allow qualified
   independent approval/activation and authorized unilateral emergency revocation.
5. Exact service/operational boundaries; nullable end; missing dimensions; intersecting
   unequal applicability sets; disjoint intervals/scopes; deterministic permutation
   tests for every blocking-state combination and mixed applicable/inapplicable sources.
6. Missing/foreign/unrelated/self/cyclic supersession target fails without input mutation.
   Supersession splits timeline correctly; rollback uses new lineage, preserves history,
   and denies revoked/expired/unapproved/unhealthy/rights-invalid targets. Source artifact
   effective interval never changes. Selected historical SUPERSEDED authority still works.
   Renewing an approval alone cannot change a published assignment/result; explicit
   REFRESH_APPROVAL adopts it, checks independent activation and emits invalidation.
7. Future/expired/revoked/unverified rights and every missing purpose deny; MODEL_INPUT
   never grants DERIVED_OUTPUT/display. Activation checks all enabled uses, not storage alone.
8. NOT_CHECKED cannot act CURRENT; future/contradictory health timestamps reject; LKG needs
   exact authorization and never bypasses hard expiry/rights/qualification/revocation.
9. All required publication/eligibility operations produce typed invalidation intents;
   ACTIVATE included. Expiry intent keys stable; no delivery/clinical invalidation claimed.
   Validate audit/outbox types reject content-bearing/unknown/free-reason fields.
10. Knowledge path guard matrix: cookie+trusted Origin succeeds; cookie+missing/hostile
    Origin denies; cookie+invalid Bearer denies missing Origin; cookie A+Bearer B cannot
    switch principal; Bearer-only valid request authenticates; invalid Bearer-only returns
    401 after auth; iOS header cannot bypass knowledge protection. Existing native login,
    cookie reset/token/logout and existing-route tests remain valid. Test-only harness,
    no production knowledge endpoint. No global auth precedence change.
11. Existing valid foundation cases remain meaningful (eligibility, education exclusion,
    missing knowledge versus no-known-issue, immutability, historical selection, review
    requirement and injection text treated as data). Update obsolete contract assertions
    with documented reason; never delete security coverage just to pass.
12. Sentinel marker injected into rejected metadata/command fields must not appear in
    errors/logs; fixtures are synthetic. Static import/route checks prove foundation
    stays disconnected from clinical tools, PHI endpoints and clients. No DB table/
    migration/OpenAPI/lockfile change. No clinical quality claim from these tests.

### LOCAL VERIFICATION

Use pnpm 10.26.1 from packageManager and current workflow's Node version (24 at
baseline). Synchronize clean main before feature branch, preserve human work, record
SHA; suggested implementation branch `fix/k1a-foundation-contracts`.

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server exec vitest run src/knowledge/foundation/foundation.test.ts src/security/requestSecurity.test.ts src/auth/middleware.test.ts src/auth/sessionSecurityContract.test.ts
pnpm run typecheck
pnpm --filter @workspace/spartan-ai-tools test
pnpm --filter @workspace/field-kit-catalog test
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/spartan-coaching test
pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand
pnpm --filter @workspace/db test
pnpm run build
node scripts/performance-budget.mjs
pnpm run release-gate
pnpm exec playwright install --with-deps chromium webkit
pnpm run test:e2e
node scripts/forge-security.test.mjs
node scripts/security/dependency-regression.test.mjs
node scripts/security/patched-audit.test.mjs
node scripts/security/patched-audit.mjs
gitleaks detect --source . --verbose --redact --exit-code 1
git diff --check
```

Also retain current CI's explicit ops-readiness/delivery invocations. Where isolated
PostgreSQL is available, replay EXISTING migrations and run P02 with
RUN_MIGRATION_INTEGRATION=true, MIGRATION_ENVIRONMENT=synthetic and loopback
MIGRATION_TEST_DATABASE_URL; run existing `pnpm --filter @workspace/db run
backup-restore-drill` with RECOVERY_ENVIRONMENT=synthetic and loopback
RECOVERY_TEST_DATABASE_URL/matching PostgreSQL clients. These verify unchanged
infrastructure; do not author migrations or run against production. Record skipped
integration tests as unverified locally, not passed. CI must supply their real proof.

API pretest already checks generated contracts/path registration; no route/spec
change is authorized, so do not regenerate unrelated clients. For a legitimate
unavailable environment or live NPI DNS failure, report exact failure/step and use
fresh exact-SHA CI proof; do not remove/mock a real existing test merely to hide it.
No independently adjudicated clinical evaluation suite is established here. Since
the foundation stays disconnected, clinical model/prompt behavior must be unchanged.

### CI REQUIREMENTS

Preserve current job names, dependencies, assertions and failure behavior:
Secret scan (full history); Application typecheck, test, and build; Synthetic
migration equivalence (P02); Independent synthetic database recovery (P03);
Dependency vulnerability audit; Browser release gate; Typecheck, test, and build.
Aggregate success requires every dependency successful. Never substitute an older,
canceled, different-branch or pre-refresh head run. Concurrency cancels old runs.

Do not change artifact attestation hashes, expiry (currently 2026-11-01T00:00:00Z),
scope, advisories or security behavior. All four security scripts above are the
actual gate; raw `pnpm audit --audit-level high` alone is not the policy acceptance
rule. Preserve raw findings. New high/critical issues, changed artifacts, expired
policy or required upstream-fix review are security blockers, not permission to
silently renew/exclude. Never commit secrets even temporarily; full history is scanned.

### ACCEPTANCE CRITERIA

All nine findings have code/tests or explicitly future durable-contract coverage
matching this ADR. Defects reproduced; inverted regressions and retained valid cases
pass. Strict future knowledge-route security is verified without changing existing
native/web transport. No live clinical consumer, persistent schema, migration number,
source integration, PHI, license content, new dependency or production operation.
Design/ExecPlan matches actual code and distinguishes implemented from future semantics.

Stage intentionally after reviewing every diff. Logically scoped commits, descriptive
branch and normal PR. Fix implementation-caused failures until exact final PR head
has all seven green jobs. Fetch current main before merge; if it advanced, integrate
normally, resolve conflicts, test/push and require a NEW exact-head full CI run.
Existing merge authorization applies only with these gates satisfied; no bypass or
force-push main. Merge normally, fetch/ff-only pull main, record merge SHA and require
its own fresh push CI to pass every job/aggregate. A red post-merge run means K1A is
not done: create a bounded repair branch/PR and repeat. Do not claim completed/green
main from PR status alone. Report starting SHA/files/tests/results/commits/PR/CI/
merged SHA/owner actions/unverified items/blockers/follow-up in ExecPlan and handoff.

### STOP CONDITIONS

Stop only architecture-dependent work for a newly found live consumer, incompatible
auth/client behavior, unsafe contract contradiction or required scope expansion;
record ARCHITECTURE BLOCKER with evidence, affected files, options, risks and
recommendation. Continue independent safe work. Do not quietly choose another
architecture, weaken tests/security, add persistence or activate a source.

After K1A's implementation is merged and exact main is green, STOP. A fresh independent
Astra session must review corrected code. Only its GO may authorize authoring a
separate K1B-PERSIST packet. This document neither issues nor authorizes K1B.

### OWNER-ONLY ACTIONS

Real reviewer appointment/credential verification, rights approval, production
bootstrap authority, production secrets/infrastructure/migrations, patient-data
movement, PHI enablement, source activation, customer rollout and material store
submission require separate authorization. Synthetic fixture grants/rights/health
are never evidence of those approvals. Engineering green is not clinical validation.

### EXPLICIT NON-GOALS

No persistence/control HTTP API, no K2/CMS/eCFR/GovInfo/HOPE/ICD/HCPCS/LOINC/UCUM/
RxNorm/DailyMed/SNOMED/UMLS/PubMed/pharmacology adapters, no patient/FHIR tools,
no new production identity or professional-verification service, no blanket global
CSRF/mobile-auth refactor, no complete clinical required-source policy, no corpus
or clinical evaluation certification, and no downstream invalidation delivery.

GO — K1A-CORRECT packet is ready for bounded Sol implementation
