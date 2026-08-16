describe("Expo production configuration", () => {
  const originalDomain = process.env.EXPO_PUBLIC_DOMAIN;
  const originalOrigin = process.env.EXPO_PUBLIC_WEB_ORIGIN;
  const originalSkip = process.env.EAS_SKIP_ASSOCIATED_DOMAINS;

  afterEach(() => {
    if (originalDomain === undefined) delete process.env.EXPO_PUBLIC_DOMAIN;
    else process.env.EXPO_PUBLIC_DOMAIN = originalDomain;

    if (originalOrigin === undefined) delete process.env.EXPO_PUBLIC_WEB_ORIGIN;
    else process.env.EXPO_PUBLIC_WEB_ORIGIN = originalOrigin;

    if (originalSkip === undefined) delete process.env.EAS_SKIP_ASSOCIATED_DOMAINS;
    else process.env.EAS_SKIP_ASSOCIATED_DOMAINS = originalSkip;

    jest.resetModules();
  });

  it("defaults native routing to the live Spartan Coaching host", () => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
    delete process.env.EXPO_PUBLIC_WEB_ORIGIN;
    delete process.env.EAS_SKIP_ASSOCIATED_DOMAINS;

    const config = require("../app.config.js");

    expect(config.expo.plugins[0]).toEqual([
      "expo-router",
      { origin: "https://spartanhospicecoaching.com" },
    ]);
    expect(config.expo.ios.bundleIdentifier).toBe(
      "com.spartancoaching.fieldkit",
    );
    expect(config.expo.extra.eas.projectId).toBe(
      "bafdaa6f-80f5-4fb0-baef-324fa376c44c",
    );
    // When not skipped, Universal Links entitlement is present (with-applinks builds).
    expect(config.expo.ios.associatedDomains).toEqual([
      "applinks:spartanhospicecoaching.com",
    ]);
    expect(
      config.expo.ios.entitlements["com.apple.developer.associated-domains"],
    ).toEqual(["applinks:spartanhospicecoaching.com"]);
  });

  it("normalizes the EAS domain variable to an HTTPS origin", () => {
    process.env.EXPO_PUBLIC_DOMAIN = "spartanhospicecoaching.com/";
    delete process.env.EXPO_PUBLIC_WEB_ORIGIN;

    const config = require("../app.config.js");

    expect(config.expo.plugins[0]).toEqual([
      "expo-router",
      { origin: "https://spartanhospicecoaching.com" },
    ]);
  });

  it("can omit Associated Domains for emergency TestFlight when profile is stale", () => {
    process.env.EAS_SKIP_ASSOCIATED_DOMAINS = "1";

    const config = require("../app.config.js");

    expect(config.expo.ios.associatedDomains).toBeUndefined();
    expect(config.expo.ios.entitlements).toBeUndefined();
  });

  it("declares Coach data without retired clinical device permissions", () => {
    const config = require("../app.config.js");
    const collected = config.expo.ios.privacyManifests.NSPrivacyCollectedDataTypes.map(
      (item: { NSPrivacyCollectedDataType: string }) => item.NSPrivacyCollectedDataType,
    );
    const plugins = config.expo.plugins.map((plugin: string | [string, unknown]) =>
      Array.isArray(plugin) ? plugin[0] : plugin,
    );

    expect(collected).toEqual(expect.arrayContaining([
      "NSPrivacyCollectedDataTypeUserID",
      "NSPrivacyCollectedDataTypeAudioData",
      "NSPrivacyCollectedDataTypeOtherUserContent",
    ]));
    expect(config.expo.ios.infoPlist.NSCameraUsageDescription).toBeUndefined();
    expect(config.expo.ios.infoPlist.NSPhotoLibraryUsageDescription).toBeUndefined();
    expect(plugins).not.toContain("expo-image-picker");
    expect(plugins).not.toContain("expo-local-authentication");
  });

  it("keeps Home Screen shortcuts aligned with the current four tab experience", () => {
    const config = require("../app.config.js");
    const shortcuts = config.expo.ios.infoPlist.UIApplicationShortcutItems;

    expect(shortcuts.map((item: { UIApplicationShortcutItemTitle: string }) => item.UIApplicationShortcutItemTitle)).toEqual([
      "Today's briefing",
      "Spartan Coach",
      "Practice",
    ]);
    expect(shortcuts.map((item: { UIApplicationShortcutItemUserInfo: { url: string } }) => item.UIApplicationShortcutItemUserInfo.url)).toEqual([
      "spartan-coaching-mobile://home",
      "spartan-coaching-mobile://coach",
      "spartan-coaching-mobile://tools",
    ]);
  });
});
