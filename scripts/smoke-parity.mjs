/**
 * Web ↔ iOS API parity smoke (no secrets / no login).
 *
 * Proves the production host exposes the contracts both clients rely on:
 * health, public Learn feeds, and gated routes that reject unauthenticated
 * callers (same gate mobile Bearer and web cookie share).
 *
 * Usage:
 *   node scripts/smoke-parity.mjs https://spartanhospicecoaching.com
 *
 * Exit 0 = pass, 1 = fail.
 */
const base = (process.argv[2] || process.env.SITE_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke-parity.mjs <SITE_URL>");
  process.exit(1);
}

let failed = 0;
const log = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) failed += 1;
};

async function fetchJson(path, init) {
  const res = await fetch(`${base}${path}`, init);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { res, body };
}

console.log(`\nParity smoke → ${base}\n`);

// ── Health (both surfaces need a live API) ───────────────────────────────
{
  const { res, body } = await fetchJson("/api/healthz");
  log(res.ok && body?.status === "ok", `GET /api/healthz → ${res.status} status=${body?.status}`);
}

// ── Public Learn feeds (mobile Learn tab + web) ──────────────────────────
for (const [path, key] of [
  ["/api/articles", "articles"],
  ["/api/podcasts", "podcasts"],
  ["/api/resources", "resources"],
]) {
  try {
    const { res, body } = await fetchJson(path);
    const arr = body?.[key];
    log(
      res.ok && Array.isArray(arr),
      `GET ${path} → ${res.status} ${key}=${Array.isArray(arr) ? arr.length : "missing"}`,
    );
  } catch (e) {
    log(false, `GET ${path} — ${e?.message || e}`);
  }
}

// ── Shared gates: unauthenticated must not get product data ─────────────
// Mobile and web both hit these with session; without session → 401/403.
const gated = [
  { method: "GET", path: "/api/auth/me" },
  { method: "GET", path: "/api/billing/status" },
  { method: "GET", path: "/api/me/onboarding" },
  { method: "GET", path: "/api/ai-tools" },
  {
    method: "GET",
    path: `/api/v1/sales-workflow/today?from=${encodeURIComponent(new Date().toISOString())}&to=${encodeURIComponent(new Date().toISOString())}`,
  },
  // Command Center AI debrief (web + mobile) — draft only, still entitled
  {
    method: "POST",
    path: "/api/v1/sales-workflow/debrief/draft",
    body: {
      notes: "Saw DON, wants education follow-up next week about referral path.",
    },
  },
  {
    method: "POST",
    path: "/api/objections",
    body: { objection: "We already have a preferred hospice." },
  },
  {
    method: "POST",
    path: "/api/chat",
    body: { prompt: "What is hospice eligibility?", conversationHistory: [] },
  },
];

for (const g of gated) {
  try {
    const { res } = await fetchJson(g.path, {
      method: g.method,
      headers: g.body ? { "Content-Type": "application/json" } : undefined,
      body: g.body ? JSON.stringify(g.body) : undefined,
    });
    const blocked = res.status === 401 || res.status === 403;
    log(
      blocked,
      `${g.method} ${g.path.split("?")[0]} unauthenticated → ${res.status} (expect 401/403)`,
    );
  } catch (e) {
    log(false, `${g.method} ${g.path} — ${e?.message || e}`);
  }
}

// ── Org admin gates (provider_admin) — unauthenticated must not read/write ──
// Stable routes hard-fail unless 401/403. Newer routes soft-WARN on 404 until
// the host is redeployed with those handlers (set STRICT_ORG_GATES=1 to fail).
const strictOrg = process.env.STRICT_ORG_GATES === "1" || process.env.STRICT_ORG_GATES === "true";
const orgGatedStable = [
  { method: "GET", path: "/api/org/members" },
  { method: "GET", path: "/api/org/usage" },
  {
    method: "POST",
    path: "/api/org/invites",
    body: { email: "parity-smoke-unauth@example.invalid", role: "member" },
  },
];
const orgGatedSoft = [
  { method: "GET", path: "/api/org/profile" },
  { method: "GET", path: "/api/org/audit" },
  { method: "GET", path: "/api/org/structure" },
  {
    method: "POST",
    path: "/api/org/members/00000000-0000-4000-8000-000000000001/offboard",
    body: {},
  },
];

function logOrgGate(method, path, status, soft) {
  const short = path.split("?")[0];
  const blocked = status === 401 || status === 403;
  if (blocked) {
    log(true, `${method} ${short} unauthenticated → ${status} (expect 401/403)`);
    return;
  }
  if (soft && status === 404 && !strictOrg) {
    console.log(
      `WARN ${method} ${short} unauthenticated → 404 (route not deployed yet; STRICT_ORG_GATES=1 to fail)`,
    );
    return;
  }
  log(false, `${method} ${short} unauthenticated → ${status} (expect 401/403)`);
}

for (const g of orgGatedStable) {
  try {
    const { res } = await fetchJson(g.path, {
      method: g.method,
      headers: g.body ? { "Content-Type": "application/json" } : undefined,
      body: g.body ? JSON.stringify(g.body) : undefined,
    });
    logOrgGate(g.method, g.path, res.status, false);
  } catch (e) {
    log(false, `${g.method} ${g.path} — ${e?.message || e}`);
  }
}

for (const g of orgGatedSoft) {
  try {
    const { res } = await fetchJson(g.path, {
      method: g.method,
      headers: g.body ? { "Content-Type": "application/json" } : undefined,
      body: g.body ? JSON.stringify(g.body) : undefined,
    });
    logOrgGate(g.method, g.path, res.status, true);
  } catch (e) {
    log(false, `${g.method} ${g.path} — ${e?.message || e}`);
  }
}

// ── Product HTML shells (web lander + dual-product markers) ──────────────
const htmlChecks = [
  { path: "/", mustInclude: ["Hospice Sales Pro"] },
  { path: "/hospice-sales-pro", mustInclude: ["Hospice Sales Pro"] },
  { path: "/login", mustInclude: [] },
  { path: "/portal", mustInclude: [] },
];

for (const h of htmlChecks) {
  try {
    const res = await fetch(`${base}${h.path}`, { redirect: "follow" });
    const text = await res.text();
    const okStatus = res.ok;
    const missing = h.mustInclude.filter((s) => !text.includes(s));
    log(
      okStatus && missing.length === 0,
      `HTML ${h.path} → ${res.status}${missing.length ? ` missing: ${missing.join(", ")}` : ""}`,
    );
  } catch (e) {
    log(false, `HTML ${h.path} — ${e?.message || e}`);
  }
}

// ── Legacy product paths should not 404 forever ──────────────────────────
for (const path of ["/membership", "/field-kit"]) {
  try {
    const res = await fetch(`${base}${path}`, { redirect: "manual" });
    // 2xx, 3xx, or SPA 200 are fine; hard 404/5xx is not
    const ok = res.status >= 200 && res.status < 400;
    log(ok, `legacy ${path} → ${res.status} (expect 2xx/3xx redirect or SPA)`);
  } catch (e) {
    log(false, `legacy ${path} — ${e?.message || e}`);
  }
}

console.log(
  failed
    ? `\n${failed} parity check(s) failed. Live host is not ready for web+iOS shared use.\n`
    : `\nParity smoke passed. Public + gate contracts match web/mobile expectations.\n` +
        `Next: login smoke on web + TestFlight with the same account (checklist/Command).\n`,
);

process.exit(failed ? 1 : 0);
