/**
 * Startup guard: verify that STRIPE_WEBHOOK_SECRET looks consistent with the
 * webhook endpoint registered in Stripe for this deployment's SITE_URL.
 *
 * Stripe never re-exposes a webhook signing secret after creation, so we
 * cannot compare the secret byte-for-byte.  Instead we use proxy signals:
 *
 *  • If no webhook is registered for this site's /api/billing/webhook path
 *    → the bootstrap hasn't run yet, or it was re-run with a new domain and
 *      a fresh secret was generated. STRIPE_WEBHOOK_SECRET is likely stale.
 *
 *  • If the only webhooks for /api/billing/webhook point to a *different*
 *    domain → bootstrap was re-run after a domain change. The new signing
 *    secret was not saved to Replit Secrets — webhooks will silently fail.
 *
 *  • If STRIPE_WEBHOOK_SECRET is missing or malformed → billing events will
 *    be rejected with a 400 signature error.
 *
 * `checkWebhookSecret()` returns a structured result.
 * `checkWebhookSecretOnStartup()` wraps it and logs warnings — never crashes.
 */

import { logger } from "../lib/logger";
import { getStripe, getSiteUrl, isStripeConfigured } from "./stripeClient";

export type WebhookSecretStatus =
  | { ok: true; webhookId: string; webhookUrl: string; webhookStatus: string }
  | { ok: false; reason: string; hint: string; detail?: Record<string, unknown> };

const WEBHOOK_PATH = "/api/billing/webhook";

/**
 * Run the webhook-secret consistency check and return a structured result.
 * Does NOT throw — any Stripe API errors are caught and returned as ok:false.
 */
export async function checkWebhookSecret(): Promise<WebhookSecretStatus> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      reason: "STRIPE_NOT_CONFIGURED",
      hint: "Set STRIPE_SECRET_KEY in Replit Secrets, then run scripts/stripe-bootstrap.mjs.",
    };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const expectedWebhookUrl = `${siteUrl}${WEBHOOK_PATH}`;

  // Check secret format first (cheap, no network).
  if (!webhookSecret) {
    return {
      ok: false,
      reason: "STRIPE_WEBHOOK_SECRET_MISSING",
      hint: "Copy the signing secret from Stripe Dashboard → Webhooks → Reveal signing secret, then set STRIPE_WEBHOOK_SECRET in Replit Secrets.",
    };
  }
  if (!webhookSecret.startsWith("whsec_")) {
    return {
      ok: false,
      reason: "STRIPE_WEBHOOK_SECRET_MALFORMED",
      hint: "STRIPE_WEBHOOK_SECRET must start with 'whsec_'. Retrieve it from Stripe Dashboard → Webhooks → Reveal signing secret.",
    };
  }

  try {
    const stripe = getStripe();
    const list = await stripe.webhookEndpoints.list({ limit: 100 });
    const allEndpoints = list.data;

    // Endpoints that target the billing webhook path (any domain)
    const pathEndpoints = allEndpoints.filter((w) => w.url.endsWith(WEBHOOK_PATH));

    // Endpoints that exactly match our current site URL
    const matchingEndpoints = pathEndpoints.filter((w) => w.url === expectedWebhookUrl);

    // Endpoints that target a *different* domain (stale after domain change)
    const staleEndpoints = pathEndpoints.filter((w) => w.url !== expectedWebhookUrl);

    if (matchingEndpoints.length === 0 && pathEndpoints.length === 0) {
      return {
        ok: false,
        reason: "NO_WEBHOOK_REGISTERED",
        hint: "Run scripts/stripe-bootstrap.mjs to create the webhook endpoint and capture the signing secret.",
        detail: { expectedWebhookUrl },
      };
    }

    if (matchingEndpoints.length === 0 && staleEndpoints.length > 0) {
      // Bootstrap was re-run with a new domain — the new secret wasn't saved.
      return {
        ok: false,
        reason: "WEBHOOK_URL_MISMATCH",
        hint: "Run scripts/stripe-bootstrap.mjs then update STRIPE_WEBHOOK_SECRET in Replit Secrets with the new signing secret.",
        detail: {
          expectedWebhookUrl,
          staleEndpoints: staleEndpoints.map((w) => ({ id: w.id, url: w.url })),
        },
      };
    }

    const endpoint = matchingEndpoints[0]!;

    if (endpoint.status !== "enabled") {
      return {
        ok: false,
        reason: "WEBHOOK_DISABLED",
        hint: `Webhook ${endpoint.id} has status '${endpoint.status}'. Re-enable it in Stripe Dashboard or re-run scripts/stripe-bootstrap.mjs.`,
        detail: { webhookId: endpoint.id, webhookUrl: endpoint.url, status: endpoint.status },
      };
    }

    return {
      ok: true,
      webhookId: endpoint.id,
      webhookUrl: endpoint.url,
      webhookStatus: endpoint.status,
    };
  } catch (err: any) {
    return {
      ok: false,
      reason: "STRIPE_API_ERROR",
      hint: "Check STRIPE_SECRET_KEY and network access.",
      detail: { error: err?.message || String(err) },
    };
  }
}

/**
 * Call at server startup: runs `checkWebhookSecret()` and logs warnings.
 * Never throws — a bad result is a warning, not a crash.
 */
export async function checkWebhookSecretOnStartup(): Promise<void> {
  const result = await checkWebhookSecret();

  if (result.ok) {
    logger.info(
      {
        webhookId: result.webhookId,
        webhookUrl: result.webhookUrl,
        status: result.webhookStatus,
      },
      "[stripe] Webhook endpoint confirmed in Stripe. STRIPE_WEBHOOK_SECRET is set.",
    );
    return;
  }

  // Not ok — log a clear warning with actionable hint.
  logger.warn(
    {
      reason: result.reason,
      hint: result.hint,
      ...(result.detail ?? {}),
    },
    `[stripe] STARTUP WARNING: ${result.reason} — ${result.hint}`,
  );
}
