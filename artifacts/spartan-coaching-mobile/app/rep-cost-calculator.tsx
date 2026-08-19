import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalculatorField, CalculatorHero, CalculatorReportActions, CalculatorSection, DecisionBrief, MetricGrid, VisualScale } from "@/components/calculators/CalculatorExperience";
import { useColors } from "@/hooks/useColors";
import { calculateRepCost, money, type CommissionTier, type RepCostInputs } from "@/lib/calculators";
import { font } from "@/lib/typography";

const INITIAL_TIERS: CommissionTier[] = [
  { id: 1, min: 1, max: 10, rate: 100 },
  { id: 2, min: 11, max: 20, rate: 125 },
  { id: 3, min: 21, max: 999, rate: 150 },
];

export default function RepCostCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<Record<keyof RepCostInputs, string>>({ baseSalary: "90000", benefitsLoad: "42", annualMileage: "5400", otherFixedCosts: "15484", callsPerDay: "12", workingDaysPerMonth: "20", callsPerReferral: "8", conversionRate: "70" });
  const [tiers, setTiers] = useState<CommissionTier[]>(INITIAL_TIERS);
  const input = useMemo<RepCostInputs>(() => ({
    baseSalary: positive(values.baseSalary), benefitsLoad: positive(values.benefitsLoad), annualMileage: positive(values.annualMileage), otherFixedCosts: positive(values.otherFixedCosts), callsPerDay: positive(values.callsPerDay), workingDaysPerMonth: positive(values.workingDaysPerMonth), callsPerReferral: Math.max(0.01, positive(values.callsPerReferral)), conversionRate: Math.min(100, positive(values.conversionRate)),
  }), [values]);
  const result = useMemo(() => calculateRepCost(input, tiers), [input, tiers]);
  const set = (key: keyof RepCostInputs) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const updateTier = (id: number, key: "min" | "max" | "rate", raw: string) => setTiers((current) => current.map((tier) => tier.id === id ? { ...tier, [key]: positive(raw) || (key === "max" ? 999 : 0) } : tier));
  const addTier = () => setTiers((current) => {
    const last = current[current.length - 1];
    if (!last) return [{ id: Date.now(), min: 1, max: 999, rate: 100 }];
    const nextMin = last.max === 999 ? last.min + 10 : last.max + 1;
    const prior = last.max === 999 ? [...current.slice(0, -1), { ...last, max: nextMin - 1 }] : current;
    return [...prior, { id: Date.now(), min: nextMin, max: 999, rate: last.rate }];
  });
  const report = ["Spartan Coaching Rep Economics", `Total annual rep cost: ${money(result.totalRepCost)}`, `Annual commission: ${money(result.annualCommission)}`, `Cost per call: ${money(result.costPerCall)}`, `Cost per referral: ${money(result.costPerReferral)}`, `Blended cost per admit: ${money(result.blendedCostPerAdmit)}`, `Monthly admissions: ${result.monthlyAdmissions.toFixed(1)}`, `Annual conversion leakage: ${money(result.annualConversionLoss)}`, `Active tier: ${result.activeTier?.min ?? 0} to ${result.activeTier?.max === 999 ? "unlimited" : result.activeTier?.max ?? 0} admits at ${money(result.activeTier?.rate ?? 0)} per admit`, "Planning estimate only. Validate compensation and cost assumptions with finance and human resources."].join("\n");

  return <>
    <Stack.Screen options={{ title: "Rep Economics", headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground }} />
    <ScrollView style={{ backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" testID="rep-cost-calculator-workspace">
      <CalculatorHero icon="dollar-sign" eyebrow="REP ECONOMICS" title="Know what the field really costs." body="Model loaded compensation, activity, conversion, commission, and the cost of referral leakage without spreadsheet theater." />
      <CalculatorSection eyebrow="01 · LOADED COST" title="Build the annual cost base">
        <CalculatorField label="Base salary" value={values.baseSalary} onChangeText={set("baseSalary")} prefix="$" />
        <CalculatorField label="Benefits load" value={values.benefitsLoad} onChangeText={set("benefitsLoad")} suffix="%" />
        <CalculatorField label="Annual mileage" value={values.annualMileage} onChangeText={set("annualMileage")} suffix="miles" />
        <CalculatorField label="Other fixed costs" value={values.otherFixedCosts} onChangeText={set("otherFixedCosts")} prefix="$" />
      </CalculatorSection>
      <CalculatorSection eyebrow="02 · FIELD PERFORMANCE" title="Connect cost to production">
        <CalculatorField label="Calls per day" value={values.callsPerDay} onChangeText={set("callsPerDay")} />
        <CalculatorField label="Working days per month" value={values.workingDaysPerMonth} onChangeText={set("workingDaysPerMonth")} />
        <CalculatorField label="Calls required per referral" value={values.callsPerReferral} onChangeText={set("callsPerReferral")} />
        <CalculatorField label="Referral conversion rate" value={values.conversionRate} onChangeText={set("conversionRate")} suffix="%" />
      </CalculatorSection>
      <CalculatorSection eyebrow="03 · COMMISSION" title="Use the actual tier structure" body="The highlighted tier is active at the modeled monthly admission volume.">
        {tiers.map((tier) => {
          const active = tier.id === result.activeTier?.id;
          return <View key={tier.id} style={[styles.tier, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryMuted : colors.background }]}>
            <View style={styles.tierHeader}><Text style={[styles.tierLabel, { color: active ? colors.primary : colors.foreground }, font("bold")]}>{active ? "ACTIVE TIER" : "COMMISSION TIER"}</Text>{tiers.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel="Remove commission tier" hitSlop={8} onPress={() => setTiers((current) => current.filter((item) => item.id !== tier.id))}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable> : null}</View>
            <View style={styles.tierFields}><View style={styles.tierField}><CalculatorField label="From" value={String(tier.min)} onChangeText={(value) => updateTier(tier.id, "min", value)} /></View><View style={styles.tierField}><CalculatorField label="To" value={tier.max === 999 ? "" : String(tier.max)} onChangeText={(value) => updateTier(tier.id, "max", value)} hint={tier.max === 999 ? "No maximum" : undefined} /></View></View>
            <CalculatorField label="Commission per admission" value={String(tier.rate)} onChangeText={(value) => updateTier(tier.id, "rate", value)} prefix="$" />
          </View>;
        })}
        <Pressable accessibilityRole="button" onPress={() => { addTier(); void Haptics.selectionAsync(); }} style={[styles.addTier, { borderColor: colors.primary }]}><Feather name="plus" size={17} color={colors.primary} /><Text style={[styles.addTierText, { color: colors.primary }, font("bold")]}>Add commission tier</Text></Pressable>
      </CalculatorSection>
      <CalculatorSection eyebrow="04 · DECISION VIEW" title="Unit economics and leakage">
        <MetricGrid metrics={[{ label: "Blended cost per admit", value: money(result.blendedCostPerAdmit), detail: "Fixed cost plus commission", emphasis: true }, { label: "Total annual rep cost", value: money(result.totalRepCost), detail: "Loaded annual cost" }, { label: "Cost per referral", value: money(result.costPerReferral), detail: `${result.monthlyReferrals.toFixed(1)} referrals monthly` }, { label: "Annual conversion leakage", value: money(result.annualConversionLoss), detail: `${result.annualLostAdmissions.toFixed(1)} unconverted referrals` }]} />
        <VisualScale label="Converted referrals" value={result.monthlyAdmissions} max={Math.max(result.monthlyReferrals, 1)} caption={`${result.monthlyAdmissions.toFixed(1)} monthly admits`} />
        <VisualScale label="Unconverted referrals" value={result.monthlyLostAdmissions} max={Math.max(result.monthlyReferrals, 1)} caption={`${result.monthlyLostAdmissions.toFixed(1)} monthly`} />
      </CalculatorSection>
      <DecisionBrief title="Executive readout" interpretation={`The modeled rep costs ${money(result.totalRepCost)} annually and produces ${result.monthlyAdmissions.toFixed(1)} monthly admissions. The blended acquisition cost is ${money(result.blendedCostPerAdmit)} per admission. Referral conversion leakage represents ${money(result.annualConversionLoss)} in modeled annual field cost.`} actions={["Confirm loaded cost and commission assumptions with finance and human resources.", "Coach the conversion gap before adding more call volume.", "Compare the same model across representatives using identical definitions."]} caution="This model does not establish compensation policy or employment terms. Review any compensation change with finance, human resources, legal, and compliance." />
      <CalculatorReportActions kind="rep-cost" title="Rep Economics" summary={`${money(result.blendedCostPerAdmit)} blended cost per admit and ${money(result.totalRepCost)} total annual rep cost.`} report={report} />
    </ScrollView>
  </>;
}

function positive(value: string) { return Math.max(0, Number(value) || 0); }

const styles = StyleSheet.create({
  tier: { borderWidth: 1, borderRadius: 18, borderCurve: "continuous", padding: 14, marginBottom: 12 },
  tierHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  tierLabel: { fontSize: 9, letterSpacing: 1.3 },
  tierFields: { flexDirection: "row", gap: 10 },
  tierField: { flex: 1 },
  addTier: { minHeight: 48, borderWidth: 1, borderRadius: 15, borderCurve: "continuous", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addTierText: { fontSize: 13 },
});
