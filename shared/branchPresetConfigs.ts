/**
 * Branch Profitability Preset Configurations and Staffing Roles.
 * Single source of truth for all scenario defaults and staffing rules.
 */

import type { StaffingRole, BranchInputs } from "./branchProfitabilityEngine";

// ─── Staffing Model ───────────────────────────────────────────────────────────
// caseloadTrigger: how many patients per FTE before adding another.
// 9999 = always exactly minFte regardless of ADC.

export const STAFF_ROLES: StaffingRole[] = [
  { role: "Executive Director",         salary: 140000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Supervisor RN Case Manager", salary: 110000, minFte: 1, caseloadTrigger: 9999 },
  { role: "RN Case Manager",            salary: 100000, minFte: 2, caseloadTrigger: 12 },
  { role: "Hospice Aide",               salary:  50000, minFte: 2, caseloadTrigger: 8 },
  { role: "Social Worker",              salary:  75000, minFte: 1, caseloadTrigger: 15 },
  { role: "Chaplain",                   salary:  70000, minFte: 1, caseloadTrigger: 20 },
  { role: "After Hours RN",             salary:  95000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Weekend RN",                 salary:  95000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Intake Coordinator",         salary:  60000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Secretary",                  salary:  55000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Sales Rep / Marketer",       salary: 115000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Medical Director Contract",  salary:  75000, minFte: 1, caseloadTrigger: 9999 },
];

// ─── Preset Scenarios ─────────────────────────────────────────────────────────

export interface PresetConfig {
  label: string;
  description: string;
  inputs: Omit<BranchInputs, "scenarioPreset" | "targetADC" | "targetOperatingMarginPercent">;
}

export const PRESET_CONFIGS: Record<string, PresetConfig> = {
  lean: {
    label: "Lean",
    description:
      "Short LOS (70 days), referral mix weighted toward shorter-stay diagnoses like heart failure or COPD. More revenue captured in the higher Day 1–60 rate.",
    inputs: {
      avgLengthOfStayDays: 70,
      rhcDay1To60: 224.62,
      rhcDay61Plus: 176.92,
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
    description:
      "90-day blended LOS with equal Day 1–60 and Day 61+ rates. The most common starting model for a new branch with a mixed referral mix.",
    inputs: {
      avgLengthOfStayDays: 90,
      rhcDay1To60: 208.72,
      rhcDay61Plus: 208.72,
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
    description:
      "Same LOS as Base but significantly higher pharmacy and supply costs, reflecting an oncology-heavy or complex symptom management patient mix.",
    inputs: {
      avgLengthOfStayDays: 90,
      rhcDay1To60: 208.72,
      rhcDay61Plus: 208.72,
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

// ─── Default Inputs ───────────────────────────────────────────────────────────

export const DEFAULT_INPUTS: BranchInputs = {
  scenarioPreset: "base",
  targetADC: 50,
  targetOperatingMarginPercent: 15,
  ...PRESET_CONFIGS.base.inputs,
};
