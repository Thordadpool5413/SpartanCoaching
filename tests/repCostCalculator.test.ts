import { describe, expect, it } from "vitest";
import { calculateRepCost, type RepCommissionTier } from "../shared/repCostCalculator";

const tiers: RepCommissionTier[] = [
  { id: 1, min: 1, max: 10, rate: 100 },
  { id: 2, min: 11, max: 20, rate: 125 },
  { id: 3, min: 21, max: 999, rate: 150 },
];

const inputs = { baseSalary: 90000, benefitsLoad: 42, annualMileage: 5400, otherFixedCosts: 15484, callsPerDay: 12, workingDaysPerMonth: 20, callsPerReferral: 8, conversionRate: 70 };

describe("calculateRepCost", () => {
  it("matches the published default unit economics", () => {
    const result = calculateRepCost(inputs, tiers);
    expect(result.costPerCall).toBeCloseTo(51.01, 2);
    expect(result.costPerReferral).toBeCloseTo(408.06, 2);
    expect(result.costPerAdmit).toBeCloseTo(582.94, 2);
    expect(result.totalRepCost).toBeCloseTo(184702, 0);
    expect(result.annualConversionLoss).toBeCloseTo(44071, 0);
  });

  it("avoids invalid unit costs when activity is zero", () => {
    const result = calculateRepCost({ ...inputs, callsPerDay: 0 }, tiers);
    expect(result.costPerCall).toBe(0);
    expect(result.costPerReferral).toBe(0);
    expect(result.costPerAdmit).toBe(0);
  });
});
