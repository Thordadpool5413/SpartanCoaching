# Spartan AI Tools Production Runbook

## Release gates

All fourteen tools are available to entitled members by default.
An explicit `AI_TOOL_* = false` remains the per-tool emergency kill switch.

**Mode selection**

| `CLINICAL_OPERATION_MODE` | Behavior |
|--------------------------|----------|
| unset | Deidentified; partial PHI activation flags report incomplete readiness |
| `phi` | Request the dedicated PHI workflow; incomplete controls keep mode deidentified and readiness false |
| `deidentified` | Force education mode even if BAAs are confirmed |

Clinical tools always run ephemerally (no retained clinical payloads). PHI mode
adds MFA, document upload (medical-record verifier), and full BAA/storage gates.

Feature entitlement and clinical authority are separate. Patient review requires
active organization/member membership, explicit nonrevoked tenant `canReview=true`,
Elite feature entitlement, recent server MFA and ready runtime. Neither platform
roles nor `canAdmin` confer patient review. Ordinary clinical tools stay deidentified.
The permission-management endpoint requires an explicit tenant `canAdmin` grant;
platform or organization roles alone cannot create clinical authority. An authorized
clinical administrator can manage permissions without patient-review permission.
Self-targeted privilege additions are rejected; an independent authorized tenant
clinical administrator must grant additional authority. Self-reduction is allowed.

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
AI_TOOL_ENCRYPTION_KEY
CLINICAL_EPHEMERAL_GCS_BUCKET
CLINICAL_FILE_SCANNER_URL
CLINICAL_FILE_SCANNER_TOKEN
HIPAA_PHI_ENABLED=true
OPENAI_BAA_CONFIRMED=true
OPENAI_RETENTION_MODE=zdr
OPENAI_HIPAA_RETENTION_CONFIRMED=true
GOOGLE_CLOUD_BAA_CONFIRMED=true
PHI_STORAGE_BAA_CONFIRMED=true
CLINICAL_SCANNER_BAA_CONFIRMED=true
CLINICAL_OPERATION_MODE=phi
CLINICAL_PATIENT_REVIEW_ENABLED=true
# Optional live CMS MCD sync (baseline educational snapshot seeds if empty):
# CMS_COVERAGE_API_TOKEN=...
```

Required controls are defined once in
`lib/spartan-ai-tools/src/clinical-runtime-contract.js`, shared by mode resolution,
API readiness, health and the dependency-free offline verifier. `OPENAI_MODEL`,
legacy `CLINICAL_GCS_BUCKET` and unrelated tool credentials are not PHI-readiness
requirements. A usable encryption key must follow the existing 32-byte key format.
Scanner authentication is required, not optional. No real environment changes are
authorized by this implementation.

Global and tenant `AI_TOOL_*` flags default to enabled. Set either flag to
`false` for the emergency kill switch. On first PHI-ready boot the API seeds an
educational hospice coverage baseline if `coverage_snapshots` is empty; replace
it with a live CMS MCD snapshot via `/api/clinical/coverage/sync` for policy
fidelity. OpenAI requests use `store: false`; the account must also have its
explicitly confirmed ZDR configuration; the deprecated Modified Retention flag cannot prove ZDR. CMS API credentials are
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
# soft post-deploy smoke (clinical WARN if PHI incomplete; does not fail):
node scripts/smoke-health.mjs https://YOUR_HOST
# hard fail when PHI must be fully ready:
REQUIRE_PHI_SMOKE=1 node scripts/smoke-health.mjs https://YOUR_HOST
# or: node scripts/smoke-health.mjs https://YOUR_HOST --require-phi
```

Expect `ok: true`, `operationMode: "phi"`, `ready: true`, and an empty
`missingControls` array when the canonical PHI configuration is complete. Requested
but incomplete PHI returns `ok:false`, `ready:false`, HTTP 503 and the actual missing
controls; data/documents are not accepted. Default or explicitly selected education
can be ready while still rejecting patient data. `--require-phi` rejects education.
Health does not attest vendor account settings or probe bucket/scanner/provider
operation. The patient route independently validates a current CMS MCD snapshot;
the educational seed cannot be used for patient review.

## Deployment sequence

1. For a separately authorized deployment, use the canonical numbered SQL migration
   runner (`pnpm --filter @workspace/db run migrate`) and the current migration
   catalog, never Drizzle push. This correction adds no migration. Preserve the
   earlier ephemeral migration's legacy-payload cleanup and object-purge evidence.
2. Configure the dedicated temporary Cloud Storage bucket with uniform bucket-level
   access, public access prevention, CMEK, no versioning, no retention lock, no
   analytics export, the shortest supported provider lifecycle backstop, and
   server-mediated authenticated API uploads using `@google-cloud/storage` into
   the GCS bucket backing Cloud Storage for Firebase; no Firebase SDK or client PHI
   access. Disable soft delete as well. Sessions expire after 55 minutes; the
   existing five-minute sweep runs in the API process. Outages/orphans can delay
   deletion; there is no absolute deletion-time guarantee.
3. Configure the covered authenticated malware scanner and prove unsafe files and missing tokens are rejected.
4. Sync and verify official CMS coverage snapshots through the allowlisted admin API.
5. Explicitly grant tenant review permission; sales membership, platform roles and clinical admin alone never grant patient review.
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
