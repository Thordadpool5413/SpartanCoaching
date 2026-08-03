# Operator checklist (cannot be finished by code alone)

Use this after deploys and when clearing the security release gate.

**Design / UI release live check:** also complete `docs/production-verification.md`
(SHA match, hard refresh on spartanhospicecoaching.com, light-mode spot-check).

**Replit Publish after dual-product rebrand:** `docs/replit-publish.md`
(pull `main` → Publish → verify Membership markers on live host).

**Public claim / PHI wording:** see `docs/content-compliance.md` before publishing
hard metrics or named testimonials.

## Credential / secret hygiene

- [ ] Revoke any Gemini API key that ever lived in a tracked `.env*` file (Google Cloud console).
- [ ] Confirm production and jobs do **not** use Gemini (product path is OpenAI-only).
- [ ] Schedule a coordinated `git filter-repo` history purge for the three removed env paths if forensic policy requires secrets out of git history; re-clone all machines afterward.
- [ ] Keep `ADMIN_BOOTSTRAP_TOKEN` unset in production after the first admin exists.

## Database

- [ ] `pnpm --filter @workspace/db run push` after schema pulls (auth + roleplay ownership columns).
- [ ] Backup restore drill completed before large migrations.

## Membership smoke

- [ ] Run `scripts/smoke-membership.md` end-to-end on the live host.
- [ ] Role-play: start session → 2+ messages → feedback (must not return 410).
- [ ] Logged-out AI tools return 401/403, not data.

## Mobile / App Store

- [ ] Verify the Apple Developer team and App Store Connect app interactively
      during the first EAS submit; never commit Apple credentials or unresolved
      `$APPLE_*` placeholders.
- [x] EAS production environment points `EXPO_PUBLIC_API_URL` and
      `EXPO_PUBLIC_DOMAIN` at `https://spartanhospicecoaching.com`.
- [ ] `pnpm --filter @workspace/spartan-coaching-mobile run build:ios` then `submit:ios`.
- [ ] Production binary points at the real `SITE_URL` / API host (not Replit LAN).
- [ ] TestFlight internal test, then App Store listing (screenshots, privacy nutrition labels).

## Background jobs

- [ ] `ENABLE_BACKGROUND_JOBS=1` (or deploy default) + `NOTIFICATION_EMAIL` / `OPS_DIGEST_EMAIL`.
- [ ] Optional external cron: `POST /api/cron/jobs` with `X-Cron-Secret`.

## Membership / billing

- [ ] Stripe secrets set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_INDIVIDUAL_WEEKLY` (see `docs/billing-phase1.md`).
- [ ] Webhook endpoint live: `POST /api/billing/webhook`.
- [ ] Customer Portal allows cancel at period end.
- [ ] Access Desk activate client still works for **comp / offline** orgs (`billing_plan=comp` or no Stripe).
- [ ] Access Desk activate client → membership email received.

## Clinical / AI tools (PHI production)

When BAAs are signed and you want live PHI mode (auto when the five confirmation
flags are `true`; see `docs/ai-tools-production-runbook.md`):

- [ ] Set: `HIPAA_PHI_ENABLED`, `OPENAI_BAA_CONFIRMED`, `OPENAI_MODIFIED_RETENTION_CONFIRMED`, `GOOGLE_CLOUD_BAA_CONFIRMED`, `PHI_STORAGE_BAA_CONFIRMED` all to `true`.
- [ ] Set runtime: `AI_TOOL_ENCRYPTION_KEY`, `CLINICAL_EPHEMERAL_GCS_BUCKET`, `CLINICAL_FILE_SCANNER_URL` (+ recommended scanner token / `CLINICAL_GCS_BUCKET`).
- [ ] Offline check: `node scripts/verify-clinical-production-env.mjs --require-phi` (exit 0).
- [ ] Live check after deploy: `GET /api/admin/clinical-runtime-health` or `GET /api/healthz/clinical` returns `ok:true`, `operationMode:"phi"`, `ready:true`.
- [ ] Or full smoke: `node scripts/smoke-health.mjs https://YOUR_HOST` (includes clinical runtime).
- [ ] Apply DB migrations including `0002_ephemeral_clinical_tools.sql` / `pnpm --filter @workspace/db run push`.
- [ ] Optional: replace educational coverage baseline via `/api/clinical/coverage/sync` with a live CMS MCD snapshot.
