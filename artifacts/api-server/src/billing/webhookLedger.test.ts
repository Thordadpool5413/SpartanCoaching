import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  insertRows: [] as Array<{ id: string; attempts: number }>,
  selectedRows: [] as Array<{ id: string; status: string; processedAt: Date | null }>,
  updateRows: [] as Array<{ id: string; attempts?: number }>,
}));

vi.mock("../db", () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve(state.insertRows),
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(state.selectedRows),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(state.updateRows),
        }),
      }),
    }),
  },
}));

vi.mock("@workspace/db", () => ({
  stripeWebhookEvents: {
    id: "id",
    type: "type",
    status: "status",
    processedAt: "processed_at",
    claimedAt: "claimed_at",
    attempts: "attempts",
  },
}));

import {
  claimStripeWebhookEvent,
  markStripeWebhookProcessed,
} from "./webhookLedger";

describe("Stripe webhook ledger", () => {
  it("claims a previously unseen Stripe event", async () => {
    state.insertRows = [{ id: "evt_new", attempts: 1 }];
    state.selectedRows = [];

    await expect(claimStripeWebhookEvent("evt_new", "invoice.paid")).resolves.toEqual({
      kind: "claimed",
      id: "evt_new",
      attempt: 1,
    });
  });

  it("acknowledges an already completed event without replaying it", async () => {
    state.insertRows = [];
    state.selectedRows = [{ id: "evt_done", status: "processed", processedAt: new Date() }];

    await expect(claimStripeWebhookEvent("evt_done", "invoice.paid")).resolves.toEqual({
      kind: "duplicate",
    });
  });

  it("does not let a stale worker finalize after a newer attempt reclaimed its lease", async () => {
    state.insertRows = [];
    state.selectedRows = [{ id: "evt_reclaimed", status: "processing", processedAt: null }];
    state.updateRows = [{ id: "evt_reclaimed", attempts: 2 }];

    await expect(claimStripeWebhookEvent("evt_reclaimed", "invoice.paid")).resolves.toEqual({
      kind: "claimed",
      id: "evt_reclaimed",
      attempt: 2,
    });

    // The original worker still holds attempt 1, but its conditional update
    // matches no row once attempt 2 owns the lease.
    state.updateRows = [];
    await expect(markStripeWebhookProcessed("evt_reclaimed", 1)).resolves.toBe(false);
  });
});