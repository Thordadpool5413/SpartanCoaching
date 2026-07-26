# Clinical Security Controls

- Explicit `clinical:use`, `clinical:review`, and `clinical:admin` authorization is
  tenant-scoped and independent of paid sales membership.
- Clinical API access requires a recent six-digit email MFA challenge; mobile clinical
  screens also require device biometric or credential verification when opened.
- Mobile session credentials use device-only SecureStore.
- PHI values use AES-256-GCM envelope encryption with random per-record data keys and
  authenticated tenant/record context.
- Clinical documents use random object keys in a dedicated private GCS bucket, five-minute
  signed URLs, allowlisted types, 25 MB/file and 250 MB/case limits, and required malware
  scanning in production.
- Clinical database queries bind organization ID and resource ID. Run history, cases,
  documents, reviews, signed URLs, and deletion paths never use an unscoped lookup.
- CMS evidence is versioned and content-hashed. Clinical runs pin the exact snapshot.
- Cases retain data for 30 days by default (organization input: 1–365 days). Legal hold
  blocks deletion. User deletion is immediately hidden; object and encrypted payload
  purge is verified, and the scheduled sweep retries expired/deleting cases.
- Audit events are append-only and contain identifiers/actions only, never clinical
  content. User-facing errors expose safe codes; server logs must not include request
  bodies, filenames, extracted text, or model output.
- Backups must be encrypted and have documented expiration. A purge does not claim
  instantaneous removal from immutable backups; the retention policy defines their
  maximum lifetime.

Operational policies, workforce training, risk assessment, incident response, vendor
BAAs, restore drills, and qualified clinical validation remain required release gates;
software controls alone do not establish HIPAA compliance.
