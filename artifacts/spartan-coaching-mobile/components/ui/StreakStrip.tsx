import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

type StreakData = { streakDays?: number; toolsThisWeek?: number; nextVisitTime?: string };

export function StreakStrip({ data }: { data: StreakData }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!data.streakDays && !data.toolsThisWeek && !data.nextVisitTime) return null;

  return (
    <View style={styles.shell} accessibilityLabel="Weekly activity">
      <View style={styles.item}>
        <Feather name="zap" size={16} color={colors.primary} />
        <Text style={styles.value}>{data.streakDays ?? 0}</Text>
        <Text style={styles.label}>day streak</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Feather name="check-circle" size={16} color={colors.primary} />
        <Text style={styles.value}>{data.toolsThisWeek ?? 0}</Text>
        <Text style={styles.label}>this week</Text>
      </View>
      {data.nextVisitTime ? (
        <>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Feather name="calendar" size={16} color={colors.primary} />
            <Text numberOfLines={1} style={styles.label}>{data.nextVisitTime}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    shell: { alignItems: "center", alignSelf: "center", backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", marginHorizontal: 24, marginTop: 18, maxWidth: 620, paddingHorizontal: 16, paddingVertical: 12, width: "auto" },
    item: { alignItems: "center", flex: 1, flexDirection: "row", gap: 6, justifyContent: "center" },
    divider: { backgroundColor: colors.border, height: 20, width: StyleSheet.hairlineWidth },
    value: { color: colors.foreground, fontSize: 14, ...font("semibold") },
    label: { color: colors.mutedForeground, flexShrink: 1, fontSize: 12, ...font("medium") },
  });
}
