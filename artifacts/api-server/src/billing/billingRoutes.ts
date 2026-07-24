import type { Express, Request, Response } from "express";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { clientOrganizations } from "@workspace/db";
import { db } from "../db";
import {
  requireAuth,
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
        await applyBillingPatch(org.id, patch);
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
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const org = await findOrgByStripeCustomerId(customerId);
        if (!org) break;
        await applyBillingPatch(org.id, {
          billingStatus: "past_due",
          status: "suspended",
          pipelineStatus: "follow_up",
        });
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
