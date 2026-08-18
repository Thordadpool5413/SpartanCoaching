import { Feather } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { useColors } from "@/hooks/useColors";
import { MEMBERSHIP_ACCESS } from "@/lib/productExperience";
import { font } from "@/lib/typography";

const FIELD_PATHS = [
  {
    icon: "message-square" as const,
    title: "Prepare for a conversation",
    body: "Build the plan, talking points, and next move before you walk in.",
  },
  {
    icon: "shield" as const,
    title: "Practice the hard part",
    body: "Work through objections, role play, and the moments you cannot afford to fumble.",
  },
  {
    icon: "book-open" as const,
    title: "Use the field library",
    body: "Read, listen, practice the Spartan Method, and keep useful resources close.",
  },
  {
    icon: "check-circle" as const,
    title: "Follow through",
    body: "Turn the conversation into one clear commitment and find it again later.",
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
        <Text style={styles.eyebrow}>SEE THE SYSTEM BEFORE YOU PAY</Text>
        <Text style={styles.title}>Know what is here, what it does, and what your next move can be.</Text>
        <Text style={styles.body}>
          Explore the app, walk through a realistic field scenario, compare membership access, and purchase securely through Apple. A Spartan account comes after purchase when you are ready to protect and sync your work.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/tour" as Href)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          testID="button-guided-tour"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryEyebrow}>GUIDED EXPERIENCE</Text>
            <Text style={styles.primaryButtonText}>Walk through Spartan Coaching</Text>
          </View>
          <Feather name="arrow-right" size={21} color="#FFFFFF" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/access" as Href)}
          style={({ pressed }) => [styles.accessButton, pressed && styles.pressed]}
          testID="button-view-complete-access"
        >
          <View style={styles.accessIcon}><Feather name="grid" size={19} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accessTitle}>See everything in the app</Text>
            <Text style={styles.accessBody}>Every destination, capability, membership boundary, offline rule, and privacy promise.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.sectionLabel}>WHAT YOU CAN DO</Text>
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
          <Text style={styles.sectionLabel}>INDIVIDUAL MEMBERSHIP</Text>
          <Text style={styles.sectionTitle}>Two plans. One clear difference.</Text>
          <Pressable style={styles.planRow} onPress={() => router.push("/membership" as Href)} accessibilityRole="button">
            <View style={styles.planCopy}>
              <Text style={styles.planName}>{MEMBERSHIP_ACCESS.standard.title}</Text>
              <Text style={styles.planDescription}>{MEMBERSHIP_ACCESS.standard.summary}</Text>
            </View>
            <Text style={styles.planPrice}>$14.99<Text style={styles.planCadence}> weekly</Text></Text>
          </Pressable>
          <Pressable style={[styles.planRow, styles.pathDivider]} onPress={() => router.push("/membership" as Href)} accessibilityRole="button">
            <View style={styles.planCopy}>
              <Text style={styles.planName}>{MEMBERSHIP_ACCESS.elite.title}</Text>
              <Text style={styles.planDescription}>{MEMBERSHIP_ACCESS.elite.summary}</Text>
            </View>
            <Text style={styles.planPrice}>$19.99<Text style={styles.planCadence}> weekly</Text></Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/membership" as Href)}
            style={styles.createAccountButton}
            testID="button-choose-membership"
          >
            <Text style={styles.createAccountText}>Compare and subscribe with Apple</Text>
            <Feather name="chevron-right" size={19} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/contact" as Href)} style={styles.consultingRow} accessibilityRole="button">
          <View style={styles.pathIcon}><Feather name="users" size={20} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pathTitle}>Need human consulting?</Text>
            <Text style={styles.pathBody}>Consulting is a separate contracted service with its own request and intake flow.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.trustRow}>
          <Feather name="lock" size={18} color={colors.primary} />
          <Text style={styles.trustText}>No patient PHI. Raw Coach conversations stay private and expire after 90 days. Organization admins never see private prompts, drafts, recordings, or transcripts.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    brandField: { minHeight: 222, backgroundColor: colors.heroBackground, paddingHorizontal: 22, paddingBottom: 24, justifyContent: "space-between" },
    brandTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    signInButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.30)" },
    signInText: { color: colors.heroForeground, fontSize: 14, ...font("semibold") },
    fieldLabel: { color: colors.heroMuted, fontSize: 10, letterSpacing: 2.2, ...font("bold") },
    main: { paddingHorizontal: 22, paddingTop: 34, gap: 14 },
    eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 35, lineHeight: 40, letterSpacing: -1.2, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, ...font("regular") },
    primaryButton: { minHeight: 72, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.primary, paddingHorizontal: 18, marginTop: 8, flexDirection: "row", alignItems: "center", gap: 12 },
    primaryEyebrow: { color: "rgba(255,255,255,0.72)", fontSize: 8, letterSpacing: 1.4, marginBottom: 3, ...font("bold") },
    primaryButtonText: { color: "#FFFFFF", fontSize: 16, ...font("bold") },
    accessButton: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong, paddingVertical: 12 },
    accessIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    accessTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    accessBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
    sectionLabel: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, marginTop: 12, ...font("bold") },
    pathList: { marginTop: 2 },
    pathRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 16 },
    pathDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    pathIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    pathCopy: { flex: 1, gap: 4 },
    pathTitle: { color: colors.foreground, fontSize: 16, ...font("bold") },
    pathBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    membershipSection: { marginTop: 12, paddingTop: 22, borderTopWidth: 1, borderTopColor: colors.borderStrong },
    sectionTitle: { color: colors.foreground, fontSize: 25, lineHeight: 30, letterSpacing: -0.6, marginTop: 7, marginBottom: 10, ...font("heavy") },
    planRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 16 },
    planCopy: { flex: 1, gap: 4 },
    planName: { color: colors.foreground, fontSize: 16, ...font("bold") },
    planDescription: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("regular") },
    planPrice: { color: colors.primary, fontSize: 16, fontVariant: ["tabular-nums"], ...font("heavy") },
    planCadence: { color: colors.mutedForeground, fontSize: 10, ...font("regular") },
    createAccountButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
    createAccountText: { color: colors.primary, fontSize: 15, ...font("bold") },
    consultingRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingVertical: 16 },
    trustRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primaryMuted, borderRadius: 16, padding: 15, marginTop: 4 },
    trustText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17, ...font("medium") },
  });
}
