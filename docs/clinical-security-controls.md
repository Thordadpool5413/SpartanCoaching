# Clinical Security Controls

Updated for the bounded PHI-readiness correction from main
`4e66375cfee6e6dc7a2f9e8c30691b1fdb34a442`. This describes repository behavior,
not production activation or clinical certification. See the
[operational contract](operational-contract.md) and
[patient review boundary](patient-record-review.md).

## Explicit clinical authority

Patient-record review requires an active organization/member relationship, the
Elite feature entitlement, an explicit nonrevoked permission for that tenant and
member with `canReview=true`, and server-verified MFA within fifteen minutes.
Platform/application/organization roles and billing entitlements do not supply
clinical permission. `canAdmin` manages clinical settings without granting patient
viewing. The permission writer itself requires explicit tenant `canAdmin`; platform
and organization roles cannot grant themselves clinical authority. Explicit
clinical administrators retain permission management without `canReview`.
Ordinary deidentified tool access remains a separate entitlement.

## One readiness contract

`lib/spartan-ai-tools/src/clinical-runtime-contract.js` is the canonical
configuration evaluator used by shared mode helpers, API readiness, clinical health
and `scripts/verify-clinical-production-env.mjs`. There is no automatic PHI activation
from BAA confirmations. PHI requires explicit activation, vendor confirmations,
`OPENAI_RETENTION_MODE=zdr`, `OPENAI_HIPAA_RETENTION_CONFIRMED=true`, a usable
OpenAI key, database/encryption configuration, a dedicated ephemeral bucket and an
authenticated covered scanner. The deprecated
`OPENAI_MODIFIED_RETENTION_CONFIRMED` input cannot prove ZDR.

If PHI is requested but any required control is absent, the runtime remains
`deidentified`, reports `ready=false` and names the missing controls. Patient data
and documents are not accepted. Explicit `CLINICAL_OPERATION_MODE=deidentified`
selects education; `--require-phi` still rejects that configuration. Health and
offline checks expose control names/status only, never secret values. These checks
verify configuration, not actual vendor account settings or live service operation.

## Temporary workflow and preserved controls

- Ordinary clinical tools accept deidentified input only, screen common direct
  identifiers and require qualified human review. Screening is not a certification
  that arbitrary text is deidentified.
- Patient review accepts at most five PDF, DOCX, PNG, JPEG or TXT files, each at most
  25 MiB, through the authenticated API. The server uses `@google-cloud/storage`
  for the GCS bucket backing Cloud Storage for Firebase. No Firebase client SDK,
  client credential or direct PHI upload path is introduced.
- File signatures and the existing parser limits remain enforced. Malware scanning
  requires a covered scanner URL and token in PHI mode; only explicit `safe:true`
  passes. Scanner errors/unknown verdicts fail closed.
- The dedicated temporary bucket must enforce public access prevention and uniform
  bucket-level access, with versioning and soft delete disabled and no retention
  policy that defeats deletion. The existing bucket-policy check remains required.
- Both OpenAI extraction and structured analysis use `store:false`. The owner
  confirms an executed API BAA and ZDR on the intended project. Configuration flags
  and `store:false` do not independently establish effective provider coverage.
- Finalization requires `confirmedHumanReview=true`. Outputs remain one-time drafts
  with a clinician/compliance review watermark, without automatic diagnosis,
  eligibility, prescribing, coding, billing, certification or EMR/FHIR writeback.
- Source bytes/text, prompts, outputs, patient facts, original filenames and
  patient-linked content hashes are not inserted into durable run/case history.
  Existing opaque session/object metadata and content-free audit remain.
- Successful finalization returns the draft only after verified object deletion.
  Cancel and failure paths purge; failed cleanup retains metadata for retry and
  returns a bounded error. Responses, including access failures, use no-store.
- Sessions expire after 55 minutes; the existing sweep runs in the API process.
  Outages/orphaned objects can delay deletion. There is no absolute deletion-time
  guarantee. The user's original file is not deleted.
- Patient review logs exclude source/model content and secrets. Cleanup failures
  log an outcome code rather than raw storage/SDK error text.

Existing parser isolation/total expansion/page-pixel budgets, independent orphan
reconciliation, dedicated native inactive-cover/local-unlock and covered deployment
leak/deletion drills remain separately recorded release evidence. This bounded
correction does not claim those controls are verified or authorize real PHI.
