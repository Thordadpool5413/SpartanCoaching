import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { radius } from "@/lib/spacing";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import type { StatusRole } from "@workspace/design-tokens";

type Props = {
  label: string;
  role?: StatusRole;
  testID?: string;
};

/**
 * Compact plan/status chip — subscription theater building block.
 */
export function StatusChip({ label, role = "neutral", testID }: Props) {
  const colors = useColors();
  const tone =
    role === "active" || role === "success"
      ? colors.success
      : role === "trial" || role === "warning"
        ? colors.warning
        : role === "locked" || role === "expired"
          ? colors.primary
          : colors.mutedForeground;

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.chip,
        {
          borderColor: colors.border,
          backgroundColor: colors.muted,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone || colors.primary }]} />
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.foreground, fontSize: 12 }, font("semibold")]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 36,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
