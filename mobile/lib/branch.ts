export type BranchInputs = {
  scenarioPreset: string;
  targetADC: number;
  avgLengthOfStayDays: number;
  targetOperatingMarginPercent: number;
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
};

export type BranchPreset = {
  label: string;
  description: string;
  inputs: Omit<BranchInputs, "scenarioPreset" | "targetADC" | "targetOperatingMarginPercent">;
};

export const BRANCH_PRESETS: Record<string, BranchPreset> = {
  lean: {
    label: "Lean",
    description: "Short LOS and leaner cost structure for faster-turning patient mixes.",
    inputs: {
      avgLengthOfStayDays: 70,
      rhcDay1To60: 230.83,
      rhcDay61Plus: 181.94,
      pharmacyPerDay: 22,
      dmePerDay: 10,
      suppliesPerDay: 10,
      travelPerDay: 6,
      otherPerDay: 5,
      monthlyNonPayrollOverhead: 38000,
      startingCapital: 250000,
      admissionsPerMarketerPerMonth: 10,
    },
  },
  base: {
    label: "Base",
    description: "Balanced mixed-acuity model using the national 2026 base rate assumptions.",
    inputs: {
      avgLengthOfStayDays: 90,
      rhcDay1To60: 230.83,
      rhcDay61Plus: 181.94,
      pharmacyPerDay: 22,
      dmePerDay: 10,
      suppliesPerDay: 10,
      travelPerDay: 6,
      otherPerDay: 5,
      monthlyNonPayrollOverhead: 38000,
      startingCapital: 250000,
      admissionsPerMarketerPerMonth: 10,
    },
  },
  highAcuity: {
    label: "High Acuity",
    description: "Higher pharmacy and supply costs for more clinically complex patient mixes.",
    inputs: {
      avgLengthOfStayDays: 90,
      rhcDay1To60: 230.83,
      rhcDay61Plus: 181.94,
      pharmacyPerDay: 44.35,
      dmePerDay: 10,
      suppliesPerDay: 23.33,
      travelPerDay: 6,
      otherPerDay: 5,
      monthlyNonPayrollOverhead: 38000,
      startingCapital: 250000,
      admissionsPerMarketerPerMonth: 10,
    },
  },
};

export const DEFAULT_BRANCH_INPUTS: BranchInputs = {
  scenarioPreset: "base",
  targetADC: 50,
  targetOperatingMarginPercent: 15,
  ...BRANCH_PRESETS.base.inputs,
};

