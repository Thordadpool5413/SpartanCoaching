import { describe, expect, it } from "vitest";
import {
  assertSafeFreeTextForAi,
  assertSafeForUrlOrNotification,
  evaluateFileUploadSafety,
  HIPAA_COMPLIANCE_CLAIM,
  sanitizeAnalyticsEvent,
  sanitizeAnalyticsMetadata,
  scanSensitiveText,
  stripSensitiveObjectFields,
} from "./sensitiveDataSafeguards";

describe("scanSensitiveText", () => {
  it("detects SSN-like patterns without returning the value", () => {
    const result = scanSensitiveText(
      "Contact had SSN 123-45-6789 on the form",
      "detect",
    );
    expect(result.hasHighRisk).toBe(true);
    expect(result.findings.some((f) => f.code === "SOCIAL_SECURITY_NUMBER")).toBe(
      true,
    );
    expect(JSON.stringify(result.findings)).not.toContain("123-45-6789");
  });

  it("redacts identifiers", () => {
    const result = scanSensitiveText(
      "Email me at nurse@example.com about the account",
      "redact",
    );
    expect(result.redacted).toBe(true);
    expect(result.text).toContain("[REDACTED]");
    expect(result.text).not.toContain("nurse@example.com");
  });

  it("blocks high-risk free text for AI", () => {
    expect(() =>
      assertSafeFreeTextForAi(
        "Patient name is Jane Doe and MRN 99887766",
        "notes",
      ),
    ).toThrow(/identifying|sensitive/i);
  });

  it("allows operational free text", () => {
    expect(() =>
      assertSafeFreeTextForAi(
        "Met the DON, they want an education visit next Tuesday about referral timing.",
      ),
    ).not.toThrow();
  });
});

describe("analytics sanitization", () => {
  it("strips notes and forbidden free text from metadata", () => {
    const clean = sanitizeAnalyticsMetadata({
      toolId: "objection-coach",
      notes: "Patient John Smith MRN 12345 needs follow up",
      platform: "ios",
      description: "long free text that should not be stored in analytics at all because it is notes",
    });
    expect(clean).not.toHaveProperty("notes");
    expect(clean).not.toHaveProperty("description");
    expect(clean?.toolId).toBe("objection-coach");
    expect(clean?.platform).toBe("ios");
  });

  it("sanitizes analytics events for storage", () => {
    const event = sanitizeAnalyticsEvent({
      eventType: "mobile_tool_view",
      eventName: "objection_coach",
      metadata: JSON.stringify({
        toolId: "objection-coach",
        transcript: "should never store",
      }),
      memberId: 3,
    });
    expect(event.metadata).toBeTruthy();
    const meta = JSON.parse(event.metadata!);
    expect(meta).not.toHaveProperty("transcript");
    expect(meta.toolId).toBe("objection-coach");
  });
});

describe("channels and files", () => {
  it("forbids sensitive text in URLs and notifications", () => {
    expect(() =>
      assertSafeForUrlOrNotification("ssn=123-45-6789", "url"),
    ).toThrow(/URL/i);
    expect(() =>
      assertSafeForUrlOrNotification(
        "Patient name is Jane Doe needs visit",
        "notification",
      ),
    ).toThrow(/notification/i);
  });

  it("rejects sensitive file names and oversized uploads", () => {
    expect(
      evaluateFileUploadSafety({
        fileName: "patient-Jane-Doe-mrn-9999.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1000,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateFileUploadSafety({
        fileName: "territory-map.pdf",
        mimeType: "application/pdf",
        sizeBytes: 20 * 1024 * 1024,
      }).allowed,
    ).toBe(false);
  });

  it("strips sensitive object fields for crash/support payloads", () => {
    const cleaned = stripSensitiveObjectFields({
      route: "/tools",
      notes: "Patient name is John Smith",
      toolId: "x",
    }) as Record<string, unknown>;
    expect(cleaned).not.toHaveProperty("notes");
    expect(cleaned.toolId).toBe("x");
  });
});

describe("compliance posture", () => {
  it("does not claim HIPAA compliance", () => {
    const result = scanSensitiveText("hello", "detect");
    expect(result.hipaaNote).toBe(HIPAA_COMPLIANCE_CLAIM);
    expect(result.hipaaNote.toLowerCase()).toMatch(/do not by themselves constitute hipaa/);
  });
});
