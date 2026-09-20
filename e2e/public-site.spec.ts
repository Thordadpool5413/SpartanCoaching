import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const publicPages = [
  { path: "/", name: "home" },
  { path: "/services", name: "services" },
  { path: "/programs", name: "programs" },
  { path: "/method", name: "method" },
  { path: "/hospice-sales-pro", name: "hospice-sales-pro" },
  { path: "/about", name: "about" },
  { path: "/tools", name: "tools" },
  { path: "/resources", name: "resources" },
  { path: "/faq", name: "faq" },
  { path: "/contact", name: "contact" },
] as const;

async function isolatePublicPage(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthenticated" }),
    }),
  );
  await page.route("**/api/analytics/track", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.route("**/api/resources", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ownershipLabel: "Hospice Sales Pro Core",
        resources: [
          {
            id: 1,
            title: "Hospice conversation field guide",
            description:
              "A practical guide for preparing clear, ethical referral conversations.",
            fileUrl: "/resources/files/field-guide.pdf",
            category: "guide",
            createdAt: "2026-01-01T00:00:00.000Z",
            contentArchitecture: null,
            seriesKey: null,
            versionLabel: "1.0",
            lifecycleStatus: "published",
            supersededById: null,
            isCurrent: true,
          },
        ],
      }),
    }),
  );
}

async function prepareWorkspaceAppearanceRefresh(page: Page) {
  await page.addInitScript(() => {
    const appearanceKeys = new Set([
      "spartan_theme",
      "spartan_bg",
      "spartan_accent",
      "spartan_theme_preset",
      "spartan_theme_sync",
    ]);
    const savedAppearance = {
      theme: JSON.stringify("dark"),
      background: "forest",
      accent: "purple",
      themePreset: "custom",
      sync: JSON.stringify({
        mode: "dark",
        accent: "purple",
        background: "forest",
        themePreset: "custom",
        t: 0,
      }),
    };

    if (!localStorage.getItem("spartan_theme_preset")) {
      localStorage.setItem("spartan_theme", savedAppearance.theme);
      localStorage.setItem("spartan_bg", savedAppearance.background);
      localStorage.setItem("spartan_accent", savedAppearance.accent);
      localStorage.setItem("spartan_theme_preset", savedAppearance.themePreset);
      localStorage.setItem("spartan_theme_sync", savedAppearance.sync);
    }

    const appearanceWrites: Array<{ key: string; value: string }> = [];
    Object.defineProperty(window, "__spartanAppearanceWrites", {
      configurable: true,
      value: appearanceWrites,
    });

    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (this === localStorage && appearanceKeys.has(key)) {
        appearanceWrites.push({ key, value });
      }
      return originalSetItem.call(this, key, value);
    };
  });

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        member: {
          id: 7,
          email: "appearance-test@example.com",
          name: "Appearance Test",
          role: "member",
          organizationId: 1,
          status: "active",
        },
        organization: {
          id: 1,
          name: "Appearance Test Organization",
          type: "personal",
          seatLimit: 1,
          status: "active",
        },
        fieldKit: {
          allowed: true,
          reason: null,
          hoursRemaining: null,
        },
      }),
    }),
  );
  await page.route("**/api/analytics/track", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.route("**/api/me/onboarding", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ member: { alsoLeadsTeam: false } }),
    }),
  );
  await page.route("**/api/v1/workspace/next-move", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ recommendation: null }),
    }),
  );
}

async function prepareHomepageVisualTest(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await isolatePublicPage(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: `
      [data-testid="button-chat-widget"],
      [data-testid="button-contact-sticky"] {
        display: none !important;
      }
    `,
  });
  await expect(page.getByTestId("section-hero")).toBeVisible();
  await expect(page.getByTestId("section-pathways")).toBeVisible();
  await expect(page.getByTestId("section-founder-authority")).toBeVisible();
  await expect(page.getByTestId("section-results")).toBeVisible();
  await expect(page.getByTestId("section-closing")).toBeVisible();
}

async function attachFullPage(page: Page, testInfo: TestInfo, name: string) {
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  await testInfo.attach(`${name}-${testInfo.project.name}`, {
    body: await page.screenshot({
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    }),
    contentType: "image/png",
  });
}

async function attachRegion(page: Page, testInfo: TestInfo, testId: string, name: string) {
  const region = page.getByTestId(testId);
  await expect(region).toBeVisible();
  const box = await region.boundingBox();
  expect(box?.width, `${name} must have visible width`).toBeGreaterThan(0);
  expect(box?.height, `${name} must have visible height`).toBeGreaterThan(0);
  await testInfo.attach(`${name}-${testInfo.project.name}`, {
    body: await region.screenshot({ animations: "disabled", caret: "hide" }),
    contentType: "image/png",
  });
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.scrollWidth - dimensions.clientWidth,
    `${label} must not overflow horizontally`,
  ).toBeLessThanOrEqual(1);
}

async function expectKeyboardFocus(locator: Locator, label: string) {
  await expect(locator, `${label} must receive keyboard focus`).toBeFocused();

  const focusState = await locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      hasOutline: styles.outlineStyle !== "none" && styles.outlineWidth !== "0px",
      hasBoxShadow: styles.boxShadow !== "none",
    };
  });

  expect(focusState.focusVisible, `${label} must use :focus-visible`).toBe(true);
  expect(
    focusState.hasOutline || focusState.hasBoxShadow,
    `${label} must retain a visible focus indicator`,
  ).toBe(true);
}

test.describe("public website release gate", () => {
  test("renders Calendly recovery states and removes the consultation token from history", async ({
    page,
  }) => {
    await isolatePublicPage(page);

    await page.goto("/contact?consultation=booked", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("card-consultation-booking-booked")).toBeVisible();
    await expect(
      page.getByText(
        "Your Access Desk request remains the source of truth. Nick will use it for any follow-up.",
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contact$/);
    expect(new URL(page.url()).searchParams.has("consultation")).toBe(false);
    await page.goBack({ waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("consultation=booked");

    await page.goto("/contact?consultation=failed", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("card-consultation-booking-failed")).toBeVisible();
    await expect(
      page.getByText(
        "Your Access Desk request is still the reliable path. Nick will follow up directly to schedule.",
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contact$/);
    expect(new URL(page.url()).searchParams.has("consultation")).toBe(false);
    await page.goBack({ waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("consultation=failed");
  });

  for (const entry of publicPages) {
    test(`${entry.name} is complete and fits the viewport`, async ({ page }, testInfo) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await isolatePublicPage(page);
      const response = await page.goto(entry.path, { waitUntil: "domcontentloaded" });

      expect(response?.ok(), `${entry.path} must return a successful document`).toBe(true);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("h1").first()).not.toHaveText("");
      await expect(page.locator("main")).toBeVisible();

      const visibleText = await page.locator("main").innerText();
      expect(
        visibleText.replace(/\s+/g, " ").trim().length,
        `${entry.path} must contain meaningful customer content`,
      ).toBeGreaterThan(250);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${entry.path} must not overflow horizontally`).toBeLessThanOrEqual(1);
      expect(pageErrors, `${entry.path} must not raise browser errors`).toEqual([]);

      await attachFullPage(page, testInfo, entry.name);
    });
  }

  test("home preserves the approved business hierarchy", async ({ page }) => {
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1:visible").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /book a strategy call/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /explore hospice sales pro/i }).first()).toBeVisible();
    await expect(page.locator("main")).toContainText("Two ways to engage");
    await expect(page.locator("main")).toContainText("Spartan Consulting");
    await expect(page.locator("main")).toContainText("Hospice Sales Pro");
    await expect(page.locator("main")).toContainText(
      /Built by someone\s*who has actually\s*carried the number\./,
    );
  });

  test("primary navigation reaches both customer paths", async ({ page }) => {
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByRole("link", { name: /book a strategy call/i }).first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator("h1").first()).toBeVisible();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /explore hospice sales pro/i }).first().click();
    await expect(page).toHaveURL(/\/hospice-sales-pro$/);
    await expect(page.locator("h1").first()).toContainText("Walk in ready.");
    await expect(page.locator("main")).toContainText("Hospice Sales Pro");
    await expect(page.locator("h1").first()).toContainText("Leave with the next move.");
    await expect(page.locator("main")).toContainText("Elite");
    await expect(page.locator("main")).toContainText("Standard");
  });

  test("homepage editorial regions remain visually stable", async ({ page }, testInfo) => {
    await prepareHomepageVisualTest(page);

    for (const region of [
      { name: "hero", testId: "section-hero" },
      { name: "pathways", testId: "section-pathways" },
      { name: "founder-authority", testId: "section-founder-authority" },
      { name: "proof-ledger", testId: "section-results" },
      { name: "closing-cta", testId: "section-closing" },
    ]) {
      await attachRegion(page, testInfo, region.testId, `home-${region.name}`);
    }
  });

  test("homepage pauses the hero video when reduced motion is preferred", async ({ page }, testInfo) => {
    await prepareHomepageVisualTest(page);

    await expect(page.getByTestId("hero-animation")).toHaveCount(0);
    const visibleVideo = page.locator('[data-testid="hero-video"]:visible').first();
    if (await visibleVideo.count()) {
      await expect(visibleVideo).toHaveAttribute("poster", /hero-poster\.jpg$/);
      await expect
        .poll(() => visibleVideo.evaluate((element: HTMLVideoElement) => element.paused))
        .toBe(true);
    } else {
      const visiblePoster = page
        .locator('[data-testid="hero-video-frame"]:visible img:visible')
        .first();
      await expect(visiblePoster).toHaveAttribute("src", /hero-poster\.jpg$/);
    }
    await attachRegion(page, testInfo, "section-hero", "home-hero-reduced-motion");
  });

  test("homepage customer paths remain stable after navigation and reload", async ({ page }) => {
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "networkidle" });

    const consulting = page.getByRole("link", { name: /explore consulting services/i });
    const platform = page.getByRole("link", { name: /explore the platform/i });
    await expect(consulting).toHaveAttribute("href", "/services");
    await expect(platform).toHaveAttribute("href", "/hospice-sales-pro");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("section-pathways")).toBeVisible();
    await expect(page.getByRole("link", { name: /explore consulting services/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /explore the platform/i })).toBeVisible();
  });

  test("workspace appearance survives a public-page refresh", async ({ page }) => {
    await prepareWorkspaceAppearanceRefresh(page);
    await page.goto("/", { waitUntil: "networkidle" });

    const savedAppearance = {
      theme: JSON.stringify("dark"),
      background: "forest",
      accent: "purple",
      themePreset: "custom",
      sync: {
        mode: "dark",
        accent: "purple",
        background: "forest",
        themePreset: "custom",
      },
    };

    const readAppearance = () =>
      page.evaluate(() => ({
        theme: localStorage.getItem("spartan_theme"),
        background: localStorage.getItem("spartan_bg"),
        accent: localStorage.getItem("spartan_accent"),
        themePreset: localStorage.getItem("spartan_theme_preset"),
        sync: (() => {
          const raw = localStorage.getItem("spartan_theme_sync");
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            mode?: string;
            accent?: string;
            background?: string;
            themePreset?: string;
          };
          return {
            mode: parsed.mode,
            accent: parsed.accent,
            background: parsed.background,
            themePreset: parsed.themePreset,
          };
        })(),
      }));
    const readAppearanceWrites = () =>
      page.evaluate(
        () =>
          (window as Window & {
            __spartanAppearanceWrites?: Array<{ key: string; value: string }>;
          }).__spartanAppearanceWrites ?? [],
      );
    const expectOnlySavedAppearanceWrites = async () => {
      const writes = await readAppearanceWrites();
      expect(
        writes.filter(({ key, value }) => {
          if (key === "spartan_theme") return value !== savedAppearance.theme;
          if (key === "spartan_bg") return value !== savedAppearance.background;
          if (key === "spartan_accent") return value !== savedAppearance.accent;
          if (key === "spartan_theme_preset") return value !== savedAppearance.themePreset;
          if (key === "spartan_theme_sync") {
            try {
              const parsed = JSON.parse(value) as {
                mode?: string;
                accent?: string;
                background?: string;
                themePreset?: string;
              };
              return (
                parsed.mode !== savedAppearance.sync.mode ||
                parsed.accent !== savedAppearance.sync.accent ||
                parsed.background !== savedAppearance.sync.background ||
                parsed.themePreset !== savedAppearance.sync.themePreset
              );
            } catch {
              return true;
            }
          }
          return true;
        }),
      ).toEqual([]);
    };

    await expect(page.locator("html")).toHaveAttribute("data-route-surface", "public");
    await expect.poll(readAppearance).toEqual(savedAppearance);
    await expectOnlySavedAppearanceWrites();

    await page.reload({ waitUntil: "networkidle" });

    await expect(page.locator("html")).toHaveAttribute("data-route-surface", "public");
    await expect.poll(readAppearance).toEqual(savedAppearance);
    await expectOnlySavedAppearanceWrites();

    await page.goto("/portal", { waitUntil: "networkidle" });

    await expect(page.locator("html")).toHaveAttribute("data-route-surface", "workspace");
    await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "purple");
    await expect(page.locator("html")).toHaveAttribute("data-bg", "forest");
    await expect(page.locator("html")).toHaveAttribute("data-theme-preset", "custom");
    await expect.poll(readAppearance).toEqual(savedAppearance);
    await expectOnlySavedAppearanceWrites();
  });

  test("workspace appearance survives a direct workspace refresh", async ({
    page,
  }) => {
    await prepareWorkspaceAppearanceRefresh(page);
    await page.goto("/portal", { waitUntil: "networkidle" });

    const savedAppearance = {
      theme: JSON.stringify("dark"),
      background: "forest",
      accent: "purple",
      themePreset: "custom",
      sync: {
        mode: "dark",
        accent: "purple",
        background: "forest",
        themePreset: "custom",
      },
    };

    const readAppearance = () =>
      page.evaluate(() => ({
        theme: localStorage.getItem("spartan_theme"),
        background: localStorage.getItem("spartan_bg"),
        accent: localStorage.getItem("spartan_accent"),
        themePreset: localStorage.getItem("spartan_theme_preset"),
        sync: (() => {
          const raw = localStorage.getItem("spartan_theme_sync");
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            mode?: string;
            accent?: string;
            background?: string;
            themePreset?: string;
          };
          return {
            mode: parsed.mode,
            accent: parsed.accent,
            background: parsed.background,
            themePreset: parsed.themePreset,
          };
        })(),
      }));
    const readAppearanceWrites = () =>
      page.evaluate(
        () =>
          (
            window as Window & {
              __spartanAppearanceWrites?: Array<{ key: string; value: string }>;
            }
          ).__spartanAppearanceWrites ?? [],
      );
    const expectOnlySavedAppearanceWrites = async () => {
      const writes = await readAppearanceWrites();
      expect(
        writes.filter(({ key, value }) => {
          if (key === "spartan_theme") return value !== savedAppearance.theme;
          if (key === "spartan_bg") return value !== savedAppearance.background;
          if (key === "spartan_accent") return value !== savedAppearance.accent;
          if (key === "spartan_theme_preset")
            return value !== savedAppearance.themePreset;
          if (key === "spartan_theme_sync") {
            try {
              const parsed = JSON.parse(value) as {
                mode?: string;
                accent?: string;
                background?: string;
                themePreset?: string;
              };
              return (
                parsed.mode !== savedAppearance.sync.mode ||
                parsed.accent !== savedAppearance.sync.accent ||
                parsed.background !== savedAppearance.sync.background ||
                parsed.themePreset !== savedAppearance.sync.themePreset
              );
            } catch {
              return true;
            }
          }
          return true;
        }),
      ).toEqual([]);
    };
    const expectWorkspaceAppearance = async () => {
      await expect(page.getByTestId("app-shell")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-route-surface",
        "workspace",
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme-mode",
        "dark",
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-accent",
        "purple",
      );
      await expect(page.locator("html")).toHaveAttribute("data-bg", "forest");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme-preset",
        "custom",
      );
      await expect.poll(readAppearance).toEqual(savedAppearance);
      await expectOnlySavedAppearanceWrites();
    };

    await expectWorkspaceAppearance();

    await page.reload({ waitUntil: "networkidle" });

    await expectWorkspaceAppearance();
  });

  test("workspace appearance survives browser back and forward across public routes", async ({
    page,
  }) => {
    await prepareWorkspaceAppearanceRefresh(page);

    const savedAppearance = {
      theme: JSON.stringify("dark"),
      background: "forest",
      accent: "purple",
      themePreset: "custom",
      sync: {
        mode: "dark",
        accent: "purple",
        background: "forest",
        themePreset: "custom",
      },
    };
    const readAppearance = () =>
      page.evaluate(() => ({
        theme: localStorage.getItem("spartan_theme"),
        background: localStorage.getItem("spartan_bg"),
        accent: localStorage.getItem("spartan_accent"),
        themePreset: localStorage.getItem("spartan_theme_preset"),
        sync: (() => {
          const raw = localStorage.getItem("spartan_theme_sync");
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            mode?: string;
            accent?: string;
            background?: string;
            themePreset?: string;
          };
          return {
            mode: parsed.mode,
            accent: parsed.accent,
            background: parsed.background,
            themePreset: parsed.themePreset,
          };
        })(),
      }));
    const readAppearanceWrites = () =>
      page.evaluate(
        () =>
          (
            window as Window & {
              __spartanAppearanceWrites?: Array<{ key: string; value: string }>;
            }
          ).__spartanAppearanceWrites ?? [],
      );
    const expectOnlySavedAppearanceWrites = async () => {
      const writes = await readAppearanceWrites();
      expect(
        writes.filter(({ key, value }) => {
          if (key === "spartan_theme") return value !== savedAppearance.theme;
          if (key === "spartan_bg") return value !== savedAppearance.background;
          if (key === "spartan_accent") return value !== savedAppearance.accent;
          if (key === "spartan_theme_preset")
            return value !== savedAppearance.themePreset;
          if (key === "spartan_theme_sync") {
            try {
              const parsed = JSON.parse(value) as {
                mode?: string;
                accent?: string;
                background?: string;
                themePreset?: string;
              };
              return (
                parsed.mode !== savedAppearance.sync.mode ||
                parsed.accent !== savedAppearance.sync.accent ||
                parsed.background !== savedAppearance.sync.background ||
                parsed.themePreset !== savedAppearance.sync.themePreset
              );
            } catch {
              return true;
            }
          }
          return true;
        }),
      ).toEqual([]);
    };
    const expectSavedAppearance = async () => {
      await expect.poll(readAppearance).toEqual(savedAppearance);
      await expectOnlySavedAppearanceWrites();
    };
    const expectPublicAppearance = async () => {
      await expect(page.locator("html")).toHaveAttribute(
        "data-route-surface",
        "public",
      );
      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "dark");
      await expect(page.locator("html")).toHaveAttribute("data-accent", "purple");
      await expect(page.locator("html")).toHaveAttribute("data-bg", "forest");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme-preset",
        "custom",
      );
      await expectSavedAppearance();
    };
    const expectWorkspaceAppearance = async () => {
      await expect(page.getByTestId("app-shell")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-route-surface",
        "workspace",
      );
      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "dark");
      await expect(page.locator("html")).toHaveAttribute("data-accent", "purple");
      await expect(page.locator("html")).toHaveAttribute("data-bg", "forest");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme-preset",
        "custom",
      );
      await expectSavedAppearance();
    };

    await page.goto("/", { waitUntil: "networkidle" });
    await expectPublicAppearance();

    await page.goto("/portal", { waitUntil: "networkidle" });
    await expectWorkspaceAppearance();

    await page.goBack({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/$/);
    await expectPublicAppearance();

    await page.goForward({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/portal$/);
    await expectWorkspaceAppearance();
  });

  test("public header stays composed at the xl and wide desktop boundaries", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await isolatePublicPage(page);

    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts?.ready);

      const header = page.locator("header.public-site-header");
      const navigation = page.getByRole("navigation", { name: "Main navigation" });
      const search = page.getByTestId("button-mobile-search");
      const menu = page.getByTestId("button-mobile-menu");
      const login = page.getByTestId("button-login");
      const primaryAction = page.getByTestId("button-book-call");

      await expect(header).toBeVisible();
      await expect(navigation).toBeVisible();
      await expect(search).toBeHidden();
      await expect(menu).toBeHidden();
      await expect(login).toBeVisible();
      await expect(primaryAction).toBeVisible();
      await expectNoHorizontalOverflow(page, `${width}px public header`);

      await page.keyboard.press("Tab");
      await login.focus();
      await expectKeyboardFocus(login, `${width}px login`);

      await testInfo.attach(`public-header-${width}px-${testInfo.project.name}`, {
        body: await header.screenshot({ animations: "disabled", caret: "hide" }),
        contentType: "image/png",
      });
    }
  });

  test("desktop navigation links stay keyboard-navigable at xl", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop navigation is not rendered on mobile");
    await page.setViewportSize({ width: 1280, height: 900 });
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts?.ready);

    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    const links = navigation.getByRole("link");
    await expect(navigation).toBeVisible();
    await expect(links).toHaveCount(4);
    await expectNoHorizontalOverflow(page, "xl desktop navigation");

    const linkCount = await links.count();
    for (let index = 0; index < linkCount; index += 1) {
      await links.nth(index).focus();
      await expectKeyboardFocus(links.nth(index), `desktop navigation link ${index + 1}`);
    }
  });

  test("mobile header keeps search and menu usable at 390px", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts?.ready);

    const header = page.locator("header.public-site-header");
    const search = page.getByTestId("button-mobile-search");
    const menu = page.getByTestId("button-mobile-menu");

    await expect(header).toBeVisible();
    await expect(search).toBeVisible();
    await expect(menu).toBeVisible();
    await expect(page.getByTestId("button-login")).toBeHidden();
    await expect(page.getByTestId("button-book-call")).toBeHidden();
    await expectNoHorizontalOverflow(page, "390px public header");

    await page.keyboard.press("Tab");
    await search.focus();
    await page.keyboard.press("Tab");
    await expectKeyboardFocus(menu, "390px menu control");
    await page.keyboard.press("Shift+Tab");
    await expectKeyboardFocus(search, "390px search control");

    await search.click();
    await expect(page.getByTestId("dialog-search")).toBeVisible();
    await expect(page.getByTestId("input-search")).toBeFocused();
    await expectNoHorizontalOverflow(page, "390px search dialog");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("dialog-search")).toBeHidden();

    await menu.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "390px mobile menu");

    await testInfo.attach(`public-header-mobile-menu-${testInfo.project.name}`, {
      body: await page.screenshot({ animations: "disabled", caret: "hide" }),
      contentType: "image/png",
    });
  });
});
