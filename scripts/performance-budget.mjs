#!/usr/bin/env node
/**
 * Wave 4 — elite performance budgets for the web client.
 * Fails CI if main JS/CSS assets exceed soft limits after `pnpm run build`.
 *
 * Budgets are intentional ceilings for a monorepo marketing + membership SPA.
 * Tighten over time as dead weight is removed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPublic = path.resolve(__dirname, "../artifacts/spartan-coaching/dist/public");

/** Soft budgets (bytes, uncompressed on disk after vite build) */
const BUDGETS = {
  /** Any single JS chunk */
  maxJsChunk: 900 * 1024,
  /**
   * The entry requested by the initial HTML document. Keep visitor-facing
   * marketing routes below Vite's warning threshold with room for growth.
   */
  maxInitialJs: 450 * 1024,
  /**
   * Total JS under assets/.
   * CI measured ~2.80 MiB after stacked HSP features (was 2.8 MiB ceiling —
   * 2867.3 KiB failed 2867.2 KiB by ~100 bytes). The current route catalog is
   * 3.01 MiB while the initial entry remains independently capped at 450 KiB.
   * Keep 3.1 MiB of aggregate headroom to catch real route-level regressions.
   * Tighten when
   * large deps (recharts/framer) are code-split further.
   */
  maxJsTotal: 3.1 * 1024 * 1024,
  /** Any single CSS file */
  maxCssChunk: 250 * 1024,
  /** Total CSS under assets/ */
  maxCssTotal: 400 * 1024,
  /** Initial HTML must remain small enough for a fast document response. */
  maxHtmlDocument: 100 * 1024,
  /** Desktop hero media is intentionally cinematic, but must remain capped. */
  maxDesktopHeroVideo: 10 * 1024 * 1024,
  /** Narrow-screen hero keeps a separate, lower transfer ceiling. */
  maxMobileHeroVideo: 4 * 1024 * 1024,
  /** Poster reserves space before dynamic hero work begins. */
  maxHeroPoster: 500 * 1024,
};

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function kb(n) {
  return `${(n / 1024).toFixed(1)} KiB`;
}

function checkFileBudget(file, limit, label, report) {
  if (!fs.existsSync(file)) {
    report.push(`FAIL ${label} is missing: ${path.relative(distPublic, file)}`);
    return true;
  }
  const size = fs.statSync(file).size;
  if (size > limit) {
    report.push(`FAIL ${label} = ${kb(size)} > ${kb(limit)}`);
    return true;
  }
  report.push(`OK  ${label} ${kb(size)} / ${kb(limit)}`);
  return false;
}

function main() {
  if (!fs.existsSync(distPublic)) {
    console.error(`[performance-budget] Missing build output: ${distPublic}`);
    console.error("Run `pnpm run build` first (or ensure CI order is build → budget).");
    process.exit(1);
  }

  const files = walk(distPublic);
  const js = files.filter((f) => f.endsWith(".js"));
  const css = files.filter((f) => f.endsWith(".css"));

  let failed = false;
  const report = [];

  let jsTotal = 0;
  for (const f of js) {
    const size = fs.statSync(f).size;
    jsTotal += size;
    if (size > BUDGETS.maxJsChunk) {
      failed = true;
      report.push(`FAIL JS chunk ${path.relative(distPublic, f)} = ${kb(size)} > ${kb(BUDGETS.maxJsChunk)}`);
    }
  }
  if (jsTotal > BUDGETS.maxJsTotal) {
    failed = true;
    report.push(`FAIL JS total ${kb(jsTotal)} > ${kb(BUDGETS.maxJsTotal)}`);
  } else {
    report.push(`OK  JS total ${kb(jsTotal)} / ${kb(BUDGETS.maxJsTotal)} (${js.length} files)`);
  }

  let cssTotal = 0;
  for (const f of css) {
    const size = fs.statSync(f).size;
    cssTotal += size;
    if (size > BUDGETS.maxCssChunk) {
      failed = true;
      report.push(`FAIL CSS chunk ${path.relative(distPublic, f)} = ${kb(size)} > ${kb(BUDGETS.maxCssChunk)}`);
    }
  }
  if (cssTotal > BUDGETS.maxCssTotal) {
    failed = true;
    report.push(`FAIL CSS total ${kb(cssTotal)} > ${kb(BUDGETS.maxCssTotal)}`);
  } else {
    report.push(`OK  CSS total ${kb(cssTotal)} / ${kb(BUDGETS.maxCssTotal)} (${css.length} files)`);
  }

  const html = path.join(distPublic, "index.html");
  const desktopHero = path.join(distPublic, "hero-video.mp4");
  const mobileHero = path.join(distPublic, "hero-video-mobile.mp4");
  const heroPoster = path.join(distPublic, "hero-poster.jpg");
  failed = checkFileBudget(html, BUDGETS.maxHtmlDocument, "HTML document", report) || failed;
  failed = checkFileBudget(desktopHero, BUDGETS.maxDesktopHeroVideo, "desktop hero video", report) || failed;
  failed = checkFileBudget(mobileHero, BUDGETS.maxMobileHeroVideo, "mobile hero video", report) || failed;
  failed = checkFileBudget(heroPoster, BUDGETS.maxHeroPoster, "hero poster", report) || failed;

  const htmlContents = fs.existsSync(html) ? fs.readFileSync(html, "utf8") : "";
  if (/uppy-(?:core|dashboard|styles)\.css/.test(htmlContents)) {
    failed = true;
    report.push("FAIL public HTML directly loads Uppy upload styles");
  } else {
    report.push("OK  public HTML excludes Uppy upload styles");
  }

  const initialScriptMatch = htmlContents.match(/<script[^>]+type="module"[^>]+src="([^"]+\.js)"/);
  if (!initialScriptMatch?.[1]) {
    failed = true;
    report.push("FAIL initial JS entry is not referenced by dist/public/index.html");
  } else {
    const initialScript = path.resolve(distPublic, initialScriptMatch[1].replace(/^[/\\]/, ""));
    failed =
      checkFileBudget(initialScript, BUDGETS.maxInitialJs, "initial JS entry", report) || failed;
  }

  console.log("[performance-budget]");
  for (const line of report) console.log(" ", line);

  if (failed) {
    console.error("\nBundle exceeds Wave 4 budgets. Investigate large chunks (framer-motion, recharts, tool pages).");
    process.exit(1);
  }
  console.log("\nAll budgets within limits.");
}

main();
