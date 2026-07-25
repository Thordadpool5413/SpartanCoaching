import type { Express, Request, Response } from "express";
import type Stripe from "stripe";
import { eq, and, ne } from "drizzle-orm";
import { clientOrganizations, clientMembers } from "@workspace/db";
import { db } from "../db";
import {
  requireAuth,
  requireAdmin,
  type AuthedRequest,
} from "../auth/middleware";
import { authLimit } from "../rateLimits";
import {
  getIndividualWeeklyPriceId,
  getSiteUrl,
  getStripe,
  isStripeConfigured,
} from "./stripeClient";
import {
  applyBillingPatch,
  billingPatchFromSubscription,
  findOrgById,
  findOrgByStripeCustomerId,
  findOrgByStripeSubscriptionId,
} from "./subscriptionSync";
import {
  activateCorporateContract,
  updateCorporateSeats,
} from "./corporateBilling";
import {
  logBillingEvent,
  notifyPaymentFailed,
  notifySubscriptionActive,
  notifySubscriptionCanceled,
} from "./billingNotifications";
import { sendBillingActiveAdminAlert } from "../resend";
import { checkWebhookSecret } from "./webhookSecretCheck";
import { getBillingEmailMetrics } from "./billingEmailMetrics";

function orgIdFromMetadata(meta: Stripe.Metadata | null | undefined): number | null {
  if (!meta?.organizationId) return null;
  const n = Number(meta.organizationId);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Register billing routes.
 * Webhook must be mounted with express.raw BEFORE global express.json — see app.ts.
 */
export function registerBillingRoutes(app: Express): void {
  /**
   * GET /api/admin/stripe-webhook-health
   * On-demand check: verifies STRIPE_WEBHOOK_SECRET is consistent with the
   * webhook endpoint registered in Stripe for this deployment's SITE_URL.
   * Returns { ok, reason?, hint?, detail?, webhookId?, webhookUrl?, webhookStatus? }.
   * Does NOT require auth so smoke-health.mjs can call it without credentials.
   * Does NOT reveal any secret values.
   */
  app.get("/api/admin/stripe-webhook-health", async (_req, res) => {
    try {
      const result = await checkWebhookSecret();
      const status = result.ok ? 200 : 503;
      return res.status(status).json(result);
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        reason: "INTERNAL_ERROR",
        hint: "Unexpected error running webhook health check.",
        detail: { error: err?.message || String(err) },
      });
    }
  });

  /**
   * GET /api/admin/billing-email-health
   * Returns in-process counts of billing_email_failed events in the last 1h and 24h.
   * HTTP 200 when below thresholds, 503 when either threshold is breached.
   * No auth required so smoke-health scripts can call it without credentials.
   * Does NOT return any PII — only counts and email types.
   */
  app.get("/api/admin/billing-email-health", (_req, res) => {
    try {
      const metrics = getBillingEmailMetrics();
      const status = metrics.ok ? 200 : 503;
      return res.status(status).json(metrics);
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: "INTERNAL_ERROR",
        detail: err?.message || String(err),
      });
    }
  });

  /**
   * GET /api/billing/status
   * Client-facing billing summary for the signed-in member's org.
   */
  app.get("/api/billing/status", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const member = req.fieldKit!.member!;
      const org = await findOrgById(member.organizationId);
      if (!org) return res.status(404).json({ error: "Organization not found" });

      return res.json({
        configured: isStripeConfigured(),
        individualWeeklyPriceConfigured: Boolean(process.env.STRIPE_PRICE_INDIVIDUAL_WEEKLY?.trim()),
        organization: {
          id: org.id,
          type: org.type,
          status: org.status,
          billingPlan: org.billingPlan ?? null,
          billingStatus: org.billingStatus ?? null,
          currentPeriodEnd: org.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: Boolean(org.cancelAtPeriodEnd),
          hasStripeCustomer: Boolean(org.stripeCustomerId),
          hasStripeSubscription: Boolean(org.stripeSubscriptionId),
          billableSeats: org.billableSeats ?? null,
          seatLimit: org.seatLimit,
          contractRef: org.contractRef ?? null,
        },
        canCheckoutIndividual:
          org.type === "personal" &&
          member.role !== "platform_admin" &&
          isStripeConfigured() &&
          Boolean(process.env.STRIPE_PRICE_INDIVIDUAL_WEEKLY?.trim()),
        canOpenPortal: Boolean(org.stripeCustomerId) && isStripeConfigured(),
      });
    } catch (err) {
      console.error("billing status error:", err);
      return res.status(500).json({ error: "Failed to load billing status" });
    }
  });

  /**
   * POST /api/billing/checkout
   * Create a Stripe Checkout Session for individual weekly subscription ($14.99/wk price in Stripe).
   * Body: { successUrl?: string, cancelUrl?: string }
   */
  app.post("/api/billing/checkout", requireAuth, authLimit, async (req: AuthedRequest, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({
          error: "Billing is not configured yet",
          code: "STRIPE_NOT_CONFIGURED",
        });
      }

      const member = req.fieldKit!.member!;
      const [org] = await db
        .select()
        .from(clientOrganizations)
        .where(eq(clientOrganizations.id, member.organizationId))
        .limit(1);
      if (!org) return res.status(404).json({ error: "Organization not found" });

      if (org.type === "platform") {
        return res.status(400).json({
          error: "Platform organizations do not use self-serve billing",
          code: "PLATFORM_ORG",
        });
      }

      // Phase 1: individual self-serve only (personal org)
      if (org.type !== "personal") {
        return res.status(400).json({
          error:
            "Corporate plans are activated under contract. Contact Spartan Coaching or use Access Desk.",
          code: "CORPORATE_CONTRACT_REQUIRED",
        });
      }

      if (org.billingPlan === "comp") {
        return res.status(400).json({
          error: "This account is complimentary and does not require payment",
          code: "COMP_ACCOUNT",
        });
      }

      // Already on an active paid sub
      if (
        org.stripeSubscriptionId &&
        (org.billingStatus === "active" || org.billingStatus === "trialing") &&
        org.status === "active"
      ) {
        return res.status(409).json({
          error: "You already have an active subscription. Use Manage billing to update or cancel.",
          code: "ALREADY_SUBSCRIBED",
        });
      }

      const stripe = getStripe();
      const priceId = getIndividualWeeklyPriceId();
      const site = getSiteUrl();
      const successUrl =
        (typeof req.body?.successUrl === "string" && req.body.successUrl.startsWith(site)
          ? req.body.successUrl
          : null) || `${site}/account?billing=success`;
      const cancelUrl =
        (typeof req.body?.cancelUrl === "string" && req.body.cancelUrl.startsWith(site)
          ? req.body.cancelUrl
          : null) || `${site}/account?billing=canceled`;

      let customerId = org.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: member.email,
          name: member.name,
          metadata: {
            organizationId: String(org.id),
            memberId: String(member.id),
            orgType: org.type,
          },
        });
        customerId = customer.id;
        await db
          .update(clientOrganizations)
          .set({ stripeCustomerId: customerId })
          .where(eq(clientOrganizations.id, org.id));
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: String(org.id),
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
          ? successUrl
          : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        metadata: {
          organizationId: String(org.id),
          memberId: String(member.id),
          billingPlan: "individual_weekly",
        },
        subscription_data: {
          metadata: {
            organizationId: String(org.id),
            memberId: String(member.id),
            billingPlan: "individual_weekly",
          },
        },
      });

      if (!session.url) {
        return res.status(500).json({ error: "Checkout session missing URL" });
      }

      return res.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (err: any) {
      console.error("billing checkout error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to start checkout",
        code: "CHECKOUT_FAILED",
      });
    }
  });

  /**
   * POST /api/billing/portal
   * Stripe Customer Portal — self-service cancel / update payment method.
   */
  app.post("/api/billing/portal", requireAuth, authLimit, async (req: AuthedRequest, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({
          error: "Billing is not configured yet",
          code: "STRIPE_NOT_CONFIGURED",
        });
      }

      const member = req.fieldKit!.member!;
      const org = await findOrgById(member.organizationId);
      if (!org) return res.status(404).json({ error: "Organization not found" });
      if (!org.stripeCustomerId) {
        return res.status(400).json({
          error: "No billing customer on file. Subscribe first.",
          code: "NO_CUSTOMER",
        });
      }

      // Only org admins / the sole personal member / platform admin
      const isPersonalOwner = org.type === "personal";
      const isOrgAdmin = member.role === "org_admin" || member.role === "platform_admin";
      if (!isPersonalOwner && !isOrgAdmin) {
        return res.status(403).json({
          error: "Only an organization admin can manage billing",
          code: "ORG_ADMIN_REQUIRED",
        });
      }

      const stripe = getStripe();
      const site = getSiteUrl();
      const returnUrl =
        (typeof req.body?.returnUrl === "string" && req.body.returnUrl.startsWith(site)
          ? req.body.returnUrl
          : null) || `${site}/account?billing=portal`;

      const portal = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: returnUrl,
      });

      return res.json({ url: portal.url });
    } catch (err: any) {
      console.error("billing portal error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to open billing portal",
        code: "PORTAL_FAILED",
      });
    }
  });

  /**
   * POST /api/admin/billing/test-alert
   * Fires a real billing-active admin alert email via Resend so you can confirm
   * it arrives in the configured inbox with correct org/plan/member data.
   * Accepts optional body: { orgId?: number } — defaults to the first org with
   * an active subscription, or a synthetic placeholder if none exist.
   * Requires platform-admin role.
   */
  app.post("/api/admin/billing/test-alert", requireAdmin, async (req: AuthedRequest, res) => {
    try {
      const requestedOrgId = req.body?.orgId ? Number(req.body.orgId) : null;

      let org = null;
      if (requestedOrgId && Number.isFinite(requestedOrgId)) {
        org = await findOrgById(requestedOrgId);
        if (!org) {
          return res.status(404).json({ error: `Organization #${requestedOrgId} not found` });
        }
      }

      if (!org) {
        // No orgId specified — fall back to first org with an active subscription
        const rows = await db
          .select()
          .from(clientOrganizations)
          .where(eq(clientOrganizations.billingStatus, "active"))
          .limit(1);
        org = rows[0] ?? null;
      }

      const adminTo =
        process.env.NOTIFICATION_EMAIL ||
        process.env.OPS_DIGEST_EMAIL ||
        "nick@spartanhospicecoaching.com";

      if (org) {
        // Fetch real member emails — same query activeMembers() uses in billingNotifications
        const members = await db
          .select()
          .from(clientMembers)
          .where(and(eq(clientMembers.organizationId, org.id), ne(clientMembers.status, "disabled")));

        // Use real org data — same path as the live webhook handler
        console.log(
          `[billing test-alert] Firing alert for real org #${org.id} (${org.name}) → ${adminTo}` +
          ` | members: ${members.map(m => m.email).join(", ") || "(none)"}`,
        );
        const ok = await sendBillingActiveAdminAlert(adminTo, {
          orgId: org.id,
          orgName: org.name,
          billingPlan: org.billingPlan,
          memberEmails: members.map(m => m.email),
        });
        return res.json({
          ok,
          recipient: adminTo,
          orgId: org.id,
          orgName: org.name,
          billingPlan: org.billingPlan,
          note: ok
            ? "Alert sent. Check the inbox listed in recipient."
            : "Resend call failed — check server logs for details.",
        });
      } else {
        // No active org in DB — send a synthetic test email
        console.log(`[billing test-alert] No active org found; sending synthetic test alert → ${adminTo}`);
        const ok = await sendBillingActiveAdminAlert(adminTo, {
          orgId: 0,
          orgName: "Test Organization (synthetic)",
          billingPlan: "individual_weekly",
          memberEmails: ["test-member@example.com"],
        });
        return res.json({
          ok,
          recipient: adminTo,
          synthetic: true,
          note: ok
            ? "Synthetic alert sent (no active org in DB). Check the inbox listed in recipient."
            : "Resend call failed — check server logs for details.",
        });
      }
    } catch (err: any) {
      console.error("[billing test-alert] Unexpected error:", err?.message || err);
      return res.status(500).json({
        ok: false,
        error: err?.message || "Unexpected error",
      });
    }
  });

  // ── Admin: corporate / provider contract (Phase 3) ─────────────────

  /**
   * POST /api/admin/organizations/:id/billing/contract
   * Activate corporate contract: seats × weekly unit price (cents).
   * Body: { seats, unitAmountCents, contractRef?, currency?, collectionMode?, billingEmail?, billingName?, daysUntilDue? }
   */
  app.post(
    "/api/admin/organizations/:id/billing/contract",
    requireAdmin,
    authLimit,
    async (req: AuthedRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id" });

        const seats = Number(req.body?.seats);
        const unitAmountCents = Number(req.body?.unitAmountCents);
        if (!Number.isFinite(seats) || seats < 1) {
          return res.status(400).json({ error: "seats must be a positive integer" });
        }
        if (!Number.isFinite(unitAmountCents) || unitAmountCents < 50) {
          return res.status(400).json({
            error: "unitAmountCents must be at least 50 ($0.50 weekly per seat)",
          });
        }

        const collectionMode = (req.body?.collectionMode || "send_invoice") as
          | "send_invoice"
          | "charge_automatically"
          | "offline";
        if (!["send_invoice", "charge_automatically", "offline"].includes(collectionMode)) {
          return res.status(400).json({ error: "Invalid collectionMode" });
        }

        const result = await activateCorporateContract(id, {
          seats,
          unitAmountCents,
          currency: typeof req.body?.currency === "string" ? req.body.currency : "usd",
          contractRef: typeof req.body?.contractRef === "string" ? req.body.contractRef : undefined,
          billingEmail:
            typeof req.body?.billingEmail === "string" ? req.body.billingEmail : undefined,
          billingName: typeof req.body?.billingName === "string" ? req.body.billingName : undefined,
          collectionMode,
          daysUntilDue:
            req.body?.daysUntilDue != null ? Number(req.body.daysUntilDue) : undefined,
        });

        // Notify members of activation (reuse membership email path via status=active side effect already set)
        return res.json({
          ok: true,
          organization: result.organization,
          stripeSubscriptionId: result.stripeSubscriptionId,
          stripeCustomerId: result.stripeCustomerId,
          mode: result.mode,
          message: result.message,
        });
      } catch (err: any) {
        console.error("corporate contract activate error:", err);
        return res.status(500).json({
          error: err?.message || "Failed to activate corporate contract",
          code: "CORPORATE_CONTRACT_FAILED",
        });
      }
    },
  );

  /**
   * PATCH /api/admin/organizations/:id/billing/seats
   * Update billable seat count; syncs Stripe quantity when subscription exists.
   * Body: { seats: number }
   */
  app.patch(
    "/api/admin/organizations/:id/billing/seats",
    requireAdmin,
    authLimit,
    async (req: AuthedRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id" });
        const seats = Number(req.body?.seats);
        if (!Number.isFinite(seats) || seats < 1) {
          return res.status(400).json({ error: "seats must be a positive integer" });
        }

        const result = await updateCorporateSeats(id, seats);
        return res.json({
          ok: true,
          organization: result.organization,
          message: result.message,
        });
      } catch (err: any) {
        console.error("corporate seats update error:", err);
        return res.status(500).json({
          error: err?.message || "Failed to update seats",
          code: "SEATS_UPDATE_FAILED",
        });
      }
    },
  );
}

/**
 * Stripe webhook handler — mount with express.raw({ type: "application/json" }).
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  let event: Stripe.Event;

  try {
    const sig = req.headers["stripe-signature"];
    if (!webhookSecret) {
      // Dev fallback: only when secret unset and not production
      if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1") {
        res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is required" });
        return;
      }
      event = JSON.parse(
        Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body),
      ) as Stripe.Event;
    } else {
      if (typeof sig !== "string") {
        res.status(400).json({ error: "Missing stripe-signature" });
        return;
      }
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""));
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err?.message || err);
    res.status(400).json({ error: `Webhook Error: ${err?.message || "invalid"}` });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const orgId =
          orgIdFromMetadata(session.metadata) ||
          (session.client_reference_id ? Number(session.client_reference_id) : null);
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (orgId && customerId) {
          await applyBillingPatch(orgId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId ?? undefined,
            billingPlan: session.metadata?.billingPlan || "individual_weekly",
          });
        }

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const resolvedOrgId =
            orgId ||
            orgIdFromMetadata(sub.metadata) ||
            (await findOrgByStripeCustomerId(
              typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            ))?.id;
          if (resolvedOrgId) {
            const plan =
              sub.metadata?.billingPlan ||
              session.metadata?.billingPlan ||
              "individual_weekly";
            await applyBillingPatch(
              resolvedOrgId,
              billingPatchFromSubscription(sub, { billingPlan: plan }),
            );
            const orgAfter = await findOrgById(resolvedOrgId);
            if (orgAfter) await notifySubscriptionActive(orgAfter);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        let org =
          (await findOrgByStripeSubscriptionId(sub.id)) ||
          (await findOrgByStripeCustomerId(customerId));
        const metaOrgId = orgIdFromMetadata(sub.metadata);
        if (!org && metaOrgId) {
          org = await findOrgById(metaOrgId);
        }
        if (!org) {
          console.warn("Stripe subscription event with no matching org", sub.id, customerId);
          break;
        }
        const prevCancelAtEnd = Boolean(org.cancelAtPeriodEnd);
        const prevStatus = org.billingStatus;
        const plan =
          sub.metadata?.billingPlan || org.billingPlan || "individual_weekly";
        const patch = billingPatchFromSubscription(sub, { billingPlan: plan });
        // On deleted, force canceled billing status
        if (event.type === "customer.subscription.deleted") {
          patch.billingStatus = "canceled";
          Object.assign(patch, {
            status: "expired",
            pipelineStatus: "churned",
            trialEndsAt: new Date(),
            cancelAtPeriodEnd: false,
          });
        }
        const updated = await applyBillingPatch(org.id, patch);
        const fresh = updated || (await findOrgById(org.id));

        await logBillingEvent(`billing_stripe_${event.type}`, org.id, {
          stripeStatus: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });

        if (event.type === "customer.subscription.deleted" && fresh) {
          await notifySubscriptionCanceled(fresh, { atPeriodEnd: false });
        } else if (
          event.type === "customer.subscription.updated" &&
          fresh &&
          sub.cancel_at_period_end &&
          !prevCancelAtEnd
        ) {
          await notifySubscriptionCanceled(fresh, {
            atPeriodEnd: true,
            periodEnd: fresh.currentPeriodEnd,
          });
        } else if (
          event.type === "customer.subscription.updated" &&
          fresh &&
          (sub.status === "past_due" || sub.status === "unpaid") &&
          prevStatus !== "past_due" &&
          prevStatus !== "unpaid"
        ) {
          await notifyPaymentFailed(fresh);
        } else if (
          (event.type === "customer.subscription.created" ||
            event.type === "customer.subscription.updated") &&
          fresh &&
          (sub.status === "active" || sub.status === "trialing") &&
          prevStatus !== "active" &&
          prevStatus !== "trialing"
        ) {
          await notifySubscriptionActive(fresh);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = (invoice as { subscription?: string | { id: string } | null }).subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const org =
          (await findOrgByStripeSubscriptionId(sub.id)) ||
          (await findOrgByStripeCustomerId(customerId));
        if (!org) break;
        await applyBillingPatch(
          org.id,
          billingPatchFromSubscription(sub, {
            billingPlan: sub.metadata?.billingPlan || org.billingPlan || undefined,
          }),
        );
        await logBillingEvent("billing_invoice_paid", org.id, {
          invoiceId: invoice.id,
          amountPaid: (invoice as { amount_paid?: number }).amount_paid,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const org = await findOrgByStripeCustomerId(customerId);
        if (!org) break;
        const updated = await applyBillingPatch(org.id, {
          billingStatus: "past_due",
          status: "suspended",
          pipelineStatus: "follow_up",
        });
        const fresh = updated || (await findOrgById(org.id));
        if (fresh) await notifyPaymentFailed(fresh);
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
