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

**How to upload to App Store Connect:**

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your Field Kit app record.
2. Go to **App Store → iOS App → iPhone screenshots**.
3. Select the **6.9" (iPhone 16 Pro Max)** device size slot.
4. Drag all 5 PNGs from `store/screenshots/` into the upload area (or click **+** to browse).
5. Arrange them in the order 01 → 05.
6. Click **Save** — then proceed to submit for review.

To regenerate screenshots (e.g. after a UI update): `python3 scripts/generate-screenshots.py`

Optional: iPad screenshots (12.9") — not required since `supportsTablet` is false.

---

## App Review notes (paste into App Store Connect → Review Notes)

> This app is available to approved users only. It is a professional tool for hospice census growth representatives working with Spartan Coaching. To test the app, use the following credentials:
>
> Email: [PROVIDE A TEST ACCOUNT EMAIL]  
> Password: [PROVIDE A TEST ACCOUNT PASSWORD]
>
> Request access via the "Request Access" flow on the login screen, or contact nick@spartanhospicecoaching.com to have a test account pre-approved.

---

## Updating the app after launch

Increment `version` in `app.json` (e.g. `"1.0.1"`) before each new build. The build number auto-increments via `autoIncrement: true` in `eas.json`.
