# TestFlight smoke for the complete Spartan Coaching iPhone experience

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
- [ ] Second user or signed out state available for public Home
- [ ] Microsoft Bookings URL is configured if exact in app scheduling is part of this build

## Public Home

- [ ] Home immediately explains what Spartan Coaching does
- [ ] Plan the conversation opens the guided experience
- [ ] Practice with Spartan Coach opens the Elite explanation
- [ ] Standard and Elite can be compared before account creation
- [ ] Apple purchase begins without requiring an account first
- [ ] Human consulting is visible and clearly separate from the subscription

## Signed in without membership

- [ ] Home recognizes the signed in member and does not ask the member to sign in again
- [ ] Coach explains Elite and opens membership choices
- [ ] Explore shows the capability map without pretending locked actions are available
- [ ] Account shows localized Standard and Elite StoreKit prices and the native Apple purchase disclosure

## Entitled Home

- [ ] Header shows the transparent helmet and Spartan Coaching identity
- [ ] Home offers Plan, Practice, and Explore as distinct starting choices
- [ ] Current commitment opens Coach for Elite or the weekly plan for Standard
- [ ] A member who also leads a team sees leadership context without different navigation
- [ ] No screen feels like a CRM dashboard

## Coach

- [ ] The tab icon is the complete transparent red helmet with no black tile or crop
- [ ] The header says Coach and keeps History and Settings discoverable
- [ ] Prepare, Rehearse, and Commit work by text
- [ ] Voice recording and transcription work in the preview build
- [ ] Raw conversation privacy and 90 day expiration are visible
- [ ] Saving a commitment updates Home and My Work

## Explore

- [ ] Explore is a separate tab and clearly contains every tool and resource destination
- [ ] Library, My Work, and the access map open natively
- [ ] Search finds both local tools and server content
- [ ] Every catalog tool opens its native route
- [ ] Objection output is readable, clearly suggested, and includes required approval language
- [ ] A saved nonclinical result remains visible after leaving and returning
- [ ] Offline retry state is understandable and does not discard the draft

## Library

- [ ] Search and Read, Listen, Use controls are immediately understandable
- [ ] Articles open as native text without website chrome
- [ ] Only playable audio episodes are presented as available
- [ ] Resources show when to use, why it matters, expected outcome, and version before opening the document
- [ ] Resource documents open inside the app and never expose a website 404 page
- [ ] Text articles and eligible resources can be downloaded and reopened in airplane mode
- [ ] Spartan Method, Drills, Quiz, and Manifesto open natively

## My Work

- [ ] Current commitment is visible with the correct privacy language
- [ ] Weekly plan and conversation plans reopen correctly
- [ ] Elite outputs are visible only to an Elite member
- [ ] Downloaded Library items reopen without a connection

## Activation (I6)

- [ ] Apple purchase completes only after server verification and access refreshes automatically
- [ ] The activation ceremony appears once and opens Home
- [ ] Ceremony does not loop on every launch  

## Account (Phase 4 theater)

- [ ] Status chip / label matches org (evaluation / active / ended / suspended)  
- [ ] Value receipt card shows highlights or honest empty state  
- [ ] Locked or expired access shows honest membership and restore language
- [ ] Personal role and optional team leadership setting save correctly
- [ ] Company administrator opens the native Admin hub
- [ ] Admin can manage seats but cannot see prompts, drafts, recordings, transcripts, or unshared outputs
- [ ] Consulting intake submits inside the app
- [ ] Microsoft Bookings opens inside the app when configured
- [ ] Sign out returns to public Home
- [ ] Light, Dark, and System appearance all update the entire app

## Feel (required for craft sign-off)

Also complete **`store/testflight-feel-checklist.md`** (principles F1–F29).

## Retention (I8)

- [ ] Fail a generate offline → banner “queued offline”; retry after signal  
- [ ] Schedule reminder on Objection → when it fires, tap opens Objection tool  
- [ ] Deep link `spartan-coaching-mobile://explore` opens Explore
- [ ] Deep link `spartan-coaching-mobile://my-work` opens My Work
- [ ] Long press app icon shows Field Guide, Spartan Coach, and Explore

## Failures — capture

| Issue | Screen | Notes |
|-------|--------|-------|
| | | |

## Pass

Every section above must pass before inviting internal testers.
