import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_SITEMAP_PATHS,
  SITE_ORIGIN,
  getSEOConfig,
  hasExplicitSEOConfig,
  isNoIndexPath,
} from "./seo-config";

const siteRoot = path.resolve(process.cwd(), ".");

function readPublic(name: string) {
  return fs.readFileSync(path.join(siteRoot, "public", name), "utf8");
}

function appRoutePaths() {
  const appSource = fs.readFileSync(path.join(siteRoot, "src", "App.tsx"), "utf8");
  return [...appSource.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1]);
}

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(siteRoot, "src", relativePath), "utf8");
}

describe("public launch contract", () => {
  it("uses one canonical host in robots and the sitemap", () => {
    const robots = readPublic("robots.txt");
    const sitemap = readPublic("sitemap.xml");
    const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
    expect(sitemapUrls).toEqual(
      PUBLIC_SITEMAP_PATHS.map((route) => `${SITE_ORIGIN}${route === "/" ? "/" : route}`),
    );
  });

  it("gives every sitemap route specific indexable metadata", () => {
    for (const route of PUBLIC_SITEMAP_PATHS) {
      const config = getSEOConfig(route);
      expect(config.title).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.noIndex).not.toBe(true);
    }
  });

  it("keeps metadata and index policy explicit for every routed page", () => {
    expect(readSource("App.tsx")).toContain("<SEO />");

    for (const route of appRoutePaths()) {
      const isDynamic = route.includes(":");
      const hasExplicitPolicy = hasExplicitSEOConfig(route) || isNoIndexPath(route);

      expect(
        hasExplicitPolicy,
        `${route} must have route-specific metadata or an explicit no-index policy`,
      ).toBe(true);

      if (isDynamic) {
        expect(
          isNoIndexPath(route),
          `${route} is dynamic and must stay out of search until it has a canonical public-route policy`,
        ).toBe(true);
      }
    }
  });

  it("does not reuse a public page title or description", () => {
    const configs = PUBLIC_SITEMAP_PATHS.map((route) => getSEOConfig(route));
    const titles = configs.map((config) => config.title);
    const descriptions = configs.map((config) => config.description);

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("keeps the catch-all Not Found page out of search", () => {
    const appSource = readSource("App.tsx");
    const notFoundSource = readSource("pages/not-found.tsx");

    expect(appSource).toContain("<Route component={NotFound} />");
    expect(notFoundSource).toMatch(/<SEO[\s\S]*\bnoIndex\b/);
  });

  it("keeps account, workspace, and template routes out of search", () => {
    for (const route of [
      "/login",
      "/register",
      "/checkout-return",
      "/portal",
      "/tools/sales-workflow",
      "/org/admin",
      "/contract",
      "/nda",
      "/brand-video",
    ]) {
      expect(isNoIndexPath(route)).toBe(true);
      expect(PUBLIC_SITEMAP_PATHS).not.toContain(route);
    }
  });
});