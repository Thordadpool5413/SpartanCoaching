import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { MEMBERSHIP_ACCESS, SPARTAN_OFFERINGS, type SpartanAccess } from "@/lib/productExperience";
import { font } from "@/lib/typography";

function accessState(input: {
  isAuthenticated: boolean;
  canUseFieldKit: boolean;
  canUseElite: boolean;
  orgType?: string | null;
  role?: string | null;
  canManageOrganization?: boolean;
}): SpartanAccess {
  if (!input.isAuthenticated) return "visitor";
  if (input.canManageOrganization) return "admin";
  if (input.orgType === "company") return "company";
  if (input.canUseElite) return "elite";
  if (input.canUseFieldKit) return "standard";
  return "visitor";
}

export default function AccessScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, canUseFieldKit, canUseElite, canManageOrganization, user } = useAuth();
  const current = accessState({
    isAuthenticated,
    canUseFieldKit,
    canUseElite,
    orgType: user?.organization?.type,
    role: user?.member?.role,
    canManageOrganization,
  });

  const tierLabel =
    current === "admin" ? "Administrator access" :
    current === "company" ? "Company membership" :
    current === "elite" ? "Elite membership" :
    current === "standard" ? "Standard membership" :
    "Explore before you subscribe";

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 34 }]}
      showsVerticalScrollIndicator={false}
      testID="screen-access-map"
    >
      <View style={styles.brandField}>
        <BrandStamp width={166} height={98} />
        <Text style={styles.brandKicker}>YOUR SPARTAN SYSTEM</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.kicker}>WHAT YOU HAVE</Text>
        <Text style={styles.title}>No guessing. Every part of the app has a job.</Text>
        <Text style={styles.subtitle}>
          {tierLabel}. This map shows what each destination does, whether it is available to you, and what still works when your connection disappears at the worst possible moment.
        </Text>

        <View style={styles.planStrip}>
          <View style={styles.planColumn}>
            <Text style={styles.planName}>{MEMBERSHIP_ACCESS.standard.title}</Text>
            <Text style={styles.planPrice}>{MEMBERSHIP_ACCESS.standard.priceFallback}</Text>
            <Text style={styles.planBody}>{MEMBERSHIP_ACCESS.standard.summary}</Text>
          </View>
          <View style={styles.planDivider} />
          <View style={styles.planColumn}>
            <Text style={styles.planName}>{MEMBERSHIP_ACCESS.elite.title}</Text>
            <Text style={styles.planPrice}>{MEMBERSHIP_ACCESS.elite.priceFallback}</Text>
            <Text style={styles.planBody}>{MEMBERSHIP_ACCESS.elite.summary}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>THE COMPLETE APP</Text>
        {SPARTAN_OFFERINGS.map((offering) => {
          const included =
            offering.id === "admin" ? canManageOrganization :
            offering.id === "coach" ? canUseElite :
            offering.id === "tools" ? canUseFieldKit :
            true;
          const accessLabel = included
            ? offering.id === "tools" || offering.id === "coach" || offering.id === "admin" ? "INCLUDED IN YOUR ACCESS" : "AVAILABLE"
            : offering.id === "coach" && user?.organization?.type === "company" ? "REQUIRES COMPANY ELITE" :
              offering.id === "coach" ? "ELITE" : "PREVIEW";
          return (
            <Pressable
              key={offering.id}
              accessibilityRole="button"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(offering.route as any);
              }}
              style={({ pressed }) => [styles.offering, pressed && styles.pressed]}
              testID={`access-${offering.id}`}
            >
              <View style={styles.offeringTop}>
                <View style={[styles.icon, { backgroundColor: included ? colors.primaryMuted : colors.muted }]}>
                  <Feather name={included ? "check" : "lock"} size={18} color={included ? colors.primary : colors.mutedForeground} />
                </View>
                <View style={styles.offeringHeading}>
                  <Text style={styles.offeringTitle}>{offering.title}</Text>
                  <Text style={[styles.accessLabel, { color: included ? colors.success : colors.mutedForeground }]}>
                    {accessLabel}
                  </Text>
                </View>
                <Feather name="chevron-right" size={21} color={colors.mutedForeground} />
              </View>
              <Text style={styles.promise}>{offering.promise}</Text>
              <View style={styles.capabilities}>
                {offering.capabilities.map((capability) => (
                  <View key={capability} style={styles.capabilityRow}>
                    <View style={styles.dot} />
                    <Text style={styles.capability}>{capability}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.metaRow}>
                <Feather name="wifi-off" size={14} color={colors.primary} />
                <Text style={styles.metaText}>{offering.offline}</Text>
              </View>
              {offering.privacy ? (
                <View style={styles.metaRow}>
                  <Feather name="lock" size={14} color={colors.primary} />
                  <Text style={styles.metaText}>{offering.privacy}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {current === "visitor" ? (
          <View style={styles.ctaBlock}>
            <Text style={styles.ctaTitle}>Explore first. Pay when the value is clear.</Text>
            <Text style={styles.ctaBody}>Take the guided tour, compare Standard and Elite, then subscribe securely through Apple before creating a Spartan account.</Text>
            <SpartanButton title="Take the guided tour" onPress={() => router.push("/tour" as any)} />
            <SpartanButton title="Compare memberships" variant="outline" onPress={() => router.push("/membership" as any)} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: 0 },
    brandField: { minHeight: 184, backgroundColor: colors.heroBackground, alignItems: "center", justifyContent: "flex-end", paddingBottom: 21 },
    brandKicker: { color: colors.heroMuted, fontSize: 9, letterSpacing: 2.1, ...font("bold") },
    body: { paddingHorizontal: 20, paddingTop: 28, gap: 14 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 32, lineHeight: 37, letterSpacing: -0.9, ...font("heavy") },
    subtitle: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, ...font("regular") },
    planStrip: { flexDirection: "row", gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 20, borderCurve: "continuous", padding: 16, marginTop: 4 },
    planColumn: { flex: 1, gap: 5 },
    planDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
    planName: { color: colors.foreground, fontSize: 17, ...font("heavy") },
    planPrice: { color: colors.primary, fontSize: 13, fontVariant: ["tabular-nums"], ...font("bold") },
    planBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, ...font("regular") },
    sectionLabel: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, marginTop: 14, ...font("bold") },
    offering: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingVertical: 19, gap: 11 },
    offeringTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    offeringHeading: { flex: 1, gap: 2 },
    offeringTitle: { color: colors.foreground, fontSize: 18, ...font("heavy") },
    accessLabel: { fontSize: 9, letterSpacing: 1.1, ...font("bold") },
    promise: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, ...font("regular") },
    capabilities: { gap: 6 },
    capabilityRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    dot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, backgroundColor: colors.primary },
    capability: { flex: 1, color: colors.foreground, fontSize: 12, lineHeight: 18, ...font("medium") },
    metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: colors.muted, borderRadius: 12, padding: 10 },
    metaText: { flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15, ...font("regular") },
    pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
    ctaBlock: { marginTop: 8, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.heroBackground, padding: 18, gap: 11 },
    ctaTitle: { color: colors.heroForeground, fontSize: 20, lineHeight: 25, ...font("heavy") },
    ctaBody: { color: colors.heroMuted, fontSize: 12, lineHeight: 18, ...font("regular") },
  });
}
