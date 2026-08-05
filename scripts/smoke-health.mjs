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
// Canonical route is /api/healthz. /api/health is an optional alias (added
// for deploy monitors); treat 404 as WARN until the host is redeployed.
await checkJsonEndpoint("/api/healthz");
{
  const path = "/api/health";
  const url = `${base}${path}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`OK  ${res.status} ${path}`);
    } else if (res.status === 404) {
      console.log(
        `WARN ${res.status} ${path} — alias not deployed yet (healthz is canonical; redeploy main to add /api/health)`,
      );
    } else {
      console.log(`FAIL ${res.status} ${path}`);
      failed += 1;
    }
  } catch (err) {
    console.log(`FAIL ERR ${path} — ${err?.message || err}`);
    failed += 1;
  }
}
await checkJsonEndpoint("/api/admin/bootstrap-status");

// Webhook health: check both HTTP status AND JSON body ok field, and print
// the actionable reason+hint when it fails so the fix is clear in deploy logs.
await checkJsonEndpoint("/api/admin/stripe-webhook-health", { checkBodyOk: true });

// Billing-email health: fail if ok:false (≥3 failures in 1h or ≥10 in 24h).
// HTTP 503 or ok:false in JSON body both count as failures.
await checkJsonEndpoint("/api/admin/billing-email-health", { checkBodyOk: true });

// Clinical runtime: soft by default so half-configured BAA flags do not red-light
// marketing deploys. Set REQUIRE_PHI_SMOKE=1 to fail when PHI mode is selected
// but infrastructure is incomplete (HTTP 503 / ok:false).
const requirePhiSmoke =
  process.env.REQUIRE_PHI_SMOKE === "1" ||
  process.env.REQUIRE_PHI_SMOKE === "true" ||
  process.argv.includes("--require-phi");

async function checkClinicalSoft(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (requirePhiSmoke) {
      if (!res.ok || body?.ok === false) {
        const detail = body?.hint
          ? ` — ${body.hint}`
          : body?.missingControls?.length
            ? ` — missing: ${body.missingControls.join(", ")}`
            : "";
        console.log(`FAIL ${res.status} ${path}${detail}`);
        failed += 1;
        return;
      }
      console.log(`OK  ${res.status} ${path}`);
      return;
    }
    // Soft: always report status; only fail on transport / non-JSON errors.
    if (!body || typeof body.operationMode !== "string") {
      console.log(`FAIL ${res.status} ${path} — clinical health body unexpected`);
      failed += 1;
      return;
    }
    if (body.ok === false || res.status === 503) {
      console.log(
        `WARN ${res.status} ${path} — PHI not ready (${body.missingControls?.join(", ") || body.hint || "see body"}); set REQUIRE_PHI_SMOKE=1 to fail hard`,
      );
      return;
    }
    console.log(
      `OK  ${res.status} ${path} mode=${body.operationMode}${body.usingEducationalBaseline ? " educational-baseline" : ""}`,
    );
  } catch (err) {
    console.log(`FAIL ERR ${path} — ${err?.message || err}`);
    failed += 1;
  }
}

await checkClinicalSoft("/api/admin/clinical-runtime-health");
await checkClinicalSoft("/api/healthz/clinical");

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
