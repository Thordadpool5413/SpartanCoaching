import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { calculateActivityTargets } from "@/lib/calculators";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanCard } from "@/components/ui/SpartanCard";

export default function ActivityCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [repName, setRepName] = useState("");
  const [repStatus, setRepStatus] = useState<"tenured" | "new_hire">("tenured");
  const [monthlyGoal, setMonthlyGoal] = useState("8");
  const [lastAdmits, setLastAdmits] = useState("6");
  const [lastConvos, setLastConvos] = useState("90");

  const result = useMemo(() => {
    return calculateActivityTargets({
      repName,
      repStatus,
      monthlyGoal: Math.max(0, Number(monthlyGoal) || 0),
      lastCycleAdmissions: Math.max(0, Number(lastAdmits) || 0),
      lastCycleConversations: Math.max(0, Number(lastConvos) || 0),
    });
  }, [repName, repStatus, monthlyGoal, lastAdmits, lastConvos]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Activity Calculator",
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
          Turn an admit goal into daily conversations
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Built for private planning on this iPhone. No PHI. Names are optional.
        </Text>

        <SpartanCard style={{ marginTop: 16 }}>
          <Field label="Rep name (optional)" value={repName} onChange={setRepName} colors={colors} />
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Rep status</Text>
          <View style={styles.row}>
            {(["tenured", "new_hire"] as const).map((s) => {
              const active = repStatus === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setRepStatus(s)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {s === "tenured" ? "Tenured" : "New hire"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Field
            label="Monthly admission goal"
            value={monthlyGoal}
            onChange={setMonthlyGoal}
            colors={colors}
            keyboard="number-pad"
          />
          {repStatus === "tenured" && (
            <>
              <Field
                label="Last cycle admissions"
                value={lastAdmits}
                onChange={setLastAdmits}
                colors={colors}
                keyboard="number-pad"
              />
              <Field
                label="Last cycle conversations"
                value={lastConvos}
                onChange={setLastConvos}
                colors={colors}
                keyboard="number-pad"
              />
            </>
          )}
        </SpartanCard>

        <SpartanCard emphasized style={{ marginTop: 16 }}>
          <SectionKicker>Targets</SectionKicker>
          <Metric label="Per day" value={String(result.targetConversationsDay)} colors={colors} />
          <Metric label="Per week" value={String(result.targetConversationsWeek)} colors={colors} />
          <Metric label="Per month" value={String(result.targetConversationsMonth)} colors={colors} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Rate: {result.conversationsPerAdmission.toFixed(1)} convos / admit · {result.rateSource}
          </Text>
          <Text style={[styles.plan, { color: colors.foreground }]}>{result.plainEnglishPlan}</Text>
          {!!result.plainEnglishRampPlan && (
            <Text style={[styles.plan, { color: colors.mutedForeground, marginTop: 8 }]}>
              {result.plainEnglishRampPlan}
            </Text>
          )}
        </SpartanCard>
      </ScrollView>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
  keyboard = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboard?: "default" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        style={[
          styles.input,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input },
        ]}
        placeholderTextColor={colors.mutedForeground}
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
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "900" }}>{value}</Text>
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
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  meta: { fontSize: 12, marginTop: 12, lineHeight: 17 },
  plan: { fontSize: 14, lineHeight: 21, marginTop: 12 },
});
