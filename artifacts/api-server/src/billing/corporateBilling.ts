/**
 * Corporate / provider contract billing helpers (Phase 3).
 * Weekly per-seat pricing set under contract; quantity = billable seats.
 */
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { clientMembers, clientOrganizations, type ClientOrganization } from "@workspace/db";
import { db } from "../db";
import { getStripe, isStripeConfigured } from "./stripeClient";
import { applyBillingPatch, billingPatchFromSubscription } from "./subscriptionSync";

export type ActivateCorporateContractInput = {
  seats: number;
  /** Weekly unit price per seat in cents, e.g. 1499 = $14.99 */
  unitAmountCents: number;
  currency?: string;
  contractRef?: string;
  /** Email for Stripe customer if creating new */
  billingEmail?: string;
  billingName?: string;
  /**
   * send_invoice (default) — Stripe emails invoices; good for contracts.
   * charge_automatically — requires customer payment method (rare for admin activate).
   * offline — DB only, no Stripe subscription (comp-style paid offline).
   */
  collectionMode?: "send_invoice" | "charge_automatically" | "offline";
  daysUntilDue?: number;
};

export type CorporateContractResult = {
  organization: ClientOrganization;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  mode: "send_invoice" | "charge_automatically" | "offline";
  message: string;
};

async function primaryBillingContact(orgId: number): Promise<{ email: string; name: string } | null> {
  const members = await db
    .select()
    .from(clientMembers)
    .where(eq(clientMembers.organizationId, orgId));
  const admin =
    members.find((m) => m.role === "org_admin" && m.status !== "disabled") ||
    members.find((m) => m.status === "active") ||
    members[0];
  if (!admin) return null;
  return { email: admin.email, name: admin.name };
}

/**
 * Activate or update a corporate contract on an organization.
 * Sets seatLimit + billableSeats, optional Stripe subscription with weekly unit price × seats.
 */
export async function activateCorporateContract(
  orgId: number,
  input: ActivateCorporateContractInput,
): Promise<CorporateContractResult> {
  const seats = Math.max(1, Math.min(500, Math.floor(input.seats)));
  const unitAmountCents = Math.max(50, Math.floor(input.unitAmountCents)); // min $0.50
  const currency = (input.currency || "usd").toLowerCase();
  const contractRef = (input.contractRef || "").trim().slice(0, 128) || null;
  const collectionMode = input.collectionMode || "send_invoice";
  const daysUntilDue = Math.max(1, Math.min(90, input.daysUntilDue ?? 14));

  const [org] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.id, orgId))
    .limit(1);
  if (!org) throw new Error("Organization not found");
  if (org.type === "platform") throw new Error("Platform org cannot use corporate billing");

  // Offline / invoice outside Stripe
  if (collectionMode === "offline" || !isStripeConfigured()) {
    const updated = await applyBillingPatch(orgId, {
      status: "active",
      pipelineStatus: "won",
      activatedAt: new Date(),
      trialEndsAt: null,
      billingPlan: "corporate_contract",
      billingStatus: isStripeConfigured() ? "offline" : "offline",
      billableSeats: seats,
      contractUnitAmountCents: unitAmountCents,
      contractCurrency: currency,
      contractRef,
      // seatLimit via applyBillingPatch when billableSeats larger — also set explicitly
    });
    // Force seatLimit
    const [withSeats] = await db
      .update(clientOrganizations)
      .set({
        seatLimit: seats,
        billableSeats: seats,
        type: org.type === "personal" ? "company" : org.type,
      })
      .where(eq(clientOrganizations.id, orgId))
      .returning();

    return {
      organization: withSeats || updated!,
      stripeSubscriptionId: null,
      stripeCustomerId: org.stripeCustomerId ?? null,
      mode: "offline",
      message: isStripeConfigured()
        ? "Contract activated offline (no Stripe charge). Seats and rate stored for records."
        : "Contract activated offline. Stripe is not configured.",
    };
  }

  const stripe = getStripe();
  const contact =
    (input.billingEmail
      ? { email: input.billingEmail, name: input.billingName || org.name }
      : null) || (await primaryBillingContact(orgId));

  if (!contact?.email) {
    throw new Error("Billing contact email required for Stripe corporate activation");
  }

  let customerId = org.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: contact.email,
      name: contact.name || org.name,
      metadata: {
        organizationId: String(org.id),
        billingPlan: "corporate_contract",
        contractRef: contractRef || "",
      },
    });
    customerId = customer.id;
  } else {
    await stripe.customers.update(customerId, {
      email: contact.email,
      name: contact.name || org.name,
      metadata: {
        organizationId: String(org.id),
        billingPlan: "corporate_contract",
        contractRef: contractRef || "",
      },
    });
  }

  const productName = `Membership seats · ${org.name}${contractRef ? ` · ${contractRef}` : ""}`;

  // Update existing subscription quantity/price if present
  if (org.stripeSubscriptionId) {
    try {
      const existing = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      if (existing.status !== "canceled" && existing.status !== "incomplete_expired") {
        const item = existing.items.data[0];
        // Create a new price for the new unit amount if it changed
        const product = await stripe.products.create({
          name: productName,
          metadata: {
            organizationId: String(org.id),
            billingPlan: "corporate_contract",
            contractRef: contractRef || "",
          },
        });
        const price = await stripe.prices.create({
          currency,
          unit_amount: unitAmountCents,
          recurring: { interval: "week" },
          product: product.id,
          metadata: {
            organizationId: String(org.id),
            billingPlan: "corporate_contract",
            contractRef: contractRef || "",
          },
        });

        const updatedSub = await stripe.subscriptions.update(org.stripeSubscriptionId, {
          items: item
            ? [{ id: item.id, price: price.id, quantity: seats }]
            : [{ price: price.id, quantity: seats }],
          proration_behavior: "create_prorations",
          metadata: {
            organizationId: String(org.id),
            billingPlan: "corporate_contract",
            contractRef: contractRef || "",
          },
          ...(collectionMode === "send_invoice"
            ? { collection_method: "send_invoice" as const, days_until_due: daysUntilDue }
            : { collection_method: "charge_automatically" as const }),
        });

        await applyBillingPatch(
          orgId,
          billingPatchFromSubscription(updatedSub, { billingPlan: "corporate_contract" }),
        );
        const [finalOrg] = await db
          .update(clientOrganizations)
          .set({
            seatLimit: seats,
            billableSeats: seats,
            contractUnitAmountCents: unitAmountCents,
            contractCurrency: currency,
            contractRef,
            stripeCustomerId: customerId,
            stripePriceId: price.id,
            type: org.type === "personal" ? "company" : org.type,
            status: "active",
            pipelineStatus: "won",
            activatedAt: new Date(),
            trialEndsAt: null,
            billingPlan: "corporate_contract",
          })
          .where(eq(clientOrganizations.id, orgId))
          .returning();

        return {
          organization: finalOrg!,
          stripeSubscriptionId: updatedSub.id,
          stripeCustomerId: customerId,
          mode: collectionMode,
          message: `Updated Stripe subscription to ${seats} seats @ ${unitAmountCents / 100}/seat/week.`,
        };
      }
    } catch (err) {
      console.warn("Could not update existing corporate subscription; creating new:", err);
    }
  }

  // New subscription
  const product = await stripe.products.create({
    name: productName,
    metadata: {
      organizationId: String(org.id),
      billingPlan: "corporate_contract",
      contractRef: contractRef || "",
    },
  });
  const price = await stripe.prices.create({
    currency,
    unit_amount: unitAmountCents,
    recurring: { interval: "week" },
    product: product.id,
    metadata: {
      organizationId: String(org.id),
      billingPlan: "corporate_contract",
      contractRef: contractRef || "",
    },
  });

  const subParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: price.id, quantity: seats }],
    metadata: {
      organizationId: String(org.id),
      billingPlan: "corporate_contract",
      contractRef: contractRef || "",
    },
  };

  if (collectionMode === "send_invoice") {
    subParams.collection_method = "send_invoice";
    subParams.days_until_due = daysUntilDue;
  } else {
    subParams.collection_method = "charge_automatically";
  }

  const sub = await stripe.subscriptions.create(subParams);

  await applyBillingPatch(
    orgId,
    billingPatchFromSubscription(sub, { billingPlan: "corporate_contract" }),
  );

  const [finalOrg] = await db
    .update(clientOrganizations)
    .set({
      seatLimit: seats,
      billableSeats: seats,
      contractUnitAmountCents: unitAmountCents,
      contractCurrency: currency,
      contractRef,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: price.id,
      type: org.type === "personal" ? "company" : org.type,
      status: "active",
      pipelineStatus: "won",
      activatedAt: new Date(),
      trialEndsAt: null,
      billingPlan: "corporate_contract",
      billingStatus: sub.status,
    })
    .where(eq(clientOrganizations.id, orgId))
    .returning();

  return {
    organization: finalOrg!,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId,
    mode: collectionMode,
    message:
      collectionMode === "send_invoice"
        ? `Corporate contract active: ${seats} seats @ $${(unitAmountCents / 100).toFixed(2)}/seat/week. Stripe will send invoices.`
        : `Corporate subscription created: ${seats} seats @ $${(unitAmountCents / 100).toFixed(2)}/seat/week.`,
  };
}

/**
 * Change billable seat count; syncs Stripe subscription quantity when present.
 */
export async function updateCorporateSeats(
  orgId: number,
  seats: number,
): Promise<{ organization: ClientOrganization; message: string }> {
  const nextSeats = Math.max(1, Math.min(500, Math.floor(seats)));
  const [org] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.id, orgId))
    .limit(1);
  if (!org) throw new Error("Organization not found");

  if (org.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    const item = sub.items.data[0];
    if (!item) throw new Error("Subscription has no line items");
    const updated = await stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [{ id: item.id, quantity: nextSeats }],
      proration_behavior: "create_prorations",
    });
    await applyBillingPatch(
      orgId,
      billingPatchFromSubscription(updated, {
        billingPlan: org.billingPlan || "corporate_contract",
      }),
    );
  }

  const [finalOrg] = await db
    .update(clientOrganizations)
    .set({
      seatLimit: nextSeats,
      billableSeats: nextSeats,
    })
    .where(eq(clientOrganizations.id, orgId))
    .returning();

  return {
    organization: finalOrg!,
    message: org.stripeSubscriptionId
      ? `Seats updated to ${nextSeats} (Stripe quantity synced).`
      : `Seats updated to ${nextSeats} (no Stripe subscription).`,
  };
}
