#!/usr/bin/env node
/**
 * Wave 4 — elite performance budgets for the web client.
 * Fails CI if main JS/CSS assets exceed soft limits after `pnpm run build`.
 *
 * Budgets are intentional ceilings for a monorepo marketing + Field Kit SPA.
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
  /** Total JS under assets/ */
  maxJsTotal: 2.8 * 1024 * 1024,
  /** Any single CSS file */
  maxCssChunk: 250 * 1024,
  /** Total CSS under assets/ */
  maxCssTotal: 400 * 1024,
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

  console.log("[performance-budget]");
  for (const line of report) console.log(" ", line);

  if (failed) {
    console.error("\nBundle exceeds Wave 4 budgets. Investigate large chunks (framer-motion, recharts, tool pages).");
    process.exit(1);
  }
  console.log("\nAll budgets within limits.");
}

main();
