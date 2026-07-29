# Clinical Security Controls

## Operating modes

- `CLINICAL_OPERATION_MODE=deidentified` is the default website and mobile
  mode. All entitled Field Kit members can open the five clinical education
  tools without organization provisioning, email MFA, a coverage-snapshot
  seed, or a clinical storage bucket. The user must confirm that every input is
  de-identified. The API also rejects common direct identifiers (email, phone,
  SSN, MRN, labeled date of birth, labeled patient name, and postal address)
  before any OpenAI request. This screening is a safety backstop rather than a
  certification that arbitrary text is de-identified. Results are ephemeral,
  human review remains mandatory, and document/photo upload is unavailable.
- `CLINICAL_OPERATION_MODE=phi` is the controlled PHI mode described below. It
  is only operational after the BAA, retention, storage, scanner, encryption,
  permission, MFA, evidence, deletion, and audit gates are configured and
  verified.

- In PHI mode, explicit clinical authorization is tenant-scoped and independent of paid sales
  membership. Clinical API access requires recent email MFA; mobile clinical screens
  also require device biometric or credential verification.
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
  expire after 55 minutes and an independent five-minute sweeper enforces the
  60-minute application-level orphan ceiling.
- Failure, cancellation, and successful finalization all invoke the same verified
  purge. Device camera and picker cache copies are removed after upload. The user's
  original source document is never deleted.
- Web clinical exports are generated from the current in-memory result and immediately
  revoke the Blob URL. Native sharing uses the in-memory result and creates no
  retained server export. All clinical results include a permanent educational
  decision-support watermark.
- The iOS clinical screen is replaced with an opaque privacy view whenever the app
  becomes inactive, preventing patient content from appearing in app-switcher
  snapshots. Clinical values are held only in component memory.
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
