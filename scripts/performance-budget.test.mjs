import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./performance-budget.mjs", import.meta.url));

function writeSizedFile(file, size, contents = "x") {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents.repeat(Math.max(1, size)));
}

function makeBudgetFixture(mode) {
  const root = mkdtempSync(path.join(os.tmpdir(), "performance-budget-"));
  const distPublic = path.join(root, "dist/public");
  mkdirSync(path.join(distPublic, "assets"), { recursive: true });

  writeFileSync(
    path.join(distPublic, "index.html"),
    '<!doctype html><html><body><script type="module" src="/assets/index.js"></script></body></html>',
  );
  writeSizedFile(path.join(distPublic, "assets/index.js"), 1024);
  writeSizedFile(path.join(distPublic, "hero-video.mp4"), 1024);
  writeSizedFile(path.join(distPublic, "hero-video-mobile.mp4"), 1024);
  writeSizedFile(path.join(distPublic, "hero-poster.jpg"), 1024);

  if (mode === "pass") {
    writeSizedFile(path.join(distPublic, "assets/index.css"), 32 * 1024);
  } else {
    writeSizedFile(path.join(distPublic, "assets/index.css"), 200 * 1024);
    writeSizedFile(path.join(distPublic, "assets/portal.css"), 170 * 1024);
    writeSizedFile(path.join(distPublic, "uppy-core.css"), 45 * 1024);
  }

  return { root, distPublic };
}

function runBudget(cwd, distPublic) {
  const env = { ...process.env };
  if (distPublic) env.PERFORMANCE_BUDGET_DIST_PUBLIC = distPublic;
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    env,
    encoding: "utf8",
  });
}

test("uses cwd dist/public when repository artifact paths are absent", () => {
  const { root, distPublic } = makeBudgetFixture("pass");
  try {
    const result = runBudget(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`Using build output: ${distPublic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(result.stdout, /All budgets within limits\./);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("counts root-level CSS files toward the total CSS budget", () => {
  const { root, distPublic } = makeBudgetFixture("fail-root-css");
  try {
    const result = runBudget(root);
    assert.notEqual(result.status, 0, "budget check should fail when root-level CSS pushes total over the limit");
    assert.match(result.stdout, /FAIL CSS total/);
    assert.match(result.stderr, /Bundle exceeds Wave 4 budgets/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("prefers an explicit dist/public override when provided", () => {
  const fallback = makeBudgetFixture("fail-root-css");
  const override = makeBudgetFixture("pass");
  try {
    const result = runBudget(fallback.root, override.distPublic);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`Using build output: ${override.distPublic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(result.stdout, /All budgets within limits\./);
  } finally {
    rmSync(fallback.root, { recursive: true, force: true });
    rmSync(override.root, { recursive: true, force: true });
  }
});
