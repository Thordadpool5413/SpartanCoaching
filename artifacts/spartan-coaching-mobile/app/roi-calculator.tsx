import React, { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { calculateRoi, money } from "@/lib/calculators";
import { CalculatorField, CalculatorHero, CalculatorReportActions, CalculatorSection, DecisionBrief, MetricGrid, VisualScale } from "@/components/calculators/CalculatorExperience";

export default function RoiCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reps, setReps] = useState("3");
  const [referrals, setReferrals] = useState("15");
  const [conversion, setConversion] = useState("65");
  const [los, setLos] = useState("45");
  const [rppd, setRppd] = useState("200");
  const [activityLift, setActivityLift] = useState("15");
  const [conversionLift, setConversionLift] = useState("5");
  const [losLift, setLosLift] = useState("0");

  const result = useMemo(() => calculateRoi({
    reps: Math.max(1, Number(reps) || 1),
    referralsPerRep: Math.max(0, Number(referrals) || 0),
    conversionPct: Math.min(100, Math.max(0, Number(conversion) || 0)),
    losDays: Math.max(0, Number(los) || 0),
    rppd: Math.max(0, Number(rppd) || 0),
    activityLiftPct: Math.min(100, Math.max(0, Number(activityLift) || 0)),
    conversionLiftPts: Math.min(40, Math.max(0, Number(conversionLift) || 0)),
    losLiftPct: Math.min(100, Math.max(0, Number(losLift) || 0)),
  }), [reps, referrals, conversion, los, rppd, activityLift, conversionLift, losLift]);

  const summary = `${money(result.additionalAnnualRevenue)} modeled annual opportunity with ${result.additionalPatients.toFixed(1)} additional admissions per month.`;
  const report = [
    "Spartan Coaching ROI Scenario",
    `Current monthly referrals: ${result.totalReferrals.toFixed(0)}`,
    `Current monthly admissions: ${result.monthlyAdmissions.toFixed(1)}`,
    `Current annual revenue: ${money(result.annualRevenue)}`,
    `Activity improvement assumption: ${result.activityLiftPct}%`,
    `Conversion improvement assumption: ${result.conversionLiftPts} points`,
    `Length of stay improvement assumption: ${result.losLiftPct}%`,
    `Projected monthly admissions: ${result.projectedAdmissions.toFixed(1)}`,
    `Projected annual revenue: ${money(result.projectedAnnualRevenue)}`,
    `Modeled annual opportunity: ${money(result.additionalAnnualRevenue)}`,
    "Scenario model only. Results are not guaranteed. Validate assumptions with finance, operations, and compliance.",
  ].join("\n");

  return <>
    <Stack.Screen options={{ title: "ROI Scenario", headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground }} />
    <ScrollView style={{ backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" testID="roi-calculator-workspace">
      <CalculatorHero icon="trending-up" eyebrow="GROWTH ECONOMICS" title="Build a business case you can defend." body="Compare the current run rate with an adjustable improvement scenario. Every assumption stays visible, editable, and shareable." />

      <CalculatorSection eyebrow="01 · CURRENT PERFORMANCE" title="Set the baseline" body="Use the same definitions your finance and operations teams use so the conversation starts from one source of truth.">
        <CalculatorField label="Sales representatives" value={reps} onChangeText={setReps} suffix="reps" />
        <CalculatorField label="Monthly referrals per rep" value={referrals} onChangeText={setReferrals} suffix="referrals" />
        <CalculatorField label="Current conversion rate" value={conversion} onChangeText={setConversion} suffix="%" />
        <CalculatorField label="Average length of stay" value={los} onChangeText={setLos} suffix="days" />
        <CalculatorField label="Revenue per patient day" value={rppd} onChangeText={setRppd} prefix="$" />
      </CalculatorSection>

      <CalculatorSection eyebrow="02 · IMPROVEMENT SCENARIO" title="Control the assumptions" body="Nothing is hidden. Change the activity, conversion, and length of stay assumptions independently.">
        <CalculatorField label="Referral activity improvement" value={activityLift} onChangeText={setActivityLift} suffix="%" testID="input-activity-lift" />
        <CalculatorField label="Conversion improvement" value={conversionLift} onChangeText={setConversionLift} suffix="points" testID="input-conversion-lift" />
        <CalculatorField label="Length of stay improvement" value={losLift} onChangeText={setLosLift} suffix="%" testID="input-los-lift" />
      </CalculatorSection>

      <CalculatorSection eyebrow="03 · ECONOMIC IMPACT" title="Current versus modeled performance">
        <MetricGrid metrics={[
          { label: "Annual opportunity", value: money(result.additionalAnnualRevenue), detail: "Modeled difference", emphasis: true },
          { label: "Current annual revenue", value: money(result.annualRevenue), detail: `${result.monthlyAdmissions.toFixed(1)} admits monthly` },
          { label: "Modeled annual revenue", value: money(result.projectedAnnualRevenue), detail: `${result.projectedAdmissions.toFixed(1)} admits monthly` },
          { label: "Revenue lift", value: `${result.revenueIncreasePercent.toFixed(1)}%`, detail: `${result.additionalPatients.toFixed(1)} added admits monthly` },
        ]} />
        <VisualScale label="Current admissions" value={result.monthlyAdmissions} max={Math.max(result.projectedAdmissions, 1)} caption={result.monthlyAdmissions.toFixed(1)} />
        <VisualScale label="Modeled admissions" value={result.projectedAdmissions} max={Math.max(result.projectedAdmissions, 1)} caption={result.projectedAdmissions.toFixed(1)} />
      </CalculatorSection>

      <DecisionBrief title="Leadership brief" interpretation={`The modeled scenario moves monthly admissions from ${result.monthlyAdmissions.toFixed(1)} to ${result.projectedAdmissions.toFixed(1)} and creates a potential annual revenue difference of ${money(result.additionalAnnualRevenue)}. The outcome is driven by the three assumptions above, not by a guaranteed coaching result.`} actions={["Confirm the baseline with finance before presenting the scenario.", "Choose one improvement assumption the team can measure over the next 30 days.", "Review the model monthly and replace estimates with actual performance."]} caution="Revenue varies by region, level of care, payer mix, eligibility, timing, and operating execution. This is a planning model, not financial advice or a performance promise." />
      <CalculatorReportActions kind="roi" title="ROI Scenario" summary={summary} report={report} />
    </ScrollView>
  </>;
}
