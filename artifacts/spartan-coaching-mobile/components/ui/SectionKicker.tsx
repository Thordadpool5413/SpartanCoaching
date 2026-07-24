import React from "react";
import { StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

export function SectionKicker({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.kicker, { color: colors.primary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontFamily: "Inter_700Bold",
  },
});
