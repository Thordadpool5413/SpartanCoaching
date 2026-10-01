# Repository truth and migration audit

All paths below refer to baseline commit `708b0522af3534a0066134d646f21f2a3cb8747c`. Statements labeled observed come from source inspection; proposed changes are in the other documents. No deployed-state claim follows merely from a checked-in flag or test.

## Actual implementation

| Area | Observed truth and evidence | Implication |
|---|---|---|
| Workspace | `package.json`, `pnpm-workspace.yaml`: pnpm 10.26.1 monorepo; Node 24 in CI; root TypeScript ~6.0.3 | Preserve package boundaries; older TypeScript prose is stale |
| API | `artifacts/api-server/src/app.ts`: Express, cookie and Bearer session loading, security/CORS middleware, routes and raw Stripe webhook | Existing API remains integration boundary |
| Web | `artifacts/spartan-coaching/src/pages/PatientReview.tsx`, `src/App.tsx`: React/Vite client; credentialed patient-review requests, in-memory result and pagehide DELETE | Page closure is a cleanup request, not proof of deletion |
| iOS | `artifacts/spartan-coaching-mobile/app/ai-tools/patient-review.tsx`, `lib/api.ts`: Expo Router; authenticated binary upload, SecureStore token with WHEN_UNLOCKED_THIS_DEVICE_ONLY | Retain native app; protect all temporary copies and foreground/background transitions |
| Authentication | `auth/middleware.ts`, `auth/crypto.ts`, `routes/authRoutes.ts`: hashed session tokens, scrypt password flow, 14-day sessions, 8-session cap, `client_*` identity | Do not migrate to Google identity merely for hosting |
| Organizations/roles | `lib/db/src/schema/auth.ts`, `auth/entitlement.ts`: integer organization/member IDs, member/org_admin/platform_admin roles | Sales membership does not prove clinical duties |
| Workflow tenancy | `auth/workflowTenantAuthz.ts`, `lib/tenant-ids`, `lib/hospice-sales-runtime/server/express.ts`: shared integer-to-workflow UUID adapter and authorization | Preserve mapping; old audit's missing-adapter risk is outdated |
| Billing | `billing/billingRoutes.ts`, `appleBilling.ts`, `subscriptionSync.ts`, `entitlementMap.ts`: Stripe plus verified Apple transaction flows | Migration must preserve webhook deduplication, org linkage, Apple account tokens and original transaction ownership |
| Clinical permission | `clinical/access.ts`: explicit canUse/canReview/canAdmin fields, but platform_admin implies canAdmin; `requireClinicalReview` accepts either canReview or canAdmin | Verified conflict with minimum-necessary clinical design |
| Patient review | `routes/patientReviewRoutes.ts`: Elite + clinical middleware + recent 15-minute MFA; current CMS_MCD snapshot; five files; synchronous finalize; purge before response | Temporary review, not durable longitudinal patient management |
| PHI runtime | `lib/spartan-ai-tools/src/clinical-runtime.ts`: explicit phi mode, patient-review enable flag and six confirmations; `clinical/runtimeReadiness.ts` checks required settings exist | Defaults fail closed; configuration presence does not validate contracts or controls |
| OpenAI | `lib/spartan-ai-tools/src/server.ts`: server-side Responses parse, Zod structured outputs, store:false; models from environment; retry layers | Good foundation; pin an approved manifest and bound aggregate retries |
| Extraction | `clinical/patientExtraction.ts`: magic headers, TXT UTF-8, JSZip DOCX XML, OpenAI file/image transcription for PDF/images | No Document AI or FHIR pipeline exists here |
| Storage | `clinical/storage.ts`: dedicated temporary GCS bucket; validates PAP/UBLA, no soft delete/versioning/retention; authenticated patient upload | Stronger than generic signed uploads, but policy cache and side-effect reconciliation need tests |
| Deletion | `clinical/ephemeral.ts`: session row locks, delete + existence check; `auth/opsJobs.ts`: process-local timers | External independent cleanup and orphan inventory needed on autoscaling hosting |
| Legacy retention | `clinical/retention.ts`: sweeps all non-held, unpurged clinical cases, not a new customer retention schedule | Never reuse this sweeper for a durable patient workspace unchanged |
| Encryption | `security/phiEncryption.ts`: AES-GCM envelope format with environment wrapping key, legacy version support | Existing helper is not evidence of KMS-managed key rotation |
| Clinical schema | `lib/db/src/schema/aiTools.ts`: cases/documents/reviews/permissions/ephemeral sessions/policy snapshots/audit | Retained legacy table definitions do not mean active patient workflow retains charts |
| AI contracts | `lib/spartan-ai-tools/src/clinical-contract.ts`: evidence citation strings and numeric confidence 0–1; verifier schema includes medication/lab/coding questions | Replace numeric confidence in a versioned contract; citation presence alone does not prove attribution |
| Catalog/runtime | `lib/field-kit-catalog`, `lib/hospice-sales-runtime`: shared tool/access/client contracts; separate sales workflow runtime | Preserve existing sales product and do not route clinical data into its saved history |
| Offline | `mobile/lib/offlineQueue.ts`: compatibility API returns empty queue; `generatedToolPrivacy.ts` removes legacy generated content | `offlineArchitecture.ts` still describes queuing and is contradictory |
| Analytics/logs | `analytics/validation.ts`, `observability/safeLog.ts`, `lib/logger.ts`, `app.ts`: validation/redaction exists; request path retained; some console errors bypass safe fields | Require allowlisted event contracts and marker scans; short arbitrary strings may bypass regex sanitizers |
| API compatibility | `app.ts`: optional minimum-iOS enforcement and 426; mobile sends version/contract headers; OpenAPI now includes many paths | Existing controls should be extended, not replaced |
| CI | `.github/workflows/ci.yml`: migrate-only PostgreSQL 16 service, audit, Gitleaks, tests/typecheck/build, browser gate | Workflow definition is observed; successful execution of this exact head was not verified |
| Deployment | `.replit`, `docs/replit-publish.md`, mobile `eas.json`: existing Replit/EAS deployment configuration; no tracked Terraform found | Target Google architecture is a new deployment track, not established reality |

## Documentation discrepancy register

| ID | Classification | Documentation versus implementation | Required action |
|---|---|---|---|
| D01 | DOCUMENTATION_STALE | `docs/repository-truth-audit.md` calls db push primary and migrations partial; runner/CI now use 30 SQL files including external workflow | Supersede old operational instructions with current migration evidence |
| D02 | DOCUMENTATION_STALE | `replit.md` repeats push-after-pull and legacy X-Admin-Auth fallback; `adminAuthorization.ts` uses active platform-admin session | Remove conflicting production guidance after verification |
| D03 | DOCUMENTATION_STALE | Old audit calls OpenAPI health-only; `lib/api-spec/openapi.yaml` now has auth, work, billing and other endpoints | Assess current coverage, not obsolete stub claim |
| D04 | DOCUMENTATION_STALE | `docs/schema-ops.md` has a checked item saying CI migrations before push-force; actual CI has no push | Correct the checklist text |
| D05 | DOCUMENTATION_STALE | `docs/clinical-security-controls.md` claims auto-PHI mode, broader operational tools and hard orphan ceiling; shared runtime requires explicit flags; sweeper comments reject hard deletion guarantee | Align with dedicated patient route and outage behavior |
| D06 | IMPLEMENTATION_STALE | Explicit clinical access requirement versus implicit platform-admin clinical privileges | Remove privilege inference in PHI authorization, without breaking ordinary admin functions |
| D07 | IMPLEMENTATION_STALE | Claimed iOS inactive privacy cover/biometric control absent from dedicated patient screen and inspected layouts | Add native protection and prove on device |
| D08 | DOCUMENTATION_STALE | `docs/offline-device-storage.md` and `offlineArchitecture.ts` describe durable generate queue; implementation retires queue | Align behavior matrix and UI copy |
| D09 | AMBIGUOUS | “Backup restore drill”/PASS suggests recoverability; implementation only recreates count records | Rename simulation and add real restore evidence |
| D10 | REQUIRES_ARCHITECTURE_DECISION | Existing deletion-on-close promise versus durable FHIR/source retention proposal | Separate temporary and longitudinal products; owner-approved retention contract before persistence |
| D11 | IMPLEMENTATION_STALE | New brief forbids uncalibrated numeric confidence; current schema requires it | Introduce explicit categorical uncertainty under a new API schema version |
| D12 | AMBIGUOUS | Environment BAA/retention flags assert readiness; underlying signed scope/account provisioning unavailable | Require release attestation tied to exact project, endpoint, model, services and date |

## Critical blockers and concrete failure modes

| ID | Blocked action | Finding | Clearance evidence |
|---|---|---|---|
| B01 | Cloud SQL production migration | Actual source production schema, role grants, versions/extensions and drift unknown | Sanitized schema catalog comparison and real restore drill in covered environment |
| B02 | Production cutover | Count-only “restore” cannot prove schema/data recovery | Full synthetic backup restore plus owner-run covered production recovery exercise |
| B03 | PHI rollout | Platform administrator inherits clinical review path | Negative permission tests across roles/tenants and explicit clinical grants |
| B04 | PHI pilot | Native dedicated screen clears only after background, no inactive cover; close awaits DELETE before local clear | Offline/background/expired-MFA/picker/crash tests on actual build |
| B05 | Untrusted document ingestion | DOCX check bounds main XML metadata, not all decompressed entries; PDF/image budgets and parser isolation missing | Hostile synthetic corpus passes fail-closed resource limits |
| B06 | Cloud Run clinical service | Process-local sweeping and synchronous extraction not durable orchestration | External scheduler, object inventory reconciliation, job leases/outbox and fault tests |
| B07 | Trusted clinical findings | Numeric confidence, incomplete enforced source locators/manifests; policy check only source/date/retired state | Evidence validator, freshness/approval CAS, jurisdiction-aware approved policy bundles and clinical eval gate |
| B08 | Durable clinical storage | Retention agreement and authority not selected; legacy sweep would purge non-held cases | Approved lifecycle contract and entirely separate lifecycle enforcement |
| B09 | PHI activation | Vendor coverage, OpenAI account controls, log safety and deployment boundary not attested | Owner evidence, configuration checks, sentinel test across all sinks |

Additional source-level risks: GCS writes occur inside a DB transaction. A crash after external write but before DB commit can orphan an object without a committed tracking row. Random keys reduce collision but `save()` has no explicit generation-match create-only precondition. Cleanup endpoint also requires recent MFA and an unexpired owned session: an expired session cannot rely on user DELETE and needs independent server deletion. Several success audit inserts swallow failures. Policy validity lacks jurisdiction/applicability/approval/freshness enforcement. These are design gaps, not proof that an exploit or data loss occurred.

## Database reproducibility findings

The runner enumerates 29 SQL files under `lib/db/migrations`, sorts filenames, then appends the external sales workflow migration as tracking ID `0013_sales_workflow.sql`. There are two distinct 0023 filenames; filename identity makes them distinct and their table targets differ. Do not renumber applied migrations. The external 0013 actually executes last, not at numeric position 13. Future dependencies must use explicit stable order.

A static name comparison found CREATE TABLE coverage for all 71 actual `pgTable` declarations after excluding the commented `posts` example. This is **not** a column, constraint or production equivalence proof. SQL-only objects include Medicare runtime tables and offboarding lifecycle. The migration safety catalog contains 0026 at this head; the older missing-0026 report must not be repeated as a current finding.

| Schema dimension | Inspected evidence | Remaining proof |
|---|---|---|
| Tables/columns/types/defaults | Drizzle schema modules and SQL files; static table-name coverage | Clean PostgreSQL replay and normalized catalog diff including identity/sequences, generated columns, collations and timezone types |
| PK/FK/constraints/indexes | SQL declares indexes and selected FKs; tenant ownership also relies on app checks | Constraint definitions, validation state, partial predicates, expression indexes and cross-tenant composite FK tests |
| Functions/triggers | `0018_member_offboarding_lifecycle.sql` contains offboarding functions/triggers | Compare bodies, owner, SECURITY DEFINER/search_path, execution grants and trigger enabled state |
| Extensions | `0001_spartan_ai_tools.sql` creates pgcrypto | Actual source extension/version list and target support |
| RLS/policies | Workflow migration enables and forces RLS for four workflow tables | Clinical defense-in-depth policy design; non-owner/non-superuser isolation tests; role membership/BYPASSRLS inventory |
| Order/ledger | Filename order, external-last; `schema_migrations` has ID/time | Checksums, dependency validation, advisory lock, concurrent runner tests, no skipping changed historical files |
| Historical push | Older docs advocate push; current push guard restricts production heuristically | Owner-collected schema-only metadata; do not assume URL text proves environment identity |

Production equivalence verdict: **UNPROVEN, therefore B01 BLOCKER**. No production schema access was requested or used; never pull production records into this workspace.

Prerequisite plan: (1) collect schema-only metadata inside the approved cloud boundary; scrub comments/default literals for secrets/PHI before exporting a discrepancy report; (2) replay migrations on empty PostgreSQL 16 and target supported version, without push; (3) diff every dimension above against Drizzle and source production; (4) author additive reconciliation migrations for actual differences; (5) test upgrade from representative prior schemas; (6) take/restore real backups and verify synthetic content, ownership and constraints; (7) owner-approved freeze/catch-up cutover, reconcile counts and protected checksums in-cloud, verify sequences/webhooks/sessions, and retain old DB read-only until rollback window closes. After target writes begin, rollback requires reverse replication or write reconciliation, not merely changing DATABASE_URL.

Schema evolution is EXPAND → MIGRATE → BACKFILL → VERIFY → CUTOVER → CONTRACT. Backfill in bounded batches with checkpoints. Add constraints NOT VALID where appropriate, validate after cleanup; handle concurrent indexes outside the runner's transaction. Never edit applied SQL or drop old columns until installed iOS contracts are retired and recovery is proven.
