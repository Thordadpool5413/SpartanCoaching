# Security, operations and rollout

## PHI threat model

Assets: source records, patient identity, normalized facts, drafts/approvals, credentials, evidence manifests, exports, backups and patient-linked audit. Actors: authorized clinician, ordinary member, tenant admin, platform support, compromised account/worker, malicious uploader and external attacker. Trust boundaries: device/API, API/clinical workers, tenant/tenant, SQL/object/FHIR, Google/OpenAI, production/development, clinical/sales and infrastructure operator/clinical reviewer.

| Threat | Required control | Release evidence |
|---|---|---|
| Tenant IDOR/search/export leakage | Server-derived tenant; explicit permissions; composite FKs/RLS; scoped store identity; reject foreign references | Two-tenant read/write/search/history/bulk export/batch tests using non-owner DB role |
| Wrong-patient attachment/merge | Verified source identity, uncertain-match queue, immutable merge ledger | Conflicting MRN and merge/unmerge benchmark |
| Platform-admin overreach | No implicit PHI permission, delegated grant limits, approved break-glass only | Admin without clinical grant denied; cannot self-grant |
| Session theft/CSRF | HttpOnly/Secure cookies, reviewed SameSite/origin protection, server revocation, recent step-up | Cookie and Bearer transport tests, revoke during job/approval, session fixation tests |
| Malicious files and decompression denial of service | Streaming limits, structural checks, scan, isolated no-network parser, CPU/memory/page bounds | Archive bombs, malformed/encrypted PDF, huge images, timeout and scanner outage fixtures |
| Prompt injection/source manipulation | Source treated as data; no tool side effects; evidence validation; immutable generations | Embedded instructions cannot change policy or exfiltrate data |
| Upload/delete race and orphan | Generation preconditions, durable intent/outbox, cancel tombstone, bucket inventory reconciliation | Crash before/after every DB/object commit; late upload after cancel |
| Stale clinical guidance | Input manifests, source/policy invalidation and approval/export CAS | Source changes during reasoning and approval result in STALE |
| Unsupported clinical statement | Validated evidence references and clinical evals; reviewer attestation | No unsupported high-impact finding in sentinel set |
| PHI in logs/analytics/errors | Allowlisted fields, path templates, sanitized SDK errors, body/header capture disabled | Sentinel scan of all app/provider/tracing/build/notification sinks |
| Device/browser persistence | Memory-only clinical views, no offline replay, immediate clear, protected picker cache, inactive privacy cover | Device filesystem/browser storage scans after success/failure/offline/logout/crash |
| Exfiltration through network/tools | Fixed destinations, scoped service identity, no arbitrary URLs, secrets isolation | Deny arbitrary outbound hosts and client-specified store paths |
| Unauthorized knowledge change | Non-PHI ingestion, signed approved bundle, controlled activation | Upstream edit does not affect production until approval |
| Backup/export leakage | Covered encrypted destinations, least privilege, documented lifecycle, no public artifacts | Restore/export access tests and audited download expiry |
| Audit loss/tampering | Append-only event contract, transactional outbox, restricted sink and integrity monitoring | Simulated audit outage blocks approval/export or durably records pending event |
| Cost abuse | Tenant budgets, bounded retries/concurrency/token/page limits and cancellation | Duplicate request flood cannot bypass limits |

## Web controls

Clinical routes use no-store/private headers on successes and errors, and authenticated fetch with cache:no-store. Exclude them from service worker/PWA caches and persisted query clients. No patient text/IDs in URLs, location state, localStorage, sessionStorage, IndexedDB, analytics, replay tools or error telemetry. Use route templates in observability rather than raw clinical paths. Disable autocomplete for clinical inputs where practical; clear content on logout/tenant switch/session expiry and visibility policy. Sanitize any rendered markdown; show extracted text as text, never executable HTML. No external images/links auto-fetched from clinical output. Strong CSP and dependency controls mitigate XSS; memory-only storage does not mitigate a compromised page by itself.

Network loss blocks new PHI operations and clears hidden/closed views locally immediately. It must not prevent local cleanup while waiting for server acknowledgement. Closing requests cancellation but independent server TTL performs eventual cleanup. Offline/service-outage wording must not promise absolute deletion. Browser cannot guarantee erasure of OS memory/swap or user-created screenshots; do not claim it does.

## iOS controls

Retain SecureStore token with device-only accessibility; do not place chart content in SecureStore, AsyncStorage, member continuity, offline queue or drafts. Treat cached auth profile as identity metadata with logout cleanup, separate from clinical content. Picker copies live in a controlled temporary directory with startup scavenging, error-path deletion and tested backup exclusion/data protection. The user's original Files/photos remain untouched. Do not save uploads to Photos. A crash can prevent finally blocks; startup cleanup and server expiry are mandatory.

Install an opaque clinical privacy cover on `inactive` before app-switcher snapshots, including while picker/biometric UI is active; background cancellation alone is insufficient. Local device authentication gates resumption; server step-up remains authoritative. No automatic clipboard, share sheet, push preview or screen recording export. Explicit clinical export requires permission and audited policy; if an export creates a local file, track/delete it and explain the user's exported copy is outside automatic deletion. Verify backup and app-switcher behavior on the actual EAS build, not only JavaScript unit tests. Disable sensitive crash breadcrumbs and attachment capture. On logout/account switch/network loss/close, clear memory without first awaiting network deletion; use cancellation generation to prevent late requests repopulating results.

## Vendor/data-flow inventory

This is a proposed allowed-flow inventory. Actual executed contracts and vendor settings are unverified. “No” is this architecture's policy, not a claim about all vendor product offerings. Linkable IDs may be PHI even without names; minimize them and protect audit data accordingly.

| Vendor/service | PHI allowed? / contract gate | Data and purpose | Retention and production dependency |
|---|---|---|---|
| Google Cloud clinical services | Conditional: executed applicable BAA, exact covered service/feature and configuration | API processing, SQL records, GCS source/temp, OCR, FHIR, restricted audit/backup | Per approved lifecycle; essential production clinical dependency |
| OpenAI API | Conditional: applicable executed BAA and approved project/model/endpoint/retention | Minimum necessary extracted evidence for structured reasoning | Verify configured controls and exceptions; no product-owned chart storage; essential reasoning dependency |
| GitHub | No PHI | Source, synthetic tests, content-free build/evaluation evidence | Repo/CI artifact policy; delivery dependency only |
| Replit | No PHI | Development and synthetic preview | Synthetic development lifecycle; not production clinical dependency |
| ChatGPT/Codex development session | No PHI under this brief | Code/architecture and synthetic fixtures only | Do not upload clinical records or production dumps |
| Expo/EAS | No PHI | App source/build assets and nonclinical release metadata | Build/artifact policy verified before release; delivery dependency, not clinical backend |
| Apple / APNs / StoreKit | No PHI in notifications/billing payloads | App distribution, signed purchase transactions, generic notification token/message | Vendor contract/retention verified; native distribution/billing dependency |
| Stripe | No PHI | Customer/account contact, subscription and invoices only; no patient names/diagnoses in metadata | Billing contract/retention; paid-access dependency |
| Resend | No clinical PHI | Login/MFA and generic operational emails; no clinical attachment/identifier | Verify actual account retention and metadata minimization; email dependency |
| First-party analytics | No clinical payloads | Allowlisted product events and aggregate counters | Existing retention reviewed; not required for clinical correctness |
| External analytics/session replay | No PHI; disabled on clinical surfaces by default | No clinical page capture | Inventory actual scripts/SDK configuration before release; optional |
| Crash reporting/APM/Cloud Trace | No clinical content; restricted linkable metadata only within approved boundary | Sanitized codes/timings, no payload/breadcrumb/screenshots | Sink-specific access and retention; observability dependency |
| Malware scanner | Conditional: covered GCP workload or separately approved service/BAA | Quarantined object bytes in isolated scanner | Ephemeral; no content logging; ingestion dependency |
| SMS/Slack/Teams/future notification vendors | No PHI in initial scope | Generic “A clinical review is ready. Sign in to Spartan.” | No patient IDs in links or message metadata; optional, disabled until inventoried |
| EMR connector (future) | Conditional: customer authority and applicable contractual/privacy scope | Minimum scoped patient records with source versions | Source-system agreement and local lifecycle; future dependency |

Before activation, produce a deployment-specific subprocessor/flow inventory including region, endpoint, credential owner, retention setting and evidence link. A BAA with one vendor does not cover every other processor. Google compliance guidance describes shared responsibility and covered-service configuration, not blanket application certification (S17).

## Observability and sentinel gate

Use centralized structured logger: operation enum, opaque correlation token, stage, approved model/bundle ID, outcome code, duration/count. Do not log bodies, headers, filenames, raw SDK exceptions, SQL parameter values, URLs with patient IDs, source text or model output. Redaction is a backstop, not permission to pass arbitrary objects. Wrap GCP/OpenAI/database/parser errors to safe codes. Audit events are separate from analytics and access-restricted; retain patient-linked audit only under the approved policy.

Inject unique synthetic markers into filename, PDF content, request headers/fields, OCR errors, model outputs and rejected files. Exercise success, retries, cancellation, scanner/DB/SDK faults, export and backgrounding. Search API/worker/scanner logs, Cloud Logging, load-balancer request logs, Cloud Audit Logs fields, trace/APM, browser console, mobile logs/crash stores, notifications/email previews, CI artifacts and third-party telemetry. Marker may exist only in the explicitly permitted synthetic clinical data store, never observability/notification output. Gate fails if a required sink cannot be inspected or contains a marker. Record sink inventory, query interval, request IDs, counts and content-free pass/fail evidence. No real PHI in the test.

## Recovery and offboarding

Proposed targets for contracted longitudinal service: Cloud SQL RPO <=15 minutes/RTO <=4 hours; FHIR projection RPO <=24 hours/RTO <=8 hours, while replay from authoritative approved SQL/source versions reconciles changes; retained sources RPO <=24 hours/RTO <=8 hours. These are design targets, not promises, and need owner approval and measured drills. Temporary reviews have no recovery promise for content; cancellation/purge takes priority over restoring discarded charts. No backup of ephemeral processing objects.

Explicitly configure Cloud SQL automated backups and PITR; do not rely on provider defaults. Restore into a new isolated covered instance, test schema, synthetic records, row ownership, grants, RLS, sequence positions and application transactions, record measured RPO/RTO. Existing count drill cannot satisfy this. At least quarterly full drills and before migration; actual PHI restoration stays inside covered infrastructure with owner approval. FHIR: protected exports plus versioned projection mappings/replay; verify resource/history coverage of exports rather than assuming all histories are included. GCS retained sources: version/lifecycle/hold policy and inventory reconcile against SQL/FHIR. Restore deletion tombstones before reopening service so backups cannot resurrect offboarded data. Test coordinated consistency across stores and key recovery. S11–S12.

Offboarding: revoke interactive and service access, stop intake/jobs, preserve owner-authorized export access separately, evaluate holds/retention, export FHIR/source/approved reviews/audit as permitted, verify tenant scope/manifest/count/hash, deliver through authenticated time-limited access, delete eligible primary objects/history/projections/state, process exports/backups on their documented schedules, verify with inventories, issue content-free deletion receipt with explicit remaining held/backup data. Never issue “all deleted” while known recoverable copies remain. Current billing/member offboarding must not cascade-delete contracted clinical history without the clinical lifecycle decision.

Terraform state backup/versioning and encryption keys are recovery dependencies. Separate authority for state access, production apply and clinical viewing. Key loss can make backups unusable; prove recovery, not merely backup creation.

## Incident response

Engineering sequence: DETECT → CONTAIN → DISABLE → PRESERVE EVIDENCE → ROTATE/REVOKE → ASSESS → REMEDIATE → VERIFY. Named incident commander, security owner, clinical reviewer and customer/compliance contacts are configured before pilot. Do not invent statutory notice timing; counsel/compliance determines applicable obligations.

Compromised key: disable relevant service/tenant route, rotate scoped credential and review audit. PHI in logs: disable emitting path/sink, restrict access, preserve necessary evidence within covered boundary, determine exposed copies and approved removal. Tenant bug/wrong patient: kill affected reads/exports/jobs, revoke URLs, quarantine findings and identity links, reconcile scope before restoration. Malicious upload: isolate object and scanner/parser, preserve safe evidence, block matching payload privately. Lost device: revoke sessions, require reauth, assess local cache/export exposure; do not claim remote erasure of personal files. Unexpected vendor retention: disable that modality/service, preserve contract/configuration evidence and evaluate purge/notification with owner. Every incident requires targeted regression test and controlled reactivation.

## Abuse controls, software supply chain and rollout

Per-tenant launch proposal: two concurrent clinical jobs and 500 pages/day, configurable downwards; global admission control protects shared resources. Reserve estimated OCR/token budget transactionally before dispatch; release/reconcile reservations; reject over-budget work before provider call. Retained-mode dedup is tenant/patient/source-version specific and authorization-checked; temporary mode has no long-lived document fingerprints. Cloud billing alerts and provider budgets supplement application hard caps; never assume alerts stop spending. Meter without chart text, cap retries, disallow automatic downgrade to unevaluated models, and load-test fair scheduling.

Keep existing Gitleaks and dependency audit. Add SAST (CodeQL or Semgrep selected by language support), SBOM, container and Terraform scans, dependency license policy, SHA-pinned Actions, verified tool checksums and image digests. Review existing audit exclusions individually with expiry/owner. Separate untrusted PR code from privileged deployment credentials; OIDC claims limited to protected environment/ref. Synthetic canary release verifies kill switches and rollback. No PHI in test artifacts.

Supported iOS contract proposal: current and previous two minor app releases for at least 90 days, extended if observed active versions require it; owner approves actual support commitment. Additive APIs and capability negotiation preserve older installed apps. Emergency force update only for demonstrated unmitigable client security/contract risk; keep login/account/export support paths available appropriately. Clinical v2 feature stays hidden from unsupported clients; do not break sales tools to retire old clinical schema. Require dual-contract regression tests before migration.

Rollout sequence: synthetic dev → synthetic covered staging → internal synthetic pilot tenant → owner-approved limited PHI pilot → broader rollout. PHI pilot prerequisites: B01–B09 cleared for applicable scope, accepted retention mode, vendor attestation, native/web tests, clinical evaluation signoff, real recovery evidence, incident drill and trained named reviewers. Start one tenant with bounded usage and daily review of content-free incidents/errors; expand only with documented clinical/security acceptance. Environment and organization switches stop new uploads/inference/exports separately while allowing purge and recovery. Kill switch never disables cleanup. Roll back to known evaluated code/model/policy bundle; compatible schema stays expanded. Production Terraform apply, secrets changes, destructive migration, data move, PHI activation, customer rollout and material TestFlight/App Store release remain explicit owner-only operations.
