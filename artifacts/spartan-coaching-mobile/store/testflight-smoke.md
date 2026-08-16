# TestFlight smoke — elite Hospice Sales Pro (I0–I8)

Run on a **physical iPhone** after each TestFlight build. Demo account with entitlement preferred.

**Build / commit under test:** _______________  
**Date / tester:** _______________

## Pre-flight (API + same host as website)

From a laptop (not the phone):

```bash
node scripts/ship-check.mjs https://spartanhospicecoaching.com
# with seat:
PARITY_EMAIL=… PARITY_PASSWORD=… node scripts/ship-check.mjs https://spartanhospicecoaching.com
```

- [ ] `ship-check` health + public parity green  
- [ ] Optional: auth parity green for the **same email** you will use on TestFlight  
- [ ] EAS env: `EXPO_PUBLIC_API_URL` + `EXPO_PUBLIC_DOMAIN` → production host  
- [ ] Demo user: login works; `fieldKit.allowed` true when testing entitled paths  
- [ ] Second user or signed-out state available for dual-door Home  

## Shell A — Logged out

- [ ] Logged-out Today makes Hospice Sales Pro primary and keeps human consulting easy to find
- [ ] Book strategy call / Client login / See what’s inside work  
- [ ] Tools shows paywall + catalog browse (no crash)  

## Shell B — Authenticated locked

- [ ] After login without entitlement: Today directs the member to native Apple membership choices
- [ ] PaywallCard → Account  
- [ ] Account shows localized Standard and Elite StoreKit prices and the native Apple purchase disclosure

## Shell C — Entitled Home

- [ ] **One** emphasis “Next action” card  
- [ ] Today chips: Command · Objections · Weekly  
- [ ] Mission CTA matches product language (Command / checklist)  

## Command hub

- [ ] Command tab is a **hub** (not silent dump into a form only)  
- [ ] Empty day: guided “Schedule first visit”  
- [ ] With data: next visit card → full workflow  
- [ ] Prep shortcuts open tools  

## Tools (I3)

- [ ] Tools tab is **catalog only** + filter  
- [ ] Command hero opens Command Center / workflow  
- [ ] Tap Objections → `/tool/objection` (ToolShell, back to Tools)  
- [ ] Sticky **Generate** in thumb zone  
- [ ] Objection: generate → result; draft survives leave/return  
- [ ] Airplane mode after a successful generate: last result still visible (cache)  
- [ ] Legacy deep link: open app to tools with `tab=objection` still lands on tool (if testable)  

## Learn (I4)

- [ ] Tabs: Articles · Podcasts · **Resources** (not “Knowledge Base”)  
- [ ] Resources grouped (Visit prep / Week / Onboarding)  
- [ ] “AI Research (Tools)” opens Research tool  
- [ ] PDF open works  

## Web tools (I5)

- [ ] Web tool shows **WEB TOOL** badge  
- [ ] Loading overlay then content  
- [ ] Retry / Open in Safari present  
- [ ] Advanced library from Tools + Account  

## Activation (I6)

- [ ] Apple purchase completes only after server verification and access refreshes automatically
- [ ] **You’re in** ceremony once → Open Command Center  
- [ ] Ceremony does not loop on every launch  

## Account (Phase 4 theater)

- [ ] Status chip / label matches org (evaluation / active / ended / suspended)  
- [ ] Value receipt card shows highlights or honest empty state  
- [ ] Locked/expired/trial: paywall benefits + “restore = sign in” copy  
- [ ] Org admin: designed **website handoff** card (not a broken half-admin)  
- [ ] Sign out returns to logged-out Home  
- [ ] No crash on billing portal if Stripe configured  
- [ ] Cross-check web `/account`: same seat language  

## Feel (required for craft sign-off)

Also complete **`store/testflight-feel-checklist.md`** (principles F1–F29).

## Retention (I8)

- [ ] Fail a generate offline → banner “queued offline”; retry after signal  
- [ ] Schedule reminder on Objection → when it fires, tap opens Objection tool  
- [ ] Deep link: `spartan-coaching-mobile://command` opens Command hub  
- [ ] Director role: Home chips include Staffing; Command prep shows leader math  
- [ ] Long-press app icon: quick actions show Command / Objection / Tools (native build)  

## Failures — capture

| Issue | Screen | Notes |
|-------|--------|-------|
| | | |

## Pass

All critical shells A/B/C + Tools objection path + Command hub green → safe to invite internal testers.
