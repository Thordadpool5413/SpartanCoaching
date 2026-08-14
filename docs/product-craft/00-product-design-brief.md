# Product Design Brief — Hospice Sales Pro

**Version:** 1.1 · 2026-08-14

## Product statement

**Hospice Sales Pro** is field command for hospice sales professionals: one next action, Command Center for the day, tools that produce usable talk-tracks, same seat on phone and desktop.

**Spartan Coaching** (consulting) is a separate human offer. Entitled product UI must not read as a marketing brochure.

## Personas

| Persona | Primary surface | Job |
|---------|-----------------|-----|
| Field rep | iOS | What do I do before this visit? |
| Director | Web | Is the team working the plan? |
| Org admin | Web only | Seats, structure, offboard |
| Trial | Both | First win this session |
| Expired | Both | Recover access without shame |

## Goals / non-goals

**Goals:** premium feel on core loops; entitlement clarity; cross-surface grammar; design system discipline.

**Non-goals:** full org admin on iOS; marketing site inside the app; game-like polish; merging tool systems; Android craft v1; localization v1.

## Decision log (working defaults — founder may override)

| ID | Decision | Default | Source |
|----|----------|---------|--------|
| D1 | iOS top jobs | J1 next action, J2 objection, J3 prepare, J5 outcome, J9 seat | Expert + plan G1 default |
| D2 | Billing on iOS | Stripe external + “Subscribe on web”; restore = sign in (no StoreKit yet) | appStoreReadiness + G3 default |
| D3 | Trial primary | Activation next step until complete/skipped, then Command/mission | G2 state machine |
| D4 | Dual mission logic | Home primary CTA from `useMission` only (+ activation folded in) | G4 |
| D5 | iPad / Android | iPhone portrait primary; iPad large phone; Android later | G10 |
| D6 | Daily WebView | Only Call Transcriber remains webview; labeled | Catalog inventory |

## Success metrics

- &lt;3s to next action; ≤2 taps to start  
- smoke-parity-auth green for demo seat  
- Craft events: mission_cta, paywall_view, tool_complete (see `11-analytics-craft-events.md`)  
- Premium DoD in `07-premium-definition-of-done.md`
