import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { font } from "@/lib/typography";

export type CoachStep = "prepare" | "rehearse" | "review";

export const COACH_STEPS: Array<{ id: CoachStep; label: string }> = [
  { id: "prepare", label: "Prepare" },
  { id: "rehearse", label: "Rehearse" },
  { id: "review", label: "Coach" },
];

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function BrandLockup({
  styles,
}: {
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.brandShellCompact} accessibilityLabel="Spartan Coaching">
      <HelmetMark size={38} />
      <Text style={styles.brandCompactWord}>Coach</Text>
    </View>
  );
}

interface CoachShellProps {
  firstName: string;
  step: CoachStep;
  coachScrollRef: React.RefObject<ScrollView | null>;
  onStepChange: (step: CoachStep) => void;
  onHistoryOpen: () => void;
  onSettingsOpen: () => void;
  /** Step-specific content rendered inside the ScrollView */
  children: React.ReactNode;
  /** Modals (HistorySheet, SettingsPanel) rendered as siblings to the KAV */
  modals?: React.ReactNode;
}

export function CoachShell({
  firstName,
  step,
  coachScrollRef,
  onStepChange,
  onHistoryOpen,
  onSettingsOpen,
  children,
  modals,
}: CoachShellProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const current = COACH_STEPS.findIndex((item) => item.id === step);

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top"]}
      testID="screen-elite-coach"
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={coachScrollRef}
          style={styles.safe}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar: history | brand | settings */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Open private Coach history"
              onPress={onHistoryOpen}
              style={styles.iconButton}
            >
              <Feather name="clock" size={20} color={colors.foreground} />
            </Pressable>
            <BrandLockup styles={styles} />
            <Pressable
              accessibilityLabel="Open Coach settings"
              onPress={onSettingsOpen}
              style={styles.iconButton}
            >
              <Feather name="sliders" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Intro copy */}
          <View style={styles.intro}>
            <View style={styles.eliteRow}>
              <View style={styles.redRule} />
              <Text style={styles.eliteLabel}>SPARTAN COACH</Text>
            </View>
            <Text style={styles.title}>
              Prepare for the conversation that matters.
            </Text>
            <Text style={styles.subtitle}>
              Good {timeOfDay()}, {firstName}. No patient information. Your raw
              rehearsal stays private.
            </Text>
          </View>

          {/* Step rail */}
          <View
            style={styles.stepRail}
            accessibilityLabel={`Coach step ${current + 1} of 3`}
          >
            {COACH_STEPS.map((item, index) => {
              const active = index === current;
              const complete = index < current;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onStepChange(item.id)}
                  style={styles.stepItem}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${item.label}, step ${index + 1} of 3`}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      (active || complete) && styles.stepCircleActive,
                    ]}
                  >
                    {complete ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumber,
                          active && { color: colors.primaryForeground },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[styles.stepLabel, active && styles.stepLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Step-specific content */}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {modals}
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingBottom: 36 },
    topBar: {
      height: 66,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
    },
    brandShellCompact: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "transparent",
    },
    brandCompactWord: {
      color: colors.foreground,
      fontSize: 16,
      letterSpacing: -0.2,
      ...font("bold"),
    },
    intro: { paddingTop: 18, paddingBottom: 22 },
    eliteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 10,
    },
    redRule: { width: 24, height: 2, backgroundColor: colors.primary },
    eliteLabel: {
      color: colors.primary,
      fontSize: 11,
      letterSpacing: 2.1,
      ...font("bold"),
    },
    title: {
      color: colors.foreground,
      fontSize: 32,
      lineHeight: 37,
      letterSpacing: -0.9,
      ...font("heavy"),
    },
    subtitle: {
      color: colors.mutedForeground,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
      ...font("regular"),
    },
    stepRail: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 14,
      marginBottom: 26,
    },
    stepItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    stepCircle: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleActive: { backgroundColor: colors.primary },
    stepNumber: {
      color: colors.mutedForeground,
      fontSize: 12,
      ...font("semibold"),
    },
    stepLabel: {
      color: colors.mutedForeground,
      fontSize: 12,
      ...font("semibold"),
    },
    stepLabelActive: { color: colors.foreground },
  });
}
