#!/usr/bin/env node
/**
 * Public launch audit for Spartan Coaching.
 *
 * Usage:
 *   pnpm run audit:public
 *   pnpm run audit:public -- https://spartanhospicecoaching.com
 *
 * The static contract catches SEO, structured-data, and route drift before a
 * deployment. Passing a URL adds a production-like crawl of every sitemap URL
 * and validates that pages return an HTML success response.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteRoot = path.join(root, "artifacts", "spartan-coaching");
const siteOrigin = "https://spartanhospicecoaching.com";
const liveOrigin = (process.argv[2] || process.env.PUBLIC_SITE_URL || "").replace(/\/$/, "");
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(siteRoot, relativePath), "utf8");
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sitemapPaths(sitemap) {
  return [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]);
    return url.pathname;
  });
}

async function crawlPublicRoutes(origin, paths, expectedMetadata) {
  console.log(`[public-site-audit] Crawling ${paths.length} public routes on ${origin}`);
  for (const route of paths) {
    const url = new URL(route, `${origin}/`);
    const started = performance.now();
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
      const elapsed = performance.now() - started;
      const contentType = response.headers.get("content-type") || "";
      const contentLength = Number(response.headers.get("content-length") || "0");
      const canonical = `${siteOrigin}${route}`;
      const html = await response.text();
      const metadata = expectedMetadata[route];
      check(response.ok, `${route}: received HTTP ${response.status}`);
      check(contentType.includes("text/html"), `${route}: expected HTML but received ${contentType || "no content-type"}`);
      check(response.headers.get("link")?.includes(`<${canonical}>; rel="canonical"`), `${route}: missing route-specific canonical Link header`);
      check(!response.headers.get("x-robots-tag")?.includes("noindex"), `${route}: must be indexable at the HTTP layer`);
      check(html.includes(`<link rel="canonical" href="${canonical}">`), `${route}: missing route-specific canonical HTML`);
      check(html.includes(`<meta property="og:url" content="${canonical}">`), `${route}: missing route-specific Open Graph URL`);
      check(html.includes('<meta name="robots" content="index, follow">'), `${route}: missing indexable robots HTML`);
      check(Boolean(metadata), `${route}: missing generated route metadata`);
      if (metadata) {
        check(html.includes(`<title>${escapeHtml(metadata.title)}</title>`), `${route}: missing route-specific title`);
        check(html.includes(`<meta name="description" content="${escapeHtml(metadata.description)}">`), `${route}: missing route-specific description`);
        check(html.includes(`<meta property="og:title" content="${escapeHtml(metadata.title)}">`), `${route}: missing route-specific Open Graph title`);
        check(html.includes(`<meta property="og:description" content="${escapeHtml(metadata.description)}">`), `${route}: missing route-specific Open Graph description`);
        check(html.includes(`<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`), `${route}: missing route-specific Twitter title`);
        check(html.includes(`<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`), `${route}: missing route-specific Twitter description`);
      }
      // This is a deliberately generous document-response smoke budget, not a
      // Core Web Vitals assertion. Bundle/media budgets run separately.
      check(elapsed < 5_000, `${route}: document response exceeded 5 seconds (${Math.round(elapsed)}ms)`);
      check(!contentLength || contentLength < 100 * 1024, `${route}: HTML document exceeds 100 KiB`);
      console.log(`  ${response.ok ? "OK " : "ERR"} ${route} ${response.status} ${Math.round(elapsed)}ms`);
    } catch (error) {
      failures.push(`${route}: crawl request failed (${error instanceof Error ? error.message : String(error)})`);
    }
  }
}

async function crawlNoindexRoutes(origin) {
  const privatePaths = ["/login", "/register", "/portal", "/tools/sales-workflow", "/contract", "/nda"];
  console.log(`[public-site-audit] Checking ${privatePaths.length} private routes for no-index headers`);
  for (const route of privatePaths) {
    try {
      const response = await fetch(new URL(route, `${origin}/`), {
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      const canonical = `${siteOrigin}${route}`;
      const html = await response.text();
      check(response.ok, `${route}: private SPA route did not resolve`);
      check(response.headers.get("x-robots-tag")?.includes("noindex"), `${route}: missing HTTP noindex header`);
      check(html.includes('<meta name="robots" content="noindex, nofollow">'), `${route}: missing noindex HTML`);
      check(response.headers.get("link")?.includes(`<${canonical}>; rel="canonical"`), `${route}: missing route-specific canonical Link header`);
    } catch (error) {
      failures.push(`${route}: noindex route check failed (${error instanceof Error ? error.message : String(error)})`);
    }
  }
}

const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");
const indexHtml = read("index.html");
const seoConfig = read("src/lib/seo-config.ts");
const home = read("src/pages/Home.tsx");
const routeManifest = JSON.parse(read("public/seo-routes.json"));
const auditPaths = sitemapPaths(sitemap);
const contractPaths = routeManifest.publicPaths;
const generatedMetadataPath = path.join(siteRoot, "dist", "public", "seo-metadata.json");
const generatedMetadata = fs.existsSync(generatedMetadataPath)
  ? JSON.parse(fs.readFileSync(generatedMetadataPath, "utf8"))
  : {};

console.log("[public-site-audit] Static launch contract");
check(
  robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`),
  "robots.txt must reference the canonical sitemap URL",
);
check(auditPaths.length > 0, "sitemap.xml must contain at least one URL");
check(
  auditPaths.every((route) => sitemap.includes(`${siteOrigin}${route === "/" ? "/" : route}`)),
  "every sitemap URL must use the canonical production origin",
);
check(
  new Set(auditPaths).size === auditPaths.length,
  "sitemap.xml contains duplicate routes",
);
check(
  JSON.stringify(auditPaths) === JSON.stringify(contractPaths),
  "sitemap.xml must exactly match PUBLIC_SITEMAP_PATHS",
);
check(
  auditPaths.every((route) => new RegExp(`['"]${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]\\s*:`).test(seoConfig)),
  "every sitemap route must have route-specific SEO metadata",
);
check(routeManifest.noindexPrefixes.includes("/login"), "route manifest must include the login noindex prefix");
check(routeManifest.noindexPrefixes.includes("/tools/"), "route manifest must include gated tool routes");
check(!auditPaths.some((route) => route === "/login" || route === "/welcome"), "sitemap must exclude duplicate/auth entry pages");
check(indexHtml.includes(`<link rel="canonical" href="${siteOrigin}/" />`), "index.html must expose the canonical homepage URL");
check(indexHtml.includes(`<meta property="og:url" content="${siteOrigin}/" />`), "index.html must expose a canonical Open Graph URL");
check(indexHtml.includes(`content="${siteOrigin}/og-image.png"`), "social images must use absolute canonical URLs");
check(home.includes('"@type": "ProfessionalService"'), "homepage must describe the real consulting business with structured data");
check(home.includes('"@type": "WebSite"'), "homepage must expose WebSite structured data");
check(home.includes("SITE_ORIGIN"), "homepage structured data must share the production-origin constant");

if (liveOrigin) {
  await crawlPublicRoutes(liveOrigin, auditPaths, generatedMetadata);
  await crawlNoindexRoutes(liveOrigin);
} else {
  console.log("[public-site-audit] Live crawl skipped. Pass PUBLIC_SITE_URL or a URL argument after deployment.");
}

if (failures.length) {
  console.error("\nPUBLIC SITE AUDIT FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\nPUBLIC SITE AUDIT PASSED${liveOrigin ? " (static contract + live crawl)" : " (static contract)"}.`);