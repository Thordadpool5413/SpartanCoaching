# App Store Submission Guide — Spartan Coaching (Hospice Sales Pro)

## HSP-46 readiness (code + external)

In-app checklist: `lib/appStoreReadiness.ts` (privacy URLs, review notes, ASC/EAS actions).
Run: `pnpm --filter @workspace/spartan-coaching-mobile test -- app-store-readiness`

**Implemented in app/backend:** privacy manifest (`app.config.js` → PrivacyInfo.xcprivacy),
permission strings, export compliance flag, in-app account deletion (`POST /api/me/delete-account`),
privacy/terms/trust/support links, client API contract headers for backend compatibility.

**You must still complete in App Store Connect / EAS / hosting:**
- Privacy Policy URL + App Privacy questionnaire (match privacy manifest data types)
- Screenshots, description, keywords, support URL, marketing URL
- Review notes from `APP_REVIEW_NOTES` in `appStoreReadiness.ts`
- Confirm subscription storefront rules (Stripe external vs IAP) for each region
- Host `apple-app-site-association` for universal links
- TestFlight build + smoke on a physical iPhone (`store/testflight-smoke.md`)
- Craft **feel** pass (`store/testflight-feel-checklist.md`) + elite screenshots (`screenshot-shot-list.md`)
- Optional 60s day-in-the-life video (`docs/product-craft/15-day-in-the-life-script.md`)

## Replit vs phone connectivity (read this first)

| Goal | What you need | Metro / “dev server”? |
|------|----------------|------------------------|
| **TestFlight** (App Store build) | EAS `build:ios:testflight` + submit | **No** — ignore “could not connect to development server” |
| Live reload on a phone while coding on Replit | Expo Go + **tunnel** Metro | **Yes** — `pnpm --filter @workspace/spartan-coaching-mobile run dev` (auto-tunnel on Replit) |

Replit is **not** on your phone’s Wi‑Fi. Expo `--lan` will always fail from a real device with the classic Metro error. On Replit the `dev` script forces **tunnel**. Do not chase AppDelegate / same-network fixes for TestFlight.

### Before You Submit

### 1. Verify Expo / EAS account access

Do not assume Replit secrets are available to EAS Build. Verify the active Expo
account and EAS project from this app directory:

```bash
pnpm dlx eas-cli@21.0.2 whoami
pnpm dlx eas-cli@21.0.2 project:info
pnpm dlx eas-cli@21.0.2 env:list --environment production
```

The expected project is `@thordadpool/spartan-coaching`
(`bafdaa6f-80f5-4fb0-baef-324fa376c44c`). Apple credentials are obtained
interactively by EAS and must not be committed or represented by unresolved
`$APPLE_*` placeholders in `eas.json`.

### 1b. Set the production API domain (required before any store build)

The app determines where to send API requests from `EXPO_PUBLIC_API_URL`
(preferred) or `EXPO_PUBLIC_DOMAIN`. These must be project variables in the EAS
`production` environment before a TestFlight or production build.

**Get your production domain:**
Your production Replit deployment domain is listed in the Replit dashboard under the "Deployments" tab, or available as `REPLIT_INTERNAL_APP_DOMAIN` in the deployment environment. It typically looks like `<your-repl>.replit.app` or a custom domain.

**Set it once:**

```bash
pnpm dlx eas-cli@21.0.2 env:create production \
  --scope project \
  --name EXPO_PUBLIC_API_URL \
  --value https://spartanhospicecoaching.com \
  --visibility plaintext

pnpm dlx eas-cli@21.0.2 env:create production \
  --scope project \
  --name EXPO_PUBLIC_DOMAIN \
  --value spartanhospicecoaching.com \
  --visibility plaintext
```

To verify the variables:

```bash
pnpm dlx eas-cli@21.0.2 env:list --environment production
```

Both variables should resolve to the production host. The `testflight` and
`production` profiles explicitly use the EAS `production` environment.

### 2. One-time credential setup (run once from your Mac)

EAS needs to create an iOS Distribution certificate and App Store provisioning profile on your behalf. This requires Apple login — it **must be run interactively from a Mac terminal**, not from Replit.

```bash
# From your Mac terminal:
cd <path-to-workspace>/artifacts/spartan-coaching-mobile

# Log in with the EXPO_TOKEN
export EXPO_TOKEN=<paste your token from expo.dev>

# This launches the interactive credential wizard.
# Choose: "App Store" distribution (for TestFlight + production).
# Let EAS create/manage the certificate and provisioning profile.
pnpm exec eas credentials --platform ios
```

Once that completes, EAS stores the credentials on its servers and all subsequent builds — including from Replit — run non-interactively without touching your Mac.

### 3. Apple Developer Program

You need an active [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/yr).

From App Store Connect, create a new app record (if not done already):
- **Bundle ID**: `com.spartancoaching.fieldkit`  _(register this in your Apple Developer portal first)_
- **SKU**: `spartan-membership`
- **Primary language**: English (U.S.)
- **Category**: Business

---

## Building for TestFlight

After credentials are set up (step 2 above), run this from the **Replit shell**:

```bash
pnpm --filter @workspace/spartan-coaching-mobile run build:ios:testflight
```

Or from `artifacts/spartan-coaching-mobile/`:

```bash
pnpm run build:ios:testflight
```

This queues a cloud build on Expo's servers (`testflight` profile → `distribution: store` → Release). The build link appears in your [Expo dashboard](https://expo.dev/builds). You don't need to wait — it runs in the cloud.

### Submit to TestFlight

From the [Expo dashboard](https://expo.dev/builds), click **Submit** on the completed build, or run:

```bash
pnpm --filter @workspace/spartan-coaching-mobile run submit:ios
```

This pushes the `.ipa` to App Store Connect. In App Store Connect → **TestFlight → Internal Testing**, add yourself and any reps as internal testers and distribute the build.

---

## TestFlight smoke test (run before inviting beta testers)

**Canonical elite checklist (I0–I8):** [`testflight-smoke.md`](./testflight-smoke.md)  
**Full web + iOS ship matrix:** [`docs/ship-readiness.md`](../../../docs/ship-readiness.md)

Pre-flight on a laptop:

```bash
node scripts/ship-check.mjs https://spartanhospicecoaching.com
PARITY_EMAIL=… PARITY_PASSWORD=… node scripts/ship-check.mjs https://spartanhospicecoaching.com
```


Short path:

### Pre-flight
- [ ] `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_DOMAIN` set for production
- [ ] Production API healthy
- [ ] Entitled demo account + a locked/logged-out path to test

### Must-pass product paths
- [ ] Logged-out Home: dual doors (Consulting | Hospice Sales Pro)
- [ ] Entitled Home: **one** Next action card
- [ ] Command hub (not bare form-only tab)
- [ ] Tools catalog → Objection → sticky Generate → result
- [ ] Learn: Articles / Podcasts / Resources (grouped PDFs)
- [ ] Subscribe return → unlock refresh → activation ceremony once

### Pass criteria
`testflight-smoke.md` critical rows green. 401/403 on tools → check `fieldKit.allowed` on the demo org.

---

## Production build + App Store submission

```bash
# Build a production binary (same as testflight profile but tracked separately)
pnpm --filter @workspace/spartan-coaching-mobile run build:ios

# Submit to App Store Connect (triggers review queue)
pnpm --filter @workspace/spartan-coaching-mobile run submit:ios
```

---

## App Store metadata checklist

Fill these in App Store Connect before submitting for review:

| Field | Value / Notes |
|---|---|
| App name | Spartan Coaching |
| Subtitle | Hospice Sales Pro Tools |
| Description | See `store/description.txt` |
| Promotional text | See `store/promotional.txt` (170 char) |
| Keywords | See `store/keywords.txt` (100 char limit) |
| Support URL | https://spartanhospicecoaching.com/contact |
| Marketing URL | https://spartanhospicecoaching.com/hospice-sales-pro |
| Privacy Policy URL | https://spartanhospicecoaching.com/privacy |
| Category | Business |
| Age rating | 4+ |

### Screenshots (elite story)

**Shot list + captions:** [`screenshot-shot-list.md`](./screenshot-shot-list.md)

App Store Connect requires at least the **6.9"** slot. **6.7"** strongly recommended.

#### Target 5-frame sequence (replace legacy names)

| File | Screen |
|---|---|
| `01-home-mission.png` | Entitled Home — one Next action card |
| `02-command-hub.png` | Command hub |
| `03-tools-catalog.png` | Tools catalog (Command hero) |
| `04-objection-result.png` | Objection result (3-tap heat) |
| `05-dual-doors.png` | Logged-out dual doors |

Legacy files (`01-checklist.png`, etc.) in `store/screenshots/` are placeholders — **re-capture with `capture-screenshots.sh` after I0–I6 UI** before review.

**How to upload (6.9" slot):**

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your Spartan Coaching app record.
2. Go to **App Store → iOS App → iPhone screenshots**.
3. Select the **6.9" (iPhone 16 Pro Max)** device size slot.
4. Drag all 5 PNGs from `store/screenshots/` into the upload area (or click **+** to browse).
5. Arrange them in the order 01 → 05.
6. Click **Save**.

---

#### 6.7" slot — iPhone 15 Plus (1290×2796 px)

**Ready-to-upload screenshots are in `store/screenshots/6.7/`** — all 5 at the required 1290×2796 px:

| File | Screen |
|---|---|
| `01-checklist.png` | Checklist / Home |
| `02-scenario-coach.png` | AI Scenario Coach |
| `03-branch-calculator.png` | Branch Calculator |
| `04-drills.png` | Objection Handler |
| `05-login.png` | Portal / Login |

> **Note:** The current 6.7" PNGs are rendered app-UI mockups (dark theme, Spartan Red accent, realistic screen content) at the correct 1290×2796 px — an improvement over the previous blank placeholders but still not real simulator captures. Replace them with real iPhone 15 Plus simulator captures (see "Capturing Real Screenshots" below) before the next App Store review cycle for a pixel-perfect listing.
>
> App Store Connect will use the 6.9" set as a fallback for 6.7" if you skip this slot — but uploading dedicated 6.7" images gives iPhone 15/14 Plus users a pixel-perfect preview.

**How to upload (6.7" slot):**

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your Spartan Coaching app record.
2. Go to **App Store → iOS App → iPhone screenshots**.
3. Select the **6.7" (iPhone 15 Plus)** device size slot.
4. Drag all 5 PNGs from `store/screenshots/6.7/` into the upload area (or click **+** to browse).
5. Arrange them in the order 01 → 05.
6. Click **Save** — then proceed to submit for review.

Optional: iPad screenshots (12.9") — not required since `supportsTablet` is false.

---

## Capturing Real Screenshots from the Simulator

Run this once after the app is available on TestFlight (or any time you do a UI refresh).
Requires: **Mac with Xcode 16+** and the app running locally via Expo.

### Quick method — automated script

From your Mac terminal, in the repo root:

```bash
# Install deps once (if not already running)
cd artifacts/spartan-coaching-mobile
pnpm install

# In one terminal — start the Expo dev server
pnpm run dev

# In another terminal — capture 6.9" only (iPhone 16 Pro Max → store/screenshots/):
bash store/capture-screenshots.sh

# OR capture both 6.9" AND 6.7" in one run:
CAPTURE_67=1 bash store/capture-screenshots.sh
```

The script prompts you to navigate to each screen and press ENTER before capturing.
When `CAPTURE_67=1` is set it runs a full 5-screen pass on the iPhone 16 Pro Max first,
then asks you to switch to the iPhone 15 Plus simulator and repeats the same 5 screens,
saving the second set to `store/screenshots/6.7/` at 1290×2796 px.

After the script finishes, verify the PNGs look correct, then follow the upload steps above.

### Manual method — step by step

Use this if the script fails or you want to capture a specific screen yourself.

#### 6.9" (iPhone 16 Pro Max — 1320×2868)

```bash
# 1. Boot the simulator
xcrun simctl list devices available | grep "iPhone 16 Pro Max"
xcrun simctl boot <UDID>
open -a Simulator

# 2. Open the app
pnpm exec expo run:ios --simulator "iPhone 16 Pro Max"

# 3. Capture each screen
xcrun simctl io booted screenshot /tmp/screenshot.png
sips -g pixelWidth -g pixelHeight /tmp/screenshot.png   # must be 1320×2868
cp /tmp/screenshot.png store/screenshots/NN-<name>.png
```

Or use **⌘+S** inside Simulator.app → resize to exactly 1320×2868 with Preview
(Tools → Adjust Size) before copying in.

**Dimension check:**
```bash
for f in store/screenshots/*.png; do
  echo "$f: $(sips -g pixelWidth -g pixelHeight "$f" | awk '/pixel/{printf $2" "}')"
done
# Expected: 1320 2868 for each file
```

#### 6.7" (iPhone 15 Plus — 1290×2796)

```bash
# 1. Boot the simulator
xcrun simctl list devices available | grep "iPhone 15 Plus"
xcrun simctl boot <UDID>
open -a Simulator

# 2. Open the app
pnpm exec expo run:ios --simulator "iPhone 15 Plus"

# 3. Capture each screen
xcrun simctl io booted screenshot /tmp/screenshot.png
sips -g pixelWidth -g pixelHeight /tmp/screenshot.png   # must be 1290×2796
cp /tmp/screenshot.png store/screenshots/6.7/NN-<name>.png
```

**Dimension check:**
```bash
for f in store/screenshots/6.7/*.png; do
  echo "$f: $(sips -g pixelWidth -g pixelHeight "$f" | awk '/pixel/{printf $2" "}')"
done
# Expected: 1290 2796 for each file
```

**Screens and suggested state (both device sizes):**

| Screen | What to show |
|---|---|
| Checklist (01) | A sample day filled in — at least 2–3 tasks checked |
| Scenario Coach (02) | An active AI coaching conversation with a response visible |
| Branch Calculator (03) | Staffing table populated with sample ADC numbers |
| Objection Handler (04) | A field-ready objection response fully generated |
| Login (05) | The portal login screen (log out first to see it) |

Then upload to App Store Connect as described in the Screenshots section above.

---

## App Review notes (paste into App Store Connect → Review Notes)

> This app is a professional tool for hospice census growth representatives working with Spartan Coaching clients. Access is gated by an evaluation/approval workflow — users request access, and a Spartan Coaching advisor approves each account individually before granting entry to membership tools.
>
> A pre-approved test account has been set up specifically for App Review. Credentials are in App Store Connect → App Review Information → Sign-in required (see setup steps below).
>
> Log in on the "Client Login" screen and you will land directly in the portal with all tools enabled: Checklist, Scenario Coach, Branch Calculator, Objection Handler, Playbook, and Email Templates.
>
> If you encounter any login issues, please contact nick@spartanhospicecoaching.com and we will resolve them immediately.

---

### How to seed / reset the reviewer account

The reviewer account lives in the production database. Reset it **from the Replit shell** — no database URL required.

#### One-time prerequisite: set the `ADMIN_PASSWORD` Replit Secret

The reset endpoint requires the `ADMIN_PASSWORD` Secret to be configured (it fails closed if unset). Set it once in the [Replit Secrets panel](https://docs.replit.com/replit-workspace/workspace-features/secrets) — use any strong value you choose.

You only need to do this once. Once set, the shell variable `$ADMIN_PASSWORD` is available automatically in any Replit deployment shell.

#### Reset the password

```bash
# From the Replit shell — generates a new random password and prints it
curl -s -X POST localhost:80/api/admin/reviewer/reset-password \
  -H "X-Admin-Auth: $ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

The endpoint is idempotent — it creates the org + member on first call, resets the password + re-activates on subsequent calls. The reviewer email is always `apple-reviewer@spartanhospicecoaching.com`.

To pin a specific password instead of generating one, add it to the request body:

```bash
curl -s -X POST localhost:80/api/admin/reviewer/reset-password \
  -H "X-Admin-Auth: $ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"password":"YourChosenPassword1!"}' | jq .
```

**After running:**
1. Copy the `email` + `password` from the JSON response into **App Store Connect → your app → App Review Information → Sign-in required**.
2. Do not commit the password to source control — it only needs to live in App Store Connect.

> **Legacy alternative (requires production DATABASE_URL):** `DATABASE_URL=<prod-connection-string> pnpm --filter @workspace/scripts run seed:apple-reviewer`  
> Prefer the curl method above — it works from any Replit shell without manual DB credential lookup.

#### Reviewer account seed log

| Date | Result | DB record | Action required |
|---|---|---|---|
| 2026-07-24 | ✅ Confirmed working in production | prod: member id=2, org id=2 (permanent active) | None — account is live |

> Credentials are stored in App Store Connect → App Review Information → Sign-in required. Do not commit them here.
>
> The reviewer account is permanent (`status: active`, no trial expiry). Re-seeding is only needed when starting a new review cycle (e.g. password reset or account corruption). Run the seed script with the production `DATABASE_URL` to reset the password, update this log, and re-enter credentials in App Store Connect.

---

## Updating the app after launch

Increment `version` in `app.json` (e.g. `"1.0.1"`) before each new build. The build number auto-increments via `autoIncrement: true` in `eas.json`.
