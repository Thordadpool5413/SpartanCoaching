import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

const STEPS = [
  {
    kicker: "PREPARE",
    title: "Start with the conversation, not a dashboard.",
    body: "Tell Spartan Coaching what you are walking into. The app helps you define the person, purpose, likely resistance, and best next move.",
    icon: "message-square" as const,
    exampleTitle: "Oncology referral source",
    exampleBody: "Goal: secure a 15 minute hospice education follow up.",
  },
  {
    kicker: "PRACTICE",
    title: "Rehearse before the room gets real.",
    body: "Use text or voice to practice. Spartan Coach asks questions when context is missing, gives direct feedback, and ends with one clear commitment.",
    icon: "mic" as const,
    exampleTitle: "Common concern",
    exampleBody: "“We already have a preferred hospice provider.”",
  },
  {
    kicker: "USE THE RIGHT TOOL",
    title: "One outcome. One tool. No scavenger hunt.",
    body: "Tools are organized around what you need to accomplish, including objections, account preparation, planning, research, and approved education.",
    icon: "tool" as const,
    exampleTitle: "Suggested output",
    exampleBody: "Review every clinical or compliance related output with the responsible approver.",
  },
  {
    kicker: "FOLLOW THROUGH",
    title: "Leave with a commitment, not more noise.",
    body: "Save your next move, return to it from Home, and share only the summary or commitment you explicitly approve.",
    icon: "check-circle" as const,
    exampleTitle: "Private by default",
    exampleBody: "Raw Coach conversations expire after 90 days and are never visible to company administrators.",
  },
];

export default function GuidedTourScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    void Haptics.selectionAsync();
    if (isLast) {
      router.replace(isAuthenticated ? "/(tabs)" : "/register" as Href);
      return;
    }
    setStep((value) => value + 1);
  };

  return (
    <View style={styles.screen} testID="screen-guided-tour">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BrandStamp width={116} height={68} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close guided tour"
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Feather name="x" size={21} color={colors.heroForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { minHeight: Math.max(580, width * 1.32) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow} accessibilityLabel={`Tour step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((item, index) => (
            <View key={item.kicker} style={[styles.progressSegment, index <= step && styles.progressSegmentActive]} />
          ))}
        </View>

        <View style={styles.stepIcon}>
          <Feather name={current.icon} size={27} color={colors.primary} />
        </View>
        <Text style={styles.kicker}>{current.kicker}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        <View style={styles.example}>
          <Text style={styles.exampleLabel}>FICTIONAL TOUR EXAMPLE</Text>
          <Text style={styles.exampleTitle}>{current.exampleTitle}</Text>
          <Text style={styles.exampleBody}>{current.exampleBody}</Text>
        </View>

        <View style={styles.boundaryRow}>
          <Feather name="shield" size={17} color={colors.primary} />
          <Text style={styles.boundaryText}>Do not enter patient PHI. The tour uses fictional information only.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {step > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setStep((value) => value - 1)} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : <View style={styles.backButton} />}
        <Pressable accessibilityRole="button" onPress={next} style={styles.nextButton} testID="tour-next-button">
          <Text style={styles.nextText}>{isLast ? (isAuthenticated ? "Return Home" : "Create my account") : "Continue"}</Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { minHeight: 126, backgroundColor: colors.heroBackground, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.28)" },
    content: { paddingHorizontal: 22, paddingTop: 25, paddingBottom: 26 },
    progressRow: { flexDirection: "row", gap: 7, marginBottom: 30 },
    progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.muted },
    progressSegmentActive: { backgroundColor: colors.primary },
    stepIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 34, lineHeight: 39, letterSpacing: -1, marginTop: 9, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 16, lineHeight: 24, marginTop: 14, ...font("regular") },
    example: { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, borderRadius: 20, borderCurve: "continuous", padding: 18, marginTop: 27 },
    exampleLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.6, ...font("bold") },
    exampleTitle: { color: colors.foreground, fontSize: 18, marginTop: 9, ...font("bold") },
    exampleBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: 6, ...font("regular") },
    boundaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: colors.primaryMuted, borderRadius: 15, padding: 13, marginTop: 14 },
    boundaryText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17, ...font("medium") },
    footer: { minHeight: 84, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: { width: 66, minHeight: 52, alignItems: "center", justifyContent: "center" },
    backText: { color: colors.mutedForeground, fontSize: 15, ...font("semibold") },
    nextButton: { flex: 1, minHeight: 54, borderRadius: 17, borderCurve: "continuous", paddingHorizontal: 18, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    nextText: { color: "#FFFFFF", fontSize: 16, ...font("bold") },
  });
}
