# App Store Submission Guide — Spartan Coaching Field Kit

## Before You Submit

### 1. One-time Expo / EAS account setup

The Replit Secrets are already set:

| Secret key | Value |
|---|---|
| `EAS_PROJECT_ID` | ✅ Set |
| `EXPO_ACCOUNT_SLUG` | ✅ Set (`thordadpool`) |
| `EXPO_TOKEN` | ✅ Set |
| `APPLE_ID` | ✅ Set |
| `APPLE_TEAM_ID` | ✅ Set |
| `ASC_APP_ID` | ✅ Set |

### 1b. Set the production API domain (required before any store build)

The app determines where to send API requests from the `EXPO_PUBLIC_DOMAIN` environment variable. This must be set as an **EAS secret** before running a TestFlight or production build — otherwise every login attempt and tool call will fail silently on device.

**Get your production domain:**
Your production Replit deployment domain is listed in the Replit dashboard under the "Deployments" tab, or available as `REPLIT_INTERNAL_APP_DOMAIN` in the deployment environment. It typically looks like `<your-repl>.replit.app` or a custom domain.

**Set it once (run from your Mac or the Replit shell):**

```bash
# Replace <your-production-domain> with just the hostname — no https://, no trailing slash
# Example: my-app.replit.app  OR  spartanhospicecoaching.com
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_DOMAIN \
  --value <your-production-domain> \
  --type string
```

To verify the secret is set:

```bash
eas secret:list
```

You should see `EXPO_PUBLIC_DOMAIN` in the list. All subsequent TestFlight and production builds will pull it automatically — you only need to redo this if you move to a new deployment domain.

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
- **SKU**: `spartan-field-kit`
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

After TestFlight notifies you that the build is ready, install it on a physical iPhone and run through this checklist. Common first-build failures are noted on each item.

### Pre-flight
- [ ] `EXPO_PUBLIC_DOMAIN` EAS secret is set (see step 1b above) — if you skipped this, all login attempts will fail with a network error
- [ ] The production API server is deployed and reachable: `curl https://<your-domain>/api/health` returns `{"ok":true}`
- [ ] A real Field Kit account exists in production (or use the reviewer account — see "How to seed / reset the reviewer account" below)

### Launch
- [ ] App installs from TestFlight without any entitlement or provisioning error
- [ ] Splash screen shows the Spartan stamp on a black background, then transitions to the login screen
- [ ] No "network request failed" or blank screen on launch — if it appears immediately, `EXPO_PUBLIC_DOMAIN` is missing or wrong

### Login
- [ ] Enter a valid Field Kit email and password → lands on the portal home
- [ ] Wrong password shows an error message (not a crash)
- [ ] Sign out, then sign back in — session persists between app launches (stored in AsyncStorage)

### Core screens
- [ ] **Checklist** — loads visit checklist items; toggling a checkbox saves without error
- [ ] **Scenario Coach** — opens a new conversation; sending a message returns an AI response (requires `OPENAI_API_KEY` set on the production server)
- [ ] **Branch Calculator** — staffing table renders; inputs update the ADC and RN/aide split totals
- [ ] **Objection Handler** (Drills tab) — generates a field-ready response without a 401 or 403 error
- [ ] **Playbook / Email Templates** — content loads (requires Field Kit entitlement)

### Account
- [ ] Account screen shows correct name, email, and evaluation/membership status
- [ ] "Sign out of all devices" works and returns to the login screen

### Pass criteria
All boxes checked. If `EXPO_PUBLIC_DOMAIN` was missing, re-create the EAS secret and rebuild. If a tool returns 401/403, confirm the test account has `fieldKit.allowed: true` on the production server.

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
| App name | Spartan Coaching Field Kit |
| Subtitle | Hospice Census Growth Tools |
| Description | See `store/description.txt` |
| Keywords | See `store/keywords.txt` (100 char limit) |
| Support URL | https://spartanhospicecoaching.com/contact |
| Marketing URL | https://spartanhospicecoaching.com/field-kit |
| Privacy Policy URL | https://spartanhospicecoaching.com/privacy |
| Category | Business |
| Age rating | 4+ |

### Screenshots

App Store Connect requires at least the **6.9"** slot. The **6.7"** slot is strongly recommended — it covers the large installed base of iPhone 15 / 14 Plus users and appears automatically for iPhone 15 Plus devices browsing the store.

#### 6.9" slot — iPhone 16 Pro Max (1320×2868 px)

**Ready-to-upload screenshots are in `store/screenshots/`** — all 5 at the required 1320×2868 px:

| File | Screen |
|---|---|
| `01-checklist.png` | Checklist / Home — visit checklist with a sample day |
| `02-scenario-coach.png` | AI Scenario Coach — active coaching conversation |
| `03-branch-calculator.png` | Branch Calculator — staffing table with sample ADC |
| `04-drills.png` | Objection Handler — field-ready response generated |
| `05-login.png` | Portal / Login — client access screen |

> **Note:** The current PNGs were generated programmatically to unblock submission. Replace them with real simulator captures (see below) before the next App Store review cycle for a more polished listing.

**How to upload (6.9" slot):**

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your Field Kit app record.
2. Go to **App Store → iOS App → iPhone screenshots**.
3. Select the **6.9" (iPhone 16 Pro Max)** device size slot.
4. Drag all 5 PNGs from `store/screenshots/` into the upload area (or click **+** to browse).
5. Arrange them in the order 01 → 05.
6. Click **Save**.

---

#### 6.7" slot — iPhone 15 Plus (1290×2796 px)

**Ready-to-upload placeholder screenshots are in `store/screenshots/6.7/`** — all 5 at the required 1290×2796 px:

| File | Screen |
|---|---|
| `01-checklist.png` | Checklist / Home |
| `02-scenario-coach.png` | AI Scenario Coach |
| `03-branch-calculator.png` | Branch Calculator |
| `04-drills.png` | Objection Handler |
| `05-login.png` | Portal / Login |

> **Note:** The current 6.7" PNGs are placeholder fills. Replace them with real iPhone 15 Plus simulator captures (see "Capturing Real Screenshots" below) before the next App Store review cycle.
>
> App Store Connect will use the 6.9" set as a fallback for 6.7" if you skip this slot — but uploading dedicated 6.7" images gives iPhone 15/14 Plus users a pixel-perfect preview.

**How to upload (6.7" slot):**

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your Field Kit app record.
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

> This app is a professional tool for hospice census growth representatives working with Spartan Coaching clients. Access is gated by an evaluation/approval workflow — users request access, and a Spartan Coaching advisor approves each account individually before granting entry to the Field Kit.
>
> A pre-approved test account has been set up specifically for App Review. Credentials are in App Store Connect → App Review Information → Sign-in required (see setup steps below).
>
> Log in on the "Field Kit Login" screen and you will land directly in the portal with all tools enabled: Checklist, Scenario Coach, Branch Calculator, Objection Handler, Playbook, and Email Templates.
>
> If you encounter any login issues, please contact nick@spartanhospicecoaching.com and we will resolve them immediately.

---

### How to seed / reset the reviewer account

The reviewer account lives in the production database. Run this script before each App Store review submission:

```bash
# Generates a new random password and prints it — copy it straight into App Store Connect
DATABASE_URL=<prod-connection-string> pnpm --filter @workspace/scripts run seed:apple-reviewer
```

The script is idempotent — it creates the org + member on first run, resets the password + re-activates on subsequent runs, and prints the credentials at the end. The reviewer email is always `apple-reviewer@spartanhospicecoaching.com`.

**After running:**
1. Copy the printed email + password into **App Store Connect → your app → App Review Information → Sign-in required**.
2. Do not commit the password to source control — it only needs to live in App Store Connect.

To pin a specific password instead of generating one:

```bash
DATABASE_URL=<prod-connection-string> REVIEWER_PASSWORD=<your-password> pnpm --filter @workspace/scripts run seed:apple-reviewer
```

#### Reviewer account seed log

| Date | Result | DB record | Action required |
|---|---|---|---|
| 2026-07-24 | ⏳ Account exists in production (invited, null password) | prod: member id=2, org id=2 (24h trial) | **Publish the latest build, then run the activation steps below** |

> Credentials are stored in App Store Connect → App Review Information → Sign-in required. Do not commit them here.
>
> Next review cycle: re-run the seed script with the production DATABASE_URL to reset to a new password, update the log, and re-enter credentials in App Store Connect.

#### Activating the reviewer on production (one-time, after next publish)

The production database has the reviewer account in "invited" status with no password set. After Nick publishes the latest build:

**Step 1 — Get an admin Bearer token** (log in as platform admin):
```bash
curl -s -X POST https://spartanhospicecoaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin-email>","password":"<admin-password>"}' \
  | jq -r .token
```

**Step 2 — Activate the reviewer account** (supply the reviewer password from App Store Connect):
```bash
curl -X POST https://spartanhospicecoaching.com/api/admin/activate-reviewer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token-from-step-1>" \
  -d '{"password":"<reviewer-password-from-app-store-connect>"}'
# Expected: {"ok":true,"message":"Reviewer account activated.",...}
```

**Step 3 — Verify login works**:
```bash
curl -s -X POST https://spartanhospicecoaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"apple-reviewer@spartanhospicecoaching.com","password":"<reviewer-password>"}' \
  | jq '{allowed: .fieldKit.allowed, orgStatus: .organization.status, trialEndsAt: .organization.trialEndsAt}'
# Expected: {"allowed":true,"orgStatus":"active","trialEndsAt":null}
```

**Step 4** — Update the seed log row above to ✅ and delete the "Activating the reviewer on production" section from this README, then merge the cleanup PR (task #141).

---

## Updating the app after launch

Increment `version` in `app.json` (e.g. `"1.0.1"`) before each new build. The build number auto-increments via `autoIncrement: true` in `eas.json`.
