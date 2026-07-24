/**
 * Map Stripe subscription state → client_organizations entitlement fields.
 * Source of truth for payment is Stripe; tools gate on org.status.
 */
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { clientOrganizations, type ClientOrganization } from "@workspace/db";
import { db } from "../db";
import { entitlementFromStripeStatus } from "./entitlementMap";

export { entitlementFromStripeStatus } from "./entitlementMap";

export type OrgBillingPatch = {
  billingPlan?: string | null;
  billingStatus?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  status?: string;
  activatedAt?: Date | null;
  trialEndsAt?: Date | null;
  pipelineStatus?: string;
  billableSeats?: number | null;
};

function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const end = (sub as { current_period_end?: number }).current_period_end;
  if (typeof end === "number" && end > 0) return new Date(end * 1000);
  return null;
}

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0];
  const price = item?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

function quantityFromSubscription(sub: Stripe.Subscription): number | null {
  const qty = sub.items?.data?.[0]?.quantity;
  return typeof qty === "number" && qty > 0 ? qty : null;
}

export function billingPatchFromSubscription(
  sub: Stripe.Subscription,
  opts?: { billingPlan?: string },
): OrgBillingPatch {
  const stripeStatus = sub.status;
  const entitlement = entitlementFromStripeStatus(stripeStatus);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const qty = quantityFromSubscription(sub);

  return {
    ...entitlement,
    billingPlan: opts?.billingPlan ?? undefined,
    billingStatus: stripeStatus,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceIdFromSubscription(sub),
    currentPeriodEnd: periodEndFromSubscription(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    billableSeats: qty,
  };
}

export async function applyBillingPatch(
  orgId: number,
  patch: OrgBillingPatch,
): Promise<ClientOrganization | null> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) clean[k] = v;
  }
  if (Object.keys(clean).length === 0) return null;

  // When seats billable is set, keep seatLimit in sync if larger
  if (typeof clean.billableSeats === "number") {
    const [current] = await db
      .select()
      .from(clientOrganizations)
      .where(eq(clientOrganizations.id, orgId))
      .limit(1);
    if (current && (current.seatLimit ?? 0) < (clean.billableSeats as number)) {
      clean.seatLimit = clean.billableSeats;
    }
  }

  const [updated] = await db
    .update(clientOrganizations)
    .set(clean as any)
    .where(eq(clientOrganizations.id, orgId))
    .returning();
  return updated ?? null;
}

export async function findOrgByStripeCustomerId(
  customerId: string,
): Promise<ClientOrganization | null> {
  const [org] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.stripeCustomerId, customerId))
    .limit(1);
  return org ?? null;
}

export async function findOrgByStripeSubscriptionId(
  subscriptionId: string,
): Promise<ClientOrganization | null> {
  const [org] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return org ?? null;
}

export async function findOrgById(orgId: number): Promise<ClientOrganization | null> {
  const [org] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.id, orgId))
    .limit(1);
  return org ?? null;
}
