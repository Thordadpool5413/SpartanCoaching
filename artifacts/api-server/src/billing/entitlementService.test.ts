import { describe, expect, it } from "vitest";
import {
  APP_STORE_BILLING_AUDIT,
  assertIndividualCheckoutAllowed,
  deriveBillingSource,
  isInBillingGraceWindow,
  publicEntitlementPayload,
  resolveProductEntitlement,
  seatCapacityStatus,
} from "./entitlementService";

const activeMember = {
  status: "active",
  role: "member",
  passwordHash: "x",
};

describe("deriveBillingSource", () => {
  it("classifies trial, individual stripe, corporate, comp, platform", () => {
    expect(
      deriveBillingSource(activeMember, {
        type: "personal",
        status: "trial",
        trialEndsAt: new Date(Date.now() + 86_400_000),
      }),
    ).toBe("trial_evaluation");

    expect(
      deriveBillingSource(activeMember, {
        type: "personal",
        status: "active",
        billingPlan: "individual_weekly",
        stripeSubscriptionId: "sub_1",
        billingStatus: "active",
      }),
    ).toBe("stripe_individual");

    expect(
      deriveBillingSource(activeMember, {
        type: "company",
        status: "active",
        billingPlan: "corporate_contract",
        stripeSubscriptionId: "sub_c",
      }),
    ).toBe("stripe_corporate");

    expect(
      deriveBillingSource(activeMember, {
        type: "company",
        status: "active",
        billingPlan: "corporate_contract",
        contractRef: "MSA-1",
      }),
    ).toBe("offline_contract");

    expect(
      deriveBillingSource(activeMember, {
        type: "personal",
        status: "active",
        billingPlan: "comp",
      }),
    ).toBe("comp");

    expect(
      deriveBillingSource(
        { status: "active", role: "platform_admin", passwordHash: "x" },
        { type: "platform", status: "active" },
      ),
    ).toBe("platform_admin");
  });
});

describe("assertIndividualCheckoutAllowed — duplicate + plan guards", () => {
  it("blocks active duplicate subscription", () => {
    const block = assertIndividualCheckoutAllowed(activeMember, {
      type: "personal",
      status: "active",
      stripeSubscriptionId: "sub_live",
      billingStatus: "active",
    });
    expect(block?.code).toBe("ALREADY_SUBSCRIBED");
  });

  it("blocks comp and corporate and platform", () => {
    expect(
      assertIndividualCheckoutAllowed(activeMember, {
        type: "personal",
        status: "trial",
        billingPlan: "comp",
      })?.code,
    ).toBe("COMP_ACCOUNT");
    expect(
      assertIndividualCheckoutAllowed(activeMember, {
        type: "company",
        status: "trial",
      })?.code,
    ).toBe("CORPORATE_CONTRACT_REQUIRED");
    expect(
      assertIndividualCheckoutAllowed(activeMember, {
        type: "platform",
        status: "active",
      })?.code,
    ).toBe("PLATFORM_ORG");
  });

  it("allows personal trial without sub", () => {
    expect(
      assertIndividualCheckoutAllowed(activeMember, {
        type: "personal",
        status: "trial",
        trialEndsAt: new Date(Date.now() + 3_600_000),
      }),
    ).toBeNull();
  });
});

describe("resolveProductEntitlement — product vs billing source", () => {
  it("grants product access on trial without treating trial as paid stripe", () => {
    const ent = resolveProductEntitlement(
      activeMember,
      {
        type: "personal",
        status: "trial",
        trialEndsAt: new Date(Date.now() + 7_200_000),
        seatLimit: 1,
      },
      { activeMemberCount: 1, stripeConfigured: true, individualPriceConfigured: true },
    );
    expect(ent.productAccess).toBe(true);
    expect(ent.billingSource).toBe("trial_evaluation");
    expect(ent.actions.canCheckoutIndividual).toBe(true);
    expect(ent.purchaseChannel.appleIapImplemented).toBe(false);
  });

  it("denies product access when suspended but exposes billing failure + portal restore", () => {
    const ent = resolveProductEntitlement(
      activeMember,
      {
        type: "personal",
        status: "suspended",
        billingPlan: "individual_weekly",
        billingStatus: "past_due",
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
        seatLimit: 1,
      },
      { stripeConfigured: true, individualPriceConfigured: true },
    );
    expect(ent.productAccess).toBe(false);
    expect(ent.reason).toBe("suspended");
    expect(ent.billingFailure).toBe(true);
    expect(ent.inBillingGraceWindow).toBe(true);
    expect(ent.actions.canOpenBillingPortal).toBe(true);
    expect(ent.actions.canRestoreViaPortal).toBe(true);
    // Suspended past_due is not ALREADY_SUBSCRIBED (requires org.status=active).
    // Portal is preferred; checkout may still open if Stripe allows a new session.
    expect(ent.actions.canCheckoutIndividual).toBe(true);
  });

  it("denies expired evaluation and allows checkout restore path", () => {
    const ent = resolveProductEntitlement(
      activeMember,
      {
        type: "personal",
        status: "expired",
        trialEndsAt: new Date(Date.now() - 1000),
        seatLimit: 1,
      },
      { stripeConfigured: true, individualPriceConfigured: true },
    );
    expect(ent.productAccess).toBe(false);
    expect(ent.reason).toBe("expired");
    expect(ent.actions.canCheckoutIndividual).toBe(true);
  });

  it("comp grants access without checkout", () => {
    const ent = resolveProductEntitlement(
      activeMember,
      {
        type: "personal",
        status: "active",
        billingPlan: "comp",
        seatLimit: 1,
      },
      { stripeConfigured: true, individualPriceConfigured: true },
    );
    expect(ent.productAccess).toBe(true);
    expect(ent.billingSource).toBe("comp");
    expect(ent.actions.canCheckoutIndividual).toBe(false);
    expect(ent.actions.blockCheckoutCode).toBe("COMP_ACCOUNT");
  });

  it("flags seat overage without inventing client-side access", () => {
    const seats = seatCapacityStatus(
      { type: "company", status: "active", seatLimit: 2, billableSeats: 2 },
      5,
    );
    expect(seats.overSeatLimit).toBe(true);
  });

  it("public payload never includes secret provider ids", () => {
    const ent = resolveProductEntitlement(
      activeMember,
      {
        type: "personal",
        status: "active",
        billingPlan: "individual_weekly",
        billingStatus: "active",
        stripeCustomerId: "cus_secret",
        stripeSubscriptionId: "sub_secret",
        seatLimit: 1,
      },
      { stripeConfigured: true },
    );
    const json = JSON.stringify(publicEntitlementPayload(ent));
    expect(json).not.toContain("cus_secret");
    expect(json).not.toContain("sub_secret");
    expect(json).toContain("stripe_individual");
  });
});

describe("billing grace window", () => {
  it("is true for past_due with future period end", () => {
    expect(
      isInBillingGraceWindow({
        type: "personal",
        status: "suspended",
        billingStatus: "past_due",
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      }),
    ).toBe(true);
  });
});

describe("App Store audit constants", () => {
  it("records IAP not implemented and web Stripe path", () => {
    expect(APP_STORE_BILLING_AUDIT.appleIapStatus).toBe("not_implemented");
    expect(APP_STORE_BILLING_AUDIT.nativeStripeInAppBinary).toContain(
      "not_recommended",
    );
  });
});
