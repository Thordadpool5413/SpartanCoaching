# App Store Submission Guide — Spartan Coaching Field Kit

## Before You Submit

### 1. One-time Expo / EAS account setup

1. Create an account at [expo.dev](https://expo.dev) if you don't have one.
2. From `artifacts/spartan-coaching-mobile/`, run the interactive setup script:
   ```
   chmod +x setup-eas.sh
   ./setup-eas.sh
   ```
   The script will log you in to Expo, link the EAS project, collect your Apple
   Developer credentials, and print the five **Replit Secrets** you must set.

3. In Replit, open **Tools → Secrets** and add:

   | Secret key | Where to find it |
   |---|---|
   | `EAS_PROJECT_ID` | Printed by `setup-eas.sh` after `eas init` |
   | `EXPO_ACCOUNT_SLUG` | Your Expo username at expo.dev/accounts |
   | `APPLE_ID` | Your Apple ID email (Apple Developer account) |
   | `APPLE_TEAM_ID` | 10-char team ID in Certificates, Identifiers & Profiles |
   | `ASC_APP_ID` | Numeric App Store Connect App ID (see step 2 below) |

### 2. Apple Developer Program

You need an active [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/yr).

From App Store Connect, create a new app record:
- **Bundle ID**: `com.spartancoaching.fieldkit`  _(register this in your Apple Developer portal first)_
- **SKU**: `spartan-field-kit`
- **Primary language**: English (U.S.)
- **Category**: Business

After creating the app record, the **App Store Connect App ID** is the numeric ID in the URL of the app detail page. Set it as the `ASC_APP_ID` secret.

---

## Building for TestFlight (internal testing)

From `artifacts/spartan-coaching-mobile/`:

```bash
pnpm run build:ios:preview
```

EAS handles certificates and provisioning automatically (managed workflow). The build link appears in your [Expo dashboard](https://expo.dev/builds). Submit to TestFlight from the dashboard, or run:

```bash
pnpm run submit:ios
```

---

## Production build + App Store submission

```bash
# Build a production binary
pnpm run build:ios

# Submit to App Store Connect (triggers review queue)
pnpm run submit:ios
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
