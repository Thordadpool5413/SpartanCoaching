import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { stripeWebhookEvents, stripeWebhookNotifications } from "@workspace/db";
import { db } from "../db";

const CLAIM_STALE_AFTER_MS = 10 * 60 * 1000;

export type WebhookClaim =
  | { kind: "claimed"; id: string; attempt: number }
  | { kind: "duplicate" }
  | { kind: "retry_later" };

/**
 * Claim one Stripe delivery at a time. A completed event is never replayed.
 * If a worker dies after claiming, Stripe can retry after the short lease
 * expires; in-progress concurrent deliveries receive a retryable response.
 */
export async function claimStripeWebhookEvent(
  stripeEventId: string,
  eventType: string,
): Promise<WebhookClaim> {
  const now = new Date();
  const [created] = await db
    .insert(stripeWebhookEvents)
    .values({
      id: stripeEventId,
      type: eventType,
      status: "processing",
      attempts: 1,
      claimedAt: now,
    })
    .onConflictDoNothing({ target: stripeWebhookEvents.id })
    .returning({ id: stripeWebhookEvents.id, attempts: stripeWebhookEvents.attempts });
  if (created) return { kind: "claimed", id: created.id, attempt: created.attempts };

  const [existing] = await db
    .select({
      id: stripeWebhookEvents.id,
      status: stripeWebhookEvents.status,
      processedAt: stripeWebhookEvents.processedAt,
    })
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.id, stripeEventId))
    .limit(1);
  if (!existing || existing.processedAt || existing.status === "processed") {
    return { kind: "duplicate" };
  }

  const staleBefore = new Date(now.getTime() - CLAIM_STALE_AFTER_MS);
  const [reclaimed] = await db
    .update(stripeWebhookEvents)
    .set({
      status: "processing",
      attempts: sql`${stripeWebhookEvents.attempts} + 1`,
      claimedAt: now,
      failedAt: null,
      lastErrorCode: null,
    })
    .where(
      and(
        eq(stripeWebhookEvents.id, existing.id),
        isNull(stripeWebhookEvents.processedAt),
        or(
          eq(stripeWebhookEvents.status, "failed"),
          lt(stripeWebhookEvents.claimedAt, staleBefore),
        ),
      ),
    )
    .returning({ id: stripeWebhookEvents.id, attempts: stripeWebhookEvents.attempts });

  return reclaimed
    ? { kind: "claimed", id: reclaimed.id, attempt: reclaimed.attempts }
    : { kind: "retry_later" };
}

/**
 * Finalize only the claim that performed the work. The attempt number fences
 * out a worker whose lease was reclaimed while it was still running.
 */
export async function markStripeWebhookProcessed(
  id: string,
  attempt: number,
  organizationId?: number,
): Promise<boolean> {
  const updated = await db
    .update(stripeWebhookEvents)
    .set({
      status: "processed",
      processedAt: new Date(),
      organizationId: organizationId ?? null,
      failedAt: null,
      lastErrorCode: null,
    })
    .where(
      and(
        eq(stripeWebhookEvents.id, id),
        eq(stripeWebhookEvents.attempts, attempt),
        eq(stripeWebhookEvents.status, "processing"),
      ),
    )
    .returning({ id: stripeWebhookEvents.id });
  return updated.length > 0;
}

export async function markStripeWebhookFailed(
  id: string,
  attempt: number,
  errorCode = "PROCESSING_FAILED",
): Promise<boolean> {
  const updated = await db
    .update(stripeWebhookEvents)
    .set({
      status: "failed",
      failedAt: new Date(),
      lastErrorCode: errorCode.slice(0, 64),
    })
    .where(
      and(
        eq(stripeWebhookEvents.id, id),
        eq(stripeWebhookEvents.attempts, attempt),
        eq(stripeWebhookEvents.status, "processing"),
      ),
    )
    .returning({ id: stripeWebhookEvents.id });
  return updated.length > 0;
}

export async function claimStripeWebhookNotification(
  stripeEventId: string,
  notificationType: string,
  organizationId?: number,
): Promise<boolean> {
  const [claimed] = await db
    .insert(stripeWebhookNotifications)
    .values({
      stripeEventId,
      notificationType,
      organizationId: organizationId ?? null,
      status: "claimed",
    })
    .onConflictDoNothing({
      target: [
        stripeWebhookNotifications.stripeEventId,
        stripeWebhookNotifications.notificationType,
      ],
    })
    .returning({ id: stripeWebhookNotifications.id });
  return Boolean(claimed);
}

export async function markStripeWebhookNotificationCompleted(
  stripeEventId: string,
  notificationType: string,
  delivered: boolean,
): Promise<void> {
  await db
    .update(stripeWebhookNotifications)
    .set({
      status: delivered ? "sent" : "failed",
      completedAt: new Date(),
      failureCode: delivered ? null : "DELIVERY_FAILED",
    })
    .where(
      and(
        eq(stripeWebhookNotifications.stripeEventId, stripeEventId),
        eq(stripeWebhookNotifications.notificationType, notificationType),
      ),
    );
}