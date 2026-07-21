/**
 * Lightweight live health smoke (no auth).
 * Usage: node scripts/smoke-health.mjs https://your-deploy.replit.app
 */
const base = (process.argv[2] || process.env.SITE_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke-health.mjs <SITE_URL>");
  process.exit(1);
}

const paths = [
  "/api/health",
  "/api/admin/bootstrap-status",
];

let failed = 0;
for (const p of paths) {
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

// Public HTML shells (SPA)
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

process.exit(failed ? 1 : 0);
