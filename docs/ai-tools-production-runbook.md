# Spartan AI Tools Production Runbook

## Release gates

All fourteen tools ship disabled by organization/tool feature flags until package, API,
web, native-device, authorization, production-smoke, monitoring, support, and rollback
checks pass. Clinical flags remain off until vendor BAAs, the security risk assessment,
privacy/retention procedures, clinical sign-off, and a production deletion/audit drill
are complete.

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
CLINICAL_FILE_SCANNER_URL
CLINICAL_FILE_SCANNER_TOKEN
CMS_COVERAGE_API_TOKEN
GOOGLE_PLACES_API_KEY
HIPAA_PHI_ENABLED=true
OPENAI_BAA_CONFIRMED=true
OPENAI_MODIFIED_RETENTION_CONFIRMED=true
GOOGLE_CLOUD_BAA_CONFIRMED=true
PHI_STORAGE_BAA_CONFIRMED=true
```

Global `AI_TOOL_*` flags are fail-closed: a tool is runnable only when its environment
flag is exactly `true` and its tenant-scoped database flag is enabled. Set either flag
to `false` for the emergency kill switch. OpenAI requests use `store: false`; the
account must also have its approved HIPAA/Modified Retention configuration. CMS API
credentials are server-side only and must never be accepted in request bodies.

## Deployment sequence

1. Apply `lib/db/migrations/0001_spartan_ai_tools.sql`.
2. Configure private Cloud Storage with uniform bucket-level access, public access
   prevention, CMEK, object lifecycle/backup expiration, and a five-minute signed URL
   maximum.
3. Configure the malware scanner and prove unsafe files are rejected.
4. Sync and verify official CMS coverage snapshots through the allowlisted admin API.
5. Explicitly grant clinical permissions; sales membership alone never grants access.
6. Run tests, web E2E, Expo device tests, authorization isolation tests, deletion/audit
   drill, restore drill, and PHI-free observability inspection.
7. Enable the global flag, then the organization flag, one tool and one pilot
   organization at a time. Monitor only operational, PHI-free metrics.

## Rollback

Disable the affected tool flag first. Roll back application containers without rolling
back the additive migration. Preserve append-only audit events. If exposure is
suspected, activate the incident-response plan, rotate affected credentials and keys,
and retain evidence under the approved legal process.

## Native release gate

SecureStore, local authentication, camera/document selection, and file handling affect
the native binary. Do not run EAS Build or EAS Submit until the owner approves a new
native build. Version and iOS build numbers are intentionally unchanged in this change.
