# K1 foundation design and implementation boundary

Historical v1 implementation description. The adversarial review identified gaps
in approval binding, scope fingerprints, publication and authority contracts.
`03-k1a-correct.md` supersedes the affected design decisions for K1A implementation.
Its v2 corrections are not implemented merely by publishing that decision document.
Do not proceed directly from this historical design to persistence: K1A must be
implemented, merged, green, and independently reviewed before K1B is issued.

Decision K1-001, derived from the owner-supplied mandate: extend the canonical
Express server's `knowledge/` namespace with pure, typed foundation services.
Preserve existing runtime, auth, organization IDs, coverage snapshots, OpenAI
client and clients. This is a safe first K1 slice, not a second production system.

## Implemented semantic contracts

`artifacts/api-server/src/knowledge/foundation/contracts.ts` defines 17 claim
types and explicit claim-to-domain eligibility. The matrix is not a universal
ranking and does not certify that one eligible source suffices for a clinical
question. Legal claims accept statute/regulation/state law; coverage accepts
regulatory/national/MAC/manual domains; medication identity, labeling and
interactions are different domains; coding, evidence, protocols, workflow and
quality have distinct mappings. Patient facts/derivations/inferences have claim
types but cannot be registered as public knowledge in this first implementation.
FHIR semantics stay in existing approved architecture, not a policy text source.

No numerical clinical confidence is added. Unknown-state schema preserves UNKNOWN,
NOT_CHECKED, SOURCE_UNAVAILABLE, NOT_APPLICABLE, INSUFFICIENT_EVIDENCE,
INSUFFICIENT_PATIENT_CONTEXT, POLICY_NOT_CONFIGURED,
PAYER_KNOWLEDGE_NOT_CONFIGURED, JURISDICTION_NOT_SUPPORTED,
CONFLICTING_SOURCES, HUMAN_REVIEW_REQUIRED, CHECKED_NO_KNOWN_ISSUE and ISSUE_FOUND.
The resolver reports applicability only: APPLICABLE does not mean a patient's
claim is supported, complete, safe, payable or clinically approved.

Source metadata includes publisher, official URL, domain, supported claims,
educational flag and explicit PUBLIC/TENANT scope. Version metadata includes
exact document/edition IDs, source URL, raw/normalized SHA-256, parser version,
publication/retrieval dates, effective window, payer/jurisdiction/MAC/provider/
setting/benefit-period/code-edition/product/population restrictions, licensing,
qualified approval, activation/revocation, health and conflict/dependency links.
Metadata hashes do not prove the source bytes were obtained or parsed correctly;
a future ingestion adapter must establish that evidence independently.

Effective intervals are date-only **[from,to)**; publishers with inclusive end
dates require explicit adapter normalization. Clock timestamps normalize to UTC.
Missing service date, payer or jurisdiction is insufficient context. No wildcard
jurisdiction; enumerate reviewed jurisdiction applicability. Null optional scope
means explicitly dimension-independent, never unknown. MAC_COVERAGE requires MAC
scope. Wrong/missing dimensions cannot be replaced with vector similarity.

`createKnowledgeRegistry` validates referential identity, duplicate editions and
artifact-bound approvals; owns an immutable metadata snapshot and SHA-256 bundle
fingerprint. It exposes a resolver, not mutable data or a general query endpoint.
No seeded real registry exists. There is no DB/network/LLM access or PHI body.
Tenant scope is filtered before result construction, so foreign IDs/reasons are
not returned. A future server adapter must obtain organization context from
verified membership, not copy a client organization ID. Tests do not certify
existing clinical authorization; P04 remains a production blocker.

The resolver returns exact selected IDs/hashes/effective windows, bundle ID/hash,
per-source coded decisions, warnings and mandatory human review. It never picks
newest by default. Historically applicable superseded versions may be selected
when still approved, healthy and licensed; revoked versions cannot. Overlapping
versions of one source/document or declared source conflicts require human review.
Conflicts here are declared/structural; detecting semantic contradictory clinical
text is not implemented. Relevant uncertain/blocked candidates prevent silent
fallback. No relevant candidate produces SOURCE_UNAVAILABLE. Source-specific
required-domain sets and question-level evidence completeness require clinical
review in K2/K18; domain eligibility alone is not that policy.

## Control plane, rights and health

The pure `transitionKnowledge` reducer models APPROVE, ACTIVATE, SUPERSEDE,
REVOKE and ROLLBACK. It requires expected revision, human actor, explicit action
permission, public stewardship or matching tenant, qualified reviewer for the
source domain, version/hash-bound approval and future review due date. Detection
through REVIEW_PENDING states are defined but ingestion is not implemented.
Approval does not activate. Activation requires valid internal-storage rights,
current source health and approval; runtime checks requested model/prompt/display/
redistribution permission separately. Revocation is irreversible for that version.
Rollback requires a prior superseded version and fresh approval/rights/health;
it cannot restore a revoked artifact. Events bind actor, action, revision, version,
hash, reason and time; changes emit an invalidation intent for open reviews.

This is an in-memory transition contract, NOT authenticated administration,
durable audit, concurrent activation enforcement or completed revocation delivery.
The actor argument is trusted server context; do not expose it to request/model
input. K1 persistence work must enforce transaction/CAS, append-only events and
outbox delivery. Existing signed reviews must retain their original bundle.

License status starts unapproved unless explicitly supplied by the trusted
registry owner. Track owner/version, approvedBy, commercial use, per-purpose
permissions and expiration. No model acceptance of licensing terms. Licensed
corpora are absent; future ingestion must quarantine unknown rights and prohibit
unapproved dataset commits. Existing dependency licenses are a separate concern.

Health includes CURRENT, STALE_ALLOWED_WITH_WARNING, STALE_BLOCKED,
UPSTREAM_UNAVAILABLE and REVOKED, checked/validated timestamps, warning and hard
limits, and explicit last-known-good permission. LKG never bypasses hard expiry,
revocation, license or approval. No cron/source monitoring is claimed in K1.

## Canonical persistence design (not deployed)

Use `lib/db` and version-controlled migrations. Keep coverageSnapshots as the
legacy content/version store; new metadata references its UUID where applicable.
Never create a second CMS ingestion path or automatically approve existing rows.
The legacy JSON hash cannot be relabeled a raw-byte hash. Existing same-version
upsert must be replaced by immutable version handling in the K2 migration plan.

Proposed entities for the next reviewed K1 persistence packet:

| Entity | Responsibility / key constraints |
|---|---|
| knowledge_sources | Publisher/domain/scope; public or tenant; explicit claim capabilities |
| knowledge_documents | Stable upstream document identity per source, scope inherited |
| knowledge_versions | Immutable content/parser hashes and effective window; unique source/document/edition; optional legacy coverage FK |
| knowledge_sections, claims, citations | Immutable version-bound anchors and claim lineage; no patient text |
| knowledge_licenses | Rights edition and permitted uses, approval owner, expiry |
| knowledge_reviewers | Verified identity, qualification and delegated scope, never model-declared |
| knowledge_activation_events | Append-only transitions/reasons/actor, optimistic revision and transaction constraints |
| knowledge_dependencies | Version/bundle dependencies and invalidation outbox |
| knowledge_ingestion_runs/errors | Quarantine, parser/validation metadata, bounded content-free failures |
| knowledge_health/source_alerts | Source freshness checks, review/license deadlines, circuit status |

Tenant-specific protocols need composite tenant FKs/RLS and explicit delegated
review roles. Global source stewardship must not grant patient access. Adopt the
existing transaction/migration/catalog test mechanism; expand schema before any
backfill, independently review legacy versions, verify zero catalog differences,
cut over behind a capability gate, and contract only after client compatibility.
No schema changes are necessary for this disconnected semantic-contract slice.

## Deferred boundaries and acceptance

No endpoint, model tool, prompt, clinical schema, existing resolver or UI imports
this foundation in this packet. No new dependency, persistence, credential,
external API or infrastructure was added. All fixtures are synthetic and have no
clinical ground truth status. Unit scenarios prove engineered boundaries, not
medical correctness or clinical thresholds. Existing AI tests still run. An
independent clinical evaluation program is absent; no production reasoning may
adopt these rules until qualified review/evaluation and K2+ prerequisites pass.

The next bounded packet is K1 persistence/authenticated control plane, before K2
source ingestion. It requires approval of tenant/public stewardship mapping,
reviewer credential verification and durable lifecycle/outbox design, followed by
negative tenancy, concurrency, immutable approval and migration tests. Do not
start K2–K23 or production activation as part of this PR.
