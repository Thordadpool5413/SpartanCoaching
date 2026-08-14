# App Store screenshot shot list — elite Hospice Sales Pro

**Goal:** Show *jobs*, not a feature soup. Every frame should answer “what do I do next?”  
**Brand:** Midnight navy + Spartan red. No cyan SaaS. No equal grid of 12 tools.  
**Sizes:** Capture once at **6.9"** (1320×2868) and scale/export for **6.7"** as needed.

---

## Required sequence (5 frames) — craft Phase 5

Capture on **current craft UI** (mission purity + paywall suite). Do **not** reuse legacy `01-checklist.png` style frames.

| # | File name | Screen / state | Caption (optional ASC overlay) | Pass if |
|---|-----------|----------------|--------------------------------|---------|
| 01 | `01-home-mission.png` | Entitled **Home** — single `MissionCard` + EntitlementBanner + quiet chips | “One next action” | Exactly one emphasis mission; checklist collapsed |
| 02 | `02-command-hub.png` | **Command** hub — next visit or empty “Schedule first visit” | “Command Center” | Hub, not a raw form dump |
| 03 | `03-tools-catalog.png` | **Tools** catalog — Command spine + job groups (web) or native catalog | “Prepare · Practice” | Not equal 12-tile soup |
| 04 | `04-objection-result.png` | **Objection Handler** after Generate — talk track + sticky CTA | “Handle ‘not ready’ fast” | 3-tap: Tools → Objections → Generate |
| 05 | `05-account-seat.png` | **Account** — StatusChip + Value receipt (or locked Paywall benefits) | “Same seat as web” | Restore = sign-in copy visible if locked |

Optional extras:
- `06-dual-doors.png` — Logged-out Home dual doors  
- `07-learn-resources.png` — Learn Resources groups  
- `08-paywall-locked.png` — Authenticated locked paywall suite  

### Retire legacy frames

Folder may still contain old `01-checklist.png` / `02-scenario-coach.png` etc.  
**For ASC upload use only elite frames above** after re-capture on current build.

---

## Capture rules

1. Use a **demo account** with `fieldKit.allowed` — fake facility names only, **no PHI**.  
2. Objection sample text: *“We’re not ready for hospice yet — the family wants to keep trying.”*  
3. Prefer **real device or simulator** at final UI (post I0–I6), not old PNGs named checklist/drills.  
4. Status bar: clean (full battery, full signal) or hide via simulator.  
5. Tab bar visible on Home / Command / Tools / Learn shots.  
6. Do **not** screenshot clinical vault or PHI workflows for public listing.

### Simulator (macOS)

```bash
# From artifacts/spartan-coaching-mobile after login as demo user
# Manually navigate, then:
xcrun simctl io booted screenshot store/screenshots/01-home-mission.png
```

Or use `store/capture-screenshots.sh` after updating routes (see script header).

### App Store Connect captions (short)

1. One next action every day  
2. Command Center for the field  
3. Tools map — Command first  
4. Objection answers in seconds  
5. Consulting or Hospice Sales Pro  

---

## Preview video (15–30s) — script

| Sec | Visual | VO / text |
|-----|--------|-----------|
| 0–3 | Dual doors (logged out) | “Spartan Coaching — two clear offers.” |
| 3–8 | Home mission card | “When you’re in, one next action.” |
| 8–14 | Tools → Objections → paste → Generate | “Handle the hard line before the visit.” |
| 14–20 | Command hub | “Run the day from Command Center.” |
| 20–25 | Logo + $14.99/wk · cancel anytime | “Hospice Sales Pro. No PHI in tools.” |

Export 1080×1920 or App Store Connect recommended portrait. No patient data.

---

## Replace legacy assets

Delete or archive outdated names when new captures land:

- `01-checklist.png` → prefer `01-home-mission.png`  
- `02-scenario-coach.png` → role-play is secondary; use objection for public heat  
- `03-branch-calculator.png` → leaders-only; not primary store story  
- `04-drills.png` → covered by objection  
- `05-login.png` → dual doors stronger  

Keep 6.7/ copies in sync after re-export.
