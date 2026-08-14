# Phase 5 — Harden pack

**Goal:** Prove craft on device and prepare store materials.  
**Code cannot complete Phase 5 alone** — human TestFlight + capture required.

## Operator sequence

1. Merge craft PR to `main` (when ready).  
2. Replit: `git reset --hard origin/main` → migrate if needed → **Publish** (UI).  
3. Laptop:
   ```bash
   pnpm run release-gate:live -- https://spartanhospicecoaching.com
   PARITY_EMAIL=… PARITY_PASSWORD=… pnpm run release-gate:live -- https://spartanhospicecoaching.com
   ```
4. EAS TestFlight build with production `EXPO_PUBLIC_API_URL`.  
5. Physical iPhone:
   - `store/testflight-smoke.md` (functional)  
   - `store/testflight-feel-checklist.md` (craft)  
6. Capture screenshots: `store/screenshot-shot-list.md`  
7. Record 60s video: `15-day-in-the-life-script.md`  
8. Update `07-premium-definition-of-done.md` checkboxes with evidence links/dates  

## Artifacts in this phase

| File | Purpose |
|------|---------|
| `store/testflight-feel-checklist.md` | Feel / principles pass-fail |
| `store/testflight-smoke.md` | Functional shells (updated) |
| `store/screenshot-shot-list.md` | Elite 5 frames |
| `15-day-in-the-life-script.md` | Video shot list |
| `07-premium-definition-of-done.md` | Binary DoD |

## Explicit non-claims

Until DoD is fully checked by a human:

- Do not market “$500k polish”  
- Do not set `productionReadyClaimAllowed` true  
- Do not submit ASC without IAP/external purchase review note  
