import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { runEngine, type BranchInputs, type StaffingRole } from "@workspace/branch-engine/engine";
import { DEFAULT_INPUTS, PRESET_CONFIGS, STAFF_ROLES } from "@workspace/branch-engine/presets";
import { CONTENT_VERSION } from "@workspace/branch-engine/content";
import { CalculatorField, CalculatorHero, CalculatorReportActions, CalculatorSection, DecisionBrief, MetricGrid, VisualScale } from "@/components/calculators/CalculatorExperience";
import { StaffingTable } from "@/components/StaffingTable";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export function buildInputs(presetKey: string, targetADC: number): BranchInputs {
  const preset = PRESET_CONFIGS[presetKey];
  return { ...DEFAULT_INPUTS, ...(preset ? preset.inputs : {}), scenarioPreset: presetKey, targetADC };
}

type NumericKey = Exclude<keyof BranchInputs, "scenarioPreset">;

export default function StaffingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [presetKey, setPresetKey] = useState(DEFAULT_INPUTS.scenarioPreset);
  const [values, setValues] = useState<Record<NumericKey, string>>(() => numericValues(DEFAULT_INPUTS));
  const [staffingRoles, setStaffingRoles] = useState<StaffingRole[]>(() => STAFF_ROLES.map((role) => ({ ...role })));
  const inputs = useMemo<BranchInputs>(() => ({ scenarioPreset: presetKey, ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, positive(value)])) } as BranchInputs), [presetKey, values]);
  const results = useMemo(() => runEngine(inputs, staffingRoles, CONTENT_VERSION), [inputs, staffingRoles]);
  const set = (key: NumericKey) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const selectPreset = (key: string) => {
    const next = buildInputs(key, positive(values.targetADC) || DEFAULT_INPUTS.targetADC);
    setPresetKey(key);
    setValues(numericValues(next));
  };
  const updateStaffing = (index: number, field: "minFte" | "salary", raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    setStaffingRoles((current) => current.map((role, roleIndex) => roleIndex === index ? { ...role, [field]: value, caseloadTrigger: 9999 } : role));
  };
  const resetStaffing = () => setStaffingRoles(STAFF_ROLES.map((role) => ({ ...role })));
  const addStaffingRole = () => setStaffingRoles((current) => [...current, { role: `Custom role ${current.filter((role) => role.role.startsWith("Custom role")).length + 1}`, salary: 0, minFte: 1, caseloadTrigger: 9999 }]);
  const report = ["Spartan Coaching Branch Profitability Scenario", `Scenario: ${PRESET_CONFIGS[presetKey]?.label || presetKey}`, `Target ADC: ${inputs.targetADC}`, `Annual revenue: ${results.display.annualRevenue}`, `Annual profit: ${results.display.annualProfit}`, `Operating margin: ${results.display.operatingMarginPercent}`, `Break even ADC: ${results.display.breakEvenADC}`, `Target margin ADC: ${results.display.targetMarginADC}`, `Monthly admissions required: ${results.display.monthlyAdmissionsNeeded}`, `Marketers required: ${results.display.marketersNeeded}`, `Cash at month 12: ${currency(results.narrative.cashAtMonth12)}`, `Formula version: ${results.metadata.formulaVersion}`, "Planning scenario only. Validate local rates, expenses, staffing requirements, and assumptions with finance, operations, clinical leadership, compliance, and legal."].join("\n");
  const status = results.narrative.status === "at-target" ? "At or above target margin" : results.narrative.status === "profitable-below-target" ? "Profitable but below target margin" : "Below modeled break even";

  return <>
    <Stack.Screen options={{ title: "Branch Economics", headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground }} />
    <ScrollView style={{ backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" testID="branch-calculator-workspace">
      <CalculatorHero icon="briefcase" eyebrow="BRANCH ECONOMICS" title="See the whole operating model." body="Stress test census, staffing, margin, admissions, and cash runway in one decision workspace. Every assumption remains visible." />
      <CalculatorSection eyebrow="01 · SCENARIO" title="Choose a starting model" body={PRESET_CONFIGS[presetKey]?.description}>
        <View style={styles.presetRow}>{Object.entries(PRESET_CONFIGS).map(([key, preset]) => { const active = key === presetKey; return <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => selectPreset(key)} style={[styles.preset, { backgroundColor: active ? colors.primary : colors.secondary, borderColor: active ? colors.primary : colors.border }]} testID={`button-scenario-${key}`}><Text style={[styles.presetText, { color: active ? "#FFFFFF" : colors.foreground }, font("bold")]}>{preset.label}</Text></Pressable>; })}</View>
        <CalculatorField label="Target average daily census" value={values.targetADC} onChangeText={set("targetADC")} suffix="ADC" testID="input-adc" />
        <CalculatorField label="Average length of stay" value={values.avgLengthOfStayDays} onChangeText={set("avgLengthOfStayDays")} suffix="days" />
        <CalculatorField label="Target operating margin" value={values.targetOperatingMarginPercent} onChangeText={set("targetOperatingMarginPercent")} suffix="%" />
      </CalculatorSection>
      <CalculatorSection eyebrow="02 · REVENUE AND COST" title="Make the assumptions explicit" body="Rates are scenario inputs. Confirm the correct fiscal year, locality, payer mix, and actual branch expenses before relying on the result.">
        <CalculatorField label="Routine home care, days 1 through 60" value={values.rhcDay1To60} onChangeText={set("rhcDay1To60")} prefix="$" suffix="per day" />
        <CalculatorField label="Routine home care, day 61 and later" value={values.rhcDay61Plus} onChangeText={set("rhcDay61Plus")} prefix="$" suffix="per day" />
        <CalculatorField label="Pharmacy cost" value={values.pharmacyPerDay} onChangeText={set("pharmacyPerDay")} prefix="$" suffix="per day" />
        <CalculatorField label="Durable medical equipment" value={values.dmePerDay} onChangeText={set("dmePerDay")} prefix="$" suffix="per day" />
        <CalculatorField label="Supplies" value={values.suppliesPerDay} onChangeText={set("suppliesPerDay")} prefix="$" suffix="per day" />
        <CalculatorField label="Travel" value={values.travelPerDay} onChangeText={set("travelPerDay")} prefix="$" suffix="per day" />
        <CalculatorField label="Other variable cost" value={values.otherPerDay} onChangeText={set("otherPerDay")} prefix="$" suffix="per day" />
        <CalculatorField label="Monthly nonpayroll overhead" value={values.monthlyNonPayrollOverhead} onChangeText={set("monthlyNonPayrollOverhead")} prefix="$" />
      </CalculatorSection>
      <CalculatorSection eyebrow="03 · GROWTH AND RUNWAY" title="Connect admissions to cash">
        <CalculatorField label="Starting capital" value={values.startingCapital} onChangeText={set("startingCapital")} prefix="$" />
        <CalculatorField label="Admissions per marketer each month" value={values.admissionsPerMarketerPerMonth} onChangeText={set("admissionsPerMarketerPerMonth")} suffix="admits" />
      </CalculatorSection>
      <CalculatorSection eyebrow="04 · EXECUTIVE VIEW" title={status}>
        <MetricGrid metrics={[{ label: "Annual profit", value: results.display.annualProfit, detail: results.display.operatingMarginPercent, emphasis: true }, { label: "Break even ADC", value: results.display.breakEvenADC, detail: "Modeled threshold" }, { label: "Target margin ADC", value: results.display.targetMarginADC, detail: `${inputs.targetOperatingMarginPercent}% target` }, { label: "Monthly admissions", value: results.display.monthlyAdmissionsNeeded, detail: `${results.display.weeklyAdmissionsNeeded} weekly` }, { label: "Required marketers", value: results.display.marketersNeeded, detail: `${inputs.admissionsPerMarketerPerMonth} admits each month` }]} />
        <VisualScale label="Current target ADC" value={inputs.targetADC} max={Math.max(results.derived.targetMarginADC, inputs.targetADC, 1)} caption={String(inputs.targetADC)} />
        <VisualScale label="Target margin ADC" value={results.derived.targetMarginADC} max={Math.max(results.derived.targetMarginADC, inputs.targetADC, 1)} caption={results.display.targetMarginADC} />
      </CalculatorSection>
      <CalculatorSection eyebrow="05 · STAFFING MODEL" title={`Your staffing plan at ADC ${inputs.targetADC}`} body="Set the real team and salaries before relying on the financial result. This planning model does not replace state law, Conditions of Participation, accreditor requirements, clinical judgment, or company policy."><StaffingTable results={results} staffingRoles={staffingRoles} onUpdate={updateStaffing} onReset={resetStaffing} onAdd={addStaffingRole} onRemove={(index) => setStaffingRoles((current) => current.filter((_, roleIndex) => roleIndex !== index))} /></CalculatorSection>
      <CalculatorSection eyebrow="06 · CASH RUNWAY" title="First twelve months" body={`Modeled starting capital is ${currency(inputs.startingCapital)}. Cash flow turns positive in ${results.narrative.monthCashFlowTurnsPositive > 0 ? `month ${results.narrative.monthCashFlowTurnsPositive}` : "no month within the modeled runway"}.`}>
        {results.tables.runwayMonths.slice(0, 12).map((month) => <VisualScale key={month.month} label={`Month ${month.month}`} value={Math.max(0, month.cumulativeCash)} max={Math.max(inputs.startingCapital, ...results.tables.runwayMonths.slice(0, 12).map((item) => Math.max(0, item.cumulativeCash)), 1)} caption={currency(month.cumulativeCash)} />)}
      </CalculatorSection>
      <DecisionBrief title="Operating brief" interpretation={`At ${inputs.targetADC} ADC, this scenario produces ${results.display.annualProfit} in annual profit at a ${results.display.operatingMarginPercent} operating margin. Break even is ${results.display.breakEvenADC} ADC and the ${inputs.targetOperatingMarginPercent}% target margin begins near ${results.display.targetMarginADC} ADC.`} actions={["Replace preset assumptions with the branch’s actual payer, cost, payroll, and overhead data.", `Build a referral plan for ${results.display.monthlyAdmissionsNeeded} monthly admissions.`, "Review staffing and cash runway with the accountable operational and clinical leaders before a decision."]} caution="This simulator is strategic education, not accounting, legal, reimbursement, staffing, or clinical advice. Obtain appropriate medical director, compliance, finance, operations, and legal review." />
      <CalculatorReportActions kind="branch" title="Branch Profitability Scenario" summary={`${results.display.annualProfit} annual profit at ${results.display.operatingMarginPercent} margin.`} report={report} />
    </ScrollView>
  </>;
}

function numericValues(input: BranchInputs): Record<NumericKey, string> {
  const { scenarioPreset: _scenarioPreset, ...numeric } = input;
  return Object.fromEntries(Object.entries(numeric).map(([key, value]) => [key, String(value)])) as Record<NumericKey, string>;
}

function positive(value: string) { return Math.max(0, Number(value) || 0); }
function currency(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }

const styles = StyleSheet.create({
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  preset: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  presetText: { fontSize: 12, textAlign: "center" },
});
