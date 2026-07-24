# Field Kit smoke test (Replit)

Run after `git pull` and a deploy. Use a real inbox you control.

## 0. Prep

- [ ] `ADMIN_PASSWORD` set in Secrets (8+ chars recommended)
- [ ] `RESEND_API_KEY` (or connector) + `NOTIFICATION_EMAIL` work
- [ ] `SITE_URL` matches the live HTTPS origin (set-password links depend on this)
- [ ] Optional: `CRON_SECRET` for external cron

## 1. Public path

- [ ] Open `/` — intro or home loads
- [ ] `/request-access` — submit **individual** request
- [ ] Confirmation email received (“we received your request”)
- [ ] Nick alert email received (Access Desk link → `/admin/access-desk`)

## 2. Access Desk

- [ ] Open `/admin/access-desk` (faster than full `/admin`)
- [ ] Unlock with admin password (or already signed in as platform admin)
- [ ] Pending request visible
- [ ] **Approve 24h** — toast shows email sent (or email issue if Resend fails)
- [ ] Set-password email arrives with working link

## 3. Evaluation client

- [ ] Set password → lands on `/portal`
- [ ] First-session: pick role → open tool → debrief CTA
- [ ] Run one AI tool (objections) — no 401/403
- [ ] **Role-play:** start a scenario → send 2 messages → end session for feedback (must not 410)
- [ ] Checklist toggle saves (objection / roleplay when tools complete)
- [ ] Account page shows evaluation status + time remaining

## 4. Reject path (second request or different email)

- [ ] Submit another request
- [ ] Reject with a template note
- [ ] Rejection email arrives

## 5. Ops jobs

- [ ] Access Desk → **Run trial sweep** (no error)
- [ ] **Email ops digest now** — arrives at NOTIFICATION_EMAIL
- [ ] **Clean expired sessions** — completes

## 5a. Apple reviewer reset (pre-submission check)

- [ ] Access Desk → click **Reset Apple Reviewer Password**
- [ ] Dialog opens showing non-empty **Email** (`apple-reviewer@spartanhospicecoaching.com`) and **Password**
- [ ] Copy both and paste into App Store Connect → App Review Information → Sign-in required

Or run the smoke script (requires `ADMIN_PASSWORD` env var):

```bash
ADMIN_PASSWORD=<your-password> SITE_URL=http://localhost:80 \
  pnpm --filter @workspace/scripts run smoke:reviewer-reset
```

Expected: `3 passed, 0 failed`

## 6. Activation

- [ ] Org detail → **Activate client**
- [ ] Membership-active email to member(s)
- [ ] Tools still unlocked; status Active on Account

## 7. Optional API checks

```bash
# Health
curl -sS "$SITE_URL/api/health"

# Cron (if CRON_SECRET set)
curl -sS -X POST "$SITE_URL/api/cron/jobs" \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -d '{}'
```

## Auth unit tests (local / CI)

```bash
pnpm --filter @workspace/api-server run test
```

## Pass criteria

All boxes checked, no silent email failures, tools gated correctly for logged-out users.
