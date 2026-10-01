# Patient record review deployment boundary

The new `/api/clinical/patient-review/sessions` workflow is **off by default**. Existing clinical tools continue to accept deidentified information only. The dedicated web and iPhone screens link to this workflow from the clinical tools.

The intended access contract requires an explicit tenant-scoped clinical review grant, active membership, an Elite feature entitlement, and recent server-verified MFA. **Current implementation gap:** `clinical/access.ts` also accepts clinical admin and gives platform admins that flag; P04 must remove this bypass before activation. They select a current, nonretired `CMS_MCD` coverage snapshot, then upload at most five PDF, DOCX, PNG, JPEG or TXT files (25 MB each). The server checks file signatures, scans each object, extracts text, compares documented facts to that snapshot, and returns a one-time draft. It does not make an autonomous diagnosis, eligibility, coding, medication, billing, or admission decision. The clinician must review the chart and the cited CMS policy. [CMS hospice guidance](https://www.cms.gov/medicare/payment/fee-for-service-providers/hospice) describes physician certification and the six-month prognosis; [CMS compliance guidance](https://www.cms.gov/training-education/medicare-learning-networkr-mln/compliance/medicare-provider-compliance-tips/hospice-services) describes supporting clinical findings and documentation.

## Activation prerequisites — not authorization

Checked at `708b0522af3534a0066134d646f21f2a3cb8747c`. Current DOCX parsing checks main XML metadata but does not prove total archive expansion, isolated parsing or page/pixel budgets. P07 must enforce the approved controls; listed formats are current runtime acceptance, not a safety approval.

The server cleanup timer lives in the API process (`opsJobs.ts`). Upload storage side effects can precede transaction commit, so orphan reconciliation requires P07/P08. The dedicated native route awaits deletion before clearing local state; offline-close, late response, privacy-cover and device unlock evidence remains P13 work.

Temporary review must not create durable patient facts, reviews or FHIR resources. Any longitudinal lifecycle requires separate owner-approved retention and customer wording. Source records remain authoritative; a generated draft is not a verified clinical fact or an amendment to an EMR.


Only a release operator who has verified the service agreements and data controls should configure **all** of:

- `CLINICAL_OPERATION_MODE=phi`, `CLINICAL_PATIENT_REVIEW_ENABLED=true`, `HIPAA_PHI_ENABLED=true`
- `OPENAI_BAA_CONFIRMED=true`, `OPENAI_MODIFIED_RETENTION_CONFIRMED=true` after verifying the actual API project and the suitability of image and file input for the signed agreement
- `GOOGLE_CLOUD_BAA_CONFIRMED=true`, `PHI_STORAGE_BAA_CONFIRMED=true`, `CLINICAL_SCANNER_BAA_CONFIRMED=true`
- `OPENAI_API_KEY`, `DATABASE_URL`, `CLINICAL_EPHEMERAL_GCS_BUCKET`, `CLINICAL_FILE_SCANNER_URL`, `CLINICAL_FILE_SCANNER_TOKEN`

An OpenAI BAA by itself does not cover the database, Google Cloud Storage, or an independent file scanner. HHS requires appropriate agreements with cloud providers that process or maintain ePHI: [HHS cloud guidance](https://www.hhs.gov/hipaa/for-professionals/faq/may-a-hipaa-covered-entity-or-business-associate-use-cloud-service-to-store-or-process-ephi/index.html).

The dedicated GCS bucket must have public access prevention and uniform bucket access enforced, versioning, soft delete, and retention disabled, and a lifecycle rule as an additional cleanup backstop. The app checks the bucket policy before accepting a session. The scanner must be a covered service and return explicit `{ "safe": true }` for an uploaded object. Configure CORS only if other legacy signed upload routes remain in use; the new patient route uploads through the authenticated API. Sync and independently verify effective CMS MCD policies before enabling record review.

## Retention and limits

The app writes temporary encrypted-at-rest files to the dedicated bucket, keeps only opaque object keys and session metadata in PostgreSQL, and calls the OpenAI Responses API with `store:false`. It deletes and verifies each object before returning the result. Closing the tool requests deletion; the server sweeps abandoned or failed sessions. A disconnected client, service outage, or provider failure can delay that cleanup, so there is **no absolute deletion-time guarantee**. The UI keeps the returned result in memory and clears it on close; it does not sync it to member history or include it in analytics.

OpenAI documents that image and file inputs can have exceptional retention for safety review even under modified monitoring or zero data retention: [OpenAI data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint). The signed BAA and approved project settings must be checked against this workflow; `store:false` alone is insufficient to promise that no copy exists anywhere. The user requested no patient data storage after closure, so do not enable PHI mode if this exception or a vendor retention rule conflicts with that requirement.

Before release, test the entire flow with synthetic records in a covered staging environment: authorized and unauthorized access, MFA expiry, each file type, malware rejection, wrong MIME, parallel uploads, app backgrounding, failure during model execution, delete verification, sweep after a storage outage, and clinician review of citations. No real patient data belongs in local fixtures, logs, or CI.
