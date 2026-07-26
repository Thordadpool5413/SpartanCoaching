import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { radius } from "@workspace/design-tokens";

type Variant = "primary" | "outline" | "ghost";

export function SpartanButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  testID,
}: {
  title: string;
  onPress?: PressableProps["onPress"];
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useColors();
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
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        variant === "primary" && styles.primaryShadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryShadow: {
    shadowColor: "#e8291e",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: "Inter_700Bold",
  },
});
