# Operator checklist (cannot be finished by code alone)

Use this after deploys and when clearing the security release gate.

## Credential / secret hygiene

- [ ] Revoke any Gemini API key that ever lived in a tracked `.env*` file (Google Cloud console).
- [ ] Confirm production and jobs do **not** use Gemini (product path is OpenAI-only).
- [ ] Schedule a coordinated `git filter-repo` history purge for the three removed env paths if forensic policy requires secrets out of git history; re-clone all machines afterward.
- [ ] Keep `ADMIN_BOOTSTRAP_TOKEN` unset in production after the first admin exists.

## Database

- [ ] `pnpm --filter @workspace/db run push` after schema pulls (auth + roleplay ownership columns).
- [ ] Backup restore drill completed before large migrations.

## Field Kit smoke

- [ ] Run `scripts/smoke-field-kit.md` end-to-end on the live host.
- [ ] Role-play: start session → 2+ messages → feedback (must not return 410).
- [ ] Logged-out AI tools return 401/403, not data.

## Mobile / App Store

- [ ] Set `APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID` in EAS secrets.
- [ ] `pnpm --filter @workspace/spartan-coaching-mobile run build:ios` then `submit:ios`.
- [ ] Production binary points at the real `SITE_URL` / API host (not Replit LAN).
- [ ] TestFlight internal test, then App Store listing (screenshots, privacy nutrition labels).

## Background jobs

- [ ] `ENABLE_BACKGROUND_JOBS=1` (or deploy default) + `NOTIFICATION_EMAIL` / `OPS_DIGEST_EMAIL`.
- [ ] Optional external cron: `POST /api/cron/jobs` with `X-Cron-Secret`.

## Membership

- [ ] Paid conversion remains offline/invoiced unless you later add billing.
- [ ] Access Desk activate client → membership email received.
