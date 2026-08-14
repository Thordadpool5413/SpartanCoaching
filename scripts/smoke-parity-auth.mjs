/**
 * Authenticated web ↔ iOS parity smoke (same seat, same API).
 *
 * Uses the mobile-style Bearer token from POST /api/auth/login (also sets
 * cookie for web). Proves one entitled account can hit the surfaces both
 * clients share: me, onboarding, billing, Command today, AI tools list,
 * and a non-mutating entitlement check on objections (or a dry 400).
 *
 * Usage:
 *   SITE_URL=https://spartanhospicecoaching.com \
 *   PARITY_EMAIL=you@example.com \
 *   PARITY_PASSWORD='…' \
 *   node scripts/smoke-parity-auth.mjs
 *
 * Or:
 *   node scripts/smoke-parity-auth.mjs https://host email password
 *
 * Optional:
 *   PARITY_SKIP_AI=1  — skip POST /api/objections (avoids AI quota)
 *
 * Exit 0 = pass, 1 = fail, 2 = missing credentials.
 */
const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const base = (args[0] || process.env.SITE_URL || "")
  .replace(/\/$/, "")
  .trim();
const email = (args[1] || process.env.PARITY_EMAIL || process.env.SMOKE_EMAIL || "")
  .trim()
  .toLowerCase();
const password = args[2] || process.env.PARITY_PASSWORD || process.env.SMOKE_PASSWORD || "";
const skipAi =
  process.env.PARITY_SKIP_AI === "1" ||
  process.env.PARITY_SKIP_AI === "true" ||
  process.argv.includes("--skip-ai");

if (!base || !email || !password) {
  console.error(`
Authenticated parity smoke — same seat as web + iOS clients.

Usage:
  SITE_URL=https://spartanhospicecoaching.com \\
  PARITY_EMAIL=you@example.com \\
  PARITY_PASSWORD='your-password' \\
  node scripts/smoke-parity-auth.mjs

  node scripts/smoke-parity-auth.mjs https://host email password

Optional: PARITY_SKIP_AI=1 to avoid generating an objection (quota).

Use a real account email/password (not the placeholder your@email.com).
`);
  process.exit(2);
}

const placeholderEmail =
  /^(your@email\.com|you@example\.com|example@example\.com|test@test\.com)$/i.test(
    email,
  );
const placeholderPassword = /^(your-password|password|changeme|secret)$/i.test(
  password,
);
if (placeholderEmail || placeholderPassword) {
  console.error(`
Auth smoke refused placeholder credentials.

PARITY_EMAIL / PARITY_PASSWORD must be a real production seat, not the docs example
(your@email.com / your-password).

Example:
  export PARITY_EMAIL='nick@your-real-domain.com'
  export PARITY_PASSWORD='the-password-you-use-on-the-website'
  pnpm run release-gate:live -- https://spartanhospicecoaching.com
`);
  process.exit(2);
}

let failed = 0;
const log = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) failed += 1;
};

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

console.log(`\nAuth parity smoke → ${base}`);
console.log(`Seat: ${email}${skipAi ? " (skip AI generate)" : ""}\n`);

// ── 1. Login (mobile Bearer + web cookie path) ───────────────────────────
let token = null;
let loginBody = null;
{
  const { res, json } = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  loginBody = json;
  token = json?.token || null;
  const ok = res.ok && token && json?.member?.id && json?.fieldKit;
  log(
    ok,
    `POST /api/auth/login → ${res.status}` +
      (ok
        ? ` member=${json.member.id} fieldKit.allowed=${json.fieldKit.allowed}`
        : ` ${json?.error || json?.code || ""}`),
  );
  if (!ok) {
    console.error("\nCannot continue without a session. Fix credentials or account status.\n");
    process.exit(1);
  }
}

// ── 2. /api/auth/me (mobile fetchMe + web session) ───────────────────────
{
  const { res, json } = await api("/api/auth/me", { token });
  const ok =
    res.ok &&
    json?.member?.id === loginBody.member.id &&
    typeof json?.fieldKit?.allowed === "boolean";
  log(
    ok,
    `GET /api/auth/me → ${res.status} allowed=${json?.fieldKit?.allowed} org=${json?.organization?.status ?? "null"}`,
  );
}

const entitled = Boolean(loginBody?.fieldKit?.allowed);

// ── 3. Onboarding (shared checklist) ─────────────────────────────────────
{
  const { res, json } = await api("/api/me/onboarding", { token });
  const ok = res.ok && json?.member?.id;
  log(
    ok,
    `GET /api/me/onboarding → ${res.status} checklist keys=${Object.keys(json?.member?.checklistProgress || {}).length}`,
  );
}

// ── 4. Billing status (Account tab + web Account) ────────────────────────
{
  const { res, json } = await api("/api/billing/status", { token });
  // 200 for any authenticated member with an org; 404 if org missing is a real bug
  const ok = res.ok && json?.organization;
  log(
    ok,
    `GET /api/billing/status → ${res.status}` +
      (ok
        ? ` plan=${json.organization.billingPlan} billing=${json.organization.billingStatus} checkout=${json.canCheckoutIndividual}`
        : ""),
  );
}

// ── 5. Command Center today (mobile useMission + web SalesWorkflow) ─────
{
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const path = `/api/v1/sales-workflow/today?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`;
  const { res, json } = await api(path, { token });
  if (entitled) {
    const ok =
      res.ok &&
      Array.isArray(json?.calls) &&
      Array.isArray(json?.plans) &&
      Array.isArray(json?.actions);
    log(
      ok,
      `GET /api/v1/sales-workflow/today → ${res.status} calls=${json?.calls?.length ?? "?"} plans=${json?.plans?.length ?? "?"} actions=${json?.actions?.length ?? "?"}`,
    );
  } else {
    // Locked seat: gate may 403 or return empty — either is coherent; 5xx is not
    const ok = res.status === 403 || res.status === 401 || res.ok;
    log(ok, `GET /api/v1/sales-workflow/today (locked seat) → ${res.status}`);
  }
}

// ── 6. AI tools catalog (advanced library both surfaces) ─────────────────
{
  const { res, json } = await api("/api/ai-tools", { token });
  if (entitled) {
    const ok = res.ok && Array.isArray(json?.tools);
    log(ok, `GET /api/ai-tools → ${res.status} tools=${json?.tools?.length ?? "?"}`);
  } else {
    const ok = res.status === 403 || res.status === 401 || (res.ok && Array.isArray(json?.tools));
    log(ok, `GET /api/ai-tools (locked) → ${res.status}`);
  }
}

// ── 7. Core tool path (mobile ObjectionTool + web Objections) ────────────
if (!skipAi && entitled) {
  const { res, json } = await api("/api/objections", {
    method: "POST",
    token,
    body: {
      objection: "Parity smoke — we already have a preferred hospice (no PHI).",
    },
  });
  const ok = res.ok && typeof json?.response === "string" && json.response.length > 10;
  log(
    ok,
    `POST /api/objections → ${res.status}` +
      (ok ? ` responseChars=${json.response.length}` : ` ${json?.error || json?.code || ""}`),
  );
} else if (!entitled) {
  log(true, `POST /api/objections skipped (fieldKit.allowed=false — paywall seat)`);
} else {
  log(true, `POST /api/objections skipped (PARITY_SKIP_AI)`);
}

// ── 8. Logout (mobile logoutMobile) ──────────────────────────────────────
{
  const { res, json } = await api("/api/auth/logout", { method: "POST", token });
  log(res.ok && json?.ok !== false, `POST /api/auth/logout → ${res.status}`);
}

// ── 9. Token should no longer work ───────────────────────────────────────
{
  const { res } = await api("/api/auth/me", { token });
  log(res.status === 401 || res.status === 403, `GET /api/auth/me after logout → ${res.status} (expect 401/403)`);
}

console.log(
  failed
    ? `\n${failed} auth parity check(s) failed.\n`
    : `\nAuth parity passed for ${email}.\n` +
        `This seat can use the same API as web cookie sessions and iOS Bearer sessions.\n` +
        `Manual: open /portal on web and TestFlight Account with this login — status should match.\n`,
);

process.exit(failed ? 1 : 0);
