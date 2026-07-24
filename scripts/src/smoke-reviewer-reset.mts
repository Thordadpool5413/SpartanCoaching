/**
 * Smoke test — POST /api/admin/reviewer/reset-password
 *
 * Verifies the full round-trip: HTTP call → response shape { ok, email, password, created }.
 * Runs against a live server using the ADMIN_PASSWORD env var (X-Admin-Auth header auth path).
 *
 * Usage:
 *   ADMIN_PASSWORD=<your-password> SITE_URL=https://your-host \
 *     pnpm --filter @workspace/scripts run smoke:reviewer-reset
 *
 * Or against the local dev proxy (Replit):
 *   ADMIN_PASSWORD=5413 SITE_URL=http://localhost:80 \
 *     pnpm --filter @workspace/scripts run smoke:reviewer-reset
 *
 * Exit 0 = pass. Exit 1 = fail (details printed to stderr).
 */

const SITE_URL = (process.env.SITE_URL ?? "http://localhost:80").replace(/\/$/, "");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const ENDPOINT = `${SITE_URL}/api/admin/reviewer/reset-password`;
const EXPECTED_EMAIL = "apple-reviewer@spartanhospicecoaching.com";

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.error(`  ❌ ${label}${detail ? `: ${detail}` : ""}`);
  failed++;
}

async function checkUnauthRejected(): Promise<void> {
  console.log("\n[1] Unauthenticated request should be rejected (401 or 403)");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (res.status === 401 || res.status === 403) {
    pass(`status ${res.status} — gate is closed`);
  } else {
    fail("expected 401 or 403", `got ${res.status}`);
  }
  const body = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (body.code === "ADMIN_REQUIRED") {
    pass("error code is ADMIN_REQUIRED");
  } else {
    fail("expected error code ADMIN_REQUIRED", JSON.stringify(body));
  }
}

async function checkWrongHeaderRejected(): Promise<void> {
  if (!ADMIN_PASSWORD) {
    console.log("\n[2] Skipped wrong-header check (ADMIN_PASSWORD not set)");
    return;
  }
  console.log("\n[2] Wrong X-Admin-Auth header should be rejected (401 or 403)");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Auth": "wrong-password-value-that-should-never-match",
    },
    body: JSON.stringify({}),
  });
  if (res.status === 401 || res.status === 403) {
    pass(`status ${res.status} — wrong header rejected`);
  } else {
    fail("expected 401 or 403 for wrong header", `got ${res.status}`);
  }
}

async function checkResetSucceeds(): Promise<void> {
  if (!ADMIN_PASSWORD) {
    console.log("\n[3] Skipped full reset check (ADMIN_PASSWORD not set — set it to run this check)");
    return;
  }
  console.log("\n[3] Authorized reset — checking full round-trip and response shape");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Auth": ADMIN_PASSWORD,
    },
    body: JSON.stringify({}),
  });

  if (res.status !== 200) {
    fail(`expected 200`, `got ${res.status}`);
    const text = await res.text().catch(() => "<unreadable>");
    console.error("    body:", text);
    return;
  }
  pass("HTTP 200");

  const body = await res.json() as Record<string, unknown>;

  if (body.ok === true) {
    pass("ok === true");
  } else {
    fail("ok should be true", JSON.stringify(body));
  }

  if (typeof body.email === "string" && body.email.length > 0) {
    pass(`email present: ${body.email}`);
  } else {
    fail("email missing or empty", JSON.stringify(body));
  }

  if (body.email === EXPECTED_EMAIL) {
    pass("email matches expected reviewer address");
  } else {
    fail(`email mismatch — expected ${EXPECTED_EMAIL}`, `got ${String(body.email)}`);
  }

  if (typeof body.password === "string" && body.password.length >= 8) {
    pass(`password present (${body.password.length} chars)`);
  } else {
    fail("password missing or too short", JSON.stringify(body));
  }

  if (typeof body.created === "boolean") {
    pass(`created flag is boolean: ${String(body.created)}`);
  } else {
    fail("created should be a boolean", JSON.stringify(body));
  }

  console.log("\n  ── Reviewer credentials ──────────────────────────────────────");
  console.log(`  Email:    ${String(body.email)}`);
  console.log(`  Password: ${String(body.password)}`);
  console.log(`  Created:  ${String(body.created)}`);
  console.log("  ──────────────────────────────────────────────────────────────");
  console.log("  Copy these into App Store Connect → App Review Information.");
}

async function main(): Promise<void> {
  console.log(`\nSmoke: POST ${ENDPOINT}`);
  console.log(`Auth:  ${ADMIN_PASSWORD ? "X-Admin-Auth (ADMIN_PASSWORD set)" : "none (ADMIN_PASSWORD not set — skipping authenticated checks)"}`);

  await checkUnauthRejected();
  await checkWrongHeaderRejected();
  await checkResetSucceeds();

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error("smoke-reviewer-reset fatal error:", err);
  process.exit(1);
});
