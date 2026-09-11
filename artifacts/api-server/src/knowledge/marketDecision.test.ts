import { describe, expect, it } from "vitest";
import { buildMarketDecisionBrief } from "./marketDecision";
import type { HospiceProfile } from "./cmsHospiceLookup";

function profile(overrides: Partial<HospiceProfile> = {}): HospiceProfile {
  return {
    organization: {
      npi: "1234567890", ccn: "101010", organizationName: "Example Hospice", doingBusinessAs: "Example Hospice",
      facilityName: "Example Hospice", address: "1 Main St", city: "Tampa", state: "FL", zipCode: "33601",
      county: "Hillsborough", phone: "5555555555", ownership: "For-Profit", organizationStructure: "LLC",
      certificationDate: "01/01/2015", yearsCertified: 11,
      source: { label: "CMS Care Compare hospice data", url: "https://data.cms.gov", checkedAt: "2026-09-11T00:00:00.000Z" },
    },
    quality: [], familyExperience: [], serviceArea: { zipCodes: [], count: 0 }, strengths: [], questionsToAsk: [],
    interpretation: "Compare reporting periods before drawing a conclusion.",
    sources: [{ label: "CMS", url: "https://data.cms.gov", checkedAt: "2026-09-11T00:00:00.000Z" }],
    ...overrides,
  };
}

describe("market decision evidence", () => {
  it("lowers coverage when evidence is missing instead of treating it as poor performance", () => {
    const brief = buildMarketDecisionBrief(profile());
    expect(brief.confidence.label).toBe("Limited");
    expect(brief.confidence.score).toBe(10);
    expect(brief.confidence.explanation).toContain("Missing evidence lowers coverage");
    expect(brief.recommendedMove).toContain("Validate the missing evidence");
  });

  it("preserves source periods and produces an observable next-action plan", () => {
    const brief = buildMarketDecisionBrief(profile({
      serviceArea: { zipCodes: ["33601"], count: 1 },
      quality: [{ code: "Q1", name: "Quality measure", score: 92, displayScore: "92", stateScore: 88, differenceFromState: 4, direction: "higher", favorable: true, comparisonLabel: "4 points above the state result", reportingPeriod: "2025", footnote: "" }],
    }), "Decide whether to prioritize this account");
    expect(brief.evidence.some((item) => item.period === "2025")).toBe(true);
    expect(brief.nextActions).toHaveLength(3);
    expect(brief.purpose).toBe("Decide whether to prioritize this account");
    expect(brief.limitations.join(" ")).toContain("does not prove referral volume");
  });
});
