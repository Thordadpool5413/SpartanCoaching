/**
 * Smoke tests for billing notification emails.
 *
 * Resend + DB are mocked — no real emails or database connection required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Provide a dummy URL before any module that imports @workspace/db runs.
// (vitest hoists vi.mock / vi.hoisted above imports.)
vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://ci:ci@127.0.0.1:5432/ci";
  }
});

// ── mock the DB module so activeMembers() returns a test member ──────────────
vi.mock("../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              id: 1,
              email: "test-member@example.com",
              name: "Test Member",
              organizationId: 1,
              status: "active",
            },
          ]),
      }),
    }),
    insert: () => ({ values: () => Promise.resolve() }),
  },
}));

// ── mock the resend module so no real HTTP calls are made ────────────────────
const mockSendMembershipActivatedEmail = vi.fn().mockResolvedValue(undefined);
const mockSendBillingActiveAdminAlert = vi.fn().mockResolvedValue(undefined);
const mockSendBillingPaymentFailedEmail = vi.fn().mockResolvedValue(undefined);
const mockSendBillingPastDueAdminAlert = vi.fn().mockResolvedValue(undefined);
const mockSendBillingCanceledEmail = vi.fn().mockResolvedValue(undefined);

vi.mock("../resend", () => ({
  sendMembershipActivatedEmail: (...args: unknown[]) =>
    mockSendMembershipActivatedEmail(...args),
  sendBillingActiveAdminAlert: (...args: unknown[]) =>
    mockSendBillingActiveAdminAlert(...args),
  sendBillingPaymentFailedEmail: (...args: unknown[]) =>
    mockSendBillingPaymentFailedEmail(...args),
  sendBillingPastDueAdminAlert: (...args: unknown[]) =>
    mockSendBillingPastDueAdminAlert(...args),
  sendBillingCanceledEmail: (...args: unknown[]) =>
    mockSendBillingCanceledEmail(...args),
}));

// Avoid real DB writes from metrics if anything reaches the real module
vi.mock("./billingEmailMetrics", () => ({
  recordBillingEmailFailure: vi.fn(),
  getBillingEmailMetrics: vi.fn(() => ({
    ok: true,
    failures1h: 0,
    failures24h: 0,
  })),
  isHydrationComplete: vi.fn(() => true),
}));

import {
  notifySubscriptionActive,
  notifyPaymentFailed,
  notifySubscriptionCanceled,
} from "./billingNotifications";
import type { ClientOrganization } from "@workspace/db";

// ── shared test fixture ──────────────────────────────────────────────────────
function makeTestOrg(overrides: Partial<ClientOrganization> = {}): ClientOrganization {
  return {
    id: 1,
    name: "Test Org",
    slug: "test-org",
    billingPlan: "field_kit",
    billingStatus: "active",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: "sub_test",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    trialEndsAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  } as unknown as ClientOrganization;
}

describe("billing notification smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifySubscriptionActive", () => {
    it("sends member email without throwing", async () => {
      const org = makeTestOrg();
      await expect(notifySubscriptionActive(org)).resolves.toBe(true);
    });

    it("calls sendMembershipActivatedEmail for each active member", async () => {
      const org = makeTestOrg({ name: "Acme Corp" });
      await notifySubscriptionActive(org);
      expect(mockSendMembershipActivatedEmail).toHaveBeenCalledTimes(1);
      expect(mockSendMembershipActivatedEmail).toHaveBeenCalledWith(
        "test-member@example.com",
        "Test Member",
        "Acme Corp",
      );
    });

    it("sends admin alert with org details", async () => {
      const org = makeTestOrg({ billingPlan: "field_kit" });
      await notifySubscriptionActive(org);
      expect(mockSendBillingActiveAdminAlert).toHaveBeenCalledTimes(1);
      const [, payload] = mockSendBillingActiveAdminAlert.mock.calls[0];
      expect(payload).toMatchObject({
        orgId: 1,
        orgName: "Test Org",
        billingPlan: "field_kit",
        memberEmails: ["test-member@example.com"],
      });
    });

    it("does not throw even if the send helper rejects", async () => {
      mockSendMembershipActivatedEmail.mockRejectedValueOnce(
        new Error("Resend delivery error [validation_error]: domain not verified"),
      );
      await expect(notifySubscriptionActive(makeTestOrg())).resolves.toBe(false);
    });
  });

  describe("notifyPaymentFailed", () => {
    it("sends member email without throwing", async () => {
      const org = makeTestOrg({ billingStatus: "past_due" });
      await expect(notifyPaymentFailed(org)).resolves.toBe(true);
    });

    it("calls sendBillingPaymentFailedEmail for each active member", async () => {
      const org = makeTestOrg({ name: "Beta LLC", billingStatus: "past_due" });
      await notifyPaymentFailed(org);
      expect(mockSendBillingPaymentFailedEmail).toHaveBeenCalledTimes(1);
      expect(mockSendBillingPaymentFailedEmail).toHaveBeenCalledWith(
        "test-member@example.com",
        "Test Member",
        "Beta LLC",
      );
    });

    it("sends past-due admin alert", async () => {
      const org = makeTestOrg({ billingStatus: "past_due" });
      await notifyPaymentFailed(org);
      expect(mockSendBillingPastDueAdminAlert).toHaveBeenCalledTimes(1);
      const [, payload] = mockSendBillingPastDueAdminAlert.mock.calls[0];
      expect(payload).toMatchObject({
        orgId: 1,
        memberEmails: ["test-member@example.com"],
      });
    });

    it("does not throw even if the send helper rejects", async () => {
      mockSendBillingPaymentFailedEmail.mockRejectedValueOnce(
        new Error("Resend delivery error [validation_error]: domain not verified"),
      );
      await expect(notifyPaymentFailed(makeTestOrg())).resolves.toBe(false);
    });
  });

  describe("notifySubscriptionCanceled", () => {
    it("sends member email without throwing", async () => {
      const org = makeTestOrg({ billingStatus: "canceled" });
      await expect(notifySubscriptionCanceled(org)).resolves.toBe(true);
    });

    it("calls sendBillingCanceledEmail with period-end options", async () => {
      const periodEnd = new Date("2025-12-31");
      const org = makeTestOrg({ name: "Gamma Inc", billingStatus: "canceled" });
      await notifySubscriptionCanceled(org, { atPeriodEnd: true, periodEnd });
      expect(mockSendBillingCanceledEmail).toHaveBeenCalledTimes(1);
      expect(mockSendBillingCanceledEmail).toHaveBeenCalledWith(
        "test-member@example.com",
        "Test Member",
        "Gamma Inc",
        { atPeriodEnd: true, periodEnd },
      );
    });

    it("defaults atPeriodEnd to false when not provided", async () => {
      const org = makeTestOrg();
      await notifySubscriptionCanceled(org);
      const [, , , opts] = mockSendBillingCanceledEmail.mock.calls[0];
      expect(opts.atPeriodEnd).toBe(false);
    });

    it("does not throw even if the send helper rejects", async () => {
      mockSendBillingCanceledEmail.mockRejectedValueOnce(
        new Error("Resend delivery error [validation_error]: domain not verified"),
      );
      await expect(notifySubscriptionCanceled(makeTestOrg())).resolves.toBe(false);
    });
  });
});
