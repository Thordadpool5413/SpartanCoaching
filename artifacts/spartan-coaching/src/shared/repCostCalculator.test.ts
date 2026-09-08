import { describe, expect, it } from "vitest";
import { calculateRepCost } from "./repCostCalculator";

const inputs = {
  baseSalary: 90_000,
  benefitsLoad: 42,
  annualMileage: 5_400,
  otherFixedCosts: 15_484,
  callsPerDay: 12,
  workingDaysPerMonth: 20,
  callsPerReferral: 8,
  conversionRate: 70,
  netContributionPerAdmission: 5_000,
};

describe("rep cost break-even", () => {
  it("finds whole monthly and annual admissions without double-counting commission", () => {
    const result = calculateRepCost(inputs, [
      { id: 1, min: 1, max: 10, rate: 100 },
      { id: 2, min: 11, max: 20, rate: 125 },
      { id: 3, min: 21, max: 999, rate: 150 },
    ]);

    expect(result.fixedCost).toBe(146_902);
    expect(result.monthlyFixedCost).toBeCloseTo(12_241.83, 2);
    expect(result.monthlyBreakEvenAdmissions).toBe(3);
    expect(result.annualBreakEvenAdmissions).toBe(30);
    expect(result.monthlyContributionAfterRepCost).toBeCloseTo(89_608.17, 2);
  });

  it("returns unavailable when each admission loses money after commission", () => {
    const result = calculateRepCost(
      { ...inputs, netContributionPerAdmission: 100 },
      [{ id: 1, min: 1, max: 999, rate: 125 }],
    );
    expect(result.monthlyBreakEvenAdmissions).toBeNull();
    expect(result.annualBreakEvenAdmissions).toBeNull();
  });

  it("uses the tier reached by the break-even volume", () => {
    const result = calculateRepCost(
      { ...inputs, baseSalary: 600_000, benefitsLoad: 0, annualMileage: 0, otherFixedCosts: 0 },
      [
        { id: 1, min: 1, max: 10, rate: 100 },
        { id: 2, min: 11, max: 999, rate: 1_000 },
      ],
    );
    expect(result.monthlyBreakEvenAdmissions).toBe(13);
  });
});
