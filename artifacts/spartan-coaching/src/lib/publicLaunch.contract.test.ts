import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_SITEMAP_PATHS,
  SITE_ORIGIN,
  getSEOConfig,
  isNoIndexPath,
} from "./seo-config";

const siteRoot = path.resolve(process.cwd(), ".");

function readPublic(name: string) {
  return fs.readFileSync(path.join(siteRoot, "public", name), "utf8");
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
    ]) {
      expect(isNoIndexPath(route)).toBe(true);
      expect(PUBLIC_SITEMAP_PATHS).not.toContain(route);
    }
  });
});