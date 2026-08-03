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

## Role-play: tenant-safe vs legacy

**Current product path:** `/api/roleplay/*` is tenant-safe. New sessions always
store `memberId` + `organizationId`. Members only list/read/mutate their own
sessions. Platform admins may list owned sessions for ops analytics. Pre-tenant
rows with null ownership are never returned, continued, or mutated.

**Legacy archive (operator):** Rows without ownership must not be assigned to
members by inference. Before deleting those plaintext rows, export them into a
KMS-encrypted, platform-admin-only archive, verify row counts and ciphertext
recovery in a test environment, then delete under an approved retention ticket.

**DB migrate:** after pull, run `pnpm --filter @workspace/db run push` so
`member_id` / `organization_id` columns exist on `roleplay_sessions`.

## Production enablement evidence

- Root CI and full-history secret scan pass.
- Gemini revocation is recorded.
- Platform-admin and article authorization regression tests pass.
- Tenant-safe roleplay rejects unowned (legacy) session IDs with 404; new sessions always carry member + org ownership.
- Operator has completed or scheduled the legacy roleplay archive ticket (if any pre-tenant rows remain).
- Allowed production origins are explicitly configured through `SITE_URL` and
  optional `APP_URL`.
- `ADMIN_BOOTSTRAP_TOKEN` is absent after bootstrap.
- Database backup restoration succeeds before workflow migrations begin.

See also: `docs/operator-checklist.md` and `scripts/smoke-membership.md`.
