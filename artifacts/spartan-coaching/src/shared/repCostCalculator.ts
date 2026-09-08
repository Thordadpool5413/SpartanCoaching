export type RepCostInputs = {
  baseSalary: number;
  benefitsLoad: number;
  annualMileage: number;
  otherFixedCosts: number;
  callsPerDay: number;
  workingDaysPerMonth: number;
  callsPerReferral: number;
  conversionRate: number;
  /** Contribution retained by the hospice per admission after patient-care costs, before sales commission. */
  netContributionPerAdmission: number;
};

export type RepCommissionTier = { id: number; min: number; max: number; rate: number };

export const MILEAGE_RATE = 0.67;

function tierForMonthlyAdmissions(monthlyAdmissions: number, tiers: RepCommissionTier[]) {
  return tiers.find((tier) => monthlyAdmissions >= tier.min && monthlyAdmissions <= tier.max) ?? tiers[0];
}

function breakEvenAdmissions(
  fixedCost: number,
  netContributionPerAdmission: number,
  tiers: RepCommissionTier[],
  months: number,
): number | null {
  if (fixedCost <= 0) return 0;
  if (netContributionPerAdmission <= 0 || tiers.length === 0) return null;

  for (let admissions = 1; admissions <= 100_000; admissions += 1) {
    const monthlyVolume = admissions / months;
    const tier = tierForMonthlyAdmissions(monthlyVolume, tiers);
    if (!tier) return null;
    const contributionAfterCommission =
      admissions * (netContributionPerAdmission - tier.rate);
    if (contributionAfterCommission >= fixedCost) return admissions;
  }

  return null;
}

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
  const activeTier = tierForMonthlyAdmissions(monthlyAdmissions, tiers);
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
  const monthlyFixedCost = fixedCost / 12;
  const monthlyBreakEvenAdmissions = breakEvenAdmissions(
    monthlyFixedCost,
    inputs.netContributionPerAdmission,
    tiers,
    1,
  );
  const annualBreakEvenAdmissions = breakEvenAdmissions(
    fixedCost,
    inputs.netContributionPerAdmission,
    tiers,
    12,
  );
  const monthlyContributionAfterRepCost =
    monthlyAdmissions * inputs.netContributionPerAdmission - monthlyCommission - monthlyFixedCost;
  const annualContributionAfterRepCost = monthlyContributionAfterRepCost * 12;

  return { annualCalls, monthlyCalls, monthlyReferrals, annualReferrals, monthlyAdmissions, annualAdmissions, monthlyLostAdmissions, annualLostAdmissions, benefitsAndFixed, fixedCost, monthlyFixedCost, activeTier, monthlyCommission, annualCommission, totalRepCost, costPerCall, costPerReferral, costPerAdmit, blendedCostPerAdmit, monthlyConversionLoss, annualConversionLoss, monthlyBreakEvenAdmissions, annualBreakEvenAdmissions, monthlyContributionAfterRepCost, annualContributionAfterRepCost };
}
