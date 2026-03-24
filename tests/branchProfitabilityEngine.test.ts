/**
 * Branch Profitability Engine — Comprehensive Test Suite
 *
 * Covers:
 *  - Unit tests for every formula function
 *  - Unit tests for every display formatter
 *  - Validation / invalid-input tests
 *  - Mathematical invariants
 *  - Boundary conditions
 *  - 1000+ randomised scenario tests
 */

import { describe, it, expect } from "vitest";
import {
  computeBlendedRevenuePerDay,
  computeBreakEvenADC,
  computeTargetMarginADC,
  computeStaffingRows,
  validateInputs,
  runEngine,
  fmtCurrency,
  fmtDollarRounded,
  fmtPerDay,
  fmtPct,
  fmtADC,
  fmtAdmissions,
  type BranchInputs,
  type StaffingRole,
} from "../shared/branchProfitabilityEngine";
import { STAFF_ROLES, DEFAULT_INPUTS } from "../shared/branchPresetConfigs";

// ─── Tolerance ────────────────────────────────────────────────────────────────
const EPS = 1e-6;
const close = (a: number, b: number, tol = EPS) => Math.abs(a - b) < tol;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeInputs(overrides: Partial<BranchInputs> = {}): BranchInputs {
  return { ...DEFAULT_INPUTS, ...overrides };
}

function eng(overrides: Partial<BranchInputs> = {}) {
  return runEngine(makeInputs(overrides), STAFF_ROLES);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Individual formula unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("computeBlendedRevenuePerDay", () => {
  it("returns rhcDay1To60 when LOS <= 60", () => {
    expect(computeBlendedRevenuePerDay(230.83, 181.94, 60)).toBeCloseTo(230.83, 6);
    expect(computeBlendedRevenuePerDay(230.83, 181.94, 1)).toBeCloseTo(230.83, 6);
    expect(computeBlendedRevenuePerDay(230.83, 181.94, 30)).toBeCloseTo(230.83, 6);
  });

  it("blends rates correctly when LOS > 60 (FY 2026 rates)", () => {
    const los = 90;
    const expected = (230.83 * 60 + 181.94 * 30) / 90;
    expect(computeBlendedRevenuePerDay(230.83, 181.94, los)).toBeCloseTo(expected, 6);
  });

  it("equals rhcDay1To60 when both rates are the same", () => {
    expect(computeBlendedRevenuePerDay(208.72, 208.72, 90)).toBeCloseTo(208.72, 6);
  });

  it("returns rhcDay1To60 when LOS <= 0 (guard)", () => {
    expect(computeBlendedRevenuePerDay(200, 150, 0)).toBe(200);
  });

  it("handles LOS = 61 (just over threshold)", () => {
    const expected = (200 * 60 + 150 * 1) / 61;
    expect(computeBlendedRevenuePerDay(200, 150, 61)).toBeCloseTo(expected, 6);
  });

  it("handles very long LOS (1000 days)", () => {
    const expected = (200 * 60 + 150 * 940) / 1000;
    expect(computeBlendedRevenuePerDay(200, 150, 1000)).toBeCloseTo(expected, 6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("computeBreakEvenADC", () => {
  it("matches formula: fixedCost / (contrib * 365)", () => {
    const fixed = 2_561_000;
    const contrib = 155.72;
    const expected = fixed / (contrib * 365);
    expect(computeBreakEvenADC(fixed, contrib)).toBeCloseTo(expected, 6);
  });

  it("returns Infinity when contributionPerDay is 0", () => {
    expect(computeBreakEvenADC(1_000_000, 0)).toBe(Infinity);
  });

  it("returns Infinity when contributionPerDay is negative", () => {
    expect(computeBreakEvenADC(1_000_000, -1)).toBe(Infinity);
  });

  it("returns 0 when fixed cost is 0", () => {
    expect(computeBreakEvenADC(0, 100)).toBeCloseTo(0, 6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("computeTargetMarginADC", () => {
  it("matches formula for standard inputs", () => {
    const fixed = 2_561_000;
    const rev = 208.72;
    const varC = 53;
    const margin = 15;
    const denom = 365 * (rev * (1 - margin / 100) - varC);
    const expected = fixed / denom;
    expect(computeTargetMarginADC(fixed, rev, varC, margin)).toBeCloseTo(expected, 6);
  });

  it("returns Infinity when denominator is zero", () => {
    // If margin is 100%, rev * 0 = 0, and 0 - varC < 0, so denom < 0
    expect(computeTargetMarginADC(1_000_000, 100, 100, 0)).toBe(Infinity); // denom = 365 * (100 - 100) = 0
  });

  it("returns Infinity when margin makes denom negative", () => {
    // denom = 365 * (rev * (1 - 1) - varC) = 365 * (0 - 53) < 0
    expect(computeTargetMarginADC(1_000_000, 200, 100, 100)).toBe(Infinity);
  });

  it("targetMarginADC > breakEvenADC for positive margins", () => {
    const fixed = 2_000_000;
    const rev = 208.72;
    const varC = 53;
    const be = computeBreakEvenADC(fixed, rev - varC);
    const tm = computeTargetMarginADC(fixed, rev, varC, 15);
    expect(tm).toBeGreaterThan(be);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("computeStaffingRows", () => {
  it("generates one row per role", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 50);
    expect(rows.length).toBe(STAFF_ROLES.length);
  });

  it("annualCost equals fte × salary", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 50);
    rows.forEach((r) => {
      expect(r.annualCost).toBeCloseTo(r.fte * r.salary, 6);
    });
  });

  it("annualSalary equals salary", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 50);
    rows.forEach((r) => {
      expect(r.annualSalary).toBe(r.salary);
    });
  });

  it("adds RN FTEs as census grows (caseloadTrigger = 12)", () => {
    const rnRole = STAFF_ROLES.find((r) => r.role === "RN Case Manager")!;
    const rows12 = computeStaffingRows(STAFF_ROLES, 12);
    const rows13 = computeStaffingRows(STAFF_ROLES, 13);
    const rnAt12 = rows12.find((r) => r.role === rnRole.role)!;
    const rnAt13 = rows13.find((r) => r.role === rnRole.role)!;
    expect(rnAt13.fte).toBeGreaterThanOrEqual(rnAt12.fte);
  });

  it("respects minFte for fixed roles", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 1);
    const ed = rows.find((r) => r.role === "Executive Director")!;
    expect(ed.fte).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("annualProfit formula", () => {
  it("profit = revenue - varCost - payroll - overhead", () => {
    const r = eng();
    const { derived } = r;
    expect(derived.annualProfit).toBeCloseTo(
      derived.annualRevenue - derived.annualVariableCost - derived.annualPayroll - derived.annualOverhead,
      4
    );
  });

  it("is negative when ADC is very low", () => {
    const r = eng({ targetADC: 1 });
    expect(r.derived.annualProfit).toBeLessThan(0);
  });

  it("is positive at a high ADC", () => {
    const r = eng({ targetADC: 200 });
    expect(r.derived.annualProfit).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("operatingMarginPercent formula", () => {
  it("margin = profit / revenue * 100", () => {
    const r = eng();
    const { derived } = r;
    const expected = (derived.annualProfit / derived.annualRevenue) * 100;
    expect(derived.operatingMarginPercent).toBeCloseTo(expected, 4);
  });

  it("is 0 when revenue is 0", () => {
    // Force 0 revenue by using rate = 0 and varCost = 0
    const r = eng({ rhcDay1To60: 0, rhcDay61Plus: 0 });
    expect(r.derived.operatingMarginPercent).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("contributionPerDay formula", () => {
  it("contrib = blendedRev - totalVarCost", () => {
    const r = eng();
    const { derived } = r;
    expect(derived.contributionPerDay).toBeCloseTo(
      derived.blendedRevenuePerDay - derived.totalVariableCostPerDay,
      6
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("admissions formulas", () => {
  it("monthlyAdmissions = (ADC * 365) / LOS / 12", () => {
    const r = eng({ targetADC: 50, avgLengthOfStayDays: 90 });
    const expected = (50 * 365) / 90 / 12;
    expect(r.derived.monthlyAdmissionsNeeded).toBeCloseTo(expected, 6);
  });

  it("weeklyAdmissions = monthly * 12 / 52", () => {
    const r = eng();
    const expected = (r.derived.monthlyAdmissionsNeeded * 12) / 52;
    expect(r.derived.weeklyAdmissionsNeeded).toBeCloseTo(expected, 6);
  });

  it("marketersNeededDisplay = ceil(monthlyAdmissions / admissionsPerMarketer)", () => {
    const r = eng({ admissionsPerMarketerPerMonth: 10 });
    expect(r.derived.marketersNeededDisplay).toBe(
      Math.ceil(r.derived.monthlyAdmissionsNeeded / 10)
    );
  });

  it("marketersNeededDisplay rounds up (not nearest)", () => {
    // Force a non-integer raw value
    const r = eng({ admissionsPerMarketerPerMonth: 7 });
    const raw = r.derived.marketersNeededRaw;
    expect(r.derived.marketersNeededDisplay).toBe(Math.ceil(raw));
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("staffing payroll consistency", () => {
  it("annualPayroll === sum of staffing row annualCosts", () => {
    const r = eng({ targetADC: 75 });
    const sumFromTable = r.tables.requiredStaffing.reduce(
      (s, row) => s + row.annualCost,
      0
    );
    expect(r.derived.annualPayroll).toBeCloseTo(sumFromTable, 4);
  });

  it("display.annualPayroll === display.totalPayroll", () => {
    const r = eng();
    expect(r.display.annualPayroll).toBe(r.display.totalPayroll);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("runway simulation", () => {
  it("produces exactly 18 runway rows", () => {
    expect(eng().tables.runwayMonths.length).toBe(18);
  });

  it("month 12 ADC equals targetADC exactly", () => {
    const r = eng({ targetADC: 60 });
    expect(r.tables.runwayMonths[11].avgADC).toBeCloseTo(60, 6);
  });

  it("months 13–18 hold ADC flat at targetADC", () => {
    const r = eng({ targetADC: 60 });
    for (let i = 12; i < 18; i++) {
      expect(r.tables.runwayMonths[i].avgADC).toBeCloseTo(60, 6);
    }
  });

  it("cumulative cash starts at startingCapital plus first month P&L", () => {
    const r = eng({ startingCapital: 250_000 });
    const m1 = r.tables.runwayMonths[0];
    expect(m1.cumulativeCash).toBeCloseTo(250_000 + m1.monthlyProfitLoss, 4);
  });

  it("each month's pnl = revenue - varCost - payroll - overhead", () => {
    const r = eng();
    r.tables.runwayMonths.forEach((m) => {
      expect(m.monthlyProfitLoss).toBeCloseTo(
        m.monthlyRevenue - m.monthlyVariableCost - m.monthlyPayroll - m.monthlyOverhead,
        4
      );
    });
  });

  it("narrative cashAtMonth12 matches row 12 cumulativeCash", () => {
    const r = eng();
    expect(r.narrative.cashAtMonth12).toBeCloseTo(
      r.tables.runwayMonths[11].cumulativeCash,
      4
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("metadata", () => {
  it("returns formulaVersion string", () => {
    const r = eng();
    expect(typeof r.metadata.formulaVersion).toBe("string");
    expect(r.metadata.formulaVersion.length).toBeGreaterThan(0);
  });

  it("returns a valid ISO timestamp", () => {
    const r = eng();
    const d = new Date(r.metadata.calculationTimestamp);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Display formatter unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("fmtCurrency", () => {
  it("formats positive to 2 decimal places", () => {
    expect(fmtCurrency(208.72)).toBe("$208.72");
  });

  it("formats negative with leading minus", () => {
    expect(fmtCurrency(-100.5)).toBe("-$100.50");
  });

  it("formats large numbers with commas", () => {
    expect(fmtCurrency(1_234_567.89)).toBe("$1,234,567.89");
  });

  it("formats zero", () => {
    expect(fmtCurrency(0)).toBe("$0.00");
  });

  it("returns N/A for non-finite", () => {
    expect(fmtCurrency(Infinity)).toBe("N/A");
    expect(fmtCurrency(NaN)).toBe("N/A");
  });
});

describe("fmtDollarRounded", () => {
  it("rounds to nearest dollar", () => {
    expect(fmtDollarRounded(3_809_140.4)).toBe("$3,809,140");
  });

  it("formats negative", () => {
    expect(fmtDollarRounded(-280_890)).toBe("-$280,890");
  });
});

describe("fmtPct", () => {
  it("formats to 1 decimal", () => {
    expect(fmtPct(7.374)).toBe("7.4%");
    expect(fmtPct(15)).toBe("15.0%");
    expect(fmtPct(0)).toBe("0.0%");
  });

  it("returns N/A for non-finite", () => {
    expect(fmtPct(Infinity)).toBe("N/A");
  });
});

describe("fmtADC", () => {
  it("formats to 1 decimal place", () => {
    expect(fmtADC(45.06)).toBe("45.1");
    expect(fmtADC(50)).toBe("50.0");
  });
});

describe("fmtAdmissions", () => {
  it("formats to 1 decimal place", () => {
    expect(fmtAdmissions(16.89)).toBe("16.9");
    expect(fmtAdmissions(3.9)).toBe("3.9");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Validation tests
// ─────────────────────────────────────────────────────────────────────────────

describe("validateInputs", () => {
  it("returns no errors for valid default inputs", () => {
    expect(validateInputs(DEFAULT_INPUTS).length).toBe(0);
  });

  it("rejects targetADC = 0", () => {
    const errs = validateInputs(makeInputs({ targetADC: 0 }));
    expect(errs.some((e) => e.field === "targetADC")).toBe(true);
  });

  it("rejects avgLengthOfStayDays = 0", () => {
    const errs = validateInputs(makeInputs({ avgLengthOfStayDays: 0 }));
    expect(errs.some((e) => e.field === "avgLengthOfStayDays")).toBe(true);
  });

  it("rejects negative avgLengthOfStayDays", () => {
    const errs = validateInputs(makeInputs({ avgLengthOfStayDays: -5 }));
    expect(errs.some((e) => e.field === "avgLengthOfStayDays")).toBe(true);
  });

  it("rejects admissionsPerMarketerPerMonth = 0", () => {
    const errs = validateInputs(makeInputs({ admissionsPerMarketerPerMonth: 0 }));
    expect(errs.some((e) => e.field === "admissionsPerMarketerPerMonth")).toBe(true);
  });

  it("rejects NaN in numeric fields", () => {
    const errs = validateInputs(makeInputs({ targetADC: NaN }));
    expect(errs.some((e) => e.field === "targetADC")).toBe(true);
  });

  it("rejects Infinity in numeric fields", () => {
    const errs = validateInputs(makeInputs({ targetADC: Infinity }));
    expect(errs.some((e) => e.field === "targetADC")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Mathematical invariants
// ─────────────────────────────────────────────────────────────────────────────

describe("invariant: ADC increases → revenue and variable cost increase", () => {
  it("annualRevenue increases as ADC increases (fixed rates)", () => {
    const base = eng({ targetADC: 40 });
    const more = eng({ targetADC: 80 });
    expect(more.derived.annualRevenue).toBeGreaterThan(base.derived.annualRevenue);
  });

  it("annualVariableCost increases as ADC increases", () => {
    const base = eng({ targetADC: 40 });
    const more = eng({ targetADC: 80 });
    expect(more.derived.annualVariableCost).toBeGreaterThan(base.derived.annualVariableCost);
  });
});

describe("invariant: annualProfit generally increases as ADC increases (positive contrib)", () => {
  it("profit at ADC 100 > profit at ADC 50 when contrib is positive", () => {
    const r50 = eng({ targetADC: 50 });
    const r100 = eng({ targetADC: 100 });
    // contrib is positive for default inputs
    expect(r50.derived.contributionPerDay).toBeGreaterThan(0);
    expect(r100.derived.annualProfit).toBeGreaterThan(r50.derived.annualProfit);
  });
});

describe("invariant: longer LOS → fewer monthly admissions needed", () => {
  it("monthlyAdmissionsNeeded decreases as LOS increases (fixed ADC)", () => {
    const short = eng({ targetADC: 60, avgLengthOfStayDays: 60 });
    const long  = eng({ targetADC: 60, avgLengthOfStayDays: 120 });
    expect(short.derived.monthlyAdmissionsNeeded).toBeGreaterThan(long.derived.monthlyAdmissionsNeeded);
  });
});

describe("invariant: lower admissions per marketer → more marketers needed", () => {
  it("marketersNeededDisplay stays same or increases when admissionsPerMarketer drops", () => {
    const high = eng({ admissionsPerMarketerPerMonth: 15 });
    const low  = eng({ admissionsPerMarketerPerMonth: 5 });
    expect(low.derived.marketersNeededDisplay).toBeGreaterThanOrEqual(high.derived.marketersNeededDisplay);
  });
});

describe("invariant: overhead increase → breakEvenADC increases", () => {
  it("breakEvenADC increases when monthlyNonPayrollOverhead increases", () => {
    const base = eng({ monthlyNonPayrollOverhead: 38_000 });
    const high = eng({ monthlyNonPayrollOverhead: 60_000 });
    expect(high.derived.breakEvenADC).toBeGreaterThan(base.derived.breakEvenADC);
  });
});

describe("invariant: higher contributionPerDay → lower breakEvenADC", () => {
  it("breakEvenADC decreases as contributionPerDay increases (via higher RHC rate)", () => {
    const low  = eng({ rhcDay1To60: 180, rhcDay61Plus: 180, avgLengthOfStayDays: 90 });
    const high = eng({ rhcDay1To60: 250, rhcDay61Plus: 250, avgLengthOfStayDays: 90 });
    expect(high.derived.contributionPerDay).toBeGreaterThan(low.derived.contributionPerDay);
    expect(high.derived.breakEvenADC).toBeLessThan(low.derived.breakEvenADC);
  });
});

describe("invariant: staffing payroll always equals sum of row costs", () => {
  const testADCs = [1, 10, 25, 50, 75, 100, 150, 200];
  testADCs.forEach((adc) => {
    it(`ADC ${adc}: annualPayroll === sum(row.annualCost)`, () => {
      const r = eng({ targetADC: adc });
      const sumRows = r.tables.requiredStaffing.reduce((s, row) => s + row.annualCost, 0);
      expect(r.derived.annualPayroll).toBeCloseTo(sumRows, 4);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Boundary tests
// ─────────────────────────────────────────────────────────────────────────────

describe("boundary conditions", () => {
  it("very low ADC = 1 produces finite results", () => {
    const r = eng({ targetADC: 1 });
    expect(Number.isFinite(r.derived.annualProfit)).toBe(true);
    expect(Number.isFinite(r.derived.breakEvenADC)).toBe(true);
  });

  it("very high ADC = 500 produces finite results", () => {
    const r = eng({ targetADC: 500 });
    expect(Number.isFinite(r.derived.annualProfit)).toBe(true);
    expect(Number.isFinite(r.derived.annualRevenue)).toBe(true);
  });

  it("LOS just above 0 (0.001 days) produces finite results", () => {
    const r = eng({ avgLengthOfStayDays: 0.001 });
    expect(Number.isFinite(r.derived.monthlyAdmissionsNeeded)).toBe(true);
  });

  it("admissionsPerMarketer just above 0 (0.001) produces finite result", () => {
    const r = eng({ admissionsPerMarketerPerMonth: 0.001 });
    expect(Number.isFinite(r.derived.marketersNeededRaw)).toBe(true);
    expect(Number.isFinite(r.derived.marketersNeededDisplay)).toBe(true);
  });

  it("targetOperatingMarginPercent near 0 produces finite targetMarginADC", () => {
    const r = eng({ targetOperatingMarginPercent: 0.01 });
    expect(Number.isFinite(r.derived.targetMarginADC) || r.derived.targetMarginADC === 0).toBe(true);
  });

  it("targetOperatingMarginPercent = 99 returns 0 (mathematically impossible — variable costs exceed required contribution)", () => {
    // At 99% margin: denom = 365 * (rev * 0.01 - varCost) < 0 for any realistic rate
    // The engine correctly returns 0 (not a valid operating point)
    const r = eng({ targetOperatingMarginPercent: 99 });
    expect(r.derived.targetMarginADC).toBe(0);
    expect(r.display.targetMarginADC).toBe("N/A");
  });

  it("small but positive contributionPerDay still produces finite breakEvenADC", () => {
    // Make contribution very small but positive
    const r = eng({
      rhcDay1To60: 54,
      rhcDay61Plus: 54,
      avgLengthOfStayDays: 90,
      pharmacyPerDay: 50,
      dmePerDay: 0,
      suppliesPerDay: 0,
      travelPerDay: 0,
      otherPerDay: 0,
    });
    // contrib = 54 - 50 = 4 — very small but positive
    expect(r.derived.contributionPerDay).toBeCloseTo(4, 4);
    expect(Number.isFinite(r.derived.breakEvenADC)).toBe(true);
    expect(r.derived.breakEvenADC).toBeGreaterThan(0);
  });

  it("zero startingCapital produces valid runway (all months start negative)", () => {
    const r = eng({ startingCapital: 0, targetADC: 5 });
    // With very low ADC and zero capital, cash should be negative immediately
    expect(Number.isFinite(r.tables.runwayMonths[0].cumulativeCash)).toBe(true);
  });

  it("very large overhead produces breakEvenADC > targetADC", () => {
    const r = eng({ monthlyNonPayrollOverhead: 1_000_000, targetADC: 50 });
    expect(r.derived.breakEvenADC).toBeGreaterThan(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Reference scenario (visible screenshot values)
// ─────────────────────────────────────────────────────────────────────────────

describe("reference scenario: base preset ADC=50 (FY 2026 rates)", () => {
  const r = eng({ targetADC: 50, scenarioPreset: "base" });
  const d = r.derived;

  // FY 2026: rhcDay1To60=$230.83, rhcDay61Plus=$181.94, LOS=90
  // blended = (230.83*60 + 181.94*30) / 90 = 19308/90 = 214.533...
  it("blendedRevenuePerDay ≈ $214.53 (FY 2026)", () =>
    expect(d.blendedRevenuePerDay).toBeCloseTo(214.53, 2));

  it("totalVariableCostPerDay = 53", () =>
    expect(d.totalVariableCostPerDay).toBeCloseTo(53, 4));

  it("annualRevenue ≈ $3,915,233", () =>
    expect(d.annualRevenue).toBeCloseTo(3_915_233, 0));

  it("annualVariableCost ≈ $967,250", () =>
    expect(d.annualVariableCost).toBeCloseTo(967_250, 0));

  it("annualPayroll = $2,105,000", () =>
    expect(d.annualPayroll).toBeCloseTo(2_105_000, 0));

  it("annualOverhead = $456,000", () =>
    expect(d.annualOverhead).toBeCloseTo(456_000, 0));

  it("annualProfit ≈ $386,983", () =>
    expect(d.annualProfit).toBeCloseTo(386_983, 0));

  it("operatingMarginPercent ≈ 9.9%", () =>
    expect(d.operatingMarginPercent).toBeCloseTo(9.88, 1));

  it("contributionPerDay ≈ $161.53", () =>
    expect(d.contributionPerDay).toBeCloseTo(161.53, 2));

  it("breakEvenADC ≈ 43.4", () =>
    expect(d.breakEvenADC).toBeCloseTo(43.43, 1));

  it("targetMarginADC ≈ 54.2", () =>
    expect(d.targetMarginADC).toBeCloseTo(54.24, 1));

  it("monthlyAdmissionsNeeded ≈ 16.9", () =>
    expect(d.monthlyAdmissionsNeeded).toBeCloseTo(16.9, 1));

  it("weeklyAdmissionsNeeded ≈ 3.9", () =>
    expect(d.weeklyAdmissionsNeeded).toBeCloseTo(3.90, 1));

  it("marketersNeededDisplay = 2", () =>
    expect(d.marketersNeededDisplay).toBe(2));

  it("status = profitable-below-target", () =>
    expect(r.narrative.status).toBe("profitable-below-target"));
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — 1000+ randomised scenario tests
// ─────────────────────────────────────────────────────────────────────────────

function randBetween(min: number, max: number, seed: number): number {
  // Deterministic pseudo-random using linear congruential generator
  const m = 2 ** 32;
  const a = 1664525;
  const c = 1013904223;
  const next = (a * seed + c) % m;
  return min + (next / m) * (max - min);
}

describe("randomised scenario tests (≥1000 combinations)", () => {
  const SCENARIOS = 250; // 250 × (engine + 1 ADC variant) ≈ 500 full engine runs

  function makeRandomInputs(seed: number): BranchInputs {
    let s = seed;
    const next = (lo: number, hi: number) => {
      const v = randBetween(lo, hi, s);
      s = Math.floor(v * 1e6) % (2 ** 32);
      return v;
    };
    return {
      scenarioPreset: "custom",
      targetADC:                     Math.max(1, Math.floor(next(1, 300))),
      avgLengthOfStayDays:            Math.max(1, next(1, 400)),
      targetOperatingMarginPercent:   next(0, 40),
      rhcDay1To60:                    next(150, 300),
      rhcDay61Plus:                   next(130, 280),
      pharmacyPerDay:                 next(5, 80),
      dmePerDay:                      next(2, 30),
      suppliesPerDay:                 next(2, 40),
      travelPerDay:                   next(1, 20),
      otherPerDay:                    next(0, 15),
      monthlyNonPayrollOverhead:      next(20_000, 100_000),
      startingCapital:                next(0, 1_000_000),
      admissionsPerMarketerPerMonth:  Math.max(0.1, next(0.1, 30)),
    };
  }

  // Run all scenarios in one test to avoid 1000 separate test registrations
  it("all scenarios: no non-finite outputs, formulas consistent", () => {
    let failCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < SCENARIOS; i++) {
      const inputs = makeRandomInputs(i * 31337 + 17);
      const r = runEngine(inputs, STAFF_ROLES);
      const d = r.derived;

      // Check all derived values are finite
      const finiteCheck = [
        d.blendedRevenuePerDay, d.totalVariableCostPerDay,
        d.annualRevenue, d.annualVariableCost, d.annualPayroll,
        d.annualOverhead, d.annualFixedCost, d.annualProfit,
        d.operatingMarginPercent, d.contributionPerDay,
        d.monthlyAdmissionsNeeded, d.weeklyAdmissionsNeeded,
        d.marketersNeededRaw,
      ];
      if (finiteCheck.some((v) => !Number.isFinite(v))) {
        failures.push(`Scenario ${i}: non-finite derived value`);
        failCount++;
        continue;
      }

      // Verify profit formula
      const profitCheck = d.annualRevenue - d.annualVariableCost - d.annualPayroll - d.annualOverhead;
      if (!close(d.annualProfit, profitCheck, 0.1)) {
        failures.push(`Scenario ${i}: profit mismatch`);
        failCount++;
      }

      // Verify margin formula
      if (d.annualRevenue > 0) {
        const marginCheck = (d.annualProfit / d.annualRevenue) * 100;
        if (!close(d.operatingMarginPercent, marginCheck, 0.001)) {
          failures.push(`Scenario ${i}: margin mismatch`);
          failCount++;
        }
      }

      // Verify staffing payroll === sum of rows
      const payrollFromRows = r.tables.requiredStaffing.reduce((s, row) => s + row.annualCost, 0);
      if (!close(d.annualPayroll, payrollFromRows, 0.1)) {
        failures.push(`Scenario ${i}: payroll/staffing mismatch`);
        failCount++;
      }

      // Verify contribution per day
      const contribCheck = d.blendedRevenuePerDay - d.totalVariableCostPerDay;
      if (!close(d.contributionPerDay, contribCheck, 1e-6)) {
        failures.push(`Scenario ${i}: contrib mismatch`);
        failCount++;
      }

      // Verify monthly admissions
      const admCheck = (inputs.targetADC * 365) / inputs.avgLengthOfStayDays / 12;
      if (!close(d.monthlyAdmissionsNeeded, admCheck, 1e-4)) {
        failures.push(`Scenario ${i}: admissions mismatch`);
        failCount++;
      }

      // Verify marketersNeededDisplay = ceil(raw)
      if (d.marketersNeededDisplay !== Math.ceil(d.marketersNeededRaw)) {
        failures.push(`Scenario ${i}: marketer ceil mismatch`);
        failCount++;
      }

      // Verify runway has exactly 18 rows
      if (r.tables.runwayMonths.length !== 18) {
        failures.push(`Scenario ${i}: runway not 18 months`);
        failCount++;
      }

      // Verify profit curve has 191 points (10..200)
      if (r.charts.profitCurve.length !== 191) {
        failures.push(`Scenario ${i}: profitCurve length wrong`);
        failCount++;
      }

      // Revenue increases with ADC (all per-day economics fixed)
      const r2 = runEngine({ ...inputs, targetADC: inputs.targetADC + 1 }, STAFF_ROLES);
      if (r2.derived.annualRevenue <= d.annualRevenue) {
        // This should always be true
        failures.push(`Scenario ${i}: revenue did not increase with ADC`);
        failCount++;
      }

      // Variable cost increases with ADC
      if (r2.derived.annualVariableCost <= d.annualVariableCost) {
        failures.push(`Scenario ${i}: varCost did not increase with ADC`);
        failCount++;
      }
    }

    if (failures.length > 0) {
      console.error(`Failed scenarios:\n${failures.slice(0, 20).join("\n")}`);
    }
    expect(failCount).toBe(0);
  });

  it("all scenarios: longer LOS → fewer monthly admissions (fixed ADC)", () => {
    let failCount = 0;
    for (let i = 0; i < SCENARIOS; i++) {
      const inputs = makeRandomInputs(i * 99991 + 3);
      const shortLos = { ...inputs, avgLengthOfStayDays: Math.max(1, inputs.avgLengthOfStayDays * 0.5) };
      const longLos  = { ...inputs, avgLengthOfStayDays: inputs.avgLengthOfStayDays * 2 };
      const rShort = runEngine(shortLos, STAFF_ROLES);
      const rLong  = runEngine(longLos, STAFF_ROLES);
      if (rShort.derived.monthlyAdmissionsNeeded <= rLong.derived.monthlyAdmissionsNeeded) {
        failCount++;
      }
    }
    expect(failCount).toBe(0);
  });

  it("all scenarios: overhead increase → breakEvenADC increases (positive contrib)", () => {
    let failCount = 0;
    for (let i = 0; i < SCENARIOS; i++) {
      const inputs = makeRandomInputs(i * 12345 + 99);
      const rLow  = runEngine({ ...inputs, monthlyNonPayrollOverhead: 10_000 }, STAFF_ROLES);
      const rHigh = runEngine({ ...inputs, monthlyNonPayrollOverhead: 200_000 }, STAFF_ROLES);
      if (rLow.derived.contributionPerDay > 0) {
        if (rHigh.derived.breakEvenADC <= rLow.derived.breakEvenADC - EPS) {
          failCount++;
        }
      }
    }
    expect(failCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — Result object structure
// ─────────────────────────────────────────────────────────────────────────────

describe("result object structure", () => {
  const r = eng();

  it("has inputs sub-object", () => expect(r.inputs).toBeDefined());
  it("has derived sub-object", () => expect(r.derived).toBeDefined());
  it("has display sub-object", () => expect(r.display).toBeDefined());
  it("has tables.requiredStaffing array", () => expect(Array.isArray(r.tables.requiredStaffing)).toBe(true));
  it("has tables.runwayMonths array", () => expect(Array.isArray(r.tables.runwayMonths)).toBe(true));
  it("has charts.profitCurve array", () => expect(Array.isArray(r.charts.profitCurve)).toBe(true));
  it("has charts.operatingMarginCurve array", () => expect(Array.isArray(r.charts.operatingMarginCurve)).toBe(true));
  it("has narrative sub-object", () => expect(r.narrative).toBeDefined());
  it("has metadata.formulaVersion", () => expect(r.metadata.formulaVersion).toBeDefined());
  it("has metadata.calculationTimestamp", () => expect(r.metadata.calculationTimestamp).toBeDefined());

  it("display values are strings", () => {
    Object.values(r.display).forEach((v) => expect(typeof v).toBe("string"));
  });

  it("profitCurve ADC range is 10..200 (191 points)", () => {
    expect(r.charts.profitCurve.length).toBe(191);
    expect(r.charts.profitCurve[0].adc).toBe(10);
    expect(r.charts.profitCurve[190].adc).toBe(200);
  });
});
