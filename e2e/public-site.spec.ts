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

type AppearanceMode = "light" | "dark";

async function usePublicAppearance(page: Page, mode: AppearanceMode) {
  await page.addInitScript((appearanceMode) => {
    localStorage.setItem("spartan_theme", JSON.stringify(appearanceMode));
    localStorage.setItem("spartan_bg", appearanceMode === "light" ? "soft" : "midnight");
    localStorage.setItem("spartan_accent", "red");
    localStorage.setItem("spartan_theme_preset", "custom");
  }, mode);
}

async function expectReadableContrast(locator: Locator, label: string) {
  await expect(locator, `${label} must be visible`).toBeVisible();

  const failures = await locator.evaluate((root) => {
    type Rgba = { r: number; g: number; b: number; a: number };
    const parseColor = (value: string): Rgba | null => {
      const match = value.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\)/);
      if (!match) return null;
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] === undefined ? 1 : Number(match[4]),
      };
    };
    const composite = (front: Rgba, back: Rgba): Rgba => {
      const alpha = front.a + back.a * (1 - front.a);
      if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
        g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
        b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
        a: alpha,
      };
    };
    const backgroundFor = (element: Element): Rgba => {
      const layers: Rgba[] = [];
      let current: Element | null = element;
      while (current) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && color.a > 0) layers.push(color);
        current = current.parentElement;
      }
      return layers.reduceRight(
        (background, layer) => composite(layer, background),
        { r: 255, g: 255, b: 255, a: 1 },
      );
    };
    const luminance = ({ r, g, b }: Rgba) => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const contrast = (first: Rgba, second: Rgba) => {
      const lighter = Math.max(luminance(first), luminance(second));
      const darker = Math.min(luminance(first), luminance(second));
      return (lighter + 0.05) / (darker + 0.05);
    };
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, span, a, button, [role='button']"),
    ).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0 &&
        Boolean(element.textContent?.trim()) &&
        element.getAttribute("aria-hidden") !== "true" &&
        !element.querySelector("h1, h2, h3, h4, p, span, a, button, [role='button']")
      );
    });

    return candidates.flatMap((element) => {
      const style = getComputedStyle(element);
      const foreground = parseColor(style.color);
      if (!foreground) return [`${element.tagName}: unparseable color ${style.color}`];
      const background = backgroundFor(element);
      const renderedForeground = composite(foreground, background);
      const ratio = contrast(renderedForeground, background);
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
      const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const required = element.matches("button, [role='button']") ? 3 : largeText ? 3 : 4.5;
      return ratio + 0.01 < required
        ? [`${element.tagName} "${element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80)}" ${ratio.toFixed(2)}:1 < ${required}:1 (color ${style.color}; background ${background.r.toFixed(0)}, ${background.g.toFixed(0)}, ${background.b.toFixed(0)})`]
        : [];
    });
  });

  expect(failures, `${label} has unreadable rendered text:\n${failures.join("\n")}`).toEqual([]);
}

test.describe("public website release gate", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`intentional dark public sections retain readable text in ${mode} appearance`, async ({
      page,
    }) => {
      await isolatePublicPage(page);
      await usePublicAppearance(page, mode);

      for (const region of [
        { path: "/", testId: "section-method", label: "Home method section" },
        { path: "/services", testId: "section-services-closing", label: "Consulting closing section" },
        { path: "/method", testId: "section-method-closing", label: "Spartan Method closing section" },
      ]) {
        await page.goto(region.path, { waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveAttribute("data-theme-mode", mode);
        await expectReadableContrast(page.getByTestId(region.testId), `${region.label} (${mode})`);
      }
    });

    test(`public header controls retain readable contrast in ${mode} appearance`, async ({
      page,
    }, testInfo) => {
      await isolatePublicPage(page);
      await usePublicAppearance(page, mode);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", mode);

      const header = page.getByTestId("site-header");
      await expect(header.getByTestId("link-home")).toBeVisible();

      if (testInfo.project.name === "desktop-chromium") {
        await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
        await expect(page.getByTestId("button-login")).toBeVisible();
        await expect(page.getByTestId("button-book-call")).toBeVisible();
        await expectReadableContrast(header, `desktop header (${mode})`);
      } else {
        await expect(page.getByTestId("button-mobile-menu")).toBeVisible();
        await expectReadableContrast(header, `phone header (${mode})`);
        await page.getByTestId("button-mobile-menu").click();
        const menu = page.getByRole("dialog");
        await expect(menu.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
        await expect(menu.getByText("Client Login", { exact: true })).toBeVisible();
        await expect(menu.getByTestId("button-mobile-book-call")).toBeVisible();
        await expectReadableContrast(menu, `phone menu (${mode})`);
      }
    });
  }

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

  test("home preserves the approved consulting-first business hierarchy", async ({ page }) => {
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1:visible").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /request a strategy call/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /explore consulting/i }).first()).toBeVisible();
    await expect(page.locator("main")).toContainText("The problems we solve.");
    await expect(page.locator("main")).toContainText("Who we work with.");
    await expect(page.locator("main")).toContainText("Diagnose.");
    await expect(page.locator("main")).toContainText("Install.");
    await expect(page.locator("main")).toContainText("Sustain.");
    await expect(page.locator("main")).not.toContainText("Hospice Sales Pro");
    await expect(page.locator("main")).toContainText(
      /Built by someone\s*who has\s*carried the number\./,
    );
  });

  test("consulting CTA and product route remain stable", async ({ page }) => {
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByRole("link", { name: /request a strategy call/i }).first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator("h1").first()).toBeVisible();

    await page.goto("/hospice-sales-pro", { waitUntil: "domcontentloaded" });
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
    const heroVideo = page.getByTestId("hero-video");
    await expect(heroVideo).toHaveCount(1);
    await expect(heroVideo).toHaveAttribute("poster", /hero-poster\.jpg$/);
    await expect
      .poll(() => heroVideo.evaluate((element: HTMLVideoElement) => element.paused))
      .toBe(true);
    await attachRegion(page, testInfo, "section-hero", "home-hero-reduced-motion");
  });

  test("homepage consulting paths remain stable after navigation and reload", async ({ page }) => {
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "networkidle" });

    const consulting = page.getByRole("link", { name: /^explore consulting$/i }).first();
    const booking = page.getByRole("link", { name: /request a strategy call/i }).first();
    await expect(consulting).toHaveAttribute("href", "/services");
    await expect(booking).toHaveAttribute("href", "/contact");
    await expect(page.locator('main a[href="/hospice-sales-pro"]')).toHaveCount(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("section-pathways")).toBeVisible();
    await expect(page.getByRole("link", { name: /^explore consulting$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /request a strategy call/i }).first()).toBeVisible();
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
    const menuButtons = navigation.getByRole("button");
    await expect(navigation).toBeVisible();
    await expect(links).toHaveCount(1);
    await expect(navigation.getByRole("link", { name: /^about$/i })).toBeVisible();
    await expect(menuButtons).toHaveCount(3);
    await expectNoHorizontalOverflow(page, "xl desktop navigation");

    const navigationItems = [
      ...Array.from({ length: await menuButtons.count() }, (_, index) => menuButtons.nth(index)),
      ...Array.from({ length: await links.count() }, (_, index) => links.nth(index)),
    ];
    for (let index = 0; index < navigationItems.length; index += 1) {
      await navigationItems[index].focus();
      await expectKeyboardFocus(navigationItems[index], `desktop navigation item ${index + 1}`);
    }
  });

  test("mobile header keeps branding and menu usable at 390px", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await isolatePublicPage(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts?.ready);

    const header = page.locator("header.public-site-header");
    const menu = page.getByTestId("button-mobile-menu");

    await expect(header).toBeVisible();
    await expect(header.getByTestId("link-home")).toBeVisible();
    await expect(menu).toBeVisible();
    await expect(page.getByTestId("button-login")).toBeVisible();
    await expect(page.getByTestId("button-book-call")).toBeHidden();
    await expectNoHorizontalOverflow(page, "390px public header");

    await page.keyboard.press("Tab");
    await menu.focus();
    await expectKeyboardFocus(menu, "390px menu control");

    await menu.click();
    const mobileMenu = page.getByRole("dialog");
    await expect(mobileMenu).toBeVisible();
    await expect(mobileMenu.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expect(mobileMenu.getByText("Client Login", { exact: true })).toBeVisible();
    await expect(mobileMenu.getByTestId("button-mobile-book-call")).toBeVisible();
    await expectNoHorizontalOverflow(page, "390px mobile menu");

    await testInfo.attach(`public-header-mobile-menu-${testInfo.project.name}`, {
      body: await page.screenshot({ animations: "disabled", caret: "hide" }),
      contentType: "image/png",
    });
  });
});
