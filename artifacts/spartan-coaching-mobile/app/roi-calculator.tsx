import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { calculateRoi, money } from "@/lib/calculators";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanCard } from "@/components/ui/SpartanCard";

export default function RoiCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reps, setReps] = useState("3");
  const [referrals, setReferrals] = useState("15");
  const [conversion, setConversion] = useState("65");
  const [los, setLos] = useState("45");
  const [rppd, setRppd] = useState("200");

  const result = useMemo(
    () =>
      calculateRoi({
        reps: Math.max(1, Number(reps) || 1),
        referralsPerRep: Math.max(0, Number(referrals) || 0),
        conversionPct: Math.min(100, Math.max(0, Number(conversion) || 0)),
        losDays: Math.max(0, Number(los) || 0),
        rppd: Math.max(0, Number(rppd) || 0),
      }),
    [reps, referrals, conversion, los, rppd],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "ROI Calculator",
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
          Model coaching impact on revenue
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Same math as the website. Planning model only — not a guarantee of results.
        </Text>

        <SpartanCard style={{ marginTop: 16 }}>
          <NumField label="Sales reps" value={reps} onChange={setReps} colors={colors} />
          <NumField label="Monthly referrals / rep" value={referrals} onChange={setReferrals} colors={colors} />
          <NumField label="Conversion %" value={conversion} onChange={setConversion} colors={colors} />
          <NumField label="Avg length of stay (days)" value={los} onChange={setLos} colors={colors} />
          <NumField label="Revenue per patient day ($)" value={rppd} onChange={setRppd} colors={colors} />
        </SpartanCard>

        <SpartanCard style={{ marginTop: 16 }}>
          <SectionKicker>Current run rate</SectionKicker>
          <Metric label="Monthly revenue" value={money(result.monthlyRevenue)} colors={colors} />
          <Metric label="Annual revenue" value={money(result.annualRevenue)} colors={colors} />
          <Metric
            label="Monthly admits"
            value={result.monthlyAdmissions.toFixed(1)}
            colors={colors}
          />
        </SpartanCard>

        <SpartanCard emphasized style={{ marginTop: 16 }}>
          <SectionKicker>Projected with improved execution</SectionKicker>
          <Metric label="Additional monthly revenue" value={money(result.additionalMonthlyRevenue)} colors={colors} />
          <Metric label="Additional annual revenue" value={money(result.additionalAnnualRevenue)} colors={colors} />
          <Metric
            label="Revenue lift"
            value={`${result.revenueIncreasePercent.toFixed(1)}%`}
            colors={colors}
          />
          <Metric
            label="Extra patients / month"
            value={result.additionalPatients.toFixed(1)}
            colors={colors}
          />
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Model assumes ~40% more referral activity and up to +15 pts conversion (capped at 95%), with longer LOS.
            Use as a conversation frame with leadership — not a promise.
          </Text>
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
      <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "900" }}>{value}</Text>
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
