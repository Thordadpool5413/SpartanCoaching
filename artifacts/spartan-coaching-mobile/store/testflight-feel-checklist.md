# TestFlight **feel** checklist (craft Phase 5)

Use with `testflight-smoke.md` (functional). This sheet grades **premium feel** against product-craft principles.

**Build / commit:** _______________  
**Device:** _______________  
**Tester:** _______________ · **Date:** _______________  
**Seat email:** _______________ (same as `smoke-parity-auth`)

Score each row: **Pass / Fail / N/A**. Failures block “subscription-grade craft” claims.

---

## Pre-flight (laptop)

```bash
pnpm run release-gate:live -- https://spartanhospicecoaching.com
# with real seat:
PARITY_EMAIL=… PARITY_PASSWORD=… pnpm run release-gate:live -- https://spartanhospicecoaching.com
```

| # | Check | Score |
|---|--------|-------|
| P0 | live_health + live_parity PASS | |
| P0b | live_auth PASS for TestFlight seat | |
| P0c | EAS `EXPO_PUBLIC_API_URL` = production host | |

---

## P1 — One next action

| # | Check | Score |
|---|--------|-------|
| F1 | Entitled Home: **only one** red-rail / emphasis mission card above fold | |
| F2 | Activation (if incomplete) **replaces** checklist as primary — not side-by-side heroes | |
| F3 | Checklist / coach live under secondary (“Session checklist” / “More”) | |
| F4 | Portal web: mission card title matches product language (“Next action”) | |

## P2 — Field conditions

| # | Check | Score |
|---|--------|-------|
| F5 | Primary CTAs ≥ 44pt thumb reach | |
| F6 | Outdoor / bright light: body text readable (dark product) | |
| F7 | One-hand scroll: mission CTA visible without hunting | |

## P3 — Product grammar

| # | Check | Score |
|---|--------|-------|
| F8 | Language uses Mission → Command → Tool → Result → Account | |
| F9 | Command tab feels like hub for **today**, not a form dump | |
| F10 | Tools: Command spine first; Prepare / Practice groups (web) | |

## P4 — Subscription honesty

| # | Check | Score |
|---|--------|-------|
| F11 | Locked Home: Paywall shows benefits + price + restore = sign-in | |
| F12 | Account: StatusChip / entitlement shell matches org status | |
| F13 | Trial shows time remaining + continue path | |
| F14 | Expired / suspended: clear recovery (subscribe or manage billing) | |
| F15 | Account **Value receipt** loads (or honest empty state) | |
| F16 | Web Account EntitlementSuite + ValueReceipt present | |

## P5 — Visual restraint

| # | Check | Score |
|---|--------|-------|
| F17 | No emoji icons in product chrome | |
| F18 | Spartan red only on primary CTAs / sparse emphasis | |
| F19 | Light mode (if toggled) still readable | |

## P6 — Finish states

| # | Check | Score |
|---|--------|-------|
| F20 | Objection generate → result with copy/share path | |
| F21 | Loading labeled (not blank hang) | |
| F22 | Offline fail shows queue/banner (not silent fail) | |

## P7 — Connected product

| # | Check | Score |
|---|--------|-------|
| F23 | Same email: Account status matches web `/account` | |
| F24 | After web Stripe checkout → return to app → entitlement refreshes | |
| F25 | Org admin: designed web handoff card (not broken stub) | |

## P8–P10 — Trust, motion, proof

| # | Check | Score |
|---|--------|-------|
| F26 | No PHI claims; “Do not enter PHI” visible where relevant | |
| F27 | Reduce Motion: no jarring haptics spam (spot check) | |
| F28 | 60s day-in-the-life video recorded (see `docs/product-craft/15-day-in-the-life-script.md`) | |
| F29 | Screenshots captured per elite shot list (not legacy checklist PNGs) | |

---

## Result

| Critical fails (F1–F4, F11–F16, F23–F24) | Count: ___ |
|------------------------------------------|------------|
| Overall | ☐ Pass for internal beta · ☐ Fail — rework · ☐ Pass for ASC screenshot pack only |

**Sign-off:** _______________  

Does **not** equal App Store approval or `productionReadyClaimAllowed: true` until external ASC/IAP review also complete.
