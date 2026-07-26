import React from "react";
import { StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { typeScale } from "@workspace/design-tokens";

export function SectionKicker({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.kicker, { color: colors.primary }]} accessibilityRole="text">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: typeScale.kicker.fontSize,
    fontWeight: typeScale.kicker.fontWeight,
    letterSpacing: typeScale.kicker.letterSpacing,
    textTransform: "uppercase",
    fontFamily: "Inter_700Bold",
  },
});
