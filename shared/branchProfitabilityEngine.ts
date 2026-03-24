/**
 * Branch Profitability Engine — single source of truth for all formulas.
 *
 * Rules:
 * - All intermediate arithmetic uses Decimal.js (≥28-digit precision).
 * - Plain `number` values are only materialised at the very end (toNumber()).
 * - Display formatting happens only in the `display` sub-object; never elsewhere.
 * - This file is imported by both the client (live preview) and the server
 *   (export / print authoritative recalculation).
 */

import Decimal from "decimal.js";

// Configure Decimal globally for this module
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─── Versions ─────────────────────────────────────────────────────────────────
export const FORMULA_VERSION = "2.0.0";
// Content version is imported at call-time to avoid circular deps.
// The engine itself just stores whatever string is passed to it.
export const CONTENT_VERSION_PLACEHOLDER = "see:branch_content_claim_registry";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchInputs {
  scenarioPreset: string;
  targetADC: number;
  avgLengthOfStayDays: number;
  targetOperatingMarginPercent: number; // integer-style, e.g. 15 means 15 %
  rhcDay1To60: number;
  rhcDay61Plus: number;
  pharmacyPerDay: number;
  dmePerDay: number;
  suppliesPerDay: number;
  travelPerDay: number;
  otherPerDay: number;
  monthlyNonPayrollOverhead: number;
  startingCapital: number;
  admissionsPerMarketerPerMonth: number;
}

export interface StaffingRole {
  role: string;
  salary: number;   // annual salary per FTE
  minFte: number;
  caseloadTrigger: number; // 9999 = always exactly minFte
}

export interface StaffingRow {
  role: string;
  /** @alias annualSalary — both fields are the same value */
  salary: number;
  annualSalary: number;
  minFte: number;
  caseloadTrigger: number;
  fte: number;
  annualCost: number;
}

export interface RunwayMonth {
  month: number;
  avgADC: number;
  monthlyRevenue: number;
  monthlyVariableCost: number;
  monthlyPayroll: number;
  monthlyOverhead: number;
  monthlyProfitLoss: number;
  cumulativeCash: number;
}

export interface CurvePoint {
  adc: number;
  annualProfit: number;
  operatingMarginPercent: number;
}

export interface BranchDerived {
  blendedRevenuePerDay: number;
  totalVariableCostPerDay: number;
  annualRevenue: number;
  annualVariableCost: number;
  annualPayroll: number;
  annualOverhead: number;
  annualFixedCost: number;
  annualProfit: number;
  operatingMarginPercent: number;
  contributionPerDay: number;
  breakEvenADC: number;
  targetMarginADC: number;
  monthlyAdmissionsNeeded: number;
  weeklyAdmissionsNeeded: number;
  marketersNeededRaw: number;
  marketersNeededDisplay: number;
}

export type BranchStatus =
  | "below-breakeven"
  | "profitable-below-target"
  | "at-target";

export interface BranchNarrative {
  status: BranchStatus;
  monthsOfRunway: number;
  monthCashFlowTurnsPositive: number; // -1 = never within 18 months
  cashAtMonth12: number;
}

export interface BranchMetadata {
  formulaVersion: string;
  contentVersion: string;
  fiscalYear: string;           // CMS fiscal year for payment rates (e.g. "2026")
  calculationTimestamp: string; // ISO 8601
}

export interface BranchValidation {
  mathValid: boolean;
  contentValid: boolean;
  errors: ValidationError[];
}

export interface BranchResults {
  inputs: BranchInputs;
  derived: BranchDerived;
  display: {
    annualProfit: string;
    operatingMarginPercent: string;
    breakEvenADC: string;
    targetMarginADC: string;
    marketersNeeded: string;
    monthlyAdmissionsNeeded: string;
    weeklyAdmissionsNeeded: string;
    totalPayroll: string;
    annualRevenue: string;
    annualVariableCost: string;
    annualPayroll: string;
    annualOverhead: string;
    blendedRevenuePerDay: string;
    contributionPerDay: string;
    totalVariableCostPerDay: string;
  };
  tables: {
    requiredStaffing: StaffingRow[];
    runwayMonths: RunwayMonth[];
  };
  charts: {
    profitCurve: CurvePoint[];
    operatingMarginCurve: CurvePoint[];
  };
  narrative: BranchNarrative;
  metadata: BranchMetadata;
  validation: BranchValidation;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateInputs(inputs: BranchInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  function req(field: keyof BranchInputs, label: string) {
    const v = inputs[field];
    if (v === null || v === undefined || v === "" || !Number.isFinite(Number(v))) {
      errors.push({ field, message: `${label} is required and must be a finite number` });
    }
  }

  req("targetADC", "Target ADC");
  req("avgLengthOfStayDays", "Average Length of Stay");
  req("targetOperatingMarginPercent", "Target Operating Margin");
  req("rhcDay1To60", "RHC Day 1–60");
  req("rhcDay61Plus", "RHC Day 61+");
  req("pharmacyPerDay", "Pharmacy $/day");
  req("dmePerDay", "DME $/day");
  req("suppliesPerDay", "Supplies $/day");
  req("travelPerDay", "Travel $/day");
  req("otherPerDay", "Other $/day");
  req("monthlyNonPayrollOverhead", "Monthly overhead");
  req("startingCapital", "Starting capital");
  req("admissionsPerMarketerPerMonth", "Admissions per marketer");

  if (Number.isFinite(inputs.targetADC) && inputs.targetADC <= 0)
    errors.push({ field: "targetADC", message: "Target ADC must be greater than 0" });
  if (Number.isFinite(inputs.avgLengthOfStayDays) && inputs.avgLengthOfStayDays <= 0)
    errors.push({ field: "avgLengthOfStayDays", message: "Average Length of Stay must be greater than 0" });
  if (Number.isFinite(inputs.admissionsPerMarketerPerMonth) && inputs.admissionsPerMarketerPerMonth <= 0)
    errors.push({ field: "admissionsPerMarketerPerMonth", message: "Admissions per marketer must be greater than 0" });

  return errors;
}

// ─── Display formatters (export so tests and PDF template can import them) ─────

/**
 * Currency display: negative sign before $, two decimal places, comma grouping.
 * Per spec: "currency displays to 2 decimals".
 */
export function fmtCurrency(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  const d = new Decimal(v).toDecimalPlaces(2);
  const abs = d.abs().toFixed(2);
  const [whole, frac] = abs.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (d.isNegative() ? "-$" : "$") + grouped + "." + frac;
}

/**
 * Large dollar amounts shown without cents for readability (annual totals).
 * Negative sign before $.
 */
export function fmtDollarRounded(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  const abs = Math.abs(Math.round(v));
  return (v < 0 ? "-$" : "$") + abs.toLocaleString("en-US");
}

/**
 * Per-day rates shown to 2 decimal places (e.g., $230.83).
 */
export function fmtPerDay(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  return fmtCurrency(v);
}

/** Percentage to 1 decimal place. */
export function fmtPct(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  return v.toFixed(1) + "%";
}

/** ADC to 1 decimal place. */
export function fmtADC(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  return v.toFixed(1);
}

/** Admissions to 1 decimal place. */
export function fmtAdmissions(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  return v.toFixed(1);
}

// ─── Core formula functions (exported for unit tests) ─────────────────────────

/**
 * Formula 2: Blended RHC revenue per patient per day.
 * If LOS ≤ 60 all days are at the higher rate.
 * If LOS > 60, blend proportionally.
 */
export function computeBlendedRevenuePerDay(
  rhcDay1To60: number,
  rhcDay61Plus: number,
  los: number
): number {
  const d1 = new Decimal(rhcDay1To60);
  const d2 = new Decimal(rhcDay61Plus);
  const dLos = new Decimal(los);

  if (dLos.lte(0)) return rhcDay1To60;
  if (dLos.lte(60)) return d1.toNumber();

  // ((rhcDay1To60 * 60) + (rhcDay61Plus * (los - 60))) / los
  return d1.times(60)
    .plus(d2.times(dLos.minus(60)))
    .dividedBy(dLos)
    .toNumber();
}

/**
 * Staffing model: calculates FTE and annual cost for each role at a given ADC.
 */
export function computeStaffingRows(
  staffingRoles: StaffingRole[],
  adc: number
): StaffingRow[] {
  const dAdc = new Decimal(adc);
  return staffingRoles.map((role) => {
    const fte =
      role.caseloadTrigger < 9999
        ? Math.max(role.minFte, Math.ceil(dAdc.dividedBy(role.caseloadTrigger).toNumber()))
        : role.minFte;
    const annualCost = new Decimal(fte).times(role.salary).toNumber();
    return {
      ...role,
      fte,
      annualSalary: role.salary,
      annualCost,
    };
  });
}

/**
 * Formula 11: Break-even ADC.
 * annualFixedCost / (contributionPerDay * 365)
 */
export function computeBreakEvenADC(
  annualFixedCost: number,
  contributionPerDay: number
): number {
  if (contributionPerDay <= 0) return Infinity;
  return new Decimal(annualFixedCost)
    .dividedBy(new Decimal(contributionPerDay).times(365))
    .toNumber();
}

/**
 * Formula 12: Target margin ADC.
 * annualFixedCost / (365 * ((revenue * (1 - margin/100)) - varCost))
 */
export function computeTargetMarginADC(
  annualFixedCost: number,
  blendedRevenuePerDay: number,
  totalVariableCostPerDay: number,
  targetOperatingMarginPercent: number
): number {
  const dFixed = new Decimal(annualFixedCost);
  const dRev   = new Decimal(blendedRevenuePerDay);
  const dVar   = new Decimal(totalVariableCostPerDay);
  const dMarginFrac = new Decimal(targetOperatingMarginPercent).dividedBy(100);

  // 365 * ((revenue * (1 - margin%)) - varCost)
  const denom = new Decimal(365).times(
    dRev.times(new Decimal(1).minus(dMarginFrac)).minus(dVar)
  );

  if (denom.lte(0)) return Infinity;
  return dFixed.dividedBy(denom).toNumber();
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function runEngine(
  inputs: BranchInputs,
  staffingRoles: StaffingRole[],
  contentVersion = "2.0.0"
): BranchResults {
  const {
    targetADC,
    avgLengthOfStayDays,
    targetOperatingMarginPercent,
    rhcDay1To60,
    rhcDay61Plus,
    pharmacyPerDay,
    dmePerDay,
    suppliesPerDay,
    travelPerDay,
    otherPerDay,
    monthlyNonPayrollOverhead,
    startingCapital,
    admissionsPerMarketerPerMonth,
  } = inputs;

  // Use Decimal throughout all intermediate steps
  const D = (n: number) => new Decimal(n);

  // ── 1. Total variable cost per patient per day ────────────────────────────
  const dTotalVarCost = D(pharmacyPerDay)
    .plus(dmePerDay)
    .plus(suppliesPerDay)
    .plus(travelPerDay)
    .plus(otherPerDay);
  const totalVariableCostPerDay = dTotalVarCost.toNumber();

  // ── 2. Blended revenue per patient per day ────────────────────────────────
  const blendedRevenuePerDay = computeBlendedRevenuePerDay(
    rhcDay1To60,
    rhcDay61Plus,
    avgLengthOfStayDays
  );
  const dBlendedRev = D(blendedRevenuePerDay);

  // ── 3. Annual revenue ─────────────────────────────────────────────────────
  const dAnnualRevenue = D(targetADC).times(dBlendedRev).times(365);
  const annualRevenue = dAnnualRevenue.toNumber();

  // ── 4. Annual variable cost ───────────────────────────────────────────────
  const dAnnualVarCost = D(targetADC).times(dTotalVarCost).times(365);
  const annualVariableCost = dAnnualVarCost.toNumber();

  // ── 5. Annual payroll (always equals sum of staffing rows) ────────────────
  const staffingRows = computeStaffingRows(staffingRoles, targetADC);
  const annualPayroll = staffingRows.reduce(
    (acc, r) => acc.plus(r.annualCost),
    D(0)
  ).toNumber();
  const dAnnualPayroll = D(annualPayroll);

  // ── 6. Annual overhead ────────────────────────────────────────────────────
  const dAnnualOverhead = D(monthlyNonPayrollOverhead).times(12);
  const annualOverhead = dAnnualOverhead.toNumber();

  // ── 7. Annual fixed cost ──────────────────────────────────────────────────
  const dAnnualFixed = dAnnualPayroll.plus(dAnnualOverhead);
  const annualFixedCost = dAnnualFixed.toNumber();

  // ── 8. Annual profit ──────────────────────────────────────────────────────
  const dAnnualProfit = dAnnualRevenue
    .minus(dAnnualVarCost)
    .minus(dAnnualPayroll)
    .minus(dAnnualOverhead);
  const annualProfit = dAnnualProfit.toNumber();

  // ── 9. Operating margin % ─────────────────────────────────────────────────
  const operatingMarginPercent = dAnnualRevenue.gt(0)
    ? dAnnualProfit.dividedBy(dAnnualRevenue).times(100).toNumber()
    : 0;

  // ── 10. Contribution per patient per day ──────────────────────────────────
  const dContrib = dBlendedRev.minus(dTotalVarCost);
  const contributionPerDay = dContrib.toNumber();

  // ── 11. Break-even ADC ────────────────────────────────────────────────────
  const breakEvenADCRaw = computeBreakEvenADC(annualFixedCost, contributionPerDay);
  const breakEvenADC = Number.isFinite(breakEvenADCRaw) ? Math.max(0, breakEvenADCRaw) : 0;

  // ── 12. Target margin ADC ─────────────────────────────────────────────────
  const targetMarginADCRaw = computeTargetMarginADC(
    annualFixedCost,
    blendedRevenuePerDay,
    totalVariableCostPerDay,
    targetOperatingMarginPercent
  );
  const targetMarginADC = Number.isFinite(targetMarginADCRaw) ? Math.max(0, targetMarginADCRaw) : 0;

  // ── 13. Monthly admissions needed ─────────────────────────────────────────
  const monthlyAdmissionsNeeded = avgLengthOfStayDays > 0
    ? D(targetADC).times(365).dividedBy(avgLengthOfStayDays).dividedBy(12).toNumber()
    : 0;

  // ── 14. Weekly admissions needed ─────────────────────────────────────────
  const weeklyAdmissionsNeeded = D(monthlyAdmissionsNeeded).times(12).dividedBy(52).toNumber();

  // ── 15–16. Marketers ──────────────────────────────────────────────────────
  const marketersNeededRaw = admissionsPerMarketerPerMonth > 0
    ? D(monthlyAdmissionsNeeded).dividedBy(admissionsPerMarketerPerMonth).toNumber()
    : 0;
  const marketersNeededDisplay = Math.ceil(marketersNeededRaw);

  // ── Cash runway (18-month linear ramp to targetADC) ───────────────────────
  const dDaysPerMonth = D(365).dividedBy(12);
  let dCumCash = D(startingCapital);
  let monthCashFlowTurnsPositive = -1;
  let monthsOfRunway = 18;
  const runwayMonths: RunwayMonth[] = [];

  for (let m = 1; m <= 18; m++) {
    // Linear ramp: months 1–12 ramp from 0 to targetADC, months 13–18 hold flat
    const avgADC = m <= 12
      ? D(targetADC).times(m).dividedBy(12).toNumber()
      : targetADC;

    const dAvgADC = D(avgADC);
    const dMonthlyRev = dAvgADC.times(dBlendedRev).times(dDaysPerMonth);
    const dMonthlyVar = dAvgADC.times(dTotalVarCost).times(dDaysPerMonth);
    const dMonthlyPayroll = dAnnualPayroll.dividedBy(12);
    const dMonthlyOH = D(monthlyNonPayrollOverhead);
    const dMonthlyPnL = dMonthlyRev.minus(dMonthlyVar).minus(dMonthlyPayroll).minus(dMonthlyOH);

    dCumCash = dCumCash.plus(dMonthlyPnL);

    const monthlyRevenue      = dMonthlyRev.toNumber();
    const monthlyVariableCost = dMonthlyVar.toNumber();
    const monthlyPayroll      = dMonthlyPayroll.toNumber();
    const monthlyOverhead     = dMonthlyOH.toNumber();
    const monthlyProfitLoss   = dMonthlyPnL.toNumber();
    const cumulativeCash      = dCumCash.toNumber();

    runwayMonths.push({
      month: m,
      avgADC,
      monthlyRevenue,
      monthlyVariableCost,
      monthlyPayroll,
      monthlyOverhead,
      monthlyProfitLoss,
      cumulativeCash,
    });

    if (monthCashFlowTurnsPositive === -1 && monthlyProfitLoss > 0) {
      monthCashFlowTurnsPositive = m;
    }
    if (cumulativeCash <= 0 && monthsOfRunway === 18) {
      monthsOfRunway = m - 1;
    }
  }

  const cashAtMonth12 = runwayMonths[11]?.cumulativeCash ?? startingCapital;

  // ── Status ────────────────────────────────────────────────────────────────
  const status: BranchStatus =
    annualProfit < 0
      ? "below-breakeven"
      : operatingMarginPercent < targetOperatingMarginPercent
      ? "profitable-below-target"
      : "at-target";

  // ── Profit curve (ADC 10–200, one point per integer) ─────────────────────
  const profitCurve: CurvePoint[] = [];
  const operatingMarginCurve: CurvePoint[] = [];

  for (let adc = 10; adc <= 200; adc++) {
    const curveRows    = computeStaffingRows(staffingRoles, adc);
    const curvePayroll = curveRows.reduce((s, r) => s.plus(r.annualCost), D(0));
    const curveRev     = D(adc).times(dBlendedRev).times(365);
    const curveVar     = D(adc).times(dTotalVarCost).times(365);
    const curveProfit  = curveRev.minus(curveVar).minus(curvePayroll).minus(dAnnualOverhead);
    const curveMargin  = curveRev.gt(0)
      ? curveProfit.dividedBy(curveRev).times(100).toNumber()
      : 0;
    const point: CurvePoint = {
      adc,
      annualProfit: curveProfit.toNumber(),
      operatingMarginPercent: curveMargin,
    };
    profitCurve.push(point);
    operatingMarginCurve.push(point);
  }

  // ── Assemble result ───────────────────────────────────────────────────────
  return {
    inputs,
    derived: {
      blendedRevenuePerDay,
      totalVariableCostPerDay,
      annualRevenue,
      annualVariableCost,
      annualPayroll,
      annualOverhead,
      annualFixedCost,
      annualProfit,
      operatingMarginPercent,
      contributionPerDay,
      breakEvenADC,
      targetMarginADC,
      monthlyAdmissionsNeeded,
      weeklyAdmissionsNeeded,
      marketersNeededRaw,
      marketersNeededDisplay,
    },
    display: {
      annualProfit:             fmtDollarRounded(annualProfit),
      operatingMarginPercent:   fmtPct(operatingMarginPercent),
      breakEvenADC:             fmtADC(breakEvenADC),
      targetMarginADC:          targetMarginADC > 0 ? fmtADC(targetMarginADC) : "N/A",
      marketersNeeded:          marketersNeededDisplay.toString(),
      monthlyAdmissionsNeeded:  fmtAdmissions(monthlyAdmissionsNeeded),
      weeklyAdmissionsNeeded:   fmtAdmissions(weeklyAdmissionsNeeded),
      totalPayroll:             fmtDollarRounded(annualPayroll),
      annualRevenue:            fmtDollarRounded(annualRevenue),
      annualVariableCost:       fmtDollarRounded(annualVariableCost),
      annualPayroll:            fmtDollarRounded(annualPayroll),
      annualOverhead:           fmtDollarRounded(annualOverhead),
      blendedRevenuePerDay:     fmtPerDay(blendedRevenuePerDay),
      contributionPerDay:       fmtPerDay(contributionPerDay),
      totalVariableCostPerDay:  fmtPerDay(totalVariableCostPerDay),
    },
    tables: {
      requiredStaffing: staffingRows,
      runwayMonths,
    },
    charts: {
      profitCurve,
      operatingMarginCurve,
    },
    narrative: {
      status,
      monthsOfRunway,
      monthCashFlowTurnsPositive,
      cashAtMonth12,
    },
    metadata: {
      formulaVersion:        FORMULA_VERSION,
      contentVersion,
      fiscalYear:            "2026",
      calculationTimestamp:  new Date().toISOString(),
    },
    validation: {
      mathValid: true,
      contentValid: true,
      errors: [],
    },
  };
}
