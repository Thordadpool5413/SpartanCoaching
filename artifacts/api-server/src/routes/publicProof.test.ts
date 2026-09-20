import { describe, expect, it } from "vitest";
import { serializePublicProofRecord } from "./publicProof";

describe("public proof response serialization", () => {
  it("keeps display provenance while removing internal publication governance", () => {
    const record = serializePublicProofRecord({
      id: 42,
      quote: "The team now coaches from one shared system.",
      timeframe: "First 90 days",
      evidenceSource: "Client interview and CRM export",
      measurementContext: "Compared with the prior 90-day period",
      verificationStatus: "document_reviewed",
      attributionLimitations: "Seasonality may have contributed.",
      approvalStatus: "approved",
      approvalReference: "signed-release-42",
      approvalScope: "Quote, client label, and outcome for public web only",
      approvedAt: new Date("2026-09-19T00:00:00.000Z"),
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    });

    expect(record).toMatchObject({
      id: 42,
      timeframe: "First 90 days",
      evidenceSource: "Client interview and CRM export",
      verificationStatus: "document_reviewed",
    });
    expect(record).not.toHaveProperty("approvalStatus");
    expect(record).not.toHaveProperty("approvalReference");
    expect(record).not.toHaveProperty("approvalScope");
    expect(record).not.toHaveProperty("approvedAt");
    expect(record).not.toHaveProperty("createdAt");
  });
});
