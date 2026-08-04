# App Store screenshot shot list — elite Hospice Sales Pro

**Goal:** Show *jobs*, not a feature soup. Every frame should answer “what do I do next?”  
**Brand:** Midnight navy + Spartan red. No cyan SaaS. No equal grid of 12 tools.  
**Sizes:** Capture once at **6.9"** (1320×2868) and scale/export for **6.7"** as needed.

---

## Required sequence (5 frames)

| # | File name | Screen / state | Caption (optional ASC overlay) | Pass if |
|---|-----------|----------------|--------------------------------|---------|
| 01 | `01-home-mission.png` | Entitled **Home** — one emphasis “Next action” card + quiet today chips | “One next action” | ≤1 red-rail card; dual-offer **not** shown |
| 02 | `02-command-hub.png` | **Command** hub — next visit or empty “Schedule first visit” | “Command Center” | Hub, not a raw form dump |
| 03 | `03-tools-catalog.png` | **Tools** catalog — Command hero + Practice/Prepare list | “Find a tool in seconds” | Catalog only; filter bar OK |
| 04 | `04-objection-result.png` | **Objection Handler** after Generate — talk track visible + sticky CTA area | “Handle ‘not ready’ fast” | 3-tap story: Tools → Objections → Generate |
| 05 | `05-dual-doors.png` | **Logged-out Home** — Consulting \| Hospice Sales Pro dual doors | “Two clear offers” | Not a long marketing scroll |

Optional extras (if ASC allows more):
- `06-learn-resources.png` — Resources tab with Visit prep / Week groups  
- `07-activation.png` — “You’re in” ceremony (can be staging-only; don’t leak demo PHI)

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
