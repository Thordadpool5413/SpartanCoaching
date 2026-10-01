# Sources and verification record

Research date: 2026-10-01. Official documentation was consulted for platform-dependent decisions. Public documentation establishes product behavior and constraints, not the scope of Spartan's actual signed agreements or enabled account features. Architecture choices and numeric operating limits are proposals, not quotations of vendor requirements. Reverify feature availability, region, processor/model version and contractual scope when implementing.

## Authoritative source register

| ID | Official source | Use and limitation |
|---|---|---|
| S01 | [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data), [HIPAA eligible products and functionality](https://help.openai.com/en/articles/20001069-hipaa-eligible-products-and-functionality) | Retention/endpoint/feature review. store:false is not a BAA or account provisioning proof. Image/file inputs have documented exceptional safety-review retention. Actual account eligibility remains unverified. Live web search is excluded from this design; do not generalize that every search configuration has identical eligibility. |
| S02 | [Enterprise Document OCR](https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr) | Current format support and direct DOCX private-preview distinction. Selected target is an approved GA OCR version for PDF/images; exact processor deployment has not been selected or verified. |
| S03 | [Document AI supported files](https://docs.cloud.google.com/document-ai/docs/file-types), [limits](https://docs.cloud.google.com/document-ai/limits), [Layout Parser](https://docs.cloud.google.com/document-ai/docs/layout-parse-chunk) | Processor-specific limits and support differ; generic file support is not evidence that a particular processor accepts DOCX. Layout Parser is not silently substituted for OCR. |
| S04 | [Healthcare API access control](https://docs.cloud.google.com/healthcare-api/docs/access-control), [controlling access](https://docs.cloud.google.com/healthcare-api/docs/controlling-access) | Project/dataset/store IAM scopes support per-tenant store design. Application authorization and scoped service identities remain necessary. |
| S05 | [FHIR R4 ClinicalImpression](https://www.hl7.org/fhir/R4/clinicalimpression.html) | Resource is a clinical assessment, not a generic AI envelope. |
| S06 | [FHIR R4 Patient](https://hl7.org/fhir/R4/patient.html) | Identifier/link semantics inform patient identity; Spartan merge/unmerge workflow is an application design. |
| S07 | [FHIR R4 Provenance](https://hl7.org/fhir/R4/provenance.html) | Resource/source/agent lineage; additional span-level lineage remains application metadata. |
| S08 | [Healthcare FHIR REST API](https://cloud.google.com/healthcare-api/docs/reference/rest/v1/projects.locations.datasets.fhirStores.fhir) | Resource/version/history operations require explicit lifecycle verification. Do not infer full purge from ordinary delete. |
| S09 | [Cloud Run ingress](https://docs.cloud.google.com/run/docs/securing/ingress) | Restrict public API ingress and prevent bypass of load-balancer security. |
| S10 | [Cloud Tasks issues and limitations](https://docs.cloud.google.com/tasks/docs/common-pitfalls) | Duplicate execution and unordered delivery are possible; consumers must be idempotent. |
| S11 | [Cloud SQL PITR configuration](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/configure-pitr) | Explicitly configure PITR for deployment method; do not assume settings. |
| S12 | [Cloud SQL point-in-time recovery](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/pitr) | PITR creates another instance; recovery must include application cutover and consistency checks. |
| S13 | [CMS Hospice Determining Terminal Status LCD L34538](https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=34538) | Example of jurisdiction/version-specific coverage source; not a universal rule for all tenants and dates. Eligibility requires appropriate physician certification, not automatic model decision. |
| S14 | [NLM RxNorm](https://www.nlm.nih.gov/research/umls/rxnorm/index.html), [terms of service](https://www.nlm.nih.gov/research/umls/rxnorm/docs/termsofservice.html) | Drug-name normalization and source-specific rights review; not proof of complete drug interaction capability. |
| S15 | [DailyMed](https://dailymed.nlm.nih.gov/) | Current submitted labeling source; product-specific evidence must be versioned and clinically reviewed. |
| S16 | [42 CFR Part 418](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-418) | Official hospice regulatory source for a separately reviewed policy inventory. This report does not encode or interpret every requirement. |
| S17 | [Google Cloud HIPAA compliance](https://docs.cloud.google.com/docs/security/compliance/hipaa), [Google compliance overview](https://cloud.google.com/security/compliance/hipaa) | Shared responsibility, covered-service/contract configuration; no blanket application compliance claim. |

One attempted Google terms URL returned an error; no conclusion about executed Google terms relies on that failed retrieval. No customer-specific contract, project allowlist, BAA attachment, medication license or coding license was available to verify.

## What was actually verified

- Downloaded/read the user's entire architecture brief in sections.
- Used connected GitHub file access and cloned the repository; checked out canonical main at `708b0522af3534a0066134d646f21f2a3cb8747c`.
- Looked for repository AGENTS.md; none found in this checkout.
- Inspected relevant API/clinical/auth/billing, web/mobile, DB/migration, shared catalog/AI/runtime, docs, scripts and CI source. This is a targeted architecture/security review, not a claim that every line in the repository was reviewed.
- Inspected recent history: current head merges dependency repairs; preceding `ea63720` adds gated patient review. Historical reports were compared to current code rather than repeated.
- Performed static SQL CREATE TABLE versus non-comment Drizzle declaration coverage check: 71 declared tables, 74 SQL CREATE TABLE names; no declared table missing from CREATE inventory. This does not prove columns, production drift or migration execution correctness.
- Confirmed 30 SQL files in runner scope, including external workflow migration. Confirmed 0026 exists in SQL and migration safety catalog at this baseline.
- Confirmed backup-restore script's actual scope is count metadata, not actual database restoration.
- Confirmed no tracked Terraform files found. No claim is made about infrastructure managed outside this repository.
- Checked the documentation package for required deliverables, packet fields, local links, source paths and whitespace before committing.

## Not verified / release evidence still required

No production DB connection or schema catalog; no actual migration replay in this session; no actual backup/PITR restore; no cloud IAM/bucket/processor/runtime configuration; no signed vendor scope; no OpenAI account setting/model approval; no device test; no live scanner; no clinical gold adjudication; no end-to-end synthetic clinical runtime execution; no current GitHub CI green-state claim. Source-string tests and source inspection cannot establish those facts. Existing app tests were not run because this change is documentation-only and no runtime dependencies or database were provisioned for the review.

The proposed implementation packets specify how to obtain each missing proof. Architecture is complete as a reviewable proposal; production readiness remains explicitly blocked.

## Immutable source evidence links

- [artifacts/api-server/src/clinical/access.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/clinical/access.ts)
- [artifacts/api-server/src/routes/patientReviewRoutes.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/routes/patientReviewRoutes.ts)
- [artifacts/api-server/src/clinical/patientExtraction.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/clinical/patientExtraction.ts)
- [artifacts/api-server/src/clinical/storage.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/clinical/storage.ts)
- [artifacts/api-server/src/clinical/ephemeral.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/clinical/ephemeral.ts)
- [artifacts/api-server/src/clinical/retention.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/clinical/retention.ts)
- [artifacts/api-server/src/auth/opsJobs.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/api-server/src/auth/opsJobs.ts)
- [artifacts/spartan-coaching-mobile/app/ai-tools/patient-review.tsx](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/spartan-coaching-mobile/app/ai-tools/patient-review.tsx)
- [artifacts/spartan-coaching/src/pages/PatientReview.tsx](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/artifacts/spartan-coaching/src/pages/PatientReview.tsx)
- [lib/db/scripts/backup-restore-drill.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/db/scripts/backup-restore-drill.ts)
- [lib/db/scripts/migrate.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/db/scripts/migrate.ts)
- [lib/db/src/migrate-manifest.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/db/src/migrate-manifest.ts)
- [lib/db/src/migration-safety.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/db/src/migration-safety.ts)
- [lib/spartan-ai-tools/src/clinical-contract.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/spartan-ai-tools/src/clinical-contract.ts)
- [lib/spartan-ai-tools/src/clinical-runtime.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/spartan-ai-tools/src/clinical-runtime.ts)
- [lib/spartan-ai-tools/src/server.ts](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/lib/spartan-ai-tools/src/server.ts)
- [.github/workflows/ci.yml](https://github.com/Thordadpool5413/SpartanCoaching/blob/708b0522af3534a0066134d646f21f2a3cb8747c/.github/workflows/ci.yml)
