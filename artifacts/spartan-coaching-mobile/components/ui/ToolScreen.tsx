import React, { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SectionKicker } from "./SectionKicker";
import type { FieldKitTool } from "@workspace/field-kit-catalog";
import { font } from "@/lib/typography";

/**
 * Mirrors web FieldKitToolLayout: kicker, title, when/how/why, then content.
 */
export function ToolScreen({
  tool,
  children,
  bottomPad = 100,
}: {
  tool: Pick<FieldKitTool, "title" | "description" | "whenToUse" | "howSteps" | "why" | "category">;
  children: ReactNode;
  bottomPad?: number;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: bottomPad + insets.bottom,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SectionKicker>{`Hospice Sales Pro · ${tool.category}`}</SectionKicker>
      <Text style={[styles.title, { color: colors.foreground }]}>{tool.title}</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>{tool.description}</Text>

      <View style={[styles.howBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.howLabel, { color: colors.primary }]}>When</Text>
        <Text style={[styles.howBody, { color: colors.foreground }]}>{tool.whenToUse}</Text>
        <Text style={[styles.howLabel, { color: colors.primary, marginTop: 10 }]}>How</Text>
        {tool.howSteps.map((step, i) => (
          <Text key={i} style={[styles.howBody, { color: colors.mutedForeground }]}>
            {i + 1}. {step}
          </Text>
        ))}
        <Text style={[styles.howLabel, { color: colors.primary, marginTop: 10 }]}>Why</Text>
        <Text style={[styles.howBody, { color: colors.foreground }]}>{tool.why}</Text>
      </View>

      <View style={{ marginTop: 16 }}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.3,
    ...font("bold"),
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 14,
    ...font("regular"),
  },
  howBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  howLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    ...font("bold"),
  },
  howBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    ...font("regular"),
  },
});
