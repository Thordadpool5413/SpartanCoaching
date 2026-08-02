import React from "react";
import { StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { typeScale } from "@workspace/design-tokens";
import { font } from "@/lib/typography";

export function SectionKicker({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.kicker, { color: colors.primary }]} accessibilityRole="text">
      {"━  "}
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: typeScale.kicker.fontSize,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...font("bold"),
  },
});
