# Spartan AI Tools Production Runbook

## Release gates

All fourteen tools are available to entitled Field Kit members by default.
An explicit `AI_TOOL_* = false` remains the per-tool emergency kill switch.
Clinical tools default to ephemeral, de-identified education mode. PHI mode
remains gated until vendor BAAs, the security risk assessment,
privacy/retention procedures, clinical sign-off, and a production deletion/audit
drill are complete.

Clinical outputs are decision support. They are not diagnoses, coverage determinations,
or autonomous eligibility decisions.

## Required production configuration

Use BAA-covered Google Cloud services for the API, PostgreSQL, private Cloud Storage,
KMS/secrets, logs, backups, scanning, and OCR. Do not route PHI through Replit storage,
logs, analytics, crash reports, push messages, filenames, or support tools.

Required secrets and gates:

```text
DATABASE_URL
OPENAI_API_KEY
OPENAI_MODEL
AI_TOOL_ENCRYPTION_KEY
CLINICAL_GCS_BUCKET
CLINICAL_EPHEMERAL_GCS_BUCKET
CLINICAL_FILE_SCANNER_URL
CLINICAL_FILE_SCANNER_TOKEN
CMS_COVERAGE_API_TOKEN
GOOGLE_PLACES_API_KEY
HIPAA_PHI_ENABLED=true
OPENAI_BAA_CONFIRMED=true
OPENAI_MODIFIED_RETENTION_CONFIRMED=true
GOOGLE_CLOUD_BAA_CONFIRMED=true
PHI_STORAGE_BAA_CONFIRMED=true
CLINICAL_OPERATION_MODE=phi
```

Global and tenant `AI_TOOL_*` flags default to enabled. Set either flag to
`false` for the emergency kill switch. PHI runtime gates apply only when
`CLINICAL_OPERATION_MODE=phi`. OpenAI requests use `store: false`; the
account must also have its approved HIPAA/Modified Retention configuration. CMS API
credentials are server-side only and must never be accepted in request bodies.

## Deployment sequence

1. Apply `lib/db/migrations/0001_spartan_ai_tools.sql`, then
   `lib/db/migrations/0002_ephemeral_clinical_tools.sql`. Confirm the migration
   cleared legacy clinical payloads and that the retention worker completed the
   corresponding object purge.
2. Configure the dedicated temporary Cloud Storage bucket with uniform bucket-level
   access, public access prevention, CMEK, no versioning, no retention lock, no
   analytics export, the shortest supported provider lifecycle backstop, and
   five-minute signed uploads. The application uses a 55-minute expiry plus an
   independent five-minute sweeper to enforce its 60-minute orphan ceiling.
3. Configure the malware scanner and prove unsafe files are rejected.
4. Sync and verify official CMS coverage snapshots through the allowlisted admin API.
5. Explicitly grant clinical permissions; sales membership alone never grants access.
6. Submit unique sentinel identifiers through all five clinical tools and prove they
   are absent from PostgreSQL, GCS, logs, analytics, crash reports, caches, exports,
   backups outside their documented expiration, and support tooling. Run web E2E,
   Expo device, authorization isolation, cancellation, failure, expiry, cleanup retry,
   deletion/audit, restore, and PHI-free observability tests.
7. Enable the global flag, then the organization flag, one tool and one pilot
   organization at a time. Monitor only operational, PHI-free metrics.

## Rollback

Disable the affected tool flag first. Roll back application containers without rolling
back the additive migration. Preserve append-only audit events. If exposure is
suspected, activate the incident-response plan, rotate affected credentials and keys,
and retain evidence under the approved legal process.

## Native release gate

This change uses native modules already present in the current Expo binary. Publish it
through the matching EAS Update channel after web/API deployment and device smoke
testing. Run a new EAS Build only if Expo reports a native runtime mismatch or a native
configuration change is introduced; EAS Submit remains an explicit owner-approved
release action.
