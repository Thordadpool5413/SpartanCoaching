# Bounded implementation packets

Each packet is a separate task/PR. These are instructions for future implementation, not a claim that the work has been done. Use only synthetic data. Start by checking current main and applicable repository instructions, then compare changes since the audit SHA. Never treat this audit as permanently current.

Implementation authority: branch, scoped edit, appropriate tests and reviewable PR. No broad implementation, direct main rewrite, bypassed gate or production activation is authorized by these packets. If architecture ambiguity appears, record it and stop that affected portion; continue independently safe work. Do not combine packets to hide a major architecture decision.

Sequence: P01 → P02 → P03. P04 and P05 follow the prerequisites shown. P06 → P07 → P08 → P09 establish the clinical foundation; P10 supplies approved knowledge; P11 reasoning is not promotable until P12 evaluations pass. P13 client protection and P14 security gates precede P15 rollout dossier. P12 fixture authoring can begin earlier after contracts are agreed; this does not delegate work to agents automatically. Each packet's listed dependencies are authoritative.

Temporary-review release may omit durable FHIR/patient persistence only through an explicitly scoped release decision; it still requires authorization, ingestion, deletion, client, evaluation and observability gates. Missing production evidence is not a reason to guess a pass.

## P01 — Reconcile operational truth

**Objective:** Create a single evidence-backed operational contract and supersede contradictory instructions.

**In Scope:** Documentation, offline capability descriptions, reproducible evidence inventory; no runtime behavior change.

**Out of Scope:** Auth replacement, deployment, PHI activation, schema changes.

**Dependencies:** This audit baseline and ADRs.

**Files/packages to inspect:** docs/repository-truth-audit.md; docs/schema-ops.md; docs/clinical-security-controls.md; docs/patient-record-review.md; docs/offline-device-storage.md; replit.md; mobile/lib/offlineArchitecture.ts.

**Implementation requirements:** Recheck current main, classify every changed assertion, link code evidence; clearly distinguish count simulation from restore; retain history of superseded claims.

**Security requirements:** No credentials, PHI or unredacted production metadata in docs.

**Required tests:** Document links/paths and migration inventory checks; existing capability contract tests if executable code is touched.

**Acceptance criteria:** No production push instruction, absolute deletion promise or implied clinical-admin access described as acceptable; findings remain traceable.

**Stop condition:** Runtime behavior disagrees with approved architecture or a business promise would change; record the decision instead of guessing.

**Owner-only operations:** Accept customer-facing retention/authority wording; no production action in packet.

## P02 — Prove migration reproducibility

**Objective:** Produce full migration-to-schema equivalence and safe upgrade evidence.

**In Scope:** Synthetic PostgreSQL replay, normalized schema diff, migration ledger checksums/locking, additive corrective migrations only when demonstrated.

**Out of Scope:** Production data access, destructive reconciliation, cutover, clinical features.

**Dependencies:** P01; owner-supplied sanitized in-cloud production schema discrepancy evidence for final production verdict.

**Files/packages to inspect:** lib/db/migrations; lib/db/scripts/migrate.ts; lib/db/src/migrate-manifest.ts; migration-safety.ts; schema/*; lib/hospice-sales-runtime/migrations; .github/workflows/ci.yml.

**Implementation requirements:** Preserve applied IDs; record explicit stable ordering including external-last; reject modified historical checksum; advisory lock; distinguish transaction-safe and concurrent-index operations; compare columns/types/defaults/PK/FK/checks/indexes/functions/triggers/extensions/RLS/grants/sequences.

**Security requirements:** Use isolated synthetic DB and least-privilege application role; metadata exports scrub comments/default literals; production environment identity not inferred only from URL.

**Required tests:** Empty replay, upgrade from previous schemas, rerun, two concurrent runners, changed historical SQL rejection, partial failure, non-owner tenant isolation, complete catalog diff.

**Acceptance criteria:** No unexplained target/replay/source-schema differences; every migration has required plan; green synthetic upgrade report. Production equivalence remains blocked until owner evidence exists.

**Stop condition:** Need to rewrite applied SQL, delete data, infer unknown production state or run schema push to hide a mismatch.

**Owner-only operations:** Collect production metadata inside covered boundary and approve any production migration.

## P03 — Replace simulated recovery proof

**Objective:** Prove an actual database can be recovered.

**In Scope:** Rename count-only drill; real synthetic pg_dump/restore and Cloud SQL recovery runbook with consistency checks.

**Out of Scope:** Production restore, PHI export, automated destructive recovery.

**Dependencies:** P02 synthetic schema replay; target cloud sandbox needed for measured PITR.

**Files/packages to inspect:** lib/db/scripts/backup-restore-drill.ts; ops-readiness.ts; scripts/release-gate.mjs; docs/schema-ops.md; CI.

**Implementation requirements:** Restore actual tables, constraints, indexes, functions, triggers, RLS, grants, sequences and synthetic rows to independent DB; measure time and validate application transactions; test key and deletion-tombstone recovery.

**Security requirements:** Backup destinations private; no production dump in CI; synthetic-only fixtures.

**Required tests:** Deliberate corruption/lost-table recovery, cross-tenant access after restore, restore missing key, stale backup containing deleted record, app smoke.

**Acceptance criteria:** Content/structure verified and measured RPO/RTO recorded; count simulation cannot satisfy restore gate.

**Stop condition:** Production credential or real record needed, or restore would target a live DB.

**Owner-only operations:** Production backup/restore drill and recovery target acceptance.

## P04 — Separate clinical authorization

**Objective:** Eliminate inferred PHI privileges while preserving sales membership.

**In Scope:** Explicit permission grants/revokes, recent step-up, tenant/patient scopes, grant delegation and safe support boundary.

**Out of Scope:** Google Identity Platform migration, billing redesign, mass session invalidation.

**Dependencies:** P01, P02; ADR-004.

**Files/packages to inspect:** api-server/src/clinical/access.ts; auth/middleware.ts; routes/aiToolRoutes.ts; routes/patientReviewRoutes.ts; lib/db/src/schema/aiTools.ts; field-kit-catalog membership contracts.

**Implementation requirements:** No platform_admin/org_admin PHI bypass; clinical.admin distinct from clinical.view; revocation wins; all patient read/upload/review/approve/export paths use shared policy; cleanup survives revoked/expired interactive session via server jobs.

**Security requirements:** Fail closed; no self-grant escalation; log only event metadata; server validates recent MFA rather than trusting client boolean.

**Required tests:** All roles with/without grants, revoked grants, same patient UUID across tenants, MFA expiry, member transfer, disable during job, admin self-grant rejection and sales access regression.

**Acceptance criteria:** Ordinary/admin membership alone never permits PHI; scoped allowed actions work; Stripe/Apple entitlements unchanged.

**Stop condition:** Existing client compatibility requires privilege bypass or account migration.

**Owner-only operations:** Approve production grant assignments, stronger step-up rollout and any break-glass operation.

## P05 — Build synthetic cloud foundation

**Objective:** Define a reviewable Google deployment boundary.

**In Scope:** Terraform modules/plans for sandbox API/workers/private SQL/GCS/IAM/secrets/tasks/scheduler/logging/state; container build.

**Out of Scope:** Production apply/secrets, DNS cutover, PHI, new identity provider.

**Dependencies:** P02/P03; ADR-003 and verified current service coverage.

**Files/packages to inspect:** New infra/google modules; API build.mjs; .github/workflows/ci.yml; existing deployment docs and configuration.

**Implementation requirements:** Pin provider/tool versions; dedicated service accounts; restricted ingress/egress; private SQL; reviewed load balancer/Armor bypass control; workload identity; immutable container digest; measured service/quota cost worksheet.

**Security requirements:** No wildcard broad roles; no public buckets; state protected; clinical worker no arbitrary outbound requests; no Replit proxy in PHI path.

**Required tests:** Terraform validate/scan/plan review, IAM negative tests, direct-run.app bypass attempt, task audience rejection, arbitrary-host egress rejection, scale-to-zero sweeper behavior.

**Acceptance criteria:** Synthetic staging meets network/IAM checks and produces content-free evidence. No unapproved cloud charge or production mutation.

**Stop condition:** Cloud access/cost authority absent, service coverage uncertain, provider requires broad unsafe role.

**Owner-only operations:** Authorize cloud resources/budget, accept BAA scope, production plan/apply, secrets and DNS.

## P06 — Introduce patient identity and provenance

**Objective:** Implement the tenant-safe clinical data foundation in synthetic mode.

**In Scope:** Additive patient/external-identifier/source/fact/revision/identity-event schema and matching/merge workflows.

**Out of Scope:** Automatic demographic merge, real EMR connection, durable PHI activation.

**Dependencies:** P02, P04; ADR-001/002/005; retained-mode schema hidden by default.

**Files/packages to inspect:** New lib/db clinical schema/migrations; api-server clinical identity module; existing tenant-ids and auth adapters.

**Implementation requirements:** Opaque UUID; tenant-qualified identifiers and HMAC lookup; uncertain match quarantine; merge alias/event graph; reversible unmerge; fact types and evidence transformations remain distinct.

**Security requirements:** Composite tenant FKs/RLS, no cross-tenant matching; protect hashes and demographics; identity edits require privilege and audit.

**Required tests:** Colliding/recycled MRNs, conflicting source identifiers, demographic false matches, merge races/cycles, unmerge with post-merge data and review invalidation.

**Acceptance criteria:** No record silently changes patient; every transform traces to source revision; no historical identity event destroyed.

**Stop condition:** Need authoritative-record status, retention duration or patient linkage that evidence cannot resolve.

**Owner-only operations:** Approve durable clinical lifecycle/customer terms and production data import.

## P07 — Harden document ingestion and deletion

**Objective:** Make hostile uploads and cleanup bounded and auditable.

**In Scope:** Streaming controlled uploads, quarantine/source separation, preconditions, scanner/parser isolation, supported-format capability and independent orphan reconciliation.

**Out of Scope:** Unapproved formats/processors, clinical reasoning or chart retention activation.

**Dependencies:** P04/P05; ADR-005; synthetic identities from P06 for retained mode.

**Files/packages to inspect:** clinical/storage.ts; patientExtraction.ts; ephemeral.ts; routes/patientReviewRoutes.ts; opsJobs.ts; new isolated parser/scanner and scheduled reconciler.

**Implementation requirements:** Implement target byte/page/pixel/expanded/archive/time/retry budgets; generation-bound scanning; committed upload intent before side effect; cleanup reconciliation includes untracked objects; verify soft-delete/history settings; DOCX capability off until hardened path proven.

**Security requirements:** No network in parser, fail-closed scanner, no original filenames/PHI logs, no raw signed URLs in logs; local/server deletion not falsely coupled.

**Required tests:** MIME spoof, encrypted/malformed PDF, ZIP/nested bombs, macros, huge images, upload/delete races, crash after save before commit, scanner outage, delete outage, stale signed URL, expiry/permission revoke.

**Acceptance criteria:** No unsafe file reaches OCR; bounded resources; all synthetic orphan cases eventually produce verified cleanup receipt; service-specific processing support documented.

**Stop condition:** Cannot enforce limits/verify deletion or processor/region is not approved.

**Owner-only operations:** Approve source lifecycle and production bucket policy/scanner changes.

## P08 — Build durable clinical jobs

**Objective:** Replace synchronous chart processing with reconciled, bounded stages.

**In Scope:** Jobs/attempts/outbox/leases, private task dispatch, cancellation, stage transitions and cleanup state.

**Out of Scope:** Clinical model choice, new retention promise, PHI activation.

**Dependencies:** P02/P04/P05/P07.

**Files/packages to inspect:** patientReviewRoutes.ts; clinical/ephemeral.ts; opsJobs.ts; new clinical job modules and migrations; client capability contracts.

**Implementation requirements:** SQL state authority; idempotency key plus payload digest; CAS/fencing; transactional outbox; retries under total deadline; no PHI queue payload; independent scheduler; separate job/review/cleanup state.

**Security requirements:** Authenticate queue caller/audience; recheck tenant authorization before sensitive delivery; revoked clients cannot retrieve results; cancellation wins over late response.

**Required tests:** Duplicate/out-of-order task, worker crash every boundary, expired lease, poisoned file, provider timeout, cancellation during model call, audit outage and denied tenant retrieval.

**Acceptance criteria:** One externally visible committed result per manifest; bounded duplicate provider cost; cleanup continues while kill switch blocks intake.

**Stop condition:** Need exactly-once vendor guarantee, unbounded retry, or undisclosed durable PHI storage.

**Owner-only operations:** Production queue/scheduler deployment and retention activation.

## P09 — Add evidence-preserving extraction and FHIR projection

**Objective:** Normalize clinical facts without losing source meaning.

**In Scope:** Pinned OCR adapter, page/offset evidence, units/temporality/negation, R4 profiles and optional approved projection.

**Out of Scope:** EMR writeback, authoritative-record model, automatic prescribing/certification.

**Dependencies:** P06/P07/P08; exact OCR processor verified; retained mode approval before PHI projection.

**Files/packages to inspect:** patientExtraction.ts; new clinical normalization/FHIR adapters; lib/db clinical schema; target FHIR profile fixtures.

**Implementation requirements:** Map resources per design; preserve original values and transformation versions; conditional FHIR writes; outbox mapping/reconcile handles partial SQL/FHIR failure; reject tenant-crossing references.

**Security requirements:** Tenant-scoped store identity; minimum necessary projection; draft hypotheses not confirmed Condition/order; no permanent public document links.

**Required tests:** FHIR R4 validation, reference integrity, mixed units/dates, negation, wrong-subject mention, OCR unreadable regions, duplicate projection, stale ETag and store outage.

**Acceptance criteria:** Every projected material fact has valid tenant/source/version lineage; workflow-only data stays out of FHIR; correction stales dependent review.

**Stop condition:** Unsupported processor/terminology, ambiguous resource meaning, license issue or need to change authority ADR.

**Owner-only operations:** Approve production store creation and any durable PHI projection.

## P10 — Implement approved knowledge bundles

**Objective:** Prevent silent changes to clinical policy, coding or medication knowledge.

**In Scope:** Non-PHI ingestion, version metadata, diff/validation/approval/activation/rollback pipeline.

**Out of Scope:** Clinical rule invention, scraping licensed content without rights, autonomous production updates.

**Dependencies:** P01/P05; clinical/coding/pharmacy reviewers and licensing evidence.

**Files/packages to inspect:** clinical/patientPolicy.ts; coverageBootstrap.ts; knowledge/policyIntelligence.ts; coverageSnapshots schema; new knowledge registry.

**Implementation requirements:** Source/jurisdiction/effective interval/retrieval/hash/license/approval records; distinguish service-date applicability; no educational baseline for patient decisions; activation emits invalidation.

**Security requirements:** Knowledge worker cannot read patient data; activation requires delegated reviewer approval; source HTML handled as untrusted.

**Required tests:** Future/retired/wrong-MAC policy, superseded version, upstream tampering, license expiry, unapproved diff, rollback and concurrent activation.

**Acceptance criteria:** Only approved applicable bundles drive reasoning; every result reports bundle version; missing policy fails visibly.

**Stop condition:** Cannot verify source applicability, rights or clinical interpretation.

**Owner-only operations:** Approve production policy activation and licensing commitments.

## P11 — Implement structured clinical reasoning and freshness

**Objective:** Produce validated drafts with explicit evidence and uncertainty.

**In Scope:** Approved server model manifest, versioned result schema, evidence validator, input manifest and stale detection/approval CAS.

**Out of Scope:** Numeric confidence, autonomous orders/diagnoses/claims, provider chart database, hosted browsing/tools.

**Dependencies:** P04/P08/P09/P10; P12 evaluation gate before activation.

**Files/packages to inspect:** lib/spartan-ai-tools/src/server.ts; clinical-contract.ts; tools/medical-record-lcd-verifier/*; patientReviewRoutes.ts; new review/manifest modules.

**Implementation requirements:** Remove arbitrary model fallback in clinical mode; enforce approved endpoint/settings, store:false, total retry ceiling; preserve metadata; evidence validation by exact source revision; unknown medication context explicit; signed review revision immutable.

**Security requirements:** No provider key in clients; no PHI external search; support refusal/incomplete schema; physician approval separate from AI inference; temp mode manifest not retained after purge.

**Required tests:** Schema refusal/truncation, invented page/source, contradictory source, stale during approval/export, cancellation late output, wrong patient, missing renal/allergy context and old-client behavior.

**Acceptance criteria:** No unsupported material finding passes; changes invalidate reviews; new categorical schema exposed only to compatible clients; evaluation signoff required.

**Stop condition:** Unapproved model/account retention, unsupported clinical advice or retention conflict.

**Owner-only operations:** Approve actual API project/model/endpoint/retention evidence and PHI feature enablement.

## P12 — Establish independent clinical evaluations

**Objective:** Make clinical quality a separate reproducible release gate.

**In Scope:** Synthetic benchmark, expert gold adjudication, metrics/severity thresholds and old/new comparison.

**Out of Scope:** Real PHI in GitHub, model-only gold labels, clinical safety certification.

**Dependencies:** Design contracts from P09–P11; qualified reviewers; can author fixtures before implementations finish.

**Files/packages to inspect:** New evals/clinical synthetic harness and manifests; shared AI schemas/prompts; CI release gates.

**Implementation requirements:** Cover extraction, attribution, hallucination, contradiction, reasoning, coding and medication; include disease/format strata and abstention; version all inputs; assess confidence intervals and sample sufficiency.

**Security requirements:** Only synthetic cases; content-free operational reports; no production chart downloads or vendor-side clinical corpus.

**Required tests:** Intentionally unsafe candidate fails; model/prompt/schema/retrieval/knowledge changes trigger gate; wrong-patient and critical-safety sentinel failures override aggregate score.

**Acceptance criteria:** Independent signed gold set; all target thresholds measured; reviewer-approved release report and rollback manifest.

**Stop condition:** No qualified independent adjudicator, unverifiable source expectation or inadequate sample support.

**Owner-only operations:** Clinical lead approves gold answers/thresholds and production model promotion.

## P13 — Secure web and iOS clinical views

**Objective:** Prevent clinical content from persisting or reappearing after close.

**In Scope:** Memory-only result views, inactive privacy cover, controlled picker files, immediate local clear, server cancel and compatibility UX.

**Out of Scope:** Offline PHI drafts, redesign of sales product, material store release.

**Dependencies:** P04/P07/P08/P11 contracts; preserve older clients.

**Files/packages to inspect:** web/src/pages/PatientReview.tsx; mobile/app/ai-tools/patient-review.tsx; mobile/lib/api.ts; AuthContext.tsx; offline/draft/continuity modules; app layouts.

**Implementation requirements:** Clear locally before awaiting DELETE; cancel generation guards; app inactive cover and unlock; startup scavenging; no browser storage/cache; no auto copy/share; supported-format/capability negotiation.

**Security requirements:** No PHI telemetry, notifications or URL data; backup exclusion/data protection verified; user originals never deleted.

**Required tests:** Airplane mode close, MFA expiry, background during picker/upload/inference, late response, logout/tenant change, app kill/relaunch, cache/filesystem inspection, snapshot and native build verification.

**Acceptance criteria:** No clinical markers in device/browser persistent stores after cleanup; inactive snapshot opaque; cleanup and stale-result states truthful; old sales clients function.

**Stop condition:** Platform protection cannot be verified or workflow requires approved durable offline PHI.

**Owner-only operations:** Material TestFlight/App Store release and production client support-policy changes.

## P14 — Add PHI-safe observability and supply-chain gates

**Objective:** Prove logs, artifacts and outbound channels exclude clinical content.

**In Scope:** Structured log allowlists, transactional audit delivery, sink inventory/sentinel test, SAST/SBOM/container/IaC/license gates.

**Out of Scope:** PHI diagnostic capture, production credential rotation without approval.

**Dependencies:** P05/P07/P08/P11/P13 integration; existing CI retained.

**Files/packages to inspect:** api-server/src/lib/logger.ts; observability/safeLog.ts; clinical error paths; analytics; notifications; .github/workflows/ci.yml; release-gate scripts.

**Implementation requirements:** Wrap SDK exceptions; route templates; no body/header/trace payload capture; generic notifications; pin Actions/tool checksums/images; audit exceptions require expiry and owner.

**Security requirements:** Untrusted PRs get no production secrets; logs/audit access separated; audit outage cannot silently lose approval/export evidence.

**Required tests:** Sentinel marker across success/errors/retries/client backgrounding in every enumerated sink; excluded dependency license; secret/SAST fixture; privilege boundary CI test.

**Acceptance criteria:** Zero sentinel matches outside allowed clinical fixture store; all sinks inspectable; immutable versioned release evidence; no critical unaccepted scanner finding.

**Stop condition:** Uninspectable vendor telemetry sink, required raw content log or blocked security finding.

**Owner-only operations:** Approve production observability changes, exception acceptance and retention settings.

## P15 — Rehearse lifecycle, migration and phased rollout

**Objective:** Produce an owner-reviewable release and cutover dossier.

**In Scope:** Synthetic recovery/export/offboarding/incident/load drills, compatibility evidence, rollback and pilot checklist.

**Out of Scope:** Production Terraform apply, secrets updates, real data move, PHI enablement, customer rollout or iOS release.

**Dependencies:** P01–P14 completed for intended scope; accepted ADRs/retention and vendor evidence.

**Files/packages to inspect:** Architecture docs; infra plans; migration/recovery scripts; auth offboarding; clinical deletion/export; release gates and mobile build evidence.

**Implementation requirements:** Exercise tenant export/history/backup deletion accounting, legal holds, restore tombstones, cost reservations/hard caps, concurrent old-client API traffic, write-freeze/catch-up/reverse-reconciliation rollback; record unresolved gates.

**Security requirements:** Production data stays in covered environment; kill switches preserve purge; owner-only steps separate from ordinary merge authority.

**Required tests:** End-to-end synthetic chart, denied tenant, budget exhaustion, regional/service outage, key compromise, PHI-log incident exercise, recovery and offboarding with hold.

**Acceptance criteria:** Concrete release manifest, signed clinical/security evidence, measured RPO/RTO, validated rollback and no open critical blockers for the proposed pilot.

**Stop condition:** Any production operation or unresolved safety/contract gate; return completed dossier and exact owner action needed.

**Owner-only operations:** All production apply/data/secrets/PHI/customer/store-release operations; explicit approval at each relevant boundary.
