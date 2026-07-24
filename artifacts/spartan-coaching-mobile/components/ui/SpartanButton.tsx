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
  const borderColor = variant === "outline" ? colors.border : "transparent";
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
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
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
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
