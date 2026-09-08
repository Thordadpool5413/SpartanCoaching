/** Pure calculator engines — match website Hospice Sales Pro calculators. */

export function calculateActivityTargets(input: {
  repName: string;
  repStatus: "tenured" | "new_hire";
  monthlyGoal: number;
  lastCycleAdmissions: number;
  lastCycleConversations: number;
}) {
  const workdaysInMonth = 20;
  const workdaysPerWeek = 5;
  const bufferConversationsPerAdmission = 2;
  const teamBaseline = 15;

  let conversationsPerAdmission: number;
  let rateSource: string;

  if (input.repStatus === "tenured" && input.lastCycleAdmissions > 0) {
    conversationsPerAdmission = input.lastCycleConversations / input.lastCycleAdmissions;
    rateSource = "Personal history from last cycle";
  } else {
    conversationsPerAdmission = teamBaseline;
    rateSource = "Team baseline (no prior cycle data)";
  }

  const baseConversations = Math.ceil(input.monthlyGoal * conversationsPerAdmission);
  const bufferConversations = input.monthlyGoal * bufferConversationsPerAdmission;
  const targetConversationsMonth = baseConversations + bufferConversations;
  const targetConversationsWeek = Math.ceil(
    targetConversationsMonth / (workdaysInMonth / workdaysPerWeek),
  );
  const targetConversationsDay = Math.ceil(targetConversationsMonth / workdaysInMonth);

  const ramp = {
    week1: Math.ceil(targetConversationsWeek * 0.5),
    week2: Math.ceil(targetConversationsWeek * 0.7),
    week3: Math.ceil(targetConversationsWeek * 0.85),
    week4: Math.ceil(targetConversationsWeek * 1.0),
  };

  const name = input.repName.trim() || "This rep";
  const convPerAdmRounded = conversationsPerAdmission.toFixed(1);

  const plainEnglishPlan =
    `${name} needs ${targetConversationsMonth} referral source conversations this month to hit ${input.monthlyGoal} admissions. ` +
    `That is ${targetConversationsWeek}/week or about ${targetConversationsDay}/day across ${workdaysInMonth} workdays ` +
    `(${convPerAdmRounded} conversations per admission${input.repStatus === "tenured" ? " from last cycle" : " · team baseline"} + buffer).`;

  const plainEnglishRampPlan =
    input.repStatus === "new_hire"
      ? `Week 1: ${ramp.week1} · Week 2: ${ramp.week2} · Week 3: ${ramp.week3} · Week 4: ${ramp.week4} (full pace).`
      : "";

  return {
    conversationsPerAdmission,
    rateSource,
    baseConversations,
    bufferConversations,
    targetConversationsMonth,
    targetConversationsWeek,
    targetConversationsDay,
    ramp,
    plainEnglishPlan,
    plainEnglishRampPlan,
  };
}

export function calculateRoi(input: {
  reps: number;
  referralsPerRep: number;
  conversionPct: number;
  losDays: number;
  rppd: number;
  activityLiftPct?: number;
  conversionLiftPts?: number;
  losLiftPct?: number;
}) {
  const totalReferrals = input.reps * input.referralsPerRep;
  const conversionRate = input.conversionPct / 100;
  const monthlyAdmissions = totalReferrals * conversionRate;
  const revenuePerAdmission = input.losDays * input.rppd;
  const monthlyRevenue = monthlyAdmissions * revenuePerAdmission;
  const annualRevenue = monthlyRevenue * 12;

  const activityLiftPct = input.activityLiftPct ?? 40;
  const conversionLiftPts = input.conversionLiftPts ?? 15;
  const losLiftPct = input.losLiftPct ?? 25;
  const projectedReferrals = totalReferrals * (1 + activityLiftPct / 100);
  const projectedConversionRate = Math.min(input.conversionPct + conversionLiftPts, 95) / 100;
  const projectedAdmissions = projectedReferrals * projectedConversionRate;
  const projectedLos = input.losDays * (1 + losLiftPct / 100);
  const projectedRevenuePerAdmission = projectedLos * input.rppd;
  const projectedMonthlyRevenue = projectedAdmissions * projectedRevenuePerAdmission;
  const projectedAnnualRevenue = projectedMonthlyRevenue * 12;

  const additionalMonthlyRevenue = projectedMonthlyRevenue - monthlyRevenue;
  const additionalAnnualRevenue = projectedAnnualRevenue - annualRevenue;
  const revenueIncreasePercent =
    monthlyRevenue > 0 ? ((projectedMonthlyRevenue - monthlyRevenue) / monthlyRevenue) * 100 : 0;
  const additionalPatients = projectedAdmissions - monthlyAdmissions;

  return {
    totalReferrals,
    monthlyAdmissions,
    monthlyRevenue,
    annualRevenue,
    projectedMonthlyRevenue,
    projectedAnnualRevenue,
    additionalMonthlyRevenue,
    additionalAnnualRevenue,
    revenueIncreasePercent,
    additionalPatients,
    projectedReferrals,
    projectedConversionRate: projectedConversionRate * 100,
    projectedAdmissions,
    projectedLos,
    activityLiftPct,
    conversionLiftPts,
    losLiftPct,
  };
}

export const MILEAGE_RATE = 0.67;

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

export type CommissionTier = { id: number; min: number; max: number; rate: number };

function tierForMonthlyAdmissions(monthlyAdmissions: number, tiers: CommissionTier[]) {
  return tiers.find((tier) => monthlyAdmissions >= tier.min && monthlyAdmissions <= tier.max) ?? tiers[0];
}

function breakEvenAdmissions(
  fixedCost: number,
  netContributionPerAdmission: number,
  tiers: CommissionTier[],
  months: number,
): number | null {
  if (fixedCost <= 0) return 0;
  if (netContributionPerAdmission <= 0 || tiers.length === 0) return null;

  for (let admissions = 1; admissions <= 100_000; admissions += 1) {
    const tier = tierForMonthlyAdmissions(admissions / months, tiers);
    if (!tier) return null;
    if (admissions * (netContributionPerAdmission - tier.rate) >= fixedCost) {
      return admissions;
    }
  }
  return null;
}

export function calculateRepCost(inputs: RepCostInputs, tiers: CommissionTier[]) {
  const annualCalls = inputs.callsPerDay * inputs.workingDaysPerMonth * 12;
  const monthlyCalls = inputs.callsPerDay * inputs.workingDaysPerMonth;
  const monthlyReferrals = inputs.callsPerReferral > 0 ? monthlyCalls / inputs.callsPerReferral : 0;
  const annualReferrals = monthlyReferrals * 12;
  const monthlyAdmissions = monthlyReferrals * (inputs.conversionRate / 100);
  const annualAdmissions = monthlyAdmissions * 12;
  const monthlyLostAdmissions = Math.max(0, monthlyReferrals - monthlyAdmissions);
  const annualLostAdmissions = monthlyLostAdmissions * 12;
  const benefitsAndFixed =
    inputs.baseSalary * (inputs.benefitsLoad / 100) +
    inputs.annualMileage * MILEAGE_RATE +
    inputs.otherFixedCosts;
  const fixedCost = inputs.baseSalary + benefitsAndFixed;
  const activeTier = tierForMonthlyAdmissions(monthlyAdmissions, tiers);
  const monthlyCommission = monthlyAdmissions * (activeTier?.rate ?? 0);
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

  return {
    annualCalls,
    monthlyCalls,
    monthlyReferrals,
    annualReferrals,
    monthlyAdmissions,
    annualAdmissions,
    monthlyLostAdmissions,
    annualLostAdmissions,
    benefitsAndFixed,
    fixedCost,
    monthlyFixedCost,
    annualCommission,
    totalRepCost,
    costPerCall,
    costPerReferral,
    costPerAdmit,
    blendedCostPerAdmit,
    monthlyConversionLoss,
    annualConversionLoss,
    monthlyBreakEvenAdmissions,
    annualBreakEvenAdmissions,
    monthlyContributionAfterRepCost,
    annualContributionAfterRepCost,
    activeTier,
  };
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
