import { describe, expect, it } from "vitest";
import {
  GetMemberSyncQueryParams,
  GetMemberSyncResponse,
  GetSalesWorkflowTodayQueryParams,
  LoginBody,
  LoginResponse,
  PostMemberSyncBody,
  PostMemberSyncResponse,
  CreateMemberWorkBody,
  SaveResourceWorkBody,
  CreateProviderResourceBody,
  GetBillingStatusResponse,
  CreateBillingCheckoutBody,
  CreateBillingCheckoutResponse,
  GetAppleBillingCatalogResponse,
  VerifyAppleBillingTransactionBody,
  ListAdminAccessRequestsResponse,
  ApproveAdminAccessRequestBody,
  UpdateAdminOrganizationPipelineBody,
  TrackAnalyticsEventBody,
  TrackAnalyticsEventResponse,
  TrackAnalyticsVisitorResponse,
} from "./index";

describe("generated API validators preserve transport contracts", () => {
  it("validates session envelopes and member sync envelopes", () => {
    expect(LoginBody.safeParse({ email: "member@example.com", password: "secret" }).success).toBe(true);
    const session = LoginResponse.parse({ member: { id: 1, futureField: "kept" }, fieldKit: { allowed: true } });
    expect(session.member?.futureField).toBe("kept");
    expect(
      GetMemberSyncResponse.safeParse({
        records: [{ recordType: "member-work", recordId: "1", mutationId: "m1", payload: { output: { ok: true } }, clientUpdatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false }],
        serverTime: new Date().toISOString(),
      }).success,
    ).toBe(true);
    expect(
      PostMemberSyncResponse.safeParse({
        records: [], serverTime: new Date().toISOString(), conflicts: 0, rejected: [{ mutationId: "bad", code: "INVALID_SYNC_MUTATION" }],
      }).success,
    ).toBe(true);
  });

  it("accepts member work and resource payloads without stripping broad records", () => {
    expect(CreateMemberWorkBody.safeParse({
      kind: "tool_result", toolId: "objection", title: "Practice", output: { custom: { nested: true } },
    }).success).toBe(true);
    expect(SaveResourceWorkBody.safeParse({ formData: { arbitrary: ["payload"] }, status: "draft" }).success).toBe(true);
    expect(CreateProviderResourceBody.safeParse({ title: "Guide", fileUrl: "https://example.com/guide.pdf", meta: { custom: true } }).success).toBe(true);
  });

  it("keeps query date values as strings at the HTTP boundary", () => {
    const value = "2026-01-02T03:04:05.000Z";
    expect(GetMemberSyncQueryParams.parse({ since: value }).since).toBe(value);
    expect(GetSalesWorkflowTodayQueryParams.parse({ from: value, to: value }).from).toBe(value);
  });

  it("preserves billing and Apple purchase transport contracts", () => {
    const status = GetBillingStatusResponse.parse({
      configured: true,
      individualWeeklyPriceConfigured: true,
      individualWeeklyElitePriceConfigured: false,
      organization: {
        id: 4, type: "personal", status: "active",
        billingPlan: null, billingProvider: null, billingStatus: null,
        currentPeriodEnd: null, cancelAtPeriodEnd: false,
        hasStripeCustomer: false, hasStripeSubscription: false,
        billableSeats: null, seatLimit: 1, contractRef: null,
      },
      canCheckoutIndividual: true, canOpenPortal: false,
    });
    expect(status.organization.id).toBe(4);
    expect(CreateBillingCheckoutBody.parse({ plan: "elite_weekly" }).plan).toBe("elite_weekly");
    expect(CreateBillingCheckoutResponse.parse({ url: "https://checkout.stripe.com/session" }).url).toContain("stripe");
    expect(GetAppleBillingCatalogResponse.parse({
      configured: true,
      products: [{ id: "com.example.standard", tier: "standard" }],
    }).products[0].tier).toBe("standard");
    expect(VerifyAppleBillingTransactionBody.parse({ signedTransaction: "x".repeat(80) }).signedTransaction).toHaveLength(80);
  });

  it("preserves permissive admin and analytics payload contracts", () => {
    expect(ListAdminAccessRequestsResponse.parse({ requests: [{ id: 7, futureField: "kept" }] }).requests[0].id).toBe(7);
    expect(ApproveAdminAccessRequestBody.parse({ trialHours: 24 }).trialHours).toBe(24);
    expect(UpdateAdminOrganizationPipelineBody.parse({ pipelineStatus: "follow_up" }).pipelineStatus).toBe("follow_up");
    expect(TrackAnalyticsEventBody.parse({
      eventType: "product", eventName: "opened", metadata: '{"source":"ios"}',
    }).metadata).toBe('{"source":"ios"}');
    expect(TrackAnalyticsEventBody.parse({
      eventType: "product", eventName: "opened", metadata: null,
    }).metadata).toBeNull();
    expect(TrackAnalyticsEventBody.safeParse({
      eventType: "product", eventName: "opened", metadata: { source: "ios" },
    }).success).toBe(false);
    expect(TrackAnalyticsEventResponse.parse({ success: true })).toEqual({ success: true });
    expect(TrackAnalyticsVisitorResponse.parse({ success: true })).toEqual({ success: true });
  });
});