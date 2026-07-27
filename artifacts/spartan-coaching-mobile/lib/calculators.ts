/** Pure calculator engines — match website Field Kit calculators. */

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
}) {
  const totalReferrals = input.reps * input.referralsPerRep;
  const conversionRate = input.conversionPct / 100;
  const monthlyAdmissions = totalReferrals * conversionRate;
  const revenuePerAdmission = input.losDays * input.rppd;
  const monthlyRevenue = monthlyAdmissions * revenuePerAdmission;
  const annualRevenue = monthlyRevenue * 12;

  const projectedReferrals = totalReferrals * 1.4;
  const projectedConversionRate = Math.min(input.conversionPct + 15, 95) / 100;
  const projectedAdmissions = projectedReferrals * projectedConversionRate;
  const projectedLos = input.losDays * 1.25;
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
};

export type CommissionTier = { id: number; min: number; max: number; rate: number };

export function calculateRepCost(inputs: RepCostInputs, tiers: CommissionTier[]) {
  const annualCalls = inputs.callsPerDay * inputs.workingDaysPerMonth * 12;
  const monthlyCalls = inputs.callsPerDay * inputs.workingDaysPerMonth;
  const monthlyReferrals = inputs.callsPerReferral > 0 ? monthlyCalls / inputs.callsPerReferral : 0;
  const annualReferrals = monthlyReferrals * 12;
  const monthlyAdmissions = monthlyReferrals * (inputs.conversionRate / 100);
  const annualAdmissions = monthlyAdmissions * 12;
  const benefitsAndFixed =
    inputs.baseSalary * (inputs.benefitsLoad / 100) +
    inputs.annualMileage * MILEAGE_RATE +
    inputs.otherFixedCosts;
  const fixedCost = inputs.baseSalary + benefitsAndFixed;
  const activeTier =
    tiers.find((tier) => monthlyAdmissions >= tier.min && monthlyAdmissions <= tier.max) ??
    tiers[0];
  const monthlyCommission = monthlyAdmissions * (activeTier?.rate ?? 0);
  const annualCommission = monthlyCommission * 12;
  const totalRepCost = fixedCost + annualCommission;
  const costPerCall = annualCalls > 0 ? fixedCost / annualCalls : 0;
  const costPerReferral = annualReferrals > 0 ? fixedCost / annualReferrals : 0;
  const costPerAdmit = annualAdmissions > 0 ? fixedCost / annualAdmissions : 0;
  const blendedCostPerAdmit = annualAdmissions > 0 ? totalRepCost / annualAdmissions : 0;

  return {
    monthlyAdmissions,
    annualAdmissions,
    fixedCost,
    annualCommission,
    totalRepCost,
    costPerCall,
    costPerReferral,
    costPerAdmit,
    blendedCostPerAdmit,
    activeTier,
  };
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
