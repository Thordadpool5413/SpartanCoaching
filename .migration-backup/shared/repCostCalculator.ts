export type RepCostInputs = {
  baseSalary: number;
  benefitsLoad: number;
  annualMileage: number;
  otherFixedCosts: number;
  callsPerDay: number;
  workingDaysPerMonth: number;
  callsPerReferral: number;
  conversionRate: number;
};

export type RepCommissionTier = { id: number; min: number; max: number; rate: number };

export const MILEAGE_RATE = 0.67;

export function calculateRepCost(inputs: RepCostInputs, tiers: RepCommissionTier[]) {
  const annualCalls = inputs.callsPerDay * inputs.workingDaysPerMonth * 12;
  const monthlyCalls = inputs.callsPerDay * inputs.workingDaysPerMonth;
  const monthlyReferrals = inputs.callsPerReferral > 0 ? monthlyCalls / inputs.callsPerReferral : 0;
  const annualReferrals = monthlyReferrals * 12;
  const monthlyAdmissions = monthlyReferrals * (inputs.conversionRate / 100);
  const annualAdmissions = monthlyAdmissions * 12;
  const monthlyLostAdmissions = Math.max(0, monthlyReferrals - monthlyAdmissions);
  const annualLostAdmissions = monthlyLostAdmissions * 12;
  const benefitsAndFixed = inputs.baseSalary * (inputs.benefitsLoad / 100) + inputs.annualMileage * MILEAGE_RATE + inputs.otherFixedCosts;
  const fixedCost = inputs.baseSalary + benefitsAndFixed;
  const activeTier = tiers.find((tier) => monthlyAdmissions >= tier.min && monthlyAdmissions <= tier.max) ?? tiers[0];
  if (!activeTier) throw new Error("At least one commission tier is required");
  const monthlyCommission = monthlyAdmissions * activeTier.rate;
  const annualCommission = monthlyCommission * 12;
  const totalRepCost = fixedCost + annualCommission;
  const costPerCall = annualCalls > 0 ? fixedCost / annualCalls : 0;
  const costPerReferral = annualReferrals > 0 ? fixedCost / annualReferrals : 0;
  const costPerAdmit = annualAdmissions > 0 ? fixedCost / annualAdmissions : 0;
  const blendedCostPerAdmit = annualAdmissions > 0 ? totalRepCost / annualAdmissions : 0;
  const monthlyConversionLoss = monthlyLostAdmissions * costPerReferral;
  const annualConversionLoss = annualLostAdmissions * costPerReferral;

  return { annualCalls, monthlyCalls, monthlyReferrals, annualReferrals, monthlyAdmissions, annualAdmissions, monthlyLostAdmissions, annualLostAdmissions, benefitsAndFixed, fixedCost, activeTier, monthlyCommission, annualCommission, totalRepCost, costPerCall, costPerReferral, costPerAdmit, blendedCostPerAdmit, monthlyConversionLoss, annualConversionLoss };
}
