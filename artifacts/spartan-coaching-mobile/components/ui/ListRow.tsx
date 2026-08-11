import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";
import { layout, radius } from "@/lib/spacing";
import {
  MAX_FONT_SIZE_MULTIPLIER,
  impactLight,
  pressScale,
} from "@/lib/iosProductQuality";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Feather icon name */
  icon?: React.ComponentProps<typeof Feather>["name"];
  emphasized?: boolean;
  chevron?: boolean;
  testID?: string;
  trailing?: React.ReactNode;
};

/**
 * Quiet catalog / settings row — 44pt+ touch, one primary line + meta.
 */
export function ListRow({
  title,
  subtitle,
  onPress,
  icon,
  emphasized,
  chevron = true,
  testID,
  trailing,
}: Props) {
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (!onPress) return;
        void impactLight(reduceMotion);
        onPress();
      }}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={onPress ? "Double tap to open" : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: emphasized ? colors.primary : colors.border,
          borderWidth: emphasized ? 1.5 : StyleSheet.hairlineWidth * 2,
          opacity: pressed && onPress ? 0.92 : 1,
          transform: [pressScale(!!(pressed && onPress), reduceMotion, 0.99)],
        },
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.primaryMuted ?? "rgba(255,45,32,0.12)" },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[{ color: colors.foreground, fontSize: 15 }, font("bold")]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[
              { color: colors.mutedForeground, fontSize: 12, marginTop: 3, lineHeight: 16 },
              font("regular"),
            ]}
            numberOfLines={3}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron && onPress ? (
        <Feather
          name="chevron-right"
          size={18}
          color={colors.mutedForeground}
          accessibilityElementsHidden
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.touchMin + 8,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
