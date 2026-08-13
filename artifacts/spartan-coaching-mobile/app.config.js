const productionOrigin = "https://spartanhospicecoaching.com";

function getRouterOrigin() {
  const configuredOrigin =
    process.env.EXPO_PUBLIC_WEB_ORIGIN || process.env.EXPO_PUBLIC_DOMAIN;

  if (!configuredOrigin) return productionOrigin;

  const normalized = configuredOrigin.replace(/\/+$/, "");
  return /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;
}

module.exports = {
  expo: {
    name: "Spartan Coaching",
    slug: "spartan-coaching",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "spartan-coaching-mobile",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/spartan-stamp.png",
      resizeMode: "contain",
      backgroundColor: "#050505",
    },
    ios: {
      bundleIdentifier: "com.spartancoaching.fieldkit",
      supportsTablet: false,
      // Universal Links host — requires apple-app-site-association on the web origin (EAS/App Store Connect).
      associatedDomains: [
        `applinks:${productionOrigin.replace(/^https?:\/\//, "")}`,
      ],
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
        NSCameraUsageDescription:
          "Spartan Coaching uses the camera to capture documents you explicitly add to a protected clinical case.",
        NSPhotoLibraryUsageDescription:
          "Spartan Coaching uses your photo library only to select documents you explicitly add to a protected clinical case.",
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
        "expo-local-authentication",
        {
          faceIDPermission: "Use Face ID to reopen protected clinical cases.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Select a document image to add to your protected clinical case.",
          cameraPermission:
            "Capture a document image to add to your protected clinical case.",
        },
      ],
      "expo-web-browser",
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
