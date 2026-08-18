import { Feather } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

const FIELD_PATHS = [
  {
    icon: "message-square" as const,
    title: "Prepare for a conversation",
    body: "Build a focused plan for the person and outcome in front of you.",
  },
  {
    icon: "shield" as const,
    title: "Practice an objection",
    body: "Rehearse the moment and receive direct, private feedback.",
  },
  {
    icon: "check-circle" as const,
    title: "Follow through",
    body: "Turn the conversation into one clear commitment and next move.",
  },
];

export function WelcomeExperience({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: bottomPad + 28 }}
      showsVerticalScrollIndicator={false}
      testID="screen-logged-out-home"
    >
      <View style={[styles.brandField, { paddingTop: topPad + 10 }]}>
        <View style={styles.brandTopRow}>
          <BrandStamp width={142} height={82} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            onPress={() => router.push("/login")}
            style={styles.signInButton}
            testID="button-client-login"
          >
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
        </View>
        <Text style={styles.fieldLabel}>YOUR HOSPICE SALES FIELD GUIDE</Text>
      </View>

      <View style={styles.main}>
        <Text style={styles.eyebrow}>START WITH THE MOMENT</Text>
        <Text style={styles.title}>Know your next move before the conversation starts.</Text>
        <Text style={styles.body}>
          Spartan Coaching helps you prepare, practice, and follow through with clarity. The app guides you through the system before asking you to choose a membership.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/tour" as Href)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          testID="button-guided-tour"
        >
          <Text style={styles.primaryButtonText}>Take the guided tour</Text>
          <Feather name="arrow-right" size={21} color="#FFFFFF" />
        </Pressable>

        <View style={styles.pathList}>
          {FIELD_PATHS.map((item, index) => (
            <View key={item.title} style={[styles.pathRow, index > 0 && styles.pathDivider]}>
              <View style={styles.pathIcon}>
                <Feather name={item.icon} size={21} color={colors.primary} />
              </View>
              <View style={styles.pathCopy}>
                <Text style={styles.pathTitle}>{item.title}</Text>
                <Text style={styles.pathBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.membershipSection}>
          <Text style={styles.sectionLabel}>TWO INDIVIDUAL MEMBERSHIPS</Text>
          <Text style={styles.sectionTitle}>Choose access after you understand the value.</Text>
          <View style={styles.planRow}>
            <View style={styles.planCopy}>
              <Text style={styles.planName}>Standard</Text>
              <Text style={styles.planDescription}>Field planning, tools, practice, Library, and saved work.</Text>
            </View>
            <Text style={styles.planPrice}>$14.99<Text style={styles.planCadence}> weekly</Text></Text>
          </View>
          <View style={[styles.planRow, styles.pathDivider]}>
            <View style={styles.planCopy}>
              <Text style={styles.planName}>Elite</Text>
              <Text style={styles.planDescription}>Everything in Standard plus private Spartan Coach access.</Text>
            </View>
            <Text style={styles.planPrice}>$19.99<Text style={styles.planCadence}> weekly</Text></Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/register" as Href)}
            style={styles.createAccountButton}
            testID="button-create-account-logged-out"
          >
            <Text style={styles.createAccountText}>Create an individual account</Text>
            <Feather name="chevron-right" size={19} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.trustRow}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={styles.trustText}>
            No patient PHI. Raw Coach conversations stay private and expire after 90 days.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    brandField: {
      minHeight: 222,
      backgroundColor: colors.heroBackground,
      paddingHorizontal: 22,
      paddingBottom: 24,
      justifyContent: "space-between",
    },
    brandTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    signInButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.30)",
    },
    signInText: { color: colors.heroForeground, fontSize: 14, ...font("semibold") },
    fieldLabel: { color: colors.heroMuted, fontSize: 10, letterSpacing: 2.2, ...font("bold") },
    main: { paddingHorizontal: 22, paddingTop: 34, gap: 14 },
    eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 16, lineHeight: 24, ...font("regular") },
    primaryButton: {
      minHeight: 62,
      borderRadius: 18,
      borderCurve: "continuous",
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
    primaryButtonText: { color: "#FFFFFF", fontSize: 17, ...font("bold") },
    pathList: { marginTop: 16 },
    pathRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 17 },
    pathDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    pathIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    pathCopy: { flex: 1, gap: 4 },
    pathTitle: { color: colors.foreground, fontSize: 17, ...font("bold") },
    pathBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, ...font("regular") },
    membershipSection: { marginTop: 20, paddingTop: 26, borderTopWidth: 1, borderTopColor: colors.borderStrong },
    sectionLabel: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 25, lineHeight: 30, letterSpacing: -0.6, marginTop: 7, marginBottom: 12, ...font("heavy") },
    planRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 16 },
    planCopy: { flex: 1, gap: 4 },
    planName: { color: colors.foreground, fontSize: 16, ...font("bold") },
    planDescription: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    planPrice: { color: colors.primary, fontSize: 16, fontVariant: ["tabular-nums"], ...font("heavy") },
    planCadence: { color: colors.mutedForeground, fontSize: 10, ...font("regular") },
    createAccountButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    createAccountText: { color: colors.primary, fontSize: 15, ...font("bold") },
    trustRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primaryMuted, borderRadius: 16, padding: 15, marginTop: 8 },
    trustText: { color: colors.mutedForeground, flex: 1, fontSize: 12, lineHeight: 18, ...font("medium") },
  });
}
