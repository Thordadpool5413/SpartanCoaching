# TestFlight smoke — elite Hospice Sales Pro (I0–I6)

Run on a **physical iPhone** after each TestFlight build. Demo account with entitlement preferred.

**Build / commit under test:** _______________  
**Date / tester:** _______________

## Pre-flight

- [ ] Production API: `https://spartanhospicecoaching.com` (or current host) healthy  
- [ ] EAS env: `EXPO_PUBLIC_API_URL` + `EXPO_PUBLIC_DOMAIN` set for production  
- [ ] Demo user: login works; `fieldKit.allowed` true when testing entitled paths  
- [ ] Second user or signed-out state available for dual-door Home  

## Shell A — Logged out

- [ ] Home shows **two doors**: Consulting · Hospice Sales Pro (not a long website scroll)  
- [ ] Book strategy call / Client login / See what’s inside work  
- [ ] Tools shows paywall + catalog browse (no crash)  

## Shell B — Authenticated locked

- [ ] After login without entitlement: Home is **restore / subscribe**, not dual doors  
- [ ] PaywallCard → Account  
- [ ] Account Day Zero / Subscribe opens Stripe (or clear error if billing off)  

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

- [ ] Subscribe → Safari → return → access refreshes (may take webhook seconds)  
- [ ] **You’re in** ceremony once → Open Command Center  
- [ ] Ceremony does not loop on every launch  

## Account

- [ ] Status Unlocked / Locked correct  
- [ ] Sign out returns to logged-out Home  
- [ ] No crash on billing portal if Stripe configured  

## Failures — capture

| Issue | Screen | Notes |
|-------|--------|-------|
| | | |

## Pass

All critical shells A/B/C + Tools objection path + Command hub green → safe to invite internal testers.
