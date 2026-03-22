/**
 * Branch Profitability Engine — single source of truth for all formulas.
 * Used by both the client (live preview) and server (export / print validation).
 * No rounding occurs inside derived calculations; rounding is display-only.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchInputs {
  scenarioPreset: string;
  targetADC: number;
  avgLengthOfStayDays: number;
  targetOperatingMarginPercent: number; // e.g. 15 means 15%
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
  salary: number;
  minFte: number;
  caseloadTrigger: number; // 9999 = always one FTE
}

export interface StaffingRow {
  role: string;
  salary: number;
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
}

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateInputs(inputs: BranchInputs): ValidationError[] {
  const errors: ValidationError[] = [];
  const req = (field: keyof BranchInputs, label: string) => {
    const v = inputs[field];
    if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) {
      errors.push({ field, message: `${label} is required and must be a valid number` });
    }
  };
  req("targetADC", "Target ADC");
  req("avgLengthOfStayDays", "Average Length of Stay");
  req("targetOperatingMarginPercent", "Target Operating Margin");
  req("rhcDay1To60", "RHC Day 1-60 Rate");
  req("rhcDay61Plus", "RHC Day 61+ Rate");
  req("pharmacyPerDay", "Pharmacy daily cost");
  req("dmePerDay", "DME daily cost");
  req("suppliesPerDay", "Supplies daily cost");
  req("travelPerDay", "Travel daily cost");
  req("otherPerDay", "Other daily cost");
  req("monthlyNonPayrollOverhead", "Monthly overhead");
  req("startingCapital", "Starting capital");
  req("admissionsPerMarketerPerMonth", "Admissions per marketer");

  if (inputs.avgLengthOfStayDays <= 0)
    errors.push({ field: "avgLengthOfStayDays", message: "Average Length of Stay must be greater than 0" });
  if (inputs.admissionsPerMarketerPerMonth <= 0)
    errors.push({ field: "admissionsPerMarketerPerMonth", message: "Admissions per marketer must be greater than 0" });
  if (inputs.targetADC <= 0)
    errors.push({ field: "targetADC", message: "Target ADC must be greater than 0" });

  return errors;
}

// ─── Core formula functions (exported for unit tests) ─────────────────────────

export function computeBlendedRevenuePerDay(
  rhcDay1To60: number,
  rhcDay61Plus: number,
  los: number
): number {
  if (los <= 0) return rhcDay1To60;
  if (los <= 60) return rhcDay1To60;
  return (rhcDay1To60 * 60 + rhcDay61Plus * (los - 60)) / los;
}

export function computeStaffingRows(
  staffingRoles: StaffingRole[],
  adc: number
): StaffingRow[] {
  return staffingRoles.map((role) => {
    const fte =
      role.caseloadTrigger < 9999
        ? Math.max(role.minFte, Math.ceil(adc / role.caseloadTrigger))
        : role.minFte;
    return { ...role, fte, annualCost: fte * role.salary };
  });
}

export function computeBreakEvenADC(
  annualFixedCost: number,
  contributionPerDay: number
): number {
  if (contributionPerDay <= 0) return 0;
  return annualFixedCost / (contributionPerDay * 365);
}

export function computeTargetMarginADC(
  annualFixedCost: number,
  blendedRevenuePerDay: number,
  totalVariableCostPerDay: number,
  targetOperatingMarginPercent: number
): number {
  const targetFrac = targetOperatingMarginPercent / 100;
  const denom =
    365 * (blendedRevenuePerDay * (1 - targetFrac) - totalVariableCostPerDay);
  if (denom <= 0) return 0;
  return annualFixedCost / denom;
}

// ─── Display formatters (used inside the engine only for display fields) ──────

function fmtDollar(v: number): string {
  const sign = v < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
}

function fmtDollarShort(v: number): string {
  return "$" + Math.round(v).toLocaleString("en-US");
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function runEngine(
  inputs: BranchInputs,
  staffingRoles: StaffingRole[]
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

  // 1. Total variable cost per patient per day
  const totalVariableCostPerDay =
    pharmacyPerDay + dmePerDay + suppliesPerDay + travelPerDay + otherPerDay;

  // 2. Blended revenue per patient per day
  const blendedRevenuePerDay = computeBlendedRevenuePerDay(
    rhcDay1To60,
    rhcDay61Plus,
    avgLengthOfStayDays
  );

  // 3. Annual revenue
  const annualRevenue = targetADC * blendedRevenuePerDay * 365;

  // 4. Annual variable cost
  const annualVariableCost = targetADC * totalVariableCostPerDay * 365;

  // 5. Annual payroll from staffing model
  const staffingRows = computeStaffingRows(staffingRoles, targetADC);
  const annualPayroll = staffingRows.reduce((sum, r) => sum + r.annualCost, 0);

  // 6. Annual overhead
  const annualOverhead = monthlyNonPayrollOverhead * 12;

  // 7. Annual fixed cost
  const annualFixedCost = annualPayroll + annualOverhead;

  // 8. Annual profit
  const annualProfit =
    annualRevenue - annualVariableCost - annualPayroll - annualOverhead;

  // 9. Operating margin %
  const operatingMarginPercent =
    annualRevenue > 0 ? (annualProfit / annualRevenue) * 100 : 0;

  // 10. Contribution per patient per day
  const contributionPerDay = blendedRevenuePerDay - totalVariableCostPerDay;

  // 11. Break-even ADC
  const breakEvenADC = computeBreakEvenADC(annualFixedCost, contributionPerDay);

  // 12. Target margin ADC
  const targetMarginADC = computeTargetMarginADC(
    annualFixedCost,
    blendedRevenuePerDay,
    totalVariableCostPerDay,
    targetOperatingMarginPercent
  );

  // 13. Monthly admissions needed (raw — not rounded, feeds into marketer calc)
  const monthlyAdmissionsNeeded =
    avgLengthOfStayDays > 0
      ? (targetADC * 365) / avgLengthOfStayDays / 12
      : 0;

  // 14. Weekly admissions needed
  const weeklyAdmissionsNeeded = (monthlyAdmissionsNeeded * 12) / 52;

  // 15-16. Marketers needed
  const marketersNeededRaw =
    admissionsPerMarketerPerMonth > 0
      ? monthlyAdmissionsNeeded / admissionsPerMarketerPerMonth
      : 0;
  const marketersNeededDisplay = Math.ceil(marketersNeededRaw);

  // ─── Cash runway (18-month linear ramp) ─────────────────────────────────
  const daysPerMonth = 365 / 12;
  let cumulativeCash = startingCapital;
  let monthCashFlowTurnsPositive = -1;
  let monthsOfRunway = 18;
  const runwayMonths: RunwayMonth[] = [];

  for (let m = 1; m <= 18; m++) {
    const avgADC = m <= 12 ? (targetADC * m) / 12 : targetADC;
    const monthlyRevenue = avgADC * blendedRevenuePerDay * daysPerMonth;
    const monthlyVariableCost = avgADC * totalVariableCostPerDay * daysPerMonth;
    const monthlyPayroll = annualPayroll / 12;
    const monthlyOverhead = monthlyNonPayrollOverhead;
    const monthlyProfitLoss =
      monthlyRevenue - monthlyVariableCost - monthlyPayroll - monthlyOverhead;
    cumulativeCash += monthlyProfitLoss;

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

  // ─── Status ──────────────────────────────────────────────────────────────
  const status: BranchStatus =
    annualProfit < 0
      ? "below-breakeven"
      : operatingMarginPercent < targetOperatingMarginPercent
      ? "profitable-below-target"
      : "at-target";

  // ─── Profit curve (ADC 10–200) ────────────────────────────────────────────
  const profitCurve: CurvePoint[] = [];
  const operatingMarginCurve: CurvePoint[] = [];

  for (let adc = 10; adc <= 200; adc++) {
    const curveRows = computeStaffingRows(staffingRoles, adc);
    const curvePayroll = curveRows.reduce((s, r) => s + r.annualCost, 0);
    const curveRevenue = adc * blendedRevenuePerDay * 365;
    const curveVarCost = adc * totalVariableCostPerDay * 365;
    const curveProfit = curveRevenue - curveVarCost - curvePayroll - annualOverhead;
    const curveMargin =
      curveRevenue > 0 ? (curveProfit / curveRevenue) * 100 : 0;
    const point: CurvePoint = {
      adc,
      annualProfit: curveProfit,
      operatingMarginPercent: curveMargin,
    };
    profitCurve.push(point);
    operatingMarginCurve.push(point);
  }

  // ─── Assemble structured result ───────────────────────────────────────────
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
      breakEvenADC: Math.max(0, breakEvenADC),
      targetMarginADC: Math.max(0, targetMarginADC),
      monthlyAdmissionsNeeded,
      weeklyAdmissionsNeeded,
      marketersNeededRaw,
      marketersNeededDisplay,
    },
    display: {
      annualProfit: fmtDollar(annualProfit),
      operatingMarginPercent: operatingMarginPercent.toFixed(1) + "%",
      breakEvenADC: Math.max(0, breakEvenADC).toFixed(1),
      targetMarginADC:
        targetMarginADC > 0 ? Math.max(0, targetMarginADC).toFixed(1) : "N/A",
      marketersNeeded: marketersNeededDisplay.toString(),
      monthlyAdmissionsNeeded: monthlyAdmissionsNeeded.toFixed(1),
      weeklyAdmissionsNeeded: weeklyAdmissionsNeeded.toFixed(1),
      totalPayroll: fmtDollar(annualPayroll),
      annualRevenue: fmtDollar(annualRevenue),
      annualVariableCost: fmtDollar(annualVariableCost),
      annualPayroll: fmtDollar(annualPayroll),
      annualOverhead: fmtDollar(annualOverhead),
      blendedRevenuePerDay: fmtDollarShort(blendedRevenuePerDay),
      contributionPerDay: fmtDollarShort(contributionPerDay),
      totalVariableCostPerDay: fmtDollarShort(totalVariableCostPerDay),
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
  };
}
