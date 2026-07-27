describe("Expo production configuration", () => {
  const originalDomain = process.env.EXPO_PUBLIC_DOMAIN;
  const originalOrigin = process.env.EXPO_PUBLIC_WEB_ORIGIN;

  afterEach(() => {
    if (originalDomain === undefined) delete process.env.EXPO_PUBLIC_DOMAIN;
    else process.env.EXPO_PUBLIC_DOMAIN = originalDomain;

    if (originalOrigin === undefined) delete process.env.EXPO_PUBLIC_WEB_ORIGIN;
    else process.env.EXPO_PUBLIC_WEB_ORIGIN = originalOrigin;

    jest.resetModules();
  });

  it("defaults native routing to the live Spartan Coaching host", () => {
    delete process.env.EXPO_PUBLIC_DOMAIN;
    delete process.env.EXPO_PUBLIC_WEB_ORIGIN;

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
});
