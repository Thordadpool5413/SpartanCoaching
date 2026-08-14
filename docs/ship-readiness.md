# Ship readiness — Website + Hospice Sales Pro iOS

**Goal:** Production web and TestFlight/App Store iOS are the same product, same API, same seat model.

**Canonical host:** `https://spartanhospicecoaching.com`  
**GitHub tip:** `git rev-parse origin/main`

---

## Stack of automated proof

Run from repo root after every Replit Publish:

```bash
# 1. Health (Stripe webhook, billing email, clinical soft, public shells)
node scripts/smoke-health.mjs https://spartanhospicecoaching.com

# 2. Public web ↔ mobile contracts (no login)
node scripts/smoke-parity.mjs https://spartanhospicecoaching.com

# 3. Same seat as iOS Bearer (requires real credentials)
SITE_URL=https://spartanhospicecoaching.com \
PARITY_EMAIL=you@example.com \
PARITY_PASSWORD='…' \
node scripts/smoke-parity-auth.mjs

# Or one command:
node scripts/ship-check.mjs https://spartanhospicecoaching.com
# Auth optional via PARITY_EMAIL / PARITY_PASSWORD

# Live release-gate stack only (health + parity + optional auth; skips unit suites):
pnpm run release-gate:live -- https://spartanhospicecoaching.com
# Full automated + live when SITE_URL set:
node scripts/release-gate.mjs https://spartanhospicecoaching.com
```

| Script | Proves |
|--------|--------|
| `smoke-health` | API up, billing monitors, SPA shells |
| `smoke-parity` | Learn feeds + field-kit gates 401/403 + org_admin unauth gates + HSP brand HTML |
| `smoke-parity-auth` | Login, me, checklist, billing, Command today, tools, logout |
| `ship-check` | Runs health + public parity (+ auth if env set) |
| `release-gate:live` | Same live stack as ship-check via HSP-48 evidence report (`productionReadyClaimAllowed: false`) |

---

## A. Website (Replit Autoscale)

```
[ ] git fetch origin && git reset --hard origin/main && git clean -fd
[ ] git rev-parse HEAD matches origin/main
[ ] pnpm install --frozen-lockfile
[ ] pnpm db:migrate   # required after schema PRs — see docs/schema-ops.md (not drizzle push)
[ ] Publish / Redeploy
[ ] ship-check (health + parity) green
[ ] Hard refresh home: Consulting + Hospice Sales Pro (not Field Kit)
```

Details: `docs/replit-publish.md`, `docs/production-verification.md`, `docs/schema-ops.md`

---

## B. iOS / TestFlight

```
[ ] EAS production env: EXPO_PUBLIC_API_URL=https://spartanhospicecoaching.com
[ ] EAS production env: EXPO_PUBLIC_DOMAIN=spartanhospicecoaching.com
[ ] pnpm --filter @workspace/spartan-coaching-mobile run build:ios:testflight
[ ] Submit to ASC (Expo Submit or dashboard) — Apple agreements / API key must be valid
[ ] Internal TestFlight install on physical iPhone
[ ] Run store/testflight-smoke.md (shells A/B/C + Tools + Command + Account + I8)
[ ] Run store/testflight-feel-checklist.md (craft principles F1–F29)
[ ] Same email as smoke-parity-auth: Account status matches web /account
[ ] Optional: 60s day-in-the-life video (docs/product-craft/15-day-in-the-life-script.md)
```

Details: `artifacts/spartan-coaching-mobile/store/README.md`, `docs/product-craft/14-phase5-harden-pack.md`

---

## C. Cross-surface (one seat)

```
[ ] smoke-parity-auth PASS for the demo seat
[ ] Web: login → /portal → one objection or Command action
[ ] iOS: login → Home mission → same tool or Command
[ ] Checklist: tick on one surface → refresh other → progress matches
[ ] Subscribe path (personal): Stripe → return → both surfaces unlock after webhook
```

---

## D. App Store listing (public release)

```
[ ] Store copy: store/description.txt, keywords, promotional (Hospice Sales Pro)
[ ] Screenshots: store/screenshot-shot-list.md (elite 5-frame story — not legacy checklist PNGs)
[ ] Privacy nutrition labels / no PHI claims
[ ] App Review notes: demo login (Access Desk Apple reviewer reset if needed)
[ ] Production EAS build + submit
```

---

## Sign-off

| Field | Value |
|-------|--------|
| origin/main SHA | |
| Live health + parity | pass / fail |
| Auth parity seat | email + pass / fail |
| TestFlight build # | |
| Web UI checked | yes / no |
| iOS UI checked | yes / no |
| Ready for external testers | yes / no |

## Related

- `docs/mobile-web-parity.md` — architecture + checklists  
- `docs/operator-checklist.md` — secrets, billing, clinical  
- `scripts/smoke-membership.md` — full web membership funnel  
