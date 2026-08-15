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
      "In-app Account → Delete account calls POST /api/me/delete-account (confirm DELETE). Disables member, clears sessions, anonymizes email/name.",
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
      "ios.privacyManifests in app.config.js (NSPrivacyTracking false; UserDefaults/FileTimestamp/SystemBootTime/DiskSpace reasons; collected data types).",
  },
  {
    id: "permission_strings",
    area: "Usage description strings",
    status: "implemented",
    evidence:
      "NSUserNotificationsUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription, Face ID string via expo-local-authentication plugin.",
  },
  {
    id: "export_compliance",
    area: "Export compliance",
    status: "implemented",
    evidence: "ITSAppUsesNonExemptEncryption=false (standard HTTPS only).",
  },
  {
    id: "subscription_model",
    area: "Subscriptions / external purchase",
    status: "risk",
    evidence: `Canonical products are defined for Standard ${STANDARD_WEEKLY_PLAN.displayPrice} (${STANDARD_WEEKLY_PLAN.appleProductId}) and Elite ${ELITE_WEEKLY_PLAN.displayPrice} (${ELITE_WEEKLY_PLAN.appleProductId}), but native StoreKit purchase and server transaction verification are not implemented.`,
    action:
      "Create both products in App Store Connect, connect StoreKit 2, verify signed transactions on the server, and remove Stripe purchase links from the iOS purchase flow before public review.",
  },
  {
    id: "restore_access",
    area: "Restore purchases / access",
    status: "partial",
    evidence: "The product/provider contract exists, but there is no visible StoreKit restore action or server reconciliation.",
    action: "Add a visible Restore Purchases action and reconcile verified Apple transactions with server entitlements.",
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
      "Align ASC answers with privacyManifest collected types: Email, Name, Product Interaction, Purchase History — linked to user, not used for tracking; no ATT.",
    action: "Complete App Privacy in ASC to match PrivacyInfo.xcprivacy + privacy policy.",
  },
];

/** Suggested App Review notes (paste into ASC; no secrets). */
export const APP_REVIEW_NOTES = [
  "Hospice Sales Pro is a multiplatform membership (web + iOS) for hospice field sales coaching tools.",
  "Account creation: email/password on web or in-app login after web register; magic link supported.",
  "Account deletion: Account tab → Delete account (requires confirm DELETE). Completes within the app.",
  `Planned Apple subscriptions: Standard ${STANDARD_WEEKLY_PLAN.displayPrice} and Clinical Vault Elite ${ELITE_WEEKLY_PLAN.displayPrice}. Public App Store submission remains blocked until StoreKit purchase, server verification, and Restore Purchases are complete.`,
  "TestFlight reviewers use an existing entitled account. No purchase claim is made in this build.",
  "Demo: use provided reviewer credentials if attached; otherwise create an account and use Subscribe, or request evaluation access via Contact.",
  "No patient PHI in consumer tools; clinical vault is separate and role-gated.",
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
