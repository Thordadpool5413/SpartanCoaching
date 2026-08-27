import { logger } from "../lib/logger";
import { safeLogFields } from "../observability/safeLog";
import {
  claimStripeWebhookNotification,
  markStripeWebhookNotificationCompleted,
} from "./webhookLedger";

export type WebhookNotificationResult = "sent" | "failed" | "skipped";

/**
 * Claims a durable, per-event notification gate before an outbound email call.
 * Once claimed, a retry deliberately never re-sends this notification bundle:
 * at-most-once delivery avoids duplicate customer billing messages when the
 * webhook worker crashes after an email provider accepts the request.
 */
export async function deliverStripeWebhookNotification(
  stripeEventId: string,
  notificationType: string,
  organizationId: number,
  send: () => Promise<boolean>,
): Promise<WebhookNotificationResult> {
  const claimed = await claimStripeWebhookNotification(
    stripeEventId,
    notificationType,
    organizationId,
  );
  if (!claimed) {
    logger.info(
      { event: "stripe_webhook_notification_duplicate", notificationType, organizationId },
      "Skipped a previously claimed Stripe webhook notification",
    );
    return "skipped";
  }

  try {
    const delivered = await send();
    await markStripeWebhookNotificationCompleted(stripeEventId, notificationType, delivered);
    return delivered ? "sent" : "failed";
  } catch (err) {
    await markStripeWebhookNotificationCompleted(stripeEventId, notificationType, false).catch(
      (ledgerError) => {
        logger.error(
          safeLogFields({
            event: "stripe_webhook_notification_ledger_failure",
            notificationType,
            providerCode: (ledgerError as { code?: string })?.code,
          }),
          "Webhook notification ledger could not record a failed delivery",
        );
      },
    );
    logger.error(
      safeLogFields({
        event: "stripe_webhook_notification_failed",
        notificationType,
        providerCode: (err as { code?: string })?.code,
      }),
      "Stripe webhook notification could not be sent",
    );
    return "failed";
  }
}