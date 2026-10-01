# Clinical Security Controls

Checked against `708b0522af3534a0066134d646f21f2a3cb8747c` on 2026-10-01. This document separates intended controls from verified runtime behavior; see [the operational contract](operational-contract.md).

## Release blockers and scope

PHI activation is not authorized. Environment confirmation flags are assertions, not evidence of executed agreements or effective vendor settings. The Google production boundary is the approved target; current Replit configuration is not proof of that deployment.

`artifacts/api-server/src/clinical/access.ts` currently derives `canAdmin` from platform_admin and permits review via `canReview || canAdmin`. This contradicts explicit clinical authorization. It is a P04 blocker, not acceptable support access. Clinical administration must not imply PHI viewing/reviewing.

The dedicated patient-review screen and legacy clinical screens differ. Do not infer biometric or inactive privacy coverage on the dedicated route from another screen. P13 must verify each surface and actual native build.

## Existing modes and intended controls (not release certification)

- **De-identified (default when BAAs are not confirmed, or forced with
  `CLINICAL_OPERATION_MODE=deidentified`)**: All entitled members can
  open the five clinical education tools without organization provisioning,
  email MFA, a coverage-snapshot seed, or a clinical storage bucket. The user
  must confirm that every input is de-identified. The API also rejects common
  direct identifiers (email, phone, SSN, MRN, labeled date of birth, labeled
  patient name, and postal address) before any OpenAI request. This screening is
  a safety backstop rather than a certification that arbitrary text is
  de-identified. Results are ephemeral, human review remains mandatory, and
  document/photo upload is unavailable.
- **PHI mode (`CLINICAL_OPERATION_MODE=phi`, or auto when all BAA confirmation
  envs are `true`)**: Controlled PHI mode described below. It is only
  **operational** after BAA, retention, storage, scanner, encryption, MFA,
  evidence, deletion, and audit gates are configured and verified. Entitled
  members receive operational `canUse` when the runtime is ready
  (explicit permission rows and revokes still win). Coverage snapshots are
  auto-selected; an educational baseline is seeded if none exist.

- In PHI mode, explicit clinical authorization is tenant-scoped and independent of paid sales
  membership. Clinical API access requires recent email MFA; mobile clinical screens
  must also require device biometric or credential verification; dedicated-route enforcement remains a P13 gap.
- Patient inputs, generated clinical results, extracted text, original filenames,
  reviewer notes, and input hashes are never inserted into retained run or case
  history. Clinical responses use `Cache-Control: no-store` and cannot be replayed.
- The four text clinical tools execute synchronously in memory. The Medical Record
  LCD Verifier uses a temporary session with random object tokens and a dedicated,
  private GCS bucket. Its result is returned only after every object is deleted and
  post-delete existence checks succeed.
- Temporary sessions support PDF, JPEG, PNG, and text, with limits of 25 files,
  25 MB per file, and 250 MB per session. Upload URLs expire after five minutes.
  Malware scanning is fail-closed when PHI is enabled.
- The temporary bucket must have public access prevention and uniform bucket-level
  access enabled, with object versioning and retention policies disabled. An object
  lifecycle rule is an additional infrastructure backstop. Application sessions
  expire after 55 minutes. Current sweeping is scheduled by API-process timers in
  `opsJobs.ts`; it is not independent of API uptime. Outages and orphaned objects
  can delay deletion. There is no absolute deletion-time guarantee (P07/P08).
- Failure, cancellation, and successful finalization all invoke the same verified
  purge. Device camera and picker cache copies are removed after upload. The user's
  original source document is never deleted.
- Web clinical exports are generated from the current in-memory result and immediately
  revoke the Blob URL. Native sharing uses the in-memory result and creates no
  retained server export. All clinical results include a permanent educational
  decision-support watermark.
- Target requirement: every iOS clinical screen needs an opaque view on inactive
  and local unlock on resume. Coverage of the dedicated patient-review route
  remains unverified; do not advertise snapshot protection as complete.
- CMS coverage snapshots remain retained because they contain public policy data.
  Audit events retain only organization/user/tool identifiers, timestamps,
  model/policy versions, outcome codes, object counts, and deletion confirmation.
- Logs, analytics, crash reports, push notifications, filenames, and support tooling
  must never receive PHI or model output.

Immediate deletion reduces exposure but does not remove HIPAA obligations. Real-PHI
activation requires the applicable BAA and ZDR or Modified Abuse Monitoring on the
specific OpenAI API organization/project, HIPAA-eligible endpoints, covered hosting,
storage and scanning services, a security risk assessment, and a successful
production deletion and leak-scan drill.
