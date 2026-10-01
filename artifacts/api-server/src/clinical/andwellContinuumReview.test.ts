import { describe, expect, it } from "vitest";
import { ANDWELL_CARE_SERVICES, andwellServiceAvailability } from "./andwellCareRegistry";
import { buildAndwellContinuumReview } from "./andwellContinuumReview";

function ids(output: unknown) {
  return buildAndwellContinuumReview(output).opportunities.map((item) => item.serviceId);
}

describe("Andwell continuum care review", () => {
  it("flags palliative review from multiple independent serious-illness signals", () => {
    const result = buildAndwellContinuumReview({
      extractedData: {
        recordSummary: "Advanced CHF with three recurrent hospitalizations in five months.",
      },
      symptomEvidence: [
        { finding: "Persistent dyspnea and fatigue despite ongoing treatment." },
      ],
    });

    expect(result.opportunities.some((item) => item.serviceId === "palliative-medicine")).toBe(true);
    const palliative = result.opportunities.find((item) => item.serviceId === "palliative-medicine");
    expect(palliative?.eligibilityDetermined).toBe(false);
    expect(palliative?.humanReviewRequired).toBe(true);
  });

  it("flags dementia care without converting the flag into an eligibility determination", () => {
    const result = buildAndwellContinuumReview({
      diagnoses: [{ diagnosis: "Alzheimer dementia", sourceText: "Documented Alzheimer dementia with memory loss." }],
    });

    const guide = result.opportunities.find((item) => item.serviceId === "guide");
    expect(guide).toBeDefined();
    expect(guide?.status).toBe("clinical_review_suggested");
    expect(guide?.missingChecks).toContain("Program exclusions");
  });

  it("suppresses a service already listed as the current service", () => {
    const result = buildAndwellContinuumReview(
      { diagnoses: [{ diagnosis: "Dementia", sourceText: "Documented dementia." }] },
      { currentServiceIds: ["guide"] },
    );
    expect(result.opportunities.some((item) => item.serviceId === "guide")).toBe(false);
  });

  it("flags wound care from a documented wound need", () => {
    expect(ids({
      symptomEvidence: [{ finding: "Chronic non-healing right lower-extremity wound with an ostomy care need." }],
    })).toContain("mobile-wound");
  });

  it("requires multiple hospice signal categories before suggesting hospice review", () => {
    expect(ids({
      diagnoses: [{ diagnosis: "Advanced cancer", sourceText: "Advanced metastatic cancer." }],
    })).not.toContain("hospice-home-care");

    expect(ids({
      diagnoses: [{ diagnosis: "Advanced cancer", sourceText: "Advanced metastatic cancer." }],
      declineMetrics: [{ metric: "Function", value: "Progressive functional decline with increased dependence.", sourceText: "Progressive functional decline." }],
    })).toContain("hospice-home-care");
  });

  it("does not treat missing documentation as a negative finding", () => {
    const result = buildAndwellContinuumReview({ extractedData: { recordSummary: "No relevant facts were documented in this synthetic excerpt." } });
    expect(result.opportunities).toHaveLength(0);
    expect(result.limitations[0]).toContain("absence of a flag does not mean a need is absent");
  });

  it("uses county only as an availability screen", () => {
    expect(andwellServiceAvailability("mobile-wound", "Cumberland County")).toBe("available");
    expect(andwellServiceAvailability("mobile-wound", "Aroostook")).toBe("not_listed");
    expect(andwellServiceAvailability("mobile-wound")).toBe("verify");
  });

  it("keeps registry identifiers unique and every service human-routed", () => {
    const ids = ANDWELL_CARE_SERVICES.map((service) => service.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const service of ANDWELL_CARE_SERVICES) {
      expect(service.reviewerRole.length).toBeGreaterThan(0);
      expect(service.eligibilityChecks.length).toBeGreaterThan(0);
      expect(service.sourceUrl.startsWith("https://andwell.org/")).toBe(true);
    }
  });
});
