/**
 * Unit tests for the Branch Profitability Engine.
 *
 * Golden values were derived by hand from the published formulas (see engine
 * source comments) and locked in here so any formula regression fails loudly.
 *
 * Staffing at ADC 50 with the shared STAFF_ROLES:
 *   RN Case Manager  : max(2, ceil(50/12)) = 5  FTE  × $100,000 = $500,000
 *   Hospice Aide     : max(2, ceil(50/8))  = 7  FTE  × $50,000  = $350,000
 *   Social Worker    : max(1, ceil(50/15)) = 4  FTE  × $75,000  = $300,000
 *   Chaplain         : max(1, ceil(50/20)) = 3  FTE  × $70,000  = $210,000
 *   All fixed roles  :                       8  FTE  total fixed = $745,000
 *   Total annual payroll                                          = $2,105,000
 *   Annual overhead (38,000 × 12)                                 = $456,000
 *   Annual fixed cost                                             = $2,561,000
 */

import { describe, it, expect } from "vitest";

import {
  runEngine,
  validateInputs,
  computeBlendedRevenuePerDay,
  computeBreakEvenADC,
  computeTargetMarginADC,
  computeStaffingRows,
  buildAdmissionsReferenceTable,
  type BranchInputs,
} from "./branchProfitabilityEngine";

import {
  PRESET_CONFIGS,
  STAFF_ROLES,
  DEFAULT_INPUTS,
} from "./branchPresetConfigs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInputs(preset: string, targetADC = 50, targetOperatingMarginPercent = 15): BranchInputs {
  return {
    scenarioPreset: preset,
    targetADC,
    targetOperatingMarginPercent,
    ...PRESET_CONFIGS[preset].inputs,
  };
}

/** Assert a number is within ±tolerance of expected. */
function near(received: number, expected: number, tolerance: number, label = "") {
  const diff = Math.abs(received - expected);
  if (diff > tolerance) {
    throw new Error(
      `${label ? label + ": " : ""}expected ${received} to be within ±${tolerance} of ${expected} (diff=${diff.toFixed(4)})`
    );
  }
}

// ─── validateInputs ───────────────────────────────────────────────────────────

describe("validateInputs", () => {
  it("returns no errors for valid DEFAULT_INPUTS", () => {
    expect(validateInputs(DEFAULT_INPUTS)).toHaveLength(0);
  });

  it("returns no errors for each preset at standard ADC", () => {
    for (const preset of ["lean", "base", "highAcuity"]) {
      const errs = validateInputs(makeInputs(preset));
      expect(errs, `preset=${preset}`).toHaveLength(0);
    }
  });

  it("rejects missing targetADC (undefined)", () => {
    const bad = { ...DEFAULT_INPUTS, targetADC: undefined as unknown as number };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "targetADC")).toBe(true);
  });

  it("rejects targetADC = 0", () => {
    const bad = { ...DEFAULT_INPUTS, targetADC: 0 };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "targetADC")).toBe(true);
  });

  it("rejects negative targetADC", () => {
    const bad = { ...DEFAULT_INPUTS, targetADC: -5 };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "targetADC")).toBe(true);
  });

  it("rejects avgLengthOfStayDays = 0", () => {
    const bad = { ...DEFAULT_INPUTS, avgLengthOfStayDays: 0 };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "avgLengthOfStayDays")).toBe(true);
  });

  it("rejects admissionsPerMarketerPerMonth = 0", () => {
    const bad = { ...DEFAULT_INPUTS, admissionsPerMarketerPerMonth: 0 };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "admissionsPerMarketerPerMonth")).toBe(true);
  });

  it("rejects NaN in a rate field", () => {
    const bad = { ...DEFAULT_INPUTS, rhcDay1To60: NaN };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "rhcDay1To60")).toBe(true);
  });

  it("rejects Infinity in a rate field", () => {
    const bad = { ...DEFAULT_INPUTS, rhcDay61Plus: Infinity };
    const errs = validateInputs(bad);
    expect(errs.some((e) => e.field === "rhcDay61Plus")).toBe(true);
  });

  it("collects errors for multiple invalid fields at once", () => {
    const bad = {
      ...DEFAULT_INPUTS,
      targetADC: -1,
      avgLengthOfStayDays: 0,
      rhcDay1To60: NaN,
    };
    const errs = validateInputs(bad);
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── computeBlendedRevenuePerDay ─────────────────────────────────────────────

describe("computeBlendedRevenuePerDay", () => {
  it("returns rate1 when LOS ≤ 60", () => {
    expect(computeBlendedRevenuePerDay(230.83, 181.94, 60)).toBeCloseTo(230.83, 5);
    expect(computeBlendedRevenuePerDay(230.83, 181.94, 30)).toBeCloseTo(230.83, 5);
  });

  it("blends correctly for LOS = 70 (Lean preset)", () => {
    // (230.83 × 60 + 181.94 × 10) / 70 = 15,669.2 / 70 ≈ 223.8457
    const result = computeBlendedRevenuePerDay(230.83, 181.94, 70);
    expect(result).toBeCloseTo(223.8457, 3);
  });

  it("blends correctly for LOS = 90 (Base / High Acuity preset)", () => {
    // (230.83 × 60 + 181.94 × 30) / 90 = 19,308 / 90 ≈ 214.5333
    const result = computeBlendedRevenuePerDay(230.83, 181.94, 90);
    expect(result).toBeCloseTo(214.5333, 3);
  });

  it("blends toward rate2 as LOS grows large", () => {
    // (230.83×60 + 181.94×9940)/10000 ≈ 182.233 — approaches but never reaches rate2
    const result = computeBlendedRevenuePerDay(230.83, 181.94, 10000);
    expect(result).toBeGreaterThan(181.94);
    expect(result).toBeLessThan(183);
  });
});

// ─── computeBreakEvenADC ─────────────────────────────────────────────────────

describe("computeBreakEvenADC", () => {
  it("returns Infinity when contributionPerDay ≤ 0", () => {
    expect(computeBreakEvenADC(1000000, 0)).toBe(Infinity);
    expect(computeBreakEvenADC(1000000, -5)).toBe(Infinity);
  });

  it("computes breakeven correctly: fixedCost / (contrib × 365)", () => {
    // 365,000 / (10 × 365) = 100
    expect(computeBreakEvenADC(365_000, 10)).toBeCloseTo(100, 4);
  });
});

// ─── computeTargetMarginADC ───────────────────────────────────────────────────

describe("computeTargetMarginADC", () => {
  it("returns Infinity when denominator ≤ 0", () => {
    // margin = 100%: denom = 365 × (rev × 0 - varCost) which is negative
    const result = computeTargetMarginADC(1_000_000, 100, 200, 100);
    expect(result).toBe(Infinity);
  });

  it("produces a value greater than breakEvenADC for positive target margin", () => {
    const fixedCost = 2_561_000;
    const revPerDay = 214.53;
    const varPerDay = 53;
    const beADC = computeBreakEvenADC(fixedCost, revPerDay - varPerDay);
    const tmADC = computeTargetMarginADC(fixedCost, revPerDay, varPerDay, 15);
    expect(tmADC).toBeGreaterThan(beADC);
  });
});

// ─── computeStaffingRows ─────────────────────────────────────────────────────

describe("computeStaffingRows", () => {
  it("respects minFte for fixed roles at any ADC", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 1);
    const exec = rows.find((r) => r.role === "Executive Director")!;
    expect(exec.fte).toBe(1);
    expect(exec.annualCost).toBe(140_000);
  });

  it("scales caseload-triggered roles at ADC 50", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 50);
    // RN Case Manager: trigger=12, ceil(50/12)=5
    const rn = rows.find((r) => r.role === "RN Case Manager")!;
    expect(rn.fte).toBe(5);
    expect(rn.annualCost).toBe(500_000);
    // Hospice Aide: trigger=8, ceil(50/8)=7
    const aide = rows.find((r) => r.role === "Hospice Aide")!;
    expect(aide.fte).toBe(7);
    expect(aide.annualCost).toBe(350_000);
    // Social Worker: trigger=15, ceil(50/15)=4
    const sw = rows.find((r) => r.role === "Social Worker")!;
    expect(sw.fte).toBe(4);
    expect(sw.annualCost).toBe(300_000);
    // Chaplain: trigger=20, ceil(50/20)=3
    const chap = rows.find((r) => r.role === "Chaplain")!;
    expect(chap.fte).toBe(3);
    expect(chap.annualCost).toBe(210_000);
  });

  it("computes total annual payroll of $2,105,000 at ADC 50", () => {
    const rows = computeStaffingRows(STAFF_ROLES, 50);
    const total = rows.reduce((s, r) => s + r.annualCost, 0);
    expect(total).toBe(2_105_000);
  });
});

// ─── runEngine — Lean preset ─────────────────────────────────────────────────

describe("runEngine — Lean preset (ADC 50, LOS 70)", () => {
  const result = runEngine(makeInputs("lean"), STAFF_ROLES);

  it("annualRevenue ≈ $4,085,184", () => {
    near(result.derived.annualRevenue, 4_085_184.29, 1, "annualRevenue");
  });

  it("annualVariableCost ≈ $967,250", () => {
    // totalVarCost/day = 22+10+10+6+5 = 53; 50 × 53 × 365 = 967,250
    near(result.derived.annualVariableCost, 967_250, 1, "annualVariableCost");
  });

  it("annualPayroll = $2,105,000", () => {
    expect(result.derived.annualPayroll).toBe(2_105_000);
  });

  it("annualOverhead = $456,000", () => {
    expect(result.derived.annualOverhead).toBe(456_000);
  });

  it("annualProfit ≈ $556,934", () => {
    // 4,085,184.29 − 967,250 − 2,105,000 − 456,000 = 556,934.29
    near(result.derived.annualProfit, 556_934.29, 1, "annualProfit");
  });

  it("operatingMarginPercent ≈ 13.6%", () => {
    expect(result.derived.operatingMarginPercent).toBeCloseTo(13.62, 1);
  });

  it("breakEvenADC ≈ 41.1", () => {
    expect(result.derived.breakEvenADC).toBeCloseTo(41.08, 1);
  });

  it("marketersNeededDisplay = 3", () => {
    expect(result.derived.marketersNeededDisplay).toBe(3);
  });

  it("monthlyAdmissionsNeeded ≈ 21.7", () => {
    expect(result.derived.monthlyAdmissionsNeeded).toBeCloseTo(21.73, 1);
  });

  it("status = profitable-below-target (margin < 15%)", () => {
    expect(result.narrative.status).toBe("profitable-below-target");
  });

  it("profit = revenue − variableCost − payroll − overhead (internal consistency)", () => {
    const { annualRevenue, annualVariableCost, annualPayroll, annualOverhead, annualProfit } = result.derived;
    near(annualProfit, annualRevenue - annualVariableCost - annualPayroll - annualOverhead, 0.01, "profit identity");
  });
});

// ─── runEngine — Base preset ─────────────────────────────────────────────────

describe("runEngine — Base preset (ADC 50, LOS 90)", () => {
  const result = runEngine(makeInputs("base"), STAFF_ROLES);

  it("annualRevenue ≈ $3,915,233", () => {
    near(result.derived.annualRevenue, 3_915_233.33, 1, "annualRevenue");
  });

  it("annualProfit ≈ $386,983", () => {
    // 3,915,233.33 − 967,250 − 2,105,000 − 456,000 = 386,983.33
    near(result.derived.annualProfit, 386_983.33, 1, "annualProfit");
  });

  it("operatingMarginPercent ≈ 9.9%", () => {
    expect(result.derived.operatingMarginPercent).toBeCloseTo(9.87, 1);
  });

  it("breakEvenADC ≈ 43.4", () => {
    expect(result.derived.breakEvenADC).toBeCloseTo(43.44, 1);
  });

  it("marketersNeededDisplay = 2", () => {
    expect(result.derived.marketersNeededDisplay).toBe(2);
  });

  it("monthlyAdmissionsNeeded ≈ 16.9", () => {
    expect(result.derived.monthlyAdmissionsNeeded).toBeCloseTo(16.9, 1);
  });

  it("status = profitable-below-target (margin < 15%)", () => {
    expect(result.narrative.status).toBe("profitable-below-target");
  });

  it("profit identity holds", () => {
    const { annualRevenue, annualVariableCost, annualPayroll, annualOverhead, annualProfit } = result.derived;
    near(annualProfit, annualRevenue - annualVariableCost - annualPayroll - annualOverhead, 0.01, "profit identity");
  });
});

// ─── runEngine — High Acuity preset ──────────────────────────────────────────

describe("runEngine — High Acuity preset (ADC 50, LOS 90, high costs)", () => {
  const result = runEngine(makeInputs("highAcuity"), STAFF_ROLES);

  it("annualRevenue ≈ $3,915,233 (same rates as Base)", () => {
    near(result.derived.annualRevenue, 3_915_233.33, 1, "annualRevenue");
  });

  it("annualVariableCost ≈ $1,618,410 (higher pharmacy + supplies)", () => {
    // totalVarCost/day = 44.35 + 10 + 23.33 + 6 + 5 = 88.68
    // 50 × 88.68 × 365 = 1,618,410
    near(result.derived.annualVariableCost, 1_618_410, 1, "annualVariableCost");
  });

  it("annualProfit ≈ −$264,177 (loss)", () => {
    near(result.derived.annualProfit, -264_176.67, 1, "annualProfit");
  });

  it("operatingMarginPercent ≈ −6.7%", () => {
    expect(result.derived.operatingMarginPercent).toBeCloseTo(-6.75, 1);
  });

  it("breakEvenADC ≈ 55.8 (needs more patients than Base to break even)", () => {
    expect(result.derived.breakEvenADC).toBeCloseTo(55.75, 1);
  });

  it("marketersNeededDisplay = 2 (same admissions math as Base)", () => {
    expect(result.derived.marketersNeededDisplay).toBe(2);
  });

  it("status = below-breakeven", () => {
    expect(result.narrative.status).toBe("below-breakeven");
  });

  it("breakEvenADC > Base breakEvenADC (higher costs need more patients)", () => {
    const baseResult = runEngine(makeInputs("base"), STAFF_ROLES);
    expect(result.derived.breakEvenADC).toBeGreaterThan(baseResult.derived.breakEvenADC);
  });

  it("profit identity holds", () => {
    const { annualRevenue, annualVariableCost, annualPayroll, annualOverhead, annualProfit } = result.derived;
    near(annualProfit, annualRevenue - annualVariableCost - annualPayroll - annualOverhead, 0.01, "profit identity");
  });
});

// ─── buildAdmissionsReferenceTable ───────────────────────────────────────────

describe("buildAdmissionsReferenceTable", () => {
  it("returns 5 rows (one per standard ADC checkpoint)", () => {
    expect(buildAdmissionsReferenceTable(90)).toHaveLength(5);
  });

  it("monthly ≈ (ADC × 365) / LOS / 12", () => {
    const rows = buildAdmissionsReferenceTable(90);
    const row50 = rows.find((r) => r.targetADC === 50)!;
    // (50 × 365) / 90 / 12 ≈ 16.898
    expect(row50.monthlyAdmissionsNeeded).toBeCloseTo(16.898, 2);
  });

  it("weekly ≈ monthly × 12 / 52", () => {
    const rows = buildAdmissionsReferenceTable(90);
    const row50 = rows.find((r) => r.targetADC === 50)!;
    const expected = (row50.monthlyAdmissionsNeeded * 12) / 52;
    expect(row50.weeklyAdmissionsNeeded).toBeCloseTo(expected, 5);
  });

  it("display strings use one decimal place", () => {
    const rows = buildAdmissionsReferenceTable(90);
    for (const row of rows) {
      expect(row.display.monthlyAdmissionsNeeded).toMatch(/^\d+\.\d$/);
      expect(row.display.weeklyAdmissionsNeeded).toMatch(/^\d+\.\d$/);
    }
  });
});

// ─── Regression: at-target status ────────────────────────────────────────────

describe("runEngine — at-target status when margin ≥ target", () => {
  it("reports at-target for Lean preset at high ADC", () => {
    // At ADC 100, Lean should comfortably exceed 15% margin
    const result = runEngine(makeInputs("lean", 100, 15), STAFF_ROLES);
    expect(result.narrative.status).toBe("at-target");
    expect(result.derived.operatingMarginPercent).toBeGreaterThanOrEqual(15);
  });
});
