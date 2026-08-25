import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { haptics } from "@/lib/haptics";
import { font } from "@/lib/typography";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

type StreakData = {
  streakDays?: number;
  toolsThisWeek?: number;
  nextVisitTime?: string;
};

type Chip = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  onPress?: () => void;
  accent?: boolean;
};

function StreakChip({ icon, label, value, onPress, accent, colors, reduceMotion }: Chip & { colors: ReturnType<typeof useColors>; reduceMotion: boolean }) {
  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: accent ? colors.primaryMuted : colors.muted,
          borderColor: accent ? colors.primary + "40" : colors.border,
        },
      ]}
    >
      <Feather name={icon} size={13} color={accent ? colors.primary : colors.mutedForeground} />
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[styles.chipValue, { color: accent ? colors.primary : colors.foreground }]}
      >
        {value}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[styles.chipLabel, { color: colors.mutedForeground }]}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={() => {
        haptics.tap(reduceMotion);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
    >
      {content}
    </Pressable>
  );
}

export function StreakStrip({ data }: { data: StreakData }) {
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();

  const chips: Chip[] = [];

  if (data.streakDays != null && data.streakDays > 0) {
    chips.push({
      icon: "zap",
      label: "day streak",
      value: String(data.streakDays),
      accent: true,
      onPress: () => router.push("/(tabs)/my-work" as any),
    });
  }

  if (data.toolsThisWeek != null) {
    chips.push({
      icon: "tool",
      label: "tools this week",
      value: String(data.toolsThisWeek),
      onPress: () => router.push("/(tabs)/my-work" as any),
    });
  }

  if (data.nextVisitTime) {
    chips.push({
      icon: "clock",
      label: "next visit",
      value: data.nextVisitTime,
    });
  }

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      style={styles.scroll}
    >
      {chips.map((chip, i) => (
        <StreakChip
          key={i}
          {...chip}
          colors={colors}
          reduceMotion={reduceMotion}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  strip: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipValue: {
    fontSize: 13,
    ...font("bold"),
  },
  chipLabel: {
    fontSize: 11,
    ...font("regular"),
  },
});
