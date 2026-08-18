import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  calculateRepCost,
  money,
  type CommissionTier,
  type RepCostInputs,
} from "@/lib/calculators";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanCard } from "@/components/ui/SpartanCard";

const DEFAULT_TIERS: CommissionTier[] = [
  { id: 1, min: 1, max: 10, rate: 100 },
  { id: 2, min: 11, max: 20, rate: 125 },
  { id: 3, min: 21, max: 999, rate: 150 },
];

export default function RepCostCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [baseSalary, setBaseSalary] = useState("90000");
  const [benefitsLoad, setBenefitsLoad] = useState("42");
  const [annualMileage, setAnnualMileage] = useState("5400");
  const [otherFixed, setOtherFixed] = useState("15484");
  const [callsPerDay, setCallsPerDay] = useState("12");
  const [daysPerMonth, setDaysPerMonth] = useState("20");
  const [callsPerReferral, setCallsPerReferral] = useState("8");
  const [conversion, setConversion] = useState("70");

  const inputs: RepCostInputs = useMemo(
    () => ({
      baseSalary: Math.max(0, Number(baseSalary) || 0),
      benefitsLoad: Math.max(0, Number(benefitsLoad) || 0),
      annualMileage: Math.max(0, Number(annualMileage) || 0),
      otherFixedCosts: Math.max(0, Number(otherFixed) || 0),
      callsPerDay: Math.max(0, Number(callsPerDay) || 0),
      workingDaysPerMonth: Math.max(0, Number(daysPerMonth) || 0),
      callsPerReferral: Math.max(0.01, Number(callsPerReferral) || 1),
      conversionRate: Math.min(100, Math.max(0, Number(conversion) || 0)),
    }),
    [
      baseSalary,
      benefitsLoad,
      annualMileage,
      otherFixed,
      callsPerDay,
      daysPerMonth,
      callsPerReferral,
      conversion,
    ],
  );

  const result = useMemo(() => calculateRepCost(inputs, DEFAULT_TIERS), [inputs]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Rep Cost Calculator",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <SectionKicker>Measure</SectionKicker>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Fully loaded cost per call, referral, and admit
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Native planning economics. Use the result as a decision aid, not a guarantee.
        </Text>

        <SpartanCard style={{ marginTop: 16 }}>
          <NumField label="Base salary ($)" value={baseSalary} onChange={setBaseSalary} colors={colors} />
          <NumField label="Benefits load (%)" value={benefitsLoad} onChange={setBenefitsLoad} colors={colors} />
          <NumField label="Annual mileage (miles)" value={annualMileage} onChange={setAnnualMileage} colors={colors} />
          <NumField label="Other fixed costs ($)" value={otherFixed} onChange={setOtherFixed} colors={colors} />
          <NumField label="Calls per day" value={callsPerDay} onChange={setCallsPerDay} colors={colors} />
          <NumField label="Working days / month" value={daysPerMonth} onChange={setDaysPerMonth} colors={colors} />
          <NumField label="Calls per referral" value={callsPerReferral} onChange={setCallsPerReferral} colors={colors} />
          <NumField label="Conversion rate (%)" value={conversion} onChange={setConversion} colors={colors} />
        </SpartanCard>

        <SpartanCard emphasized style={{ marginTop: 16 }}>
          <SectionKicker>Unit economics</SectionKicker>
          <Metric label="Cost per call" value={money(result.costPerCall)} colors={colors} />
          <Metric label="Cost per referral" value={money(result.costPerReferral)} colors={colors} />
          <Metric label="Cost per admit (fixed)" value={money(result.costPerAdmit)} colors={colors} />
          <Metric label="Blended cost / admit" value={money(result.blendedCostPerAdmit)} colors={colors} />
          <Metric label="Annual fixed + commission" value={money(result.totalRepCost)} colors={colors} />
          <Metric
            label="Monthly admits (model)"
            value={result.monthlyAdmissions.toFixed(1)}
            colors={colors}
          />
          {result.activeTier && (
            <Text style={[styles.note, { color: colors.mutedForeground }]}>
              Active commission tier: {result.activeTier.min}–{result.activeTier.max} admits @ $
              {result.activeTier.rate}/admit
            </Text>
          )}
        </SpartanCard>
      </ScrollView>
    </>
  );
}

function NumField({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input },
        ]}
      />
    </View>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: "600", flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.primary, fontSize: 17, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", marginTop: 8, letterSpacing: -0.3 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },
  note: { fontSize: 12, lineHeight: 18, marginTop: 14 },
});
