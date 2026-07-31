# Spartan AI Tools Production Runbook

## Release gates

All fourteen tools are available to entitled Field Kit members by default.
An explicit `AI_TOOL_* = false` remains the per-tool emergency kill switch.

**Mode selection**

| `CLINICAL_OPERATION_MODE` | Behavior |
|--------------------------|----------|
| unset | **Auto PHI** when all five BAA confirmation envs are `true`; otherwise de-identified |
| `phi` | Force PHI mode (still fail-closed until runtime config is complete) |
| `deidentified` | Force education mode even if BAAs are confirmed |

Clinical tools always run ephemerally (no retained clinical payloads). PHI mode
adds MFA, document upload (medical-record verifier), and full BAA/storage gates.

When PHI runtime is **ready**, entitled Field Kit members receive operational
`canUse` access automatically (explicit permission rows still win, including
revokes). Org/platform admins also receive review/admin when auto-granted.

Clinical outputs are decision support. They are not diagnoses, coverage determinations,
or autonomous eligibility decisions.

## Required production configuration

Use BAA-covered Google Cloud services for the API, PostgreSQL, private Cloud Storage,
KMS/secrets, logs, backups, scanning, and OCR. Do not route PHI through Replit storage,
logs, analytics, crash reports, push messages, filenames, or support tools.

Required secrets and gates for **operational PHI mode**:

```text
DATABASE_URL
OPENAI_API_KEY
OPENAI_MODEL
AI_TOOL_ENCRYPTION_KEY
CLINICAL_GCS_BUCKET
CLINICAL_EPHEMERAL_GCS_BUCKET
CLINICAL_FILE_SCANNER_URL
CLINICAL_FILE_SCANNER_TOKEN
GOOGLE_PLACES_API_KEY
HIPAA_PHI_ENABLED=true
OPENAI_BAA_CONFIRMED=true
OPENAI_MODIFIED_RETENTION_CONFIRMED=true
GOOGLE_CLOUD_BAA_CONFIRMED=true
PHI_STORAGE_BAA_CONFIRMED=true
# Optional force; auto-selected when the five BAA flags above are true:
# CLINICAL_OPERATION_MODE=phi
# Optional live CMS MCD sync (baseline educational snapshot seeds if empty):
# CMS_COVERAGE_API_TOKEN=...
```

Global and tenant `AI_TOOL_*` flags default to enabled. Set either flag to
`false` for the emergency kill switch. On first PHI-ready boot the API seeds an
educational hospice coverage baseline if `coverage_snapshots` is empty; replace
it with a live CMS MCD snapshot via `/api/clinical/coverage/sync` for policy
fidelity. OpenAI requests use `store: false`; the account must also have its
approved HIPAA/Modified Retention configuration. CMS API credentials are
server-side only and must never be accepted in request bodies.

## Production env verification

Offline (secrets loaded into the shell, no network):

```bash
node scripts/verify-clinical-production-env.mjs --require-phi
```

Live after deploy (no secret values returned):

```bash
curl -sS https://YOUR_HOST/api/admin/clinical-runtime-health
# or
curl -sS https://YOUR_HOST/api/healthz/clinical
# or full post-deploy smoke (includes clinical):
node scripts/smoke-health.mjs https://YOUR_HOST
```

Expect `ok: true`, `operationMode: "phi"`, `ready: true`, and an empty
`missingControls` array when PHI production is fully configured. De-identified
mode returns `ok: true` with a hint to enable BAAs — that is intentional, not a
failure, unless you pass `--require-phi` offline.

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
