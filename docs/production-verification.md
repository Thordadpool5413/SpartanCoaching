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
[ ] Spot-check: Field Kit access paths (Path A / Path B) if that release shipped
[ ] Spot-check: header brand spacing; no nav collision at 390px and 1280px
```

### Quick live marker check

```bash
# From a machine with network access:
git rev-parse origin/main
curl -sL "https://spartanhospicecoaching.com" | head -c 2000
# Search built assets for a known string from the release when HTML is a shell SPA.
```

## iOS / mobile

```
[ ] Note iOS build number / EAS update ID if mobile native or JS bundle changed
[ ] TestFlight or Expo Go: logged-out home is short (Book call + Login), not a website scroll
[ ] Role-play scenarios use Feather icons — no emoji chrome
[ ] SF system type on device (not forced Inter) when running on iPhone
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
- Field Kit smoke: `scripts/smoke-field-kit.md`
- Design tokens: `design-system/spartan-coaching/MASTER.md`
