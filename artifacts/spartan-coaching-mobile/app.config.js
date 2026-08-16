const productionOrigin = "https://spartanhospicecoaching.com";
const productionHost = productionOrigin.replace(/^https?:\/\//, "");

function getRouterOrigin() {
  const configuredOrigin =
    process.env.EXPO_PUBLIC_WEB_ORIGIN || process.env.EXPO_PUBLIC_DOMAIN;

  if (!configuredOrigin) return productionOrigin;

  const normalized = configuredOrigin.replace(/\/+$/, "");
  return /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;
}

/**
 * Universal Links (applinks:) require:
 * 1. Associated Domains enabled on App ID com.spartancoaching.fieldkit
 * 2. A provisioning profile that includes com.apple.developer.associated-domains
 *
 * Default store scripts set EAS_SKIP_ASSOCIATED_DOMAINS=1 so TestFlight ships
 * against the existing App Store profile (no invalid eas-cli flags; 21.x has no
 * --clear-provisioning-profile). After enabling the capability on Apple and
 * regenerating the profile with interactive `eas credentials`, build with:
 *   pnpm run build:ios:testflight:with-applinks
 */
function getAssociatedDomains() {
  const skip =
    process.env.EAS_SKIP_ASSOCIATED_DOMAINS === "1" ||
    process.env.EAS_SKIP_ASSOCIATED_DOMAINS === "true";
  if (skip) return undefined;
  return [`applinks:${productionHost}`];
}

const associatedDomains = getAssociatedDomains();

module.exports = {
  expo: {
    name: "Spartan Coaching",
    slug: "spartan-coaching",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "spartan-coaching-mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/spartan-stamp.png",
      resizeMode: "contain",
      backgroundColor: "#050505",
    },
    ios: {
      bundleIdentifier: "com.spartancoaching.fieldkit",
      supportsTablet: false,
      // Universal Links host — requires apple-app-site-association on the web origin.
      // Omit entirely when EAS_SKIP_ASSOCIATED_DOMAINS=1 (stale profile emergency).
      ...(associatedDomains ? { associatedDomains } : {}),
      // Explicit entitlement so EAS capability sync matches the profile request.
      ...(associatedDomains
        ? {
            entitlements: {
              "com.apple.developer.associated-domains": associatedDomains,
            },
          }
        : {}),
      /**
       * PrivacyInfo.xcprivacy (Apple required-reason APIs + data collection declarations).
       * @see https://developer.apple.com/documentation/bundleresources/privacy_manifest_files
       * Reasons: UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1
       * (common Expo / React Native access patterns — not used for tracking).
       */
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeProductInteraction",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePurchaseHistory",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeAudioData",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherUserContent",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
        ],
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
            NSPrivacyAccessedAPITypeReasons: ["C617.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
            NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
            NSPrivacyAccessedAPITypeReasons: ["E174.1"],
          },
        ],
      },
      infoPlist: {
        NSUserNotificationsUsageDescription:
          "Spartan Coaching uses notifications to remind you to follow up with contacts after visits.",
        // Export compliance: app uses only HTTPS / standard encryption (no custom crypto).
        ITSAppUsesNonExemptEncryption: false,
        // Home-screen quick actions (open app; deep links via scheme when supported)
        UIApplicationShortcutItems: [
          {
            UIApplicationShortcutItemType: "com.spartancoaching.fieldkit.command",
            UIApplicationShortcutItemTitle: "Command Center",
            UIApplicationShortcutItemSubtitle: "Today's field spine",
            UIApplicationShortcutItemIconType: "UIApplicationShortcutIconTypeCompose",
            UIApplicationShortcutItemUserInfo: {
              url: "spartan-coaching-mobile://command",
            },
          },
          {
            UIApplicationShortcutItemType: "com.spartancoaching.fieldkit.objection",
            UIApplicationShortcutItemTitle: "Objection Handler",
            UIApplicationShortcutItemSubtitle: "3-tap talk track",
            UIApplicationShortcutItemIconType: "UIApplicationShortcutIconTypeSearch",
            UIApplicationShortcutItemUserInfo: {
              url: "spartan-coaching-mobile://tool/objection",
            },
          },
          {
            UIApplicationShortcutItemType: "com.spartancoaching.fieldkit.tools",
            UIApplicationShortcutItemTitle: "Tools map",
            UIApplicationShortcutItemIconType: "UIApplicationShortcutIconTypeFavorite",
            UIApplicationShortcutItemUserInfo: {
              url: "spartan-coaching-mobile://tools",
            },
          },
        ],
      },
    },
    android: {
      permissions: [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
      ],
    },
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      ["expo-router", { origin: getRouterOrigin() }],
      "expo-font",
      "expo-secure-store",
      [
        "expo-audio",
        {
          microphonePermission:
            "Spartan Coach uses the microphone only while you record a private rehearsal for transcription and feedback.",
        },
      ],
      "expo-web-browser",
      "react-native-iap",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#C8102E",
          sounds: [],
          androidMode: "default",
          androidCollapsedTitle: "Spartan Coaching",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ||
          "bafdaa6f-80f5-4fb0-baef-324fa376c44c",
      },
    },
    owner: "thordadpool",
  },
};
