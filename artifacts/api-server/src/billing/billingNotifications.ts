/**
 * Phase 4 — billing lifecycle emails + audit events.
 */
import { eq, and, ne } from "drizzle-orm";
import { authEvents, clientMembers, type ClientOrganization } from "@workspace/db";
import { db } from "../db";
import {
  sendBillingPaymentFailedEmail,
  sendBillingCanceledEmail,
  sendBillingPastDueAdminAlert,
  sendBillingActiveEmail,
  sendBillingActiveAdminAlert,
} from "../resend";

export async function logBillingEvent(
  type: string,
  orgId: number,
  meta?: Record<string, unknown>,
  memberId?: number | null,
): Promise<void> {
  try {
    await db.insert(authEvents).values({
      memberId: memberId ?? null,
      type,
      meta: { organizationId: orgId, ...(meta || {}) },
    });
  } catch (err) {
    console.warn("logBillingEvent failed:", type, err);
  }
}

async function activeMembers(orgId: number) {
  return db
    .select()
    .from(clientMembers)
    .where(and(eq(clientMembers.organizationId, orgId), ne(clientMembers.status, "disabled")));
}

/**
 * After invoice.payment_failed / past_due subscription:
 * email members + admin alert.
 */
export async function notifyPaymentFailed(org: ClientOrganization): Promise<void> {
  await logBillingEvent("billing_payment_failed", org.id, {
    billingStatus: org.billingStatus,
    stripeSubscriptionId: org.stripeSubscriptionId,
  });

  const members = await activeMembers(org.id);
  for (const m of members) {
    try {
      await sendBillingPaymentFailedEmail(m.email, m.name, org.name);
    } catch (err) {
      console.warn("payment failed email to member failed:", m.email, err);
    }
  }

  const adminTo =
    process.env.NOTIFICATION_EMAIL ||
    process.env.OPS_DIGEST_EMAIL ||
    "nick@spartanhospicecoaching.com";
  try {
    await sendBillingPastDueAdminAlert(adminTo, {
      orgId: org.id,
      orgName: org.name,
      billingPlan: org.billingPlan,
      billingStatus: org.billingStatus || "past_due",
      memberEmails: members.map((m) => m.email),
    });
  } catch (err) {
    console.error("billing_email_failed", {
      event: "billing_email_failed",
      type: "past_due_admin_alert",
      orgId: org.id,
      err,
    });
  }
}

/**
 * After subscription canceled / deleted:
 * email members that access ends.
 */
export async function notifySubscriptionCanceled(
  org: ClientOrganization,
  opts?: { atPeriodEnd?: boolean; periodEnd?: Date | null },
): Promise<void> {
  await logBillingEvent("billing_subscription_canceled", org.id, {
    atPeriodEnd: opts?.atPeriodEnd ?? false,
    periodEnd: opts?.periodEnd?.toISOString() ?? org.currentPeriodEnd?.toISOString() ?? null,
    billingStatus: org.billingStatus,
  });

  const members = await activeMembers(org.id);
  for (const m of members) {
    try {
      await sendBillingCanceledEmail(m.email, m.name, org.name, {
        atPeriodEnd: opts?.atPeriodEnd ?? Boolean(org.cancelAtPeriodEnd),
        periodEnd: opts?.periodEnd ?? org.currentPeriodEnd ?? null,
      });
    } catch (err) {
      console.warn("canceled email to member failed:", m.email, err);
    }
  }
}

export async function notifySubscriptionActive(org: ClientOrganization): Promise<void> {
  await logBillingEvent("billing_subscription_active", org.id, {
    billingPlan: org.billingPlan,
    billingStatus: org.billingStatus,
    stripeSubscriptionId: org.stripeSubscriptionId,
  });

  const members = await activeMembers(org.id);
  for (const m of members) {
    try {
      await sendBillingActiveEmail(m.email, m.name, org.name);
    } catch (err) {
      console.warn("subscription active email to member failed:", m.email, err);
    }
  }

  const adminTo =
    process.env.NOTIFICATION_EMAIL ||
    process.env.OPS_DIGEST_EMAIL ||
    "nick@spartanhospicecoaching.com";
  try {
    await sendBillingActiveAdminAlert(adminTo, {
      orgId: org.id,
      orgName: org.name,
      billingPlan: org.billingPlan,
      memberEmails: members.map((m) => m.email),
    });
  } catch (err) {
    console.error("billing_email_failed", {
      event: "billing_email_failed",
      type: "active_admin_alert",
      orgId: org.id,
      err,
    });
  }
}
