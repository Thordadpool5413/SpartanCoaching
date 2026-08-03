# Production verification checklist

**Required after every design or product UI release** that should be visible on the live site or app.

Canonical product host: **https://spartanhospicecoaching.com**  
(Do not verify against parking/redirect-only domains.)

## Web (spartanhospicecoaching.com)

```
[ ] git rev-parse origin/main matches expected SHA (release commit)
[ ] Replit / host has pulled origin/main and redeployed (or OTA equivalent)
[ ] Live HTML or main JS bundle contains an expected marker from the release
    (e.g. unique class, copy string, or commit comment in built assets)
[ ] Hard refresh (or empty cache) on https://spartanhospicecoaching.com
[ ] Spot-check: Home hero thesis + CTAs visible above the fold
[ ] Spot-check: Appearance → Soft White (light) — body text readable, no white-on-white
[ ] Spot-check: Hospice Sales Pro access paths (Path A / Path B) if that release shipped
[ ] Spot-check: dual product — Consulting + Hospice Sales Pro (no public “Field Kit” or generic “Membership” product name)
[ ] Spot-check: /hospice-sales-pro lander; /membership and /field-kit redirect there
[ ] Spot-check: header brand spacing; no nav collision at 390px and 1280px
```

### Dual-product release markers (after R1–R3 rebrand)

```
[ ] index.html / view-source: title or description mentions Hospice Sales Pro / Consulting (not “Private Field Kit”)
[ ] Home dual doors or “Two clear offers”
[ ] Nav: Hospice Sales Pro (not Field Kit, not generic Membership as product label)
```

### Quick live marker check

```bash
# From a machine with network access:
git rev-parse origin/main
curl -sL "https://spartanhospicecoaching.com" | head -c 2500
# After Replit Publish, meta should lead with Consulting / Hospice Sales Pro — not Field Kit or generic Membership product.
```

**Replit how-to for this release:** `docs/replit-publish.md`

## iOS / mobile

```
[ ] Note iOS build number / EAS update ID if mobile native or JS bundle changed
[ ] TestFlight or Expo Go: logged-out home is short (Book call + Login), not a website scroll
[ ] Role-play scenarios use Feather icons — no emoji chrome
[ ] SF system type on device (not forced Inter) when running on iPhone
```

## Elite UI/UX matrix (Phases 5–6)

Check after design releases that touch Home, Hospice Sales Pro, Tools, Portal, or iOS.
Phase 6 = ship readiness (residual product nouns + ops docs). **Redeploy still required for live.**

```
[ ] Dual offer named: Consulting + Hospice Sales Pro (not Field Kit, not generic Membership product)
[ ] Home dual doors list real features; ≤2 primary CTAs in closing
[ ] /hospice-sales-pro: product map (Command spine) above pricing
[ ] /tools: Command hero; quieter satellite cards
[ ] /portal: next action first; checklist collapsible; no warehouse of equal categories
[ ] Light mode Soft White: body readable, no white-on-white on marketing
[ ] Dark midnight: primary red readable; focus rings visible
[ ] Widths: 375 · 390 · 768 · 1024 · 1280 (header brand no collision)
[ ] iOS logged-out: Book call + Hospice Sales Pro; logged-in: mission + Command
[ ] Touch targets ≥44px on primary CTAs (mobile)
```

## Sign-off

| Field | Value |
|-------|--------|
| Expected SHA | |
| Live verified at (UTC) | |
| Verified by | |
| Notes | |

## Related

- Operator secrets / smoke: `docs/operator-checklist.md`
- Membership smoke: `scripts/smoke-membership.md`
- Design tokens: `design-system/spartan-coaching/MASTER.md`
