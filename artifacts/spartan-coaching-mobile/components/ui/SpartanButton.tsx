import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { radius } from "@workspace/design-tokens";
import { font } from "@/lib/typography";
import {
  MAX_FONT_SIZE_MULTIPLIER,
  MIN_TOUCH_TARGET,
  impactLight,
  pressScale,
} from "@/lib/iosProductQuality";

type Variant = "primary" | "outline" | "ghost";

export function SpartanButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  testID,
  haptic = true,
}: {
  title: string;
  onPress?: PressableProps["onPress"];
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Light impact on press; suppressed when Reduce Motion */
  haptic?: boolean;
}) {
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "outline"
        ? "transparent"
        : "transparent";
  const borderColor =
    variant === "outline" ? colors.borderStrong ?? colors.border : "transparent";
  const textColor =
    variant === "primary" ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      testID={testID}
      onPress={(e) => {
        if (haptic && !isDisabled) void impactLight(reduceMotion);
        onPress?.(e);
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" ? 2 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
          transform: [pressScale(!!pressed && !isDisabled, reduceMotion, 0.97)],
          ...(variant === "primary" && Platform.OS === "ios" && !reduceMotion
            ? {
                shadowColor: colors.primary,
                shadowOpacity: 0.18,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }
            : variant === "primary" && Platform.OS !== "ios"
              ? { elevation: 3 }
              : null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} accessibilityLabel="Loading" />
      ) : (
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.label, { color: textColor }]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(50, MIN_TOUCH_TARGET),
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    letterSpacing: 0.2,
    ...font("bold"),
  },
});
