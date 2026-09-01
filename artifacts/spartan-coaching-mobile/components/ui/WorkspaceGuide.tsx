import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { tokens } from "@/src/design/tokens";

const steps: Array<{ title: string; body: string; href: Href }> = [
  {
    title: "Explore Tools",
    body: "Choose the outcome and open one workspace.",
    href: "/(tabs)/tools",
  },
  {
    title: "Try Command",
    body: "Plan the conversation and next commitment.",
    href: "/(tabs)/command",
  },
  {
    title: "View Resources",
    body: "Use an approved field asset.",
    href: "/(tabs)/learn?tab=resources" as Href,
  },
];

export function WorkspaceGuide() {
  const colors = useColors();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      testID="workspace-guide"
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.kicker, { color: colors.primary }, font("bold")]}
          >
            START HERE
          </Text>
          <Text
            style={[styles.title, { color: colors.foreground }, font("heavy")]}
          >
            Three steps to useful work
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss workspace guide"
          hitSlop={8}
          onPress={() => setDismissed(true)}
          style={styles.dismiss}
        >
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
      {steps.map((step, index) => (
        <Pressable
          key={step.title}
          accessibilityRole="button"
          accessibilityLabel={`${step.title}. ${step.body}`}
          onPress={() => router.push(step.href)}
          style={({ pressed }) => [
            styles.step,
            { borderColor: colors.border },
            pressed && { opacity: 0.72 },
          ]}
        >
          <Text
            style={[
              styles.stepTitle,
              { color: colors.foreground },
              font("bold"),
            ]}
          >
            {index + 1}. {step.title}
          </Text>
          <Text
            style={[
              styles.stepBody,
              { color: colors.mutedForeground },
              font("regular"),
            ]}
          >
            {step.body}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: tokens.radius[8],
    padding: tokens.space[4],
    gap: tokens.space[2],
    marginBottom: tokens.space[6],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space[2],
    marginBottom: tokens.space[2],
  },
  kicker: { fontSize: tokens.fontSize[100], letterSpacing: 1.2 },
  title: { fontSize: tokens.fontSize[400], lineHeight: 26, marginTop: 4 },
  dismiss: {
    width: tokens.minimumTapTarget,
    height: tokens.minimumTapTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  step: {
    minHeight: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: tokens.space[2],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[2],
  },
  stepTitle: { width: 108, fontSize: tokens.fontSize[200], lineHeight: 20 },
  stepBody: { flex: 1, fontSize: tokens.fontSize[200], lineHeight: 20 },
});
