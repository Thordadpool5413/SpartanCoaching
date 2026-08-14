import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { radius } from "@/lib/spacing";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import type { StatusRole } from "@workspace/design-tokens";

type Props = {
  label: string;
  role?: StatusRole;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/**
 * Seat / trial / active status strip — same language should appear on Account.
 */
export function EntitlementBanner({
  label,
  role = "neutral",
  actionLabel,
  onAction,
  testID = "entitlement-banner",
}: Props) {
  const colors = useColors();
  const icon =
    role === "trial" || role === "warning"
      ? "clock"
      : role === "active" || role === "success"
        ? "check-circle"
        : role === "locked" || role === "expired"
          ? "lock"
          : "info";

  const accent =
    role === "active" || role === "success"
      ? colors.success
      : role === "trial" || role === "warning"
        ? colors.warning
        : colors.primary;

  return (
    <View
      testID={testID}
      style={[
        styles.row,
        {
          backgroundColor: colors.muted,
          borderColor: colors.border,
        },
      ]}
    >
      <Feather name={icon as any} size={14} color={accent || colors.primary} />
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.foreground, fontSize: 13, flex: 1 }, font("semibold")]}
      >
        {label}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
        >
          <Text style={[{ color: colors.primary, fontSize: 13 }, font("bold")]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 40,
  },
});
