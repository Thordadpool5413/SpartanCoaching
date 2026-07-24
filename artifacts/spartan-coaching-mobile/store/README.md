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

### Screenshots (iPhone 6.9" — iPhone 16 Pro Max)

**Ready-to-upload screenshots are in `store/screenshots/`** — all 5 at the required 1320×2868 px:

| File | Screen |
|---|---|
| `01-checklist.png` | Checklist / Home — visit checklist with a sample day |
| `02-scenario-coach.png` | AI Scenario Coach — active coaching conversation |
| `03-branch-calculator.png` | Branch Calculator — staffing table with sample ADC |
| `04-drills.png` | Objection Handler — field-ready response generated |
| `05-login.png` | Portal / Login — client access screen |

> **Note:** The current PNGs were generated programmatically to unblock submission. Replace them with real simulator captures (see below) before the next App Store review cycle for a more polished listing.

**How to upload to App Store Connect:**

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your Field Kit app record.
2. Go to **App Store → iOS App → iPhone screenshots**.
3. Select the **6.9" (iPhone 16 Pro Max)** device size slot.
4. Drag all 5 PNGs from `store/screenshots/` into the upload area (or click **+** to browse).
5. Arrange them in the order 01 → 05.
6. Click **Save** — then proceed to submit for review.

Optional: iPad screenshots (12.9") — not required since `supportsTablet` is false.

---

## Capturing Real Screenshots from the iPhone 16 Pro Max Simulator

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

# In another terminal — run the capture script
# This boots the simulator, navigates to each screen,
# captures at 1320×2868, and saves to store/screenshots/
bash store/capture-screenshots.sh
```

After the script finishes, verify the 5 PNGs in `store/screenshots/` look correct,
then follow the "How to upload to App Store Connect" steps above.

### Manual method — step by step

Use this if the script fails or you want to capture a specific screen yourself.

#### 1. Boot the iPhone 16 Pro Max simulator

```bash
# List available simulators
xcrun simctl list devices available | grep "iPhone 16 Pro Max"

# Boot it (replace <UDID> with the one from the list above)
xcrun simctl boot <UDID>

# Open Simulator.app so you can see it
open -a Simulator
```

#### 2. Start the Expo dev server and open the app

```bash
# From artifacts/spartan-coaching-mobile/
pnpm run dev

# Press 'i' in the Expo CLI to open in the iOS simulator
# OR run:
pnpm exec expo run:ios --simulator "iPhone 16 Pro Max"
```

#### 3. Log in and navigate to each screen

Use the test account credentials from the App Review notes section below.
Navigate to each of the 5 screens in order — give each screen a moment to fully load AI responses or data before capturing.

**Screens and suggested state:**
| Screen | What to show |
|---|---|
| Checklist (01) | A sample day filled in — at least 2–3 tasks checked |
| Scenario Coach (02) | An active AI coaching conversation with a response visible |
| Branch Calculator (03) | Staffing table populated with sample ADC numbers |
| Objection Handler (04) | A field-ready objection response fully generated |
| Login (05) | The portal login screen (log out first to see it) |

#### 4. Capture each screen

```bash
# Capture to a temp file first, then move to the right slot
xcrun simctl io booted screenshot /tmp/screenshot.png

# Verify dimensions — must be 1320×2868
sips -g pixelWidth -g pixelHeight /tmp/screenshot.png

# Copy to the screenshots folder (replace NN with 01–05)
cp /tmp/screenshot.png store/screenshots/NN-<name>.png
```

Or use **⌘+S** inside Simulator.app to save a screenshot to your Desktop, then
resize to exactly 1320×2868 with Preview (Tools → Adjust Size) before copying it in.

#### 5. Confirm all 5 are correct

```bash
# Quick check — all should be 1320 × 2868
for f in store/screenshots/*.png; do
  echo "$f: $(sips -g pixelWidth -g pixelHeight "$f" | awk '/pixel/{printf $2" "}')"
done
```

Expected output:
```
01-checklist.png: 1320 2868
02-scenario-coach.png: 1320 2868
03-branch-calculator.png: 1320 2868
04-drills.png: 1320 2868
05-login.png: 1320 2868
```

Then upload to App Store Connect as described above.

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

---

## Updating the app after launch

Increment `version` in `app.json` (e.g. `"1.0.1"`) before each new build. The build number auto-increments via `autoIncrement: true` in `eas.json`.
