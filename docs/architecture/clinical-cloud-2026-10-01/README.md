# Spartan clinical cloud architecture review

Date: 2026-10-01. Audited repository: `Thordadpool5413/SpartanCoaching`.
Baseline: `708b0522af3534a0066134d646f21f2a3cb8747c` on `main`.
Status: **architecture proposal; production PHI activation and Cloud SQL cutover blocked**.

The application already has useful authentication, billing, tenant adapters, structured AI tools, and a gated temporary patient-review path. Preserve them while correcting the specific gaps below. A Google Cloud migration is not a substitute for those corrections.

This package contains the requested architecture work, not broad production implementation:

| Deliverable | Location |
|---|---|
| Repository truth, documentation conflicts, critical blockers, migration prerequisite plan | [01-repository-audit.md](01-repository-audit.md) |
| FHIR role, patient identity, tenancy, authentication, retention decisions | [02-decisions.md](02-decisions.md) |
| Target architecture, authority model, lifecycle, clinical AI, evaluations, policy versions, infrastructure | [03-target-design.md](03-target-design.md) |
| PHI threat model, vendors, recovery, incident response, rollout | [04-security-and-operations.md](04-security-and-operations.md) |
| Ordered implementation sequence and bounded packets | [05-implementation-packets.md](05-implementation-packets.md) |
| Authoritative sources and verification limits | [06-sources-and-verification.md](06-sources-and-verification.md) |

## Decisions that control implementation

1. Keep current product authentication, organization/member identities, web cookies, mobile Bearer/SecureStore, Stripe and Apple entitlement connections.
2. Recommend a FHIR working/interoperability representation with original documents or the external EMR authoritative. Do not claim Spartan is an EMR or legal record custodian.
3. Use an opaque patient UUID and tenant-qualified external identifiers. No automatic demographic merge.
4. Recommend a dataset and FHIR store per hospice tenant initially, with tenant-scoped worker identity. A store boundary alone does not constrain a service account granted access to every store.
5. Preserve temporary-review behavior. Persistent patients, source documents, findings and FHIR require a separately approved retention contract. Do not silently convert the existing no-retention tool into a chart archive.
6. Gate PHI by explicit clinical permission, approved deployment/vendor configuration, evaluated model and policy bundle, recent step-up authentication and tenant/environment switches. Billing tier is not clinical authorization.

## Highest-priority findings

- Production schema equivalence is **unproven**. SQL migrations now exist, but table-name coverage is not full schema equivalence, and production metadata was not available.
- The current `backup-restore-drill.ts` restores table-count metadata, not an actual database backup.
- `clinical/access.ts` grants platform admins clinical-admin status; the patient-review route accepts that status for review access.
- Patient review has no durable asynchronous job/reconciliation model; deletion sweeps run in the API process.
- The dedicated iOS patient screen does not implement the inactive-state privacy cover claimed by older documentation. Local cleanup can wait on failed network deletion.
- DOCX validation lacks a complete decompression/container budget; page/image budgets and isolated parser execution are missing from the inspected extraction path.
- Clinical output still exposes a model-generated 0–1 confidence value. Source-page provenance and freshness are not a complete enforced contract.

No patient records, production secrets, production database, cloud configuration, signed agreements or deployed iOS build were inspected. Source findings are not claims about actual exposure. No PHI was used and no production settings were changed. Runtime tests and production restore verification remain outstanding; this documentation review does not certify readiness.

Start implementation with P01–P03. Later packets must preserve the decision boundaries and must stop at their stated conditions. Acceptance of this document does not authorize a production apply, data move, PHI enablement, customer rollout or material iOS release.
