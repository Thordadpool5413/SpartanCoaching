/**
 * App Store / privacy / release readiness contract (HSP-46).
 * Grounded in Apple docs (account deletion 5.1.1(v), privacy manifests, export compliance).
 * External ASC/EAS steps are listed as operator actions — not inventable in code.
 *
 * @see https://developer.apple.com/support/offering-account-deletion-in-your-app/
 * @see https://developer.apple.com/documentation/bundleresources/privacy_manifest_files
 * @see https://developer.apple.com/app-store/review/guidelines/
 */

import {
  API_CONTRACT_VERSION,
  ELITE_WEEKLY_PLAN,
  MIN_IOS_APP_VERSION,
  STANDARD_WEEKLY_PLAN,
} from "@workspace/field-kit-catalog";

export const APP_STORE_SUPPORT_URL = "https://spartanhospicecoaching.com/contact";
export const APP_STORE_PRIVACY_URL = "https://spartanhospicecoaching.com/privacy";
export const APP_STORE_TERMS_URL = "https://spartanhospicecoaching.com/terms";
export const APP_STORE_TRUST_URL = "https://spartanhospicecoaching.com/trust";
export const APP_STORE_MARKETING_URL = "https://spartanhospicecoaching.com/hospice-sales-pro";

/** Bundle id must match App Store Connect + Apple Developer portal. */
export const IOS_BUNDLE_ID = "com.spartancoaching.fieldkit";

export type ReadinessItem = {
  id: string;
  area: string;
  status: "implemented" | "external" | "partial" | "risk";
  evidence: string;
  action?: string;
};

/**
 * Checklist for TestFlight / App Store review. `external` = App Store Connect or EAS only.
 */
export const APP_STORE_READINESS_ITEMS: ReadinessItem[] = [
  {
    id: "account_deletion",
    area: "Account deletion (Guideline 5.1.1(v))",
    status: "implemented",
    evidence:
      "In-app Account → Delete account calls POST /api/me/delete-account (confirm DELETE). Disables the member, clears sessions, anonymizes identity, and removes private Coach content.",
  },
  {
    id: "privacy_policy_link",
    area: "Privacy policy in-app + ASC field",
    status: "partial",
    evidence: `In-app links to ${APP_STORE_PRIVACY_URL}. ASC Privacy Policy URL must match.`,
    action: "Set Privacy Policy URL in App Store Connect app record.",
  },
  {
    id: "privacy_manifest",
    area: "PrivacyInfo.xcprivacy / required-reason APIs",
    status: "implemented",
    evidence:
      "ios.privacyManifests in app.config.js declares Name, Email, User ID, Purchase History, Product Interaction, Audio Data, and Other User Content as linked to the member, used for app functionality, and not used for tracking.",
  },
  {
    id: "permission_strings",
    area: "Usage description strings",
    status: "implemented",
    evidence:
      "Only current product permissions ship. Microphone supports private voice rehearsal and notifications support field follow up reminders. Retired camera, photo library, and Face ID clinical permissions were removed.",
  },
  {
    id: "export_compliance",
    area: "Export compliance",
    status: "implemented",
    evidence: "ITSAppUsesNonExemptEncryption=false (standard HTTPS only).",
  },
  {
    id: "native_account_creation",
    area: "Purchase-first membership and native account protection",
    status: "implemented",
    evidence:
      "A customer can choose Standard or Elite and complete the StoreKit purchase before creating a Spartan account. The verified purchase is then claimed after native registration or sign in so access and saved work can sync without charging twice.",
  },
  {
    id: "subscription_disclosure",
    area: "Subscription disclosures and purchasing",
    status: "implemented",
    evidence:
      "The native purchase surface shows plan name, localized StoreKit price, weekly duration, automatic renewal terms, Restore Purchases, Manage Subscription, Terms of Use, and Privacy Policy. Legacy iOS web purchase steering was removed.",
  },
  {
    id: "subscription_model",
    area: "Apple subscriptions",
    status: "risk",
    evidence: `Native StoreKit purchase is implemented for Standard ${STANDARD_WEEKLY_PLAN.displayPrice} (${STANDARD_WEEKLY_PLAN.appleProductId}) and Elite ${ELITE_WEEKLY_PLAN.displayPrice} (${ELITE_WEEKLY_PLAN.appleProductId}). The API verifies Apple's signed JWS before account creation, securely claims the original transaction after authentication, prevents transaction reuse, and accepts verified App Store Server Notifications. Release remains blocked until the complete Sandbox lifecycle matrix passes.`,
    action:
      "Create both products in App Store Connect, configure APPLE_APP_ID and Apple root certificates, register the notification URL, then run purchase, renewal, upgrade, cancellation, refund, and restore on a Sandbox Apple ID and physical iPhone.",
  },
  {
    id: "restore_access",
    area: "Restore purchases / access",
    status: "implemented",
    evidence: "Membership and Account expose Restore Apple Purchases. Restore works before sign in; the verified purchase is claimed after native account creation or sign in before access is granted.",
  },
  {
    id: "sign_in_with_apple",
    area: "Sign in with Apple",
    status: "partial",
    evidence:
      "App uses email/password + magic link only (not third-party social login as sole path). SIWA not required unless you add Google/Facebook exclusive login.",
    action: "If you add third-party social login later, add Sign in with Apple (Guideline 4.8).",
  },
  {
    id: "deep_links",
    area: "Deep links / universal links",
    status: "partial",
    evidence:
      "Custom scheme spartan-coaching-mobile://; associatedDomains applinks:spartanhospicecoaching.com configured in app.config.",
    action:
      "Host apple-app-site-association on https://spartanhospicecoaching.com/.well-known/ with appID TEAMID.com.spartancoaching.fieldkit. Verify in ASC Associated Domains capability.",
  },
  {
    id: "notifications",
    area: "Notifications / background",
    status: "implemented",
    evidence:
      "expo-notifications for local follow-up reminders; usage string present. No remote push entitlement claimed unless APNs configured in EAS.",
    action: "If enabling remote push, configure APNs key in EAS credentials and update App Privacy.",
  },
  {
    id: "backend_compat",
    area: "Backend compatibility with released build",
    status: "implemented",
    evidence: `Client sends X-Client-Platform/Version/Api-Contract; API_CONTRACT_VERSION=${API_CONTRACT_VERSION}; MIN_IOS_APP_VERSION=${MIN_IOS_APP_VERSION}. GET /api/client-config.`,
  },
  {
    id: "screenshots_metadata",
    area: "Screenshots & metadata",
    status: "external",
    evidence: "store/screenshots + description.txt / keywords.txt / promotional.txt present in repo.",
    action: "Upload 6.7\" screenshots, subtitle, description, keywords, support URL, marketing URL in ASC.",
  },
  {
    id: "testflight_devices",
    area: "TestFlight on real devices",
    status: "external",
    evidence: "eas.json testflight + production profiles; store/testflight-smoke.md checklist.",
    action: "eas build --profile testflight --platform ios; internal testing; run smoke on physical iPhone.",
  },
  {
    id: "app_privacy_answers",
    area: "App Privacy questionnaire (ASC)",
    status: "external",
    evidence:
      "Align ASC answers with privacyManifest collected types: Name, Email, User ID, Purchase History, Product Interaction, Audio Data, and Other User Content. These are linked to the member, used for app functionality, and not used for tracking. Product Interaction also supports analytics. No ATT prompt is used.",
    action: "Complete App Privacy in ASC to match PrivacyInfo.xcprivacy + privacy policy.",
  },
];

/** Suggested App Review notes (paste into ASC; no secrets). */
export const APP_REVIEW_NOTES = [
  "Hospice Sales Pro is a multiplatform membership (web + iOS) for hospice field sales coaching tools.",
  "Purchase flow: open Membership, choose Standard or Elite, and complete the native Apple purchase. No Spartan account is required before payment. After Apple confirms the purchase, create or sign in to one private Spartan account to protect and sync access without a second charge.",
  "Account deletion: Account tab → Delete account (requires confirm DELETE). Completes within the app.",
  `Apple subscriptions: Standard ${STANDARD_WEEKLY_PLAN.displayPrice} and Hospice Sales Pro Elite ${ELITE_WEEKLY_PLAN.displayPrice}. Purchases and restores are verified by the Spartan Coaching API before access is granted.`,
  "App Store submission remains blocked until production server verification, App Store Connect declarations, and the Sandbox purchase matrix are complete.",
  "Demo: reviewers may browse Home, Tools, Coach, Library, and the guided tour before purchase. Use provided reviewer credentials for live gated tools or the native Membership screen to inspect StoreKit products.",
  "No patient PHI. Elite clinical tools accept deidentified information only, provide suggested education, and require medical director, compliance, or both to approve output.",
  `Support: ${APP_STORE_SUPPORT_URL} · Privacy: ${APP_STORE_PRIVACY_URL}`,
].join("\n");

export function readinessSummary(): {
  implemented: number;
  external: number;
  partial: number;
  risk: number;
  items: ReadinessItem[];
  reviewNotes: string;
} {
  const items = APP_STORE_READINESS_ITEMS;
  return {
    implemented: items.filter((i) => i.status === "implemented").length,
    external: items.filter((i) => i.status === "external").length,
    partial: items.filter((i) => i.status === "partial").length,
    risk: items.filter((i) => i.status === "risk").length,
    items,
    reviewNotes: APP_REVIEW_NOTES,
  };
}
