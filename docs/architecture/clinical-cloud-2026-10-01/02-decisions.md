# Architecture decision records

All ADRs are proposed for this architecture phase. Implementation packets may implement the synthetic design, but may not silently change these decisions or activate production PHI. Retention/customer commitments require explicit owner acceptance before durable clinical functionality is enabled.

## ADR-001: FHIR authority

**Context:** Current patient review returns an ephemeral draft and deletes temporary source copies. There is no inspected FHIR implementation. A normalized store does not automatically become the legal clinical record.

| Model | Authority and customer expectation | Corrections, synchronization, retention/export | Burden and risk |
|---|---|---|---|
| A: source documents authoritative | Spartan organizes evidence from customer-provided source records | Preserve source version; corrections create revisions and stale downstream findings; retention follows agreed custody scope; export includes source references and provenance | Suitable for uploads; source changes outside Spartan are unknown until re-uploaded |
| B: Spartan part of authoritative record | Customers depend on Spartan for clinical record custody | Formal amendment history, attestation, long-term availability, legal holds, record export, correction workflows and approved retention obligations | Highest clinical/operational/legal burden; inappropriate as an implicit migration side effect |
| C: external EMR authoritative | Spartan provides interoperability and clinical intelligence | Version/cursor-based synchronization, conflict handling, source-linked corrections, explicit optional writeback, export of derived work | Best future integration direction; connector outages and delayed updates require visible freshness |

**Decision:** Model A initially for authorized uploaded records, evolving to Model C for EMR-connected customers. FHIR is a normalized, provenance-bearing working representation. Do not choose B. Clinical findings approved inside Spartan are authoritative only as evidence of that Spartan review/attestation, not as automatic amendments to the source record.

**Consequences:** User interface and exports identify source system, source-as-of date, draft/approved state and limitations. Never silently overwrite external EMR facts. AI-suggested diagnoses remain hypotheses until reviewed; a physician approval does not automatically transmit a prescription, hospice certification or claim. Local correction creates superseding version and stales dependent reviews. Imported source corrections retain lineage. Disconnected source shows “last synchronized,” not “current chart.”

**Persistence gate:** Temporary-review mode creates no durable FHIR resources. Durable Model A/C storage is enabled only for a separate contracted workflow. FHIR stores can retain resource history; ordinary delete is not sufficient evidence of complete erasure. Verify service purge/history/offboarding behavior before offering deletion commitments.

**Revisit only if:** Owner, qualified clinical leadership and counsel deliberately accept record-custodian responsibilities and a new ADR. See sources S05–S08.

## ADR-002: Tenant-safe patient identity

**Decision:** Use cryptographically random opaque Spartan UUID patient IDs, with `(organization_id, patient_id)` as the access and referential boundary. External MRN is never a universal key. Existing integer organization IDs remain stable; do not refactor sales identity into patient identity.

Proposed tables: `clinical_patients`, `clinical_patient_identifiers`, `clinical_identity_candidates`, `clinical_identity_events`. Every table carries organization_id. External identifiers include assigning system URI, source organization, encrypted identifier value, tenant-keyed HMAC lookup, identifier type, valid period, source document/import ID, verification state and superseded linkage. Uniqueness applies to active `(tenant, source-system, source-organization, identifier-type, normalized-value)` with a controlled workflow for recycled identifiers; preserve raw value and normalization version. Do not overnormalize case-sensitive identifiers.

Creation requires tenant-scoped permission and idempotency key; reject repeated-key/different-payload conflicts. Exact trusted source mapping can attach a new version to an existing patient. Demographic similarities produce candidate matches only. Quarantine uncertain documents from reasoning until a qualified reviewer confirms identity; never leak candidate lists across tenants. Do not infer the patient from filenames.

Merge requires explicit permission, comparison of source evidence, recent step-up, reason and a reversible event; use a survivor alias graph rather than destructive rewriting. Preserve original ownership of every document/fact/resource. Lock both patients in deterministic order; prevent cycles and cross-tenant merges; freeze/reconcile in-flight jobs. FHIR Patient.link reflects confirmed linkage where appropriate, but SQL identity ledger controls workflow. Unmerge replays attributable linkage events; ambiguous post-merge records require human reassignment. Both actions invalidate affected manifests and approvals. Corrections append history, update current projection and preserve source provenance. No global cross-customer master patient index.

**Tests:** identical MRNs across two hospices, recycled MRN, conflicting source assignment, name/date similarity, concurrent create/merge, merge then source correction, unmerge after new records, access revocation and old-client references. See S06.

## ADR-003: FHIR tenancy

| Dimension | A: dataset + store per organization | B: shared store + app filtering |
|---|---|---|
| Isolation/IAM | Store-level IAM and tenant service identities; dataset assists regional/lifecycle boundary | App authorization must constrain every search, history, reference, batch and export |
| Blast radius | Smaller with scoped identities; shared broad credentials still defeat boundary | Shared credential/filter defect can affect all tenants |
| Operations/onboarding | Automated provisioning and policy verification; quotas and resource count management | Faster resource provisioning; much more complex isolation testing |
| Cost | More per-tenant operational objects; evaluate measured service usage, not assumed per-store fees | Potential operational economy; security engineering and support costs remain |
| Export/deletion/offboarding | Tenant store inventory makes operations simpler; histories/exports still need lifecycle handling | Complex selective purge and assurance of no cross-tenant resources |
| Enterprise/scalability | Supports dedicated project escalation, regional requirements and tenant-specific policies | Harder to meet isolated-customer requirements later |
| Supportability | Per-tenant diagnostics without content; more policy targets | Shared operational surface but difficult safe support access |

**Decision:** A for initial longitudinal tenants, one approved US region, provisioned through code. Separate project for a tenant only when contractual/isolation needs justify it. Do not create a dataset per patient. Measure quotas/onboarding time and cost before scaling; reconsider architecture at 100 tenants or earlier if measured limits demand it.

Control-plane DB maps organization to exact resource names. Reject user-supplied project/dataset/store paths. Use tenant-scoped worker identities or tightly scoped impersonation; a broad orchestration identity is privileged and separately audited. No clients directly access Healthcare API. Validate all resource references and import/export manifests belong to one tenant. Use a non-owner DB role with tenant RLS and composite tenant FKs for new clinical SQL tables. Application authorization is still required. See S04.

## ADR-004: Preserve product authentication; separate clinical authority

**Decision:** Keep client_organizations, client_members, client_sessions, web cookie flow, mobile Bearer/SecureStore and billing links. Google Identity Platform replacement has no demonstrated benefit sufficient to justify account migration, entitlement drift and old-iOS disruption.

Introduce explicit tenant-scoped grants `clinical.view`, `.upload`, `.review`, `.approve`, `.physician_review`, `.export`, `.admin`. No ordinary role implies any PHI read permission. Clinical admin manages grants/settings but does not automatically view patients. A grant cannot exceed the grantor's delegated authority; platform support cannot self-grant clinical access. Revocation overrides all positive grants. Tenant/patient/team scope, active employment/organization, purpose and recent step-up are checked server-side. Billing may determine feature availability but never authorizes PHI by itself; offboarding/export obligations get a separately authorized owner workflow when subscription access ends.

Retain email MFA for compatibility while adding a reviewed stronger step-up method for PHI (passkey or authenticator); mobile biometric/device credential unlock is an additional local control, not server proof of clinical authorization. Re-auth on clinical inactivity, privilege changes and export. Do not silently invalidate all sales sessions during migration.

Default support sees content-free diagnostics only. Exceptional break-glass, if owner approves: explicit tenant authorization where feasible, named individual, incident/reason, short expiry, scoped read-only access, independent approval, alert and audit review. No standing unrestricted platform support access.

Rollback removes feature exposure, not audit/grant history. If external identity is later justified, require a new ADR for account linking, password handling, session overlap, Stripe/Apple linkage, client compatibility and rollback.

## ADR-005: Two explicit clinical lifecycles

**Decision:** Existing temporary review remains temporary; durable longitudinal review is a distinct opt-in capability. Default for existing users is no new retained patient data. No general sales tool gains PHI support by virtue of a BAA flag.

Temporary workflow: encrypted short-lived staging, no retained patient facts/reviews/FHIR, in-memory result, cleanup on completion/cancel/expiry, minimal non-content operational audit. Source copies on the user's device/EMR are not deleted. Retained source hashes and patient-linked manifests are also sensitive; do not call them anonymous or retain them after session expiry in this mode. Cost deduplication here is session-scoped and ephemeral.

Longitudinal workflow: owner-approved retention schedule and customer instructions control source records, normalized facts, reviews, FHIR histories, audit, exports and backups separately. Clinical records and approved review manifests may persist only in covered production services. Deletion on screen close clears the device view but does not falsely promise deletion of contracted clinical records. Legal holds override eligible destruction and are visibly tracked.

The exact retention schedule is a product/customer/legal decision, not something an implementation model may invent. Synthetic implementation may use configurable example durations, marked nonproduction. No PHI activation until applicable durations, backup behavior, deletion verification and customer wording are approved.
