import { describe, expect, it, vi } from "vitest";

const ledger = vi.hoisted(() => ({
  claims: [true, false] as boolean[],
  completed: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./webhookLedger", () => ({
  claimStripeWebhookNotification: () => Promise.resolve(ledger.claims.shift() ?? false),
  markStripeWebhookNotificationCompleted: (...args: unknown[]) => ledger.completed(...args),
}));

vi.mock("../lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("../observability/safeLog", () => ({ safeLogFields: (value: unknown) => value }));

import { deliverStripeWebhookNotification } from "./webhookNotificationDelivery";

describe("Stripe webhook notification delivery", () => {
  it("claims a notification before delivery and never re-sends it on a retry", async () => {
    ledger.claims = [true, false];
    ledger.completed.mockReset().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue(true);

    await expect(
      deliverStripeWebhookNotification("evt_retry", "subscription_active", 12, send),
    ).resolves.toBe("sent");
    await expect(
      deliverStripeWebhookNotification("evt_retry", "subscription_active", 12, send),
    ).resolves.toBe("skipped");

    expect(send).toHaveBeenCalledTimes(1);
    expect(ledger.completed).toHaveBeenCalledWith(
      "evt_retry",
      "subscription_active",
      true,
    );
  });

  it("does not re-send after the provider accepts an email but completion persistence fails", async () => {
    ledger.claims = [true, false];
    ledger.completed
      .mockReset()
      .mockRejectedValueOnce(new Error("temporary database issue"))
      .mockResolvedValueOnce(undefined);
    const send = vi.fn().mockResolvedValue(true);

    await expect(
      deliverStripeWebhookNotification("evt_after_send_failure", "payment_failed", 12, send),
    ).resolves.toBe("failed");
    await expect(
      deliverStripeWebhookNotification("evt_after_send_failure", "payment_failed", 12, send),
    ).resolves.toBe("skipped");

    expect(send).toHaveBeenCalledTimes(1);
  });
});