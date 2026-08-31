import { expect, test, type Page, type TestInfo } from "@playwright/test";

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

async function attachFullPage(page: Page, testInfo: TestInfo, name: string) {
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  await testInfo.attach(`${name}-${testInfo.project.name}`, {
    body: await page.screenshot({
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    }),
    contentType: "image/png",
  });
}

test.describe("public website release gate", () => {
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
    await expect(page.locator("main")).toContainText("Elite recommended");
    await expect(page.locator("main")).toContainText("$19.99/wk");
    await expect(page.locator("main")).toContainText("Standard");
    await expect(page.locator("main")).toContainText("$14.99/wk");
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
    await expect(page.locator("h1").first()).toContainText("Choose access to your field system");
    await expect(page.locator("main")).toContainText("Hospice Sales Pro");
    await expect(page.locator("h1").first()).toContainText("access to your field system");
    await expect(page.locator("main")).toContainText("Elite");
    await expect(page.locator("main")).toContainText("Standard");
  });
});
