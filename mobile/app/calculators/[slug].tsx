import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { sharePdfDocument } from "@/components/export-document";
import { Card, EmptyState, Field, MetricCard, Pill, PrimaryButton, PressableCard, ScreenScrollView, SectionHeader, SecondaryButton, RowItem } from "@/components/ui";
import { api, apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatPercent, slugToLabel } from "@/lib/format";
import { DEFAULT_BRANCH_INPUTS, BRANCH_PRESETS, type BranchInputs } from "@/lib/branch";
import { CALCULATOR_DEFINITIONS, type CalculatorSlug } from "@/lib/workflows";
import { recordActivity, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

type ActivityCalculatorResult = {
  repName: string;
  repStatus: "tenured" | "new_hire";
  monthlyGoal: number;
  conversationsPerAdmission: number;
  rateSource: string;
  baseConversations: number;
  bufferConversations: number;
  targetConversationsMonth: number;
  targetConversationsWeek: number;
  targetConversationsDay: number;
  rampWeek1: number;
  rampWeek2: number;
  rampWeek3: number;
  rampWeek4: number;
  plainEnglishPlan: string;
  plainEnglishRampPlan: string;
};

type BranchResults = {
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
    requiredStaffing: Array<{ role: string; fte: number; salary: number; annualCost: number }>;
    runwayMonths: Array<{
      month: number;
      avgADC: number;
      monthlyRevenue: number;
      monthlyVariableCost: number;
      monthlyPayroll: number;
      monthlyOverhead: number;
      monthlyProfitLoss: number;
      cumulativeCash: number;
    }>;
    admissionsReferenceTable: Array<{
      targetADC: number;
      display: { monthlyAdmissionsNeeded: string; weeklyAdmissionsNeeded: string };
    }>;
  };
  narrative: {
    status: string;
    monthsOfRunway: number;
    monthCashFlowTurnsPositive: number;
    cashAtMonth12: number;
  };
  metadata: {
    formulaVersion: string;
    contentVersion: string;
    fiscalYear: string;
    calculationTimestamp: string;
  };
  paymentContent: {
    fiscalYear: string;
    rhcDay1To60: number;
    rhcDay61Plus: number;
    fy2026UpdatePercent: number;
  };
};

type RoiDraft = {
  reps: number;
  referralsPerRep: number;
  currentConversion: number;
  projectedConversion: number;
  averageLengthOfStay: number;
  perDiemRate: number;
  monthlyProgramCost: number;
  setupCost: number;
};

type ActivityDraft = {
  repName: string;
  repStatus: "tenured" | "new_hire";
  monthlyGoal: number;
  lastCycleAdmissions: number;
  lastCycleConversations: number;
};

type CalculatorWorkspace = {
  [key: string]: RoiDraft | ActivityDraft | BranchInputs;
};

const initialRoiDraft: RoiDraft = {
  reps: 3,
  referralsPerRep: 15,
  currentConversion: 65,
  projectedConversion: 80,
  averageLengthOfStay: 45,
  perDiemRate: 200,
  monthlyProgramCost: 5000,
  setupCost: 10000,
};

const initialActivityDraft: ActivityDraft = {
  repName: "",
  repStatus: "tenured",
  monthlyGoal: 8,
  lastCycleAdmissions: 6,
  lastCycleConversations: 90,
};

function calculateActivity(draft: ActivityDraft): ActivityCalculatorResult {
  const workdaysInMonth = 20;
  const workdaysPerWeek = 5;
  const bufferConversationsPerAdmission = 2;
  const teamBaselineConversationsPerAdmission = 15;
  const rampWeek1 = 0.5;
  const rampWeek2 = 0.7;
  const rampWeek3 = 0.85;
  const rampWeek4 = 1;

  const conversationsPerAdmission =
    draft.repStatus === "tenured" && draft.lastCycleAdmissions > 0
      ? draft.lastCycleConversations / draft.lastCycleAdmissions
      : teamBaselineConversationsPerAdmission;

  const baseConversations = Math.ceil(draft.monthlyGoal * conversationsPerAdmission);
  const bufferConversations = draft.monthlyGoal * bufferConversationsPerAdmission;
  const targetConversationsMonth = baseConversations + bufferConversations;
  const targetConversationsWeek = Math.ceil(targetConversationsMonth / (workdaysInMonth / workdaysPerWeek));
  const targetConversationsDay = Math.ceil(targetConversationsMonth / workdaysInMonth);
  const targetConversationsWeek1 = Math.ceil(targetConversationsWeek * rampWeek1);
  const targetConversationsWeek2 = Math.ceil(targetConversationsWeek * rampWeek2);
  const targetConversationsWeek3 = Math.ceil(targetConversationsWeek * rampWeek3);
  const targetConversationsWeek4 = Math.ceil(targetConversationsWeek * rampWeek4);

  const rateSource =
    draft.repStatus === "tenured" && draft.lastCycleAdmissions > 0
      ? "Personal history from last cycle"
      : "Team baseline (no prior cycle data)";

  const plainEnglishPlan =
    `${draft.repName || "This rep"} needs ${targetConversationsMonth} referral source conversations this month to hit ${draft.monthlyGoal} admissions. ` +
    `That works out to ${targetConversationsWeek} conversations per week, or about ${targetConversationsDay} per day across ${workdaysInMonth} workdays. ` +
    `This is based on a rate of ${conversationsPerAdmission.toFixed(1)} conversations per admission${draft.repStatus === "tenured" ? " from last cycle" : " (team baseline)"}, plus a buffer of ${bufferConversations} extra conversations to account for variability.`;

  const plainEnglishRampPlan =
    draft.repStatus === "new_hire"
      ? `Week 1: ${targetConversationsWeek1} conversations (50% ramp). Week 2: ${targetConversationsWeek2} conversations (70% ramp). Week 3: ${targetConversationsWeek3} conversations (85% ramp). Week 4: ${targetConversationsWeek4} conversations (full pace).`
      : "";

  return {
    repName: draft.repName,
    repStatus: draft.repStatus,
    monthlyGoal: draft.monthlyGoal,
    conversationsPerAdmission,
    rateSource,
    baseConversations,
    bufferConversations,
    targetConversationsMonth,
    targetConversationsWeek,
    targetConversationsDay,
    rampWeek1: targetConversationsWeek1,
    rampWeek2: targetConversationsWeek2,
    rampWeek3: targetConversationsWeek3,
    rampWeek4: targetConversationsWeek4,
    plainEnglishPlan,
    plainEnglishRampPlan,
  };
}

function calculateRoi(draft: RoiDraft) {
  const totalReferrals = draft.reps * draft.referralsPerRep;
  const currentMonthlyAdmissions = totalReferrals * (draft.currentConversion / 100);
  const projectedMonthlyAdmissions = totalReferrals * (draft.projectedConversion / 100);
  const revenuePerAdmission = draft.averageLengthOfStay * draft.perDiemRate;
  const currentMonthlyRevenue = currentMonthlyAdmissions * revenuePerAdmission;
  const projectedMonthlyRevenue = projectedMonthlyAdmissions * revenuePerAdmission;
  const additionalMonthlyRevenue = projectedMonthlyRevenue - currentMonthlyRevenue;
  const annualLift = additionalMonthlyRevenue * 12;
  const annualCost = draft.monthlyProgramCost * 12 + draft.setupCost;
  const netGain = annualLift - annualCost;
  const roiPercent = annualCost > 0 ? (netGain / annualCost) * 100 : 0;
  const paybackMonths = additionalMonthlyRevenue > 0 ? annualCost / additionalMonthlyRevenue : Infinity;

  return {
    totalReferrals,
    currentMonthlyAdmissions,
    projectedMonthlyAdmissions,
    revenuePerAdmission,
    currentMonthlyRevenue,
    projectedMonthlyRevenue,
    additionalMonthlyRevenue,
    annualLift,
    annualCost,
    netGain,
    roiPercent,
    paybackMonths,
  };
}

export default function CalculatorScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slugValue = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? "";
  const slug = slugValue as CalculatorSlug;
  const definition = CALCULATOR_DEFINITIONS[slug];
  const [drafts, setDrafts] = useStoredJson<CalculatorWorkspace>(STORAGE_KEYS.calculatorDrafts, {});
  const [result, setResult] = useState<ActivityCalculatorResult | RoiDraft | BranchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = useMemo(() => {
    if (slug === "roi") {
      return (drafts[slugValue] as RoiDraft | undefined) ?? initialRoiDraft;
    }
    if (slug === "activity") {
      return (drafts[slugValue] as ActivityDraft | undefined) ?? initialActivityDraft;
    }
    return (drafts[slugValue] as BranchInputs | undefined) ?? DEFAULT_BRANCH_INPUTS;
  }, [drafts, slug, slugValue]);
  const roiDraft = draft as RoiDraft;
  const activityDraft = draft as ActivityDraft;
  const branchDraft = draft as BranchInputs;

  const title = definition?.title ?? slugToLabel(slugValue);
  const summary = definition?.summary ?? "Fast native calculations for the field.";
  const resultLabel = definition?.resultLabel ?? "Result";
  const roiResult = slug === "roi" && result ? (result as unknown as ReturnType<typeof calculateRoi>) : null;
  const activityResult = slug === "activity" && result ? (result as ActivityCalculatorResult) : null;
  const branchResult = slug === "branch-profitability" && result ? (result as unknown as BranchResults) : null;

  function updateDraft(patch: Record<string, unknown>) {
    setDrafts({
      ...drafts,
      [slugValue]: {
        ...draft,
        ...patch,
      },
    });
  }

  function setBranchPreset(presetKey: keyof typeof BRANCH_PRESETS) {
    if (slug !== "branch-profitability") return;
    const preset = BRANCH_PRESETS[presetKey];
    setDrafts({
      ...drafts,
      [slugValue]: {
        ...branchDraft,
        scenarioPreset: presetKey,
        ...preset.inputs,
      },
    });
  }

  const canRun = useMemo(() => {
    switch (slug) {
      case "roi":
        return roiDraft.reps > 0 && roiDraft.referralsPerRep > 0 && roiDraft.averageLengthOfStay > 0 && roiDraft.perDiemRate > 0;
      case "activity":
        return activityDraft.monthlyGoal > 0;
      case "branch-profitability":
        return Number.isFinite(branchDraft.targetADC) && branchDraft.targetADC > 0;
      default:
        return false;
    }
  }, [draft, slug]);

  async function handleRun() {
    if (!definition || !canRun || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (slug === "roi") {
        const next = calculateRoi(draft as RoiDraft);
        setResult(next as any);
        recordActivity({
          title: "Ran ROI calculator",
          subtitle: definition.title,
          kind: "calculator",
        });
        return;
      }

      if (slug === "activity") {
        const next = calculateActivity(draft as ActivityDraft);
        setResult(next as any);
        recordActivity({
          title: "Ran activity calculator",
          subtitle: definition.title,
          kind: "calculator",
        });
        return;
      }

      const response = await api.calculateBranchProfitability(draft as Record<string, unknown>);
      setResult(response as BranchResults);
      recordActivity({
        title: "Ran branch profitability calculator",
        subtitle: definition.title,
        kind: "calculator",
      });
    } catch (runError) {
      setError(apiErrorMessage(runError, "Unable to run the calculator right now."));
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!definition || !result) return;

    if (slug === "roi") {
      const roi = roiResult;
      if (!roi) return;
      await sharePdfDocument({
        title: definition.exportTitle,
        subtitle: definition.exportSubtitle,
        sections: [
          {
            heading: "Inputs",
            body: [
              `Reps: ${(draft as RoiDraft).reps}`,
              `Referrals per rep: ${(draft as RoiDraft).referralsPerRep}`,
              `Current conversion: ${(draft as RoiDraft).currentConversion}%`,
              `Projected conversion: ${(draft as RoiDraft).projectedConversion}%`,
            ],
          },
          {
            heading: "Results",
            body: [
              `Current monthly revenue: ${formatCurrency(roi.currentMonthlyRevenue)}`,
              `Projected monthly revenue: ${formatCurrency(roi.projectedMonthlyRevenue)}`,
              `Additional monthly revenue: ${formatCurrency(roi.additionalMonthlyRevenue)}`,
              `Annual lift: ${formatCurrency(roi.annualLift)}`,
              `Net gain after cost: ${formatCurrency(roi.netGain)}`,
              `ROI: ${formatPercent(roi.roiPercent)}`,
            ],
          },
        ],
      });
    } else if (slug === "activity") {
      const activity = activityResult;
      if (!activity) return;
      await sharePdfDocument({
        title: definition.exportTitle,
        subtitle: definition.exportSubtitle,
        sections: [
          {
            heading: "Inputs",
            body: [
              `Rep: ${activity.repName || "Not specified"}`,
              `Status: ${activity.repStatus === "tenured" ? "Tenured rep" : "New hire"}`,
              `Monthly goal: ${activity.monthlyGoal}`,
            ],
          },
          {
            heading: "Results",
            body: [
              `Monthly conversations: ${activity.targetConversationsMonth}`,
              `Weekly conversations: ${activity.targetConversationsWeek}`,
              `Daily conversations: ${activity.targetConversationsDay}`,
              `Conversations per admission: ${activity.conversationsPerAdmission.toFixed(1)}`,
              `Rate source: ${activity.rateSource}`,
            ],
          },
        ],
      });
    } else {
      const branch = branchResult;
      if (!branch) return;
      await sharePdfDocument({
        title: definition.exportTitle,
        subtitle: definition.exportSubtitle,
        sections: [
          {
            heading: "Key outputs",
            body: [
              `Annual revenue: ${branch.display.annualRevenue}`,
              `Annual profit: ${branch.display.annualProfit}`,
              `Operating margin: ${branch.display.operatingMarginPercent}`,
              `Break-even ADC: ${branch.display.breakEvenADC}`,
              `Target margin ADC: ${branch.display.targetMarginADC}`,
            ],
          },
          {
            heading: "Runway",
            body: [
              `Months of runway: ${branch.narrative.monthsOfRunway}`,
              `Month cash-flow positive: ${branch.narrative.monthCashFlowTurnsPositive > 0 ? `Month ${branch.narrative.monthCashFlowTurnsPositive}` : "Not within 18 months"}`,
              `Cash at month 12: ${formatCurrency(branch.narrative.cashAtMonth12)}`,
            ],
          },
        ],
      });
    }

    recordActivity({
      title: `Shared ${title}`,
      subtitle: definition.title,
      kind: "calculator",
    });
  }

  if (!definition) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Calculator unavailable" body={`We do not have a calculator for "${slugToLabel(slugValue)}" yet.`} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 120 }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="warning">{definition.kicker}</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {summary}
        </Text>
      </View>

      {slug === "roi" ? (
        <Card>
          <SectionHeader title="Inputs" subtitle="Estimate revenue lift from coaching or process improvement." />
          <View style={{ gap: spacing.md }}>
            <Field label="Reps" keyboardType="numeric" value={String((draft as RoiDraft).reps)} onChangeText={(value) => updateDraft({ reps: Number(value || 0) })} />
            <Field label="Monthly referrals per rep" keyboardType="numeric" value={String((draft as RoiDraft).referralsPerRep)} onChangeText={(value) => updateDraft({ referralsPerRep: Number(value || 0) })} />
            <Field label="Current conversion %" keyboardType="numeric" value={String((draft as RoiDraft).currentConversion)} onChangeText={(value) => updateDraft({ currentConversion: Number(value || 0) })} />
            <Field label="Projected conversion %" keyboardType="numeric" value={String((draft as RoiDraft).projectedConversion)} onChangeText={(value) => updateDraft({ projectedConversion: Number(value || 0) })} />
            <Field label="Average length of stay" keyboardType="numeric" value={String((draft as RoiDraft).averageLengthOfStay)} onChangeText={(value) => updateDraft({ averageLengthOfStay: Number(value || 0) })} />
            <Field label="Per diem rate" keyboardType="numeric" value={String((draft as RoiDraft).perDiemRate)} onChangeText={(value) => updateDraft({ perDiemRate: Number(value || 0) })} />
            <Field label="Monthly program cost" keyboardType="numeric" value={String((draft as RoiDraft).monthlyProgramCost)} onChangeText={(value) => updateDraft({ monthlyProgramCost: Number(value || 0) })} />
            <Field label="One-time setup cost" keyboardType="numeric" value={String((draft as RoiDraft).setupCost)} onChangeText={(value) => updateDraft({ setupCost: Number(value || 0) })} />
          </View>
        </Card>
      ) : null}

      {slug === "activity" ? (
        <Card>
          <SectionHeader title="Inputs" subtitle="Turn a monthly admissions goal into a daily cadence." />
          <View style={{ gap: spacing.md }}>
            <Field label="Rep name" value={(draft as ActivityDraft).repName} onChangeText={(repName) => updateDraft({ repName })} placeholder="Optional" />
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Rep status</Text>
              <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                {(["tenured", "new_hire"] as const).map((repStatus) => (
                  <PressableCard
                    key={repStatus}
                    onPress={() => updateDraft({ repStatus })}
                    style={{ borderColor: (draft as ActivityDraft).repStatus === repStatus ? colors.accent : colors.border }}
                  >
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>
                      {repStatus === "tenured" ? "Tenured rep" : "New hire"}
                    </Text>
                  </PressableCard>
                ))}
              </View>
            </View>
            <Field label="Monthly admission goal" keyboardType="numeric" value={String((draft as ActivityDraft).monthlyGoal)} onChangeText={(value) => updateDraft({ monthlyGoal: Number(value || 0) })} />
            <Field label="Last cycle admissions" keyboardType="numeric" value={String((draft as ActivityDraft).lastCycleAdmissions)} onChangeText={(value) => updateDraft({ lastCycleAdmissions: Number(value || 0) })} />
            <Field label="Last cycle conversations" keyboardType="numeric" value={String((draft as ActivityDraft).lastCycleConversations)} onChangeText={(value) => updateDraft({ lastCycleConversations: Number(value || 0) })} />
          </View>
        </Card>
      ) : null}

      {slug === "branch-profitability" ? (
        <>
          <Card>
            <SectionHeader title="Scenario preset" subtitle="Load a starting point and then tune the model." />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {(["lean", "base", "highAcuity"] as const).map((presetKey) => (
                <PressableCard
                  key={presetKey}
                  onPress={() => setBranchPreset(presetKey)}
                  style={{ borderColor: (draft as BranchInputs).scenarioPreset === presetKey ? colors.accent : colors.border }}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{BRANCH_PRESETS[presetKey].label}</Text>
                </PressableCard>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Inputs" subtitle="The backend branch engine still owns the math." />
            <View style={{ gap: spacing.md }}>
              <Field label="Target ADC" keyboardType="numeric" value={String((draft as BranchInputs).targetADC)} onChangeText={(value) => updateDraft({ targetADC: Number(value || 0) })} />
              <Field label="Average length of stay" keyboardType="numeric" value={String((draft as BranchInputs).avgLengthOfStayDays)} onChangeText={(value) => updateDraft({ avgLengthOfStayDays: Number(value || 0) })} />
              <Field label="Target operating margin %" keyboardType="numeric" value={String((draft as BranchInputs).targetOperatingMarginPercent)} onChangeText={(value) => updateDraft({ targetOperatingMarginPercent: Number(value || 0) })} />
              <Field label="RHC Day 1-60" keyboardType="numeric" value={String((draft as BranchInputs).rhcDay1To60)} onChangeText={(value) => updateDraft({ rhcDay1To60: Number(value || 0) })} />
              <Field label="RHC Day 61+" keyboardType="numeric" value={String((draft as BranchInputs).rhcDay61Plus)} onChangeText={(value) => updateDraft({ rhcDay61Plus: Number(value || 0) })} />
              <Field label="Pharmacy per day" keyboardType="numeric" value={String((draft as BranchInputs).pharmacyPerDay)} onChangeText={(value) => updateDraft({ pharmacyPerDay: Number(value || 0) })} />
              <Field label="DME per day" keyboardType="numeric" value={String((draft as BranchInputs).dmePerDay)} onChangeText={(value) => updateDraft({ dmePerDay: Number(value || 0) })} />
              <Field label="Supplies per day" keyboardType="numeric" value={String((draft as BranchInputs).suppliesPerDay)} onChangeText={(value) => updateDraft({ suppliesPerDay: Number(value || 0) })} />
              <Field label="Travel per day" keyboardType="numeric" value={String((draft as BranchInputs).travelPerDay)} onChangeText={(value) => updateDraft({ travelPerDay: Number(value || 0) })} />
              <Field label="Other per day" keyboardType="numeric" value={String((draft as BranchInputs).otherPerDay)} onChangeText={(value) => updateDraft({ otherPerDay: Number(value || 0) })} />
              <Field label="Monthly non-payroll overhead" keyboardType="numeric" value={String((draft as BranchInputs).monthlyNonPayrollOverhead)} onChangeText={(value) => updateDraft({ monthlyNonPayrollOverhead: Number(value || 0) })} />
              <Field label="Starting capital" keyboardType="numeric" value={String((draft as BranchInputs).startingCapital)} onChangeText={(value) => updateDraft({ startingCapital: Number(value || 0) })} />
              <Field label="Admissions per marketer per month" keyboardType="numeric" value={String((draft as BranchInputs).admissionsPerMarketerPerMonth)} onChangeText={(value) => updateDraft({ admissionsPerMarketerPerMonth: Number(value || 0) })} />
            </View>
          </Card>
        </>
      ) : null}

      {error ? <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text> : null}

      <Card>
        <SectionHeader title="Run" subtitle="Generate the live result from the current inputs." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <PrimaryButton title={loading ? "Running..." : "Run calculator"} loading={loading} disabled={!canRun} onPress={handleRun} />
          {result ? <SecondaryButton title="Share PDF" onPress={handleShare} /> : null}
        </View>
      </Card>

      {slug === "roi" && result ? (
        <Card>
          <SectionHeader title="Results" subtitle="Revenue lift and return on the investment." />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <MetricCard label="Current Revenue" value={formatCurrency(roiResult?.currentMonthlyRevenue ?? 0)} tone="neutral" />
            <MetricCard label="Projected Revenue" value={formatCurrency(roiResult?.projectedMonthlyRevenue ?? 0)} tone="good" />
            <MetricCard label="Additional / Month" value={formatCurrency(roiResult?.additionalMonthlyRevenue ?? 0)} tone="accent" />
            <MetricCard label="ROI" value={formatPercent(roiResult?.roiPercent ?? 0)} tone="warning" />
          </View>
          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <RowItem label="Annual lift" value={formatCurrency(roiResult?.annualLift ?? 0)} detail="Projected annual revenue increase" />
            <RowItem label="Annual cost" value={formatCurrency(roiResult?.annualCost ?? 0)} detail="Monthly program cost plus setup" />
            <RowItem label="Net gain" value={formatCurrency(roiResult?.netGain ?? 0)} detail="Annual lift minus cost" />
            <RowItem
              label="Payback"
              value={roiResult && Number.isFinite(roiResult.paybackMonths) ? `${roiResult.paybackMonths.toFixed(1)} mo` : "n/a"}
              detail="Months to recoup the cost"
            />
          </View>
        </Card>
      ) : null}

      {slug === "activity" && activityResult ? (
        <Card>
          <SectionHeader title="Results" subtitle="Daily and weekly conversation targets." />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <MetricCard label="Monthly" value={String(activityResult.targetConversationsMonth)} tone="accent" />
            <MetricCard label="Weekly" value={String(activityResult.targetConversationsWeek)} tone="good" />
            <MetricCard label="Daily" value={String(activityResult.targetConversationsDay)} tone="warning" />
            <MetricCard label="Conv / Adm" value={activityResult.conversationsPerAdmission.toFixed(1)} tone="neutral" />
          </View>
          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
              {activityResult.plainEnglishPlan}
            </Text>
            {activityResult.plainEnglishRampPlan ? (
              <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
                {activityResult.plainEnglishRampPlan}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <Pill tone="neutral">{activityResult.rateSource}</Pill>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {[
                { label: "Week 1", value: activityResult.rampWeek1 },
                { label: "Week 2", value: activityResult.rampWeek2 },
                { label: "Week 3", value: activityResult.rampWeek3 },
                { label: "Week 4", value: activityResult.rampWeek4 },
              ].map((item) => (
                <View key={item.label} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{item.label}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>{item.value} conversations</Text>
                  </View>
                  <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.surfaceAlt, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (item.value / (activityResult.targetConversationsWeek || 1)) * 100)}%`,
                        backgroundColor: colors.accent,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      {slug === "branch-profitability" && branchResult ? (
        <View style={{ gap: spacing.lg }}>
          <Card>
            <SectionHeader title="Overview" subtitle="The branch engine’s live output." />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <Pill tone={branchResult.narrative.status === "at-target" ? "good" : branchResult.narrative.status === "profitable-below-target" ? "warning" : "danger"}>
                {branchResult.narrative.status}
              </Pill>
              <Pill tone="neutral">{branchResult.metadata.fiscalYear}</Pill>
              <Pill tone="neutral">{branchResult.metadata.formulaVersion}</Pill>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <MetricCard label="Annual Revenue" value={branchResult.display.annualRevenue} tone="good" />
              <MetricCard label="Annual Profit" value={branchResult.display.annualProfit} tone="accent" />
              <MetricCard label="Margin" value={branchResult.display.operatingMarginPercent} tone="warning" />
              <MetricCard label="Break-even ADC" value={branchResult.display.breakEvenADC} tone="neutral" />
            </View>
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              <RowItem label="Target ADC" value={String((draft as BranchInputs).targetADC)} detail="Current model input" />
              <RowItem label="Target margin ADC" value={branchResult.display.targetMarginADC} detail="ADC required to hit target margin" />
              <RowItem label="Monthly admissions" value={branchResult.display.monthlyAdmissionsNeeded} detail="Admissions required at the current LOS" />
              <RowItem label="Weekly admissions" value={branchResult.display.weeklyAdmissionsNeeded} detail="Week-by-week pace" />
              <RowItem label="Marketers needed" value={branchResult.display.marketersNeeded} detail="Based on the admissions per marketer input" />
            </View>
          </Card>

          <Card>
            <SectionHeader title="Staffing" subtitle="Required staffing at the current ADC." />
            <View style={{ gap: spacing.sm }}>
              {branchResult.tables.requiredStaffing.map((row) => (
                <Card key={row.role} style={{ padding: spacing.md }}>
                  <RowItem label={row.role} value={`${row.fte} FTE`} detail={`Salary ${formatCurrency(row.salary)} · Annual cost ${formatCurrency(row.annualCost)}`} />
                </Card>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Runway" subtitle="Eighteen months of ramped cash-flow projections." />
            <View style={{ gap: spacing.sm }}>
              {branchResult.tables.runwayMonths.slice(0, 6).map((month) => (
                <Card key={month.month} style={{ padding: spacing.md }}>
                  <RowItem label={`Month ${month.month}`} value={formatCurrency(month.cumulativeCash)} detail={`PnL ${formatCurrency(month.monthlyProfitLoss)} · ADC ${month.avgADC.toFixed(1)}`} />
                </Card>
              ))}
              <RowItem label="Months of runway" value={String(branchResult.narrative.monthsOfRunway)} detail="Before cash runs out" />
              <RowItem
                label="Cash at month 12"
                value={formatCurrency(branchResult.narrative.cashAtMonth12)}
                detail={String(branchResult.narrative.monthCashFlowTurnsPositive > 0 ? `Positive in month ${branchResult.narrative.monthCashFlowTurnsPositive}` : "Not positive within 18 months")}
              />
            </View>
          </Card>

          <Card>
            <SectionHeader title="Admissions reference" subtitle="Standard checkpoint values from the live engine." />
            <View style={{ gap: spacing.sm }}>
              {branchResult.tables.admissionsReferenceTable.map((row) => (
                <RowItem
                  key={row.targetADC}
                  label={`ADC ${row.targetADC}`}
                  value={`${row.display.monthlyAdmissionsNeeded} / mo`}
                  detail={`${row.display.weeklyAdmissionsNeeded} / wk`}
                />
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Payment content" subtitle="The rate card values returned by the engine." />
            <View style={{ gap: spacing.sm }}>
              <RowItem label="Fiscal year" value={branchResult.paymentContent.fiscalYear} detail="CMS payment content version" />
              <RowItem label="RHC Day 1-60" value={formatCurrency(branchResult.paymentContent.rhcDay1To60)} detail="National base rate" />
              <RowItem label="RHC Day 61+" value={formatCurrency(branchResult.paymentContent.rhcDay61Plus)} detail="National base rate" />
              <RowItem label="FY2026 update" value={formatPercent(branchResult.paymentContent.fy2026UpdatePercent)} detail="Rate change context" />
            </View>
          </Card>
        </View>
      ) : null}

      {result ? (
      <Card>
        <SectionHeader title={`Share ${resultLabel}`} subtitle="Export the current result as a PDF summary." />
        <SecondaryButton title="Share PDF" onPress={handleShare} />
      </Card>
      ) : null}

      {slug === "branch-profitability" ? (
        <Card>
          <SectionHeader title="Tip" subtitle="The branch engine is source-of-truth math. The mobile app only owns the UI and transport." />
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            The native screen uses the existing backend route so future changes to the math do not need a new mobile release.
          </Text>
        </Card>
      ) : null}
    </ScreenScrollView>
  );
}
