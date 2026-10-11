# Operator checklist (cannot be finished by code alone)

Use this after deploys and when clearing the security release gate.

**Design / UI release live check:** also complete `docs/production-verification.md`
(SHA match, hard refresh on spartanhospicecoaching.com, light-mode spot-check).

**Replit Publish after dual-product rebrand:** `docs/replit-publish.md`
(pull `main` → Publish → verify **Hospice Sales Pro / Consulting** markers on live host —
not Field Kit, not generic Membership / “Spartan Membership”).

**Public claim / PHI wording:** see `docs/content-compliance.md` before publishing
hard metrics or named testimonials.

## Credential / secret hygiene

- [ ] Revoke any Gemini API key that ever lived in a tracked `.env*` file (Google Cloud console).
- [ ] Confirm production and jobs do **not** use Gemini (product path is OpenAI-only).
- [ ] Schedule a coordinated `git filter-repo` history purge for the three removed env paths if forensic policy requires secrets out of git history; re-clone all machines afterward.
- [ ] Keep `ADMIN_BOOTSTRAP_TOKEN` unset in production after the first admin exists.

## Database

- [ ] `pnpm db:migrate` after schema pulls (migrate-primary; not drizzle push).
- [ ] Backup restore drill completed before large migrations.

## Hospice Sales Pro smoke

- [ ] **Ship stack (preferred):** `node scripts/ship-check.mjs https://spartanhospicecoaching.com`
- [ ] With seat: `PARITY_EMAIL` + `PARITY_PASSWORD` on `ship-check` or `smoke-parity-auth.mjs`
- [ ] Full funnel (optional): `scripts/smoke-membership.md` on the live host
- [ ] Role-play: start session → 2+ messages → feedback (must not return 410).
- [ ] Logged-out AI tools return 401/403, not data.
- [ ] Gates / Day Zero / Account use **Hospice Sales Pro** (not Field Kit, not generic Membership product).
- [ ] Live meta/title mentions Hospice Sales Pro / Consulting (curl or view-source).

## Consultation booking pilot

- [ ] Keep `FF_CONSULTATION_BOOKING` at the server default or set it explicitly
      to `true` only while the owner-approved Calendly URL/build flags are valid.
- [ ] For an incident pause, set `FF_CONSULTATION_BOOKING=false` on the API,
      restart/redeploy the API (no iOS rebuild), record operator/reason/UTC
      evidence, and verify `/api/client-config` reports
      `consultation_booking:false`.
- [ ] On resume, set the flag to `true`, restart/redeploy the API, record the
      verification, and confirm Access Desk requests and saved work were not
      changed. Follow `docs/field-work-loop.md`.

## Mobile / App Store (D7)

- [ ] Verify the Apple Developer team and App Store Connect app interactively
      during the first EAS submit; never commit Apple credentials or unresolved
      `$APPLE_*` placeholders.
- [x] EAS production environment points `EXPO_PUBLIC_API_URL` and
      `EXPO_PUBLIC_DOMAIN` at `https://spartanhospicecoaching.com`.
- [ ] `pnpm --filter @workspace/spartan-coaching-mobile run build:ios:testflight` then `submit:ios`.
- [ ] Production binary points at the real `SITE_URL` / API host (not Replit LAN).
- [ ] TestFlight: complete `artifacts/spartan-coaching-mobile/store/testflight-smoke.md`
- [ ] App Store listing: screenshots per `store/screenshot-shot-list.md`, privacy labels
- [ ] Store copy uses Hospice Sales Pro (see `store/description.txt`).
- [ ] Full matrix: `docs/ship-readiness.md`

## Background jobs

- [ ] `ENABLE_BACKGROUND_JOBS=1` (or deploy default) + `NOTIFICATION_EMAIL` / `OPS_DIGEST_EMAIL`.
- [ ] Optional external cron: `POST /api/cron/jobs` with `X-Cron-Secret`.

## Hospice Sales Pro / billing

- [ ] Stripe secrets set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_INDIVIDUAL_WEEKLY` (see `docs/billing-phase1.md`).
- [ ] Webhook endpoint live: `POST /api/billing/webhook`.
- [ ] Customer Portal allows cancel at period end.
- [ ] Access Desk activate client still works for **comp / offline** orgs (`billing_plan=comp` or no Stripe).
- [ ] Access Desk activate client → access email received.

## Clinical / AI tools (PHI production)

Production activation remains an owner-only operation. The owner confirms the
OpenAI BAA/ZDR project, covered Google project and Cloud Storage for Firebase/GCS,
and selection of a covered scanner. Repository configuration checks are separate
from covered staging/device/deletion verification.

- [ ] Follow the canonical contract in `lib/spartan-ai-tools/src/clinical-runtime-contract.js` and the [production runbook](ai-tools-production-runbook.md); no auto-PHI mode.
- [ ] Explicit activation: `HIPAA_PHI_ENABLED=true`, `CLINICAL_OPERATION_MODE=phi`, `CLINICAL_PATIENT_REVIEW_ENABLED=true`.
- [ ] OpenAI: `OPENAI_BAA_CONFIRMED=true`, `OPENAI_RETENTION_MODE=zdr`, `OPENAI_HIPAA_RETENTION_CONFIRMED=true`, usable `OPENAI_API_KEY`. The old Modified Retention flag is insufficient.
- [ ] Google/storage/scanner: `GOOGLE_CLOUD_BAA_CONFIRMED=true`, `PHI_STORAGE_BAA_CONFIRMED=true`, `CLINICAL_SCANNER_BAA_CONFIRMED=true`.
- [ ] Runtime: `DATABASE_URL`, `AI_TOOL_ENCRYPTION_KEY`, `CLINICAL_EPHEMERAL_GCS_BUCKET`, `CLINICAL_FILE_SCANNER_URL`, required `CLINICAL_FILE_SCANNER_TOKEN`.
- [ ] Offline: `node scripts/verify-clinical-production-env.mjs --require-phi` exits 0; missing any required control must fail.
- [ ] Health: `/api/healthz/clinical` and its alias report actual readiness and missing control names, with patient acceptance false when unavailable.
- [ ] Verify explicit tenant `canReview`, active membership, feature entitlement and recent MFA. Platform/clinical admin alone must be denied patient review.
- [ ] Verify ephemeral bucket protections, authenticated scanner, `store:false`, synthetic finalize/cancel/failure purge and covered deployment leak checks.
- [ ] Use canonical numbered SQL migrations for separately authorized deployment; never Drizzle push. This correction adds no migration.
- [ ] Independently verify the existing current CMS MCD snapshot required by patient review; an educational seed is not valid patient-review evidence.
