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
  sendBillingActiveAdminAlert,
  sendMembershipActivatedEmail,
} from "../resend";
import { recordBillingEmailFailure } from "./billingEmailMetrics";
import { logger } from "../lib/logger";
import { safeLogFields } from "../observability/safeLog";

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
    logger.warn(
      safeLogFields({ event: "billing_event_log_failed", billingEventType: type, err }),
      "Billing audit event could not be written",
    );
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
export async function notifyPaymentFailed(org: ClientOrganization): Promise<boolean> {
  await logBillingEvent("billing_payment_failed", org.id, {
    billingStatus: org.billingStatus,
    stripeSubscriptionId: org.stripeSubscriptionId,
  });

  const members = await activeMembers(org.id);
  let delivered = true;
  for (const m of members) {
    try {
      if ((await sendBillingPaymentFailedEmail(m.email, m.name, org.name)) === false) delivered = false;
    } catch (err) {
      delivered = false;
      recordBillingEmailFailure("payment_failed", org.id);
      logger.error(
        safeLogFields({ event: "billing_email_failed", type: "payment_failed", orgId: org.id, err }),
        "Billing payment-failed email could not be sent",
      );
    }
  }

  const adminTo =
    process.env.NOTIFICATION_EMAIL ||
    process.env.OPS_DIGEST_EMAIL ||
    "nick@spartanhospicecoaching.com";
  try {
    if ((await sendBillingPastDueAdminAlert(adminTo, {
      orgId: org.id,
      orgName: org.name,
      billingPlan: org.billingPlan,
      billingStatus: org.billingStatus || "past_due",
      memberEmails: members.map((m) => m.email),
    })) === false) delivered = false;
  } catch (err) {
    delivered = false;
    recordBillingEmailFailure("past_due_admin_alert", org.id);
    logger.error(
      safeLogFields({ event: "billing_email_failed", type: "past_due_admin_alert", orgId: org.id, err }),
      "Billing past-due admin alert could not be sent",
    );
  }
  return delivered;
}

/**
 * After subscription canceled / deleted:
 * email members that access ends.
 */
export async function notifySubscriptionCanceled(
  org: ClientOrganization,
  opts?: { atPeriodEnd?: boolean; periodEnd?: Date | null },
): Promise<boolean> {
  await logBillingEvent("billing_subscription_canceled", org.id, {
    atPeriodEnd: opts?.atPeriodEnd ?? false,
    periodEnd: opts?.periodEnd?.toISOString() ?? org.currentPeriodEnd?.toISOString() ?? null,
    billingStatus: org.billingStatus,
  });

  const members = await activeMembers(org.id);
  let delivered = true;
  for (const m of members) {
    try {
      if ((await sendBillingCanceledEmail(m.email, m.name, org.name, {
        atPeriodEnd: opts?.atPeriodEnd ?? Boolean(org.cancelAtPeriodEnd),
        periodEnd: opts?.periodEnd ?? org.currentPeriodEnd ?? null,
      })) === false) delivered = false;
    } catch (err) {
      delivered = false;
      recordBillingEmailFailure("canceled", org.id);
      logger.error(
        safeLogFields({ event: "billing_email_failed", type: "canceled", orgId: org.id, err }),
        "Billing cancellation email could not be sent",
      );
    }
  }
  return delivered;
}

/**
 * Stripe path: welcome members when subscription becomes active.
 * Uses membership-activated copy (Command Center first) + admin alert.
 * Note: Stripe redeliveries may re-send email; audit event always logged.
 */
export async function notifySubscriptionActive(org: ClientOrganization): Promise<boolean> {
  await logBillingEvent("billing_subscription_active", org.id, {
    billingPlan: org.billingPlan,
    billingStatus: org.billingStatus,
    stripeSubscriptionId: org.stripeSubscriptionId,
  });

  const members = await activeMembers(org.id);
  let delivered = true;
  for (const m of members) {
    try {
      if ((await sendMembershipActivatedEmail(m.email, m.name, org.name)) === false) delivered = false;
    } catch (err) {
      delivered = false;
      recordBillingEmailFailure("active", org.id);
      logger.error(
        safeLogFields({ event: "billing_email_failed", type: "active", orgId: org.id, err }),
        "Billing activation email could not be sent",
      );
    }
  }

  const adminTo =
    process.env.NOTIFICATION_EMAIL ||
    process.env.OPS_DIGEST_EMAIL ||
    "nick@spartanhospicecoaching.com";
  try {
    if ((await sendBillingActiveAdminAlert(adminTo, {
      orgId: org.id,
      orgName: org.name,
      billingPlan: org.billingPlan,
      memberEmails: members.map((m) => m.email),
    })) === false) delivered = false;
  } catch (err) {
    delivered = false;
    recordBillingEmailFailure("active_admin_alert", org.id);
    logger.error(
      safeLogFields({ event: "billing_email_failed", type: "active_admin_alert", orgId: org.id, err }),
      "Billing activation admin alert could not be sent",
    );
  }
  return delivered;
}
