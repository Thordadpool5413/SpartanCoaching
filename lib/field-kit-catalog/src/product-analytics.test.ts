import { describe, expect, it } from "vitest";
import {
  PRODUCT_EVENT_TYPE,
  PRODUCT_METRICS,
  PRODUCT_OUTCOMES,
  isProductOutcome,
  productEventDedupeKey,
  productEventPayload,
  sanitizeAnalyticsMetadata,
} from "./product-analytics";

describe("product analytics contract", () => {
  it("lists required product outcomes", () => {
    for (const name of [
      "first_account",
      "first_command_center_workflow",
      "workflow_completion",
      "next_action_confirmation",
      "tool_completion",
      "result_save",
      "resource_completion",
      "cross_device_continuation",
      "organization_invite_acceptance",
      "subscription_start",
      "evaluation_conversion",
      "cancellation",
      "return_usage",
    ]) {
      expect(PRODUCT_OUTCOMES).toContain(name);
      expect(isProductOutcome(name)).toBe(true);
    }
  });

  it("sanitizes free-text metadata to null", () => {
    expect(sanitizeAnalyticsMetadata("Patient John Smith not ready for hospice")).toBeNull();
    expect(sanitizeAnalyticsMetadata("not ready yet")).toBeNull();
    expect(sanitizeAnalyticsMetadata("user@example.com")).toBeNull();
  });

  it("keeps allowlisted short tokens as JSON", () => {
    const meta = sanitizeAnalyticsMetadata({
      toolId: "objections",
      surface: "web",
      freeText: "secret note",
      email: "x@y.com",
    });
    expect(meta).toBeTruthy();
    const parsed = JSON.parse(meta!);
    expect(parsed.toolId).toBe("objections");
    expect(parsed.surface).toBe("web");
    expect(parsed.freeText).toBeUndefined();
    expect(parsed.email).toBeUndefined();
  });

  it("maps short legacy tokens to source", () => {
    const meta = sanitizeAnalyticsMetadata("welcome");
    expect(JSON.parse(meta!).source).toBe("welcome");
  });

  it("productEventPayload uses product_outcome type", () => {
    const p = productEventPayload("tool_completion", { toolId: "objections", platform: "web" });
    expect(p.eventType).toBe(PRODUCT_EVENT_TYPE);
    expect(p.eventName).toBe("tool_completion");
    expect(p.metadata).toContain("objections");
  });

  it("dedupe keys are stable and exclude free text", () => {
    const a = productEventDedupeKey("product_outcome", "subscription_start", null, 42);
    const b = productEventDedupeKey("product_outcome", "subscription_start", null, 42);
    expect(a).toBe(b);
    expect(a).not.toMatch(/@|patient/i);
  });

  it("defines activation, engagement, retention, org adoption, feature value", () => {
    expect(PRODUCT_METRICS.activation.eventNames.length).toBeGreaterThan(0);
    expect(PRODUCT_METRICS.engagement.id).toBe("engagement");
    expect(PRODUCT_METRICS.retention.id).toBe("retention");
    expect(PRODUCT_METRICS.organizationAdoption.id).toBe("organization_adoption");
    expect(PRODUCT_METRICS.featureValue.id).toBe("feature_value");
  });
});
