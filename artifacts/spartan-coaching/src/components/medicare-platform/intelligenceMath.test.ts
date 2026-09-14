import { describe, expect, it } from "vitest";
import { buildEvidenceAlignment, evidenceConfidence, solveGrowth } from "./intelligenceMath";

describe("Medicare Intelligence decision math", () => {
  it("solves the census-flow equation and converts admissions to referral pace", () => {
    const result = solveGrowth({ currentAdc: 40, targetAdc: 50, losDays: 80, conversionPct: 50, horizonDays: 90 });
    expect(result.projectedAdcWithoutAdmissions).toBeCloseTo(12.986, 2);
    expect(result.admissionsPerMonth).toBeCloseTo(20.86, 1);
    expect(result.referralsPerMonth).toBeCloseTo(result.admissionsPerMonth * 2, 6);
  });

  it("clamps unsafe assumptions and never produces negative admissions", () => {
    const result = solveGrowth({ currentAdc: 100, targetAdc: 0, losDays: 0, conversionPct: 0 });
    expect(result.losDays).toBe(1);
    expect(result.admissionsPerDay).toBe(0);
    expect(Number.isFinite(result.referralsPerMonth)).toBe(true);
  });

  it("penalizes materially misaligned evidence vintages", () => {
    const alignment = buildEvidenceAlignment(
      { history: [{ year: 2020 }], periods: { cahpsDate: "2024", qualityDate: "2024" } },
      null,
      [{ label: "Medicare Monthly Enrollment", freshness: "2024" }],
    );
    expect(alignment).toMatchObject({ status: "PERIOD MISMATCH", spanYears: 4, confidencePenalty: 8 });
    const confidence = evidenceConfidence({ dataQuality: { status: "healthy" } }, { confidence: 90 }, null, { dataQuality: { status: "healthy" } }, {}, alignment);
    expect(confidence.adjusted).toBe(confidence.base - 8);
  });
});
