import React, { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { calculateActivityTargets } from "@/lib/calculators";
import {
  CalculatorField,
  CalculatorHero,
  CalculatorReportActions,
  CalculatorSection,
  CalculatorSegmented,
  DecisionBrief,
  MetricGrid,
  VisualScale,
} from "@/components/calculators/CalculatorExperience";

export default function ActivityCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [repName, setRepName] = useState("");
  const [repStatus, setRepStatus] = useState<"tenured" | "new_hire">("tenured");
  const [monthlyGoal, setMonthlyGoal] = useState("8");
  const [lastAdmits, setLastAdmits] = useState("6");
  const [lastConvos, setLastConvos] = useState("90");
  const [actualWeek, setActualWeek] = useState("0");

  const result = useMemo(() => calculateActivityTargets({
    repName,
    repStatus,
    monthlyGoal: Math.max(0, Number(monthlyGoal) || 0),
    lastCycleAdmissions: Math.max(0, Number(lastAdmits) || 0),
    lastCycleConversations: Math.max(0, Number(lastConvos) || 0),
  }), [repName, repStatus, monthlyGoal, lastAdmits, lastConvos]);

  const weeklyActual = Math.max(0, Number(actualWeek) || 0);
  const pace = result.targetConversationsWeek > 0 ? weeklyActual / result.targetConversationsWeek : 0;
  const paceLabel = weeklyActual === 0 ? "Add this week’s actual conversations to see pace" : pace >= 1 ? "On pace or ahead" : `${Math.max(0, result.targetConversationsWeek - weeklyActual)} conversations remain this week`;
  const summary = `${result.targetConversationsDay} conversations per day, ${result.targetConversationsWeek} per week, and ${result.targetConversationsMonth} per month.`;
  const report = [
    "Spartan Coaching Activity Plan",
    repName.trim() ? `Rep: ${repName.trim()}` : null,
    `Monthly admission goal: ${monthlyGoal}`,
    `Daily conversations: ${result.targetConversationsDay}`,
    `Weekly conversations: ${result.targetConversationsWeek}`,
    `Monthly conversations: ${result.targetConversationsMonth}`,
    `Model source: ${result.rateSource}`,
    weeklyActual ? `Current week: ${weeklyActual} conversations. ${paceLabel}.` : null,
    result.plainEnglishRampPlan || null,
    "Planning aid only. Never enter patient PHI.",
  ].filter(Boolean).join("\n");

  return (
    <>
      <Stack.Screen options={{ title: "Activity Plan", headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="activity-calculator-workspace"
      >
        <CalculatorHero icon="activity" eyebrow="ACTIVITY COMMAND" title="Make the goal coachable." body="Translate the admission goal into the exact conversations that need to happen, then compare the plan with actual pace." />

        <CalculatorSection eyebrow="01 · BUILD THE TARGET" title="Use real performance when you have it" body="A tenured rep uses personal conversion history. A new hire begins with a transparent team baseline and a four week ramp.">
          <CalculatorField label="Rep name" hint="Optional" value={repName} onChangeText={setRepName} keyboardType="default" />
          <CalculatorSegmented label="Experience" value={repStatus} onChange={setRepStatus} options={[{ value: "tenured", label: "Tenured rep" }, { value: "new_hire", label: "New hire" }]} />
          <CalculatorField label="Monthly admission goal" value={monthlyGoal} onChangeText={setMonthlyGoal} suffix="admits" testID="input-monthly-goal" />
          {repStatus === "tenured" ? <><CalculatorField label="Previous cycle admissions" hint="20 workdays" value={lastAdmits} onChangeText={setLastAdmits} suffix="admits" /><CalculatorField label="Previous cycle conversations" hint="Live referral conversations" value={lastConvos} onChangeText={setLastConvos} suffix="conversations" /></> : null}
        </CalculatorSection>

        <CalculatorSection eyebrow="02 · THE REQUIRED PACE" title="The number to coach this week" body={result.rateSource}>
          <MetricGrid metrics={[
            { label: "Daily floor", value: String(result.targetConversationsDay), detail: "Per workday", emphasis: true },
            { label: "Weekly target", value: String(result.targetConversationsWeek), detail: "Five workdays" },
            { label: "Monthly target", value: String(result.targetConversationsMonth), detail: "Twenty workdays" },
            { label: "Conversations per admit", value: result.conversationsPerAdmission.toFixed(1), detail: "Conversion basis" },
          ]} />
          {repStatus === "new_hire" ? <><VisualScale label="Week 1" value={result.ramp.week1} max={result.targetConversationsWeek} caption={`${result.ramp.week1} conversations`} /><VisualScale label="Week 2" value={result.ramp.week2} max={result.targetConversationsWeek} caption={`${result.ramp.week2} conversations`} /><VisualScale label="Week 3" value={result.ramp.week3} max={result.targetConversationsWeek} caption={`${result.ramp.week3} conversations`} /><VisualScale label="Week 4" value={result.ramp.week4} max={result.targetConversationsWeek} caption={`${result.ramp.week4} conversations`} /></> : null}
        </CalculatorSection>

        <CalculatorSection eyebrow="03 · COACH THE GAP" title="Plan versus actual" body="Update this during the week. The report changes immediately and can be saved to My Work.">
          <CalculatorField label="Actual conversations this week" value={actualWeek} onChangeText={setActualWeek} suffix="conversations" testID="input-actual-week" />
          <VisualScale label="Weekly pace" value={weeklyActual} max={result.targetConversationsWeek} caption={`${Math.min(100, Math.round(pace * 100))}%`} />
        </CalculatorSection>

        <DecisionBrief title="Coaching brief" interpretation={`${result.plainEnglishPlan} ${paceLabel}.`} actions={[`Protect enough calendar blocks to complete ${result.targetConversationsDay} live conversations each workday.`, "Coach the quality of one conversation before adding more activity.", "Review pace midweek and adjust priority accounts before Friday."]} caution="This is an activity planning model, not a patient census guarantee. Local market conditions, access, conversion quality, and execution still matter." />
        <CalculatorReportActions kind="activity" title="Activity Plan" summary={summary} report={report} />
      </ScrollView>
    </>
  );
}
