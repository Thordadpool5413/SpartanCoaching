# Security foundation release gate

This document records the mandatory operator actions that cannot be completed by
application code or an ordinary pull request. The sales workflow must remain
dark until every item is checked and evidenced.

## Credential incident

Three tracked copies of an environment file contained a `GEMINI_API_KEY`
assignment. This branch removes the files from the current tree and prevents
environment files from being tracked again. Removing a file does not revoke a
credential and does not erase it from existing Git objects.

Required owner actions:

1. Revoke the exposed Gemini key in the Google project that issued it.
2. Verify production and scheduled jobs no longer use that key.
3. Create a replacement only if a remaining approved workload requires Gemini.
   The sales workflow itself is OpenAI-only.
4. Record the revocation time, key identifier (never the secret), owner, and
   services checked in the incident record.

## Coordinated Git history purge

History rewriting changes commit IDs and must be scheduled with every
collaborator. Before the maintenance window, protect a forensic backup under
restricted access and pause merges. Use `git filter-repo` with an exact path list
for the three removed files, then force-push all rewritten branches and tags.
Do not publish the forensic backup.

After the rewrite:

1. Run Gitleaks against all refs and retain the report.
2. Confirm the three paths are absent from `git log --all --objects`.
3. Ask GitHub Support to expire cached views if required by the incident policy.
4. Require collaborators to delete old clones and clone again. Do not merge old
   branches, which would reintroduce the removed objects.
5. Re-enable branch protection only after the new root CI secret scan passes.

## Administrator bootstrap

Shared passcode and `X-Admin-Auth` authorization are retired. Normal platform
administration requires an active `platform_admin` session.

If a new installation has no platform administrator, set a random
`ADMIN_BOOTSTRAP_TOKEN` of at least 32 characters in the deployment secret
store, call the one-time bootstrap endpoint, and delete the token immediately.
Bootstrap refuses to reset or replace an existing administrator.

## Legacy roleplay archive

Member-facing legacy roleplay routes return `410 LEGACY_ROLEPLAY_RETIRED` because
the old records do not contain reliable tenant or owner identity. Do not assign
those rows to members by inference. Before deleting the legacy tables, export
them into the KMS-encrypted, platform-admin-only archive introduced by the
workflow data migration, verify row counts and ciphertext recovery in a test
environment, then delete the plaintext rows under an approved retention ticket.

## Production enablement evidence

- Root CI and full-history secret scan pass.
- Gemini revocation is recorded.
- Platform-admin and article authorization regression tests pass.
- Legacy roleplay endpoints return 410 for every method and object identifier.
- Allowed production origins are explicitly configured through `SITE_URL` and
  optional `APP_URL`.
- `ADMIN_BOOTSTRAP_TOKEN` is absent after bootstrap.
- Database backup restoration succeeds before workflow migrations begin.
