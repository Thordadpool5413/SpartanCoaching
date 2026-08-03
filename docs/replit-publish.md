# Replit publish — dual product release (Consulting + Membership)

GitHub `main` already has the dual-product rebrand. **Live visitors still see old “Field Kit” until Replit pulls and redeploys.**

**Release SHA (as of this doc):** check with `git rev-parse origin/main`  
**Canonical host:** https://spartanhospicecoaching.com

---

## Why live lags

Code is on GitHub. Production only updates when Replit:

1. Fetches `origin/main`, and  
2. Rebuilds / **Publishes** (or Redeploys) the app.

A shell `git pull` without Publish can leave the old JS bundle online.

---

## A. In Replit (do this once per release)

```
[ ] Open the SpartanCoaching Replit project that serves spartanhospicecoaching.com
[ ] Shell: git fetch origin && git checkout main && git pull origin main
[ ] Confirm: git rev-parse HEAD matches origin/main (same SHA as GitHub)
[ ] If schema changed recently: pnpm --filter @workspace/db run push
[ ] Publish / Redeploy / Deploy (use the same control you used last time “Published your App”)
[ ] Wait until deploy status is healthy (no stuck build)
```

### Optional health

```bash
# From any machine after deploy
curl -sS "https://spartanhospicecoaching.com/api/health"
node scripts/smoke-health.mjs https://spartanhospicecoaching.com
```

---

## B. Prove the new brand is live (5 minutes)

Hard refresh or private window on https://spartanhospicecoaching.com

```
[ ] View source (or curl) on / — meta description mentions Hospice Sales Pro / Consulting, NOT “Private Field Kit”
[ ] Home: dual doors — Consulting + Membership (or “Two clear offers”)
[ ] Nav: Consulting · Membership · Learn (no top-level “Field Kit”)
[ ] /membership loads Hospice Sales Pro lander ($14.99/week)
[ ] /field-kit redirects to /membership (or briefly “Redirecting…”)
[ ] /tools kicker says Hospice Sales Pro (or Membership tools)
[ ] Footer: Consulting · Membership — not “Private Field Kit”
[ ] FAQ section titled Hospice Sales Pro (or membership access)
```

### Copy markers (search live HTML or built JS)

| Should appear | Should not appear (public UI) |
|---------------|-------------------------------|
| `Hospice Sales Pro` | `Private Field Kit` (hero/nav/footer) |
| `Two clear offers` or dual door CTAs | `Open Field Kit` as primary CTA |
| `/membership` | Primary CTAs to `/field-kit-membership` only |

```bash
curl -sL "https://spartanhospicecoaching.com/" | findstr /i "Field Kit Membership Consulting"
# Prefer Membership / Consulting in title+description after publish.
```

---

## C. Product smoke (membership)

After publish, run **`scripts/smoke-membership.md`** on the live host (request access → portal → one tool).

Short path if time is tight:

```
[ ] /register → account → Day Zero / subscribe copy uses Membership language
[ ] Logged-out tool preview shows membership lock, not “Field Kit”
[ ] /portal when entitled shows Portal · Membership (not Field Kit board)
```

---

## D. Sign-off

| Field | Value |
|-------|--------|
| Expected SHA | `git rev-parse origin/main` |
| Live verified at (UTC) | |
| Verified by | |
| Notes | |

Also complete `docs/production-verification.md` for the full UI checklist.

---

## Related

- Membership smoke: `scripts/smoke-membership.md`
- Operator secrets / Stripe: `docs/operator-checklist.md`
- Billing email smoke: `docs/smoke-test-billing-email.md`
