#!/usr/bin/env node
/**
 * Stripe bootstrap script for Spartan Coaching.
 * Creates (or reuses) the Field Kit Individual product, weekly price,
 * billing portal configuration, and webhook endpoint.
 *
 * Usage:
 *   node scripts/stripe-bootstrap.mjs
 *   (or from workspace root)
 *   pnpm --filter @workspace/api-server exec node ../../scripts/stripe-bootstrap.mjs
 *
 * Idempotent: safe to run multiple times — reuses existing resources.
 */

import { createWriteStream, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── 0. Resolve Stripe SDK ──────────────────────────────────────────────────
// Support running from scripts/ directly or via pnpm exec from api-server.
let Stripe;
const candidates = [
  path.resolve(__dirname, "../node_modules/stripe"),
  path.resolve(__dirname, "../artifacts/api-server/node_modules/stripe"),
  path.resolve(__dirname, "../node_modules/.pnpm/stripe@18.5.0_@types+node@25.9.5/node_modules/stripe"),
];
for (const candidate of candidates) {
  if (existsSync(candidate)) {
    const req = createRequire(candidate + "/package.json");
    try {
      Stripe = (await import(`file://${candidate}/cjs/stripe.cjs.node.js`)).default ??
               (await import(`file://${candidate}/index.js`)).default;
      if (Stripe) break;
    } catch {
      // try next candidate
    }
  }
}
if (!Stripe) {
  // Last resort: dynamic import via Node resolution (works when run via pnpm exec)
  try {
    Stripe = (await import("stripe")).default;
  } catch {
    console.error("ERROR: Could not load the stripe package. Try running:");
    console.error("  pnpm --filter @workspace/api-server exec node ../../scripts/stripe-bootstrap.mjs");
    process.exit(1);
  }
}

// ─── 1. Environment ──────────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();
if (!STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY is not set. Add it to Replit Secrets first.");
  process.exit(1);
}

const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : "") ||
  (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "") ||
  "https://spartanhospicecoaching.com"
).replace(/\/$/, "");

const WEBHOOK_URL = `${SITE_URL}/api/billing/webhook`;
const isTestMode = STRIPE_SECRET_KEY.startsWith("sk_test_");

console.log(`\n🔑  Mode: ${isTestMode ? "TEST" : "LIVE"}`);
console.log(`🌐  Site URL: ${SITE_URL}`);
console.log(`🔔  Webhook URL: ${WEBHOOK_URL}\n`);

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ─── 2. Product ──────────────────────────────────────────────────────────────
console.log("Step 1: Product...");
let product;
const productList = await stripe.products.list({ active: true, limit: 100 });
product = productList.data.find(
  (p) => p.name === "Field Kit Individual" || p.metadata?.spartan_plan === "individual_weekly",
);

if (product) {
  console.log(`  ✓ Reusing product: ${product.id} (${product.name})`);
} else {
  product = await stripe.products.create({
    name: "Field Kit Individual",
    description: "Spartan Field Kit individual membership — weekly, cancel anytime",
    metadata: {
      spartan_plan: "individual_weekly",
      app: "spartan_coaching",
    },
  });
  console.log(`  ✓ Created product: ${product.id}`);
}

// ─── 3. Price ────────────────────────────────────────────────────────────────
console.log("Step 2: Price...");
let price;
const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
price = priceList.data.find(
  (p) =>
    p.unit_amount === 1499 &&
    p.currency === "usd" &&
    p.recurring?.interval === "week" &&
    p.recurring?.interval_count === 1,
);

if (price) {
  console.log(`  ✓ Reusing price: ${price.id}`);
} else {
  price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1499,
    currency: "usd",
    recurring: { interval: "week", interval_count: 1 },
    nickname: "individual_weekly_1499",
    metadata: {
      spartan_plan: "individual_weekly",
      app: "spartan_coaching",
    },
  });
  console.log(`  ✓ Created price: ${price.id}`);
}

// ─── 4. Billing Portal ───────────────────────────────────────────────────────
console.log("Step 3: Billing portal configuration...");
let portalConfig;
const portalList = await stripe.billingPortal.configurations.list({ limit: 10 });

const PORTAL_FEATURES = {
  customer_update: {
    enabled: true,
    allowed_updates: ["email", "address"],
  },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: {
    enabled: true,
    mode: "at_period_end",
    proration_behavior: "none",
  },
  subscription_update: { enabled: false },
};

const defaultConfig = portalList.data.find((c) => c.is_default);

if (defaultConfig) {
  portalConfig = await stripe.billingPortal.configurations.update(defaultConfig.id, {
    business_profile: {
      headline: "Spartan Coaching — Field Kit membership",
    },
    features: PORTAL_FEATURES,
    default_return_url: `${SITE_URL}/account?billing=portal`,
  });
  console.log(`  ✓ Updated default portal config: ${portalConfig.id}`);
} else {
  portalConfig = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Spartan Coaching — Field Kit membership",
    },
    features: PORTAL_FEATURES,
    default_return_url: `${SITE_URL}/account?billing=portal`,
  });
  console.log(`  ✓ Created portal config: ${portalConfig.id}`);
}

// ─── 5. Webhook ──────────────────────────────────────────────────────────────
console.log("Step 4: Webhook endpoint...");
const REQUIRED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

const WEBHOOK_PATH = "/api/billing/webhook";

let webhookEndpoint;
let webhookSecret = null;
const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });

// Detect stale webhooks: same path, different domain
const staleEndpoints = existingWebhooks.data.filter(
  (w) => w.url !== WEBHOOK_URL && w.url.endsWith(WEBHOOK_PATH),
);

if (staleEndpoints.length > 0) {
  console.log(`\n  ⚠️  WARNING: Found ${staleEndpoints.length} stale webhook(s) pointing to a different domain:`);
  for (const stale of staleEndpoints) {
    console.log(`     - ${stale.id}: ${stale.url}`);
  }
  console.log(`  ℹ️  These point to a different domain than the current SITE_URL (${SITE_URL}).`);
  console.log(`  🗑️  Deleting stale webhooks and creating a fresh one at the current URL...\n`);
  for (const stale of staleEndpoints) {
    await stripe.webhookEndpoints.del(stale.id);
    console.log(`  ✓ Deleted stale webhook: ${stale.id} (${stale.url})`);
  }
}

const existingEndpoint = existingWebhooks.data.find((w) => w.url === WEBHOOK_URL);

if (existingEndpoint) {
  // Ensure all required events are included
  const missingEvents = REQUIRED_EVENTS.filter(
    (e) => !existingEndpoint.enabled_events.includes(e),
  );
  if (missingEvents.length > 0 || existingEndpoint.status !== "enabled") {
    const allEvents = [
      ...new Set([...existingEndpoint.enabled_events, ...REQUIRED_EVENTS]),
    ].filter((e) => e !== "*");
    webhookEndpoint = await stripe.webhookEndpoints.update(existingEndpoint.id, {
      enabled_events: allEvents,
    });
    console.log(`  ✓ Updated existing webhook: ${webhookEndpoint.id}`);
  } else {
    webhookEndpoint = existingEndpoint;
    console.log(`  ✓ Reusing existing webhook: ${webhookEndpoint.id}`);
  }
  console.log(
    `  ⚠️  Webhook signing secret NOT returned for existing endpoints.`,
  );
  console.log(
    `     To get it: Stripe Dashboard → Webhooks → ${webhookEndpoint.id} → Reveal signing secret`,
  );
  console.log(`     Then set STRIPE_WEBHOOK_SECRET in Replit Secrets.`);
} else {
  webhookEndpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: REQUIRED_EVENTS,
    description: "Spartan Coaching Field Kit billing",
    metadata: { app: "spartan_coaching" },
  });
  webhookSecret = webhookEndpoint.secret ?? null;
  console.log(`  ✓ Created webhook: ${webhookEndpoint.id}`);
  if (webhookSecret) {
    console.log(`  ✓ Signing secret captured (whsec_***)`);
  }
}

// ─── 6. Smoke assertions ─────────────────────────────────────────────────────
console.log("\nSmoke checks...");
const retrievedPrice = await stripe.prices.retrieve(price.id);
const retrievedProduct = await stripe.products.retrieve(product.id);
const retrievedWebhook = await stripe.webhookEndpoints.retrieve(webhookEndpoint.id);

const errors = [];
if (retrievedPrice.unit_amount !== 1499) errors.push(`Price unit_amount is ${retrievedPrice.unit_amount}, expected 1499`);
if (retrievedPrice.recurring?.interval !== "week") errors.push(`Price interval is ${retrievedPrice.recurring?.interval}, expected 'week'`);
if (!retrievedPrice.active) errors.push("Price is not active");
if (!retrievedProduct.active) errors.push("Product is not active");
const missingWebhookEvents = REQUIRED_EVENTS.filter(
  (e) => !retrievedWebhook.enabled_events.includes(e),
);
if (missingWebhookEvents.length > 0) errors.push(`Webhook missing events: ${missingWebhookEvents.join(", ")}`);
if (retrievedWebhook.url !== WEBHOOK_URL) errors.push(`Webhook URL mismatch: ${retrievedWebhook.url}`);

if (errors.length > 0) {
  console.error("\n❌ Smoke check FAILED:");
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}
console.log("  ✓ price.unit_amount === 1499");
console.log("  ✓ price.recurring.interval === 'week'");
console.log("  ✓ price.active === true");
console.log("  ✓ product.active === true");
console.log("  ✓ webhook URL matches");
console.log("  ✓ webhook events include all 6 required events");

// ─── 7. Output ───────────────────────────────────────────────────────────────
const mask = (s) => {
  if (!s) return "(not available)";
  if (s.length <= 12) return s.slice(0, 4) + "***";
  return s.slice(0, 8) + "***" + s.slice(-4);
};

console.log("\n─── RESULTS ───────────────────────────────────────────────");
console.log(`STRIPE_PRICE_INDIVIDUAL_WEEKLY=${price.id}`);
if (webhookSecret) {
  console.log(`STRIPE_WEBHOOK_SECRET=${mask(webhookSecret)}`);
}
console.log(`SITE_URL=${SITE_URL}`);
console.log(`WEBHOOK_URL=${WEBHOOK_URL}`);
console.log("──────────────────────────────────────────────────────────");

// Write output JSON (no secrets)
const output = {
  productId: product.id,
  priceId: price.id,
  webhookEndpointId: webhookEndpoint.id,
  webhookUrl: WEBHOOK_URL,
  portalConfigId: portalConfig.id,
  mode: isTestMode ? "test" : "live",
  createdAt: new Date().toISOString(),
};
const outPath = path.resolve(__dirname, "stripe-bootstrap.out.json");
await writeFile(outPath, JSON.stringify(output, null, 2) + "\n");
console.log(`\n📄 Output written to scripts/stripe-bootstrap.out.json`);

// Export env var values for the caller to use
export const result = {
  priceId: price.id,
  productId: product.id,
  webhookEndpointId: webhookEndpoint.id,
  webhookSecret,
  portalConfigId: portalConfig.id,
  siteUrl: SITE_URL,
};

console.log("\n✅ Bootstrap complete.");
console.log("\nNext steps:");
console.log("  1. Set STRIPE_PRICE_INDIVIDUAL_WEEKLY in Replit Secrets (value shown above)");
if (!webhookSecret) {
  console.log("  2. Get STRIPE_WEBHOOK_SECRET from Stripe Dashboard → Webhooks → Reveal signing secret");
} else {
  console.log("  2. Set STRIPE_WEBHOOK_SECRET in Replit Secrets (captured above — masked for safety)");
}
console.log("  3. Human UI smoke: log in as trial → /account → Subscribe → test card 4242 4242 4242 4242");
