/**
 * Lightweight live health smoke (no auth).
 * Usage: node scripts/smoke-health.mjs https://your-deploy.replit.app
 *
 * Exits 0 if all checks pass, 1 if any fail.
 * Suitable as a post-deploy check: run this after each deployment to catch
 * misconfigured secrets (e.g. stale STRIPE_WEBHOOK_SECRET) before they cause
 * silent billing failures.
 *
 * The /api/admin/stripe-webhook-health check is intentionally strict:
 *  - HTTP 503 OR ok:false in the JSON body both count as failures.
 *  - The reason + hint from the response are printed so the fix is obvious.
 */
const base = (process.argv[2] || process.env.SITE_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke-health.mjs <SITE_URL>");
  process.exit(1);
}

let failed = 0;

/**
 * Check a JSON endpoint.
 * @param {string} path
 * @param {{ checkBodyOk?: boolean }} opts
 *   checkBodyOk: also parse the JSON body and fail if body.ok === false,
 *                even when the HTTP status is 2xx.
 */
async function checkJsonEndpoint(path, { checkBodyOk = false } = {}) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        if (body?.reason) detail = ` — ${body.reason}: ${body.hint ?? ""}`;
      } catch {
        // ignore JSON parse failure; HTTP status is enough signal
      }
      console.log(`FAIL ${res.status} ${path}${detail}`);
      failed += 1;
      return;
    }
    if (checkBodyOk) {
      let body;
      try {
        body = await res.json();
      } catch {
        console.log(`FAIL ${res.status} ${path} — could not parse JSON body`);
        failed += 1;
        return;
      }
      if (body?.ok === false) {
        const detail = body.reason
          ? ` — ${body.reason}: ${body.hint ?? ""}`
          : " (ok:false in body)";
        console.log(`FAIL ${res.status} ${path}${detail}`);
        failed += 1;
        return;
      }
    }
    console.log(`OK  ${res.status} ${path}`);
  } catch (err) {
    console.log(`FAIL ERR ${path} — ${err?.message || err}`);
    failed += 1;
  }
}

// ── JSON API health endpoints ──────────────────────────────────────────────
await checkJsonEndpoint("/api/health");
await checkJsonEndpoint("/api/admin/bootstrap-status");

// Webhook health: check both HTTP status AND JSON body ok field, and print
// the actionable reason+hint when it fails so the fix is clear in deploy logs.
await checkJsonEndpoint("/api/admin/stripe-webhook-health", { checkBodyOk: true });

// ── Public HTML shells (SPA) ──────────────────────────────────────────────
for (const p of ["/", "/request-access", "/login", "/admin/access-desk", "/faq"]) {
  const url = `${base}${p}`;
  try {
    const res = await fetch(url);
    const ok = res.ok;
    console.log(`${ok ? "OK " : "FAIL"} ${res.status} ${p}`);
    if (!ok) failed += 1;
  } catch (err) {
    console.log(`FAIL ERR ${p} — ${err?.message || err}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed. Fix the issues above and redeploy.`);
}
process.exit(failed ? 1 : 0);
