import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { beginGuidedTour, shouldAutoPresentGuidedTour } from "@/lib/guidedTour";

const PILLARS = [
  { icon: "edit-3" as const, label: "Plan", description: "Build the plan", route: "/(tabs)/tools?category=Plan" },
  { icon: "message-circle" as const, label: "Practice", description: "Rehearse the moment", route: "/(tabs)/tools?category=Practice" },
  { icon: "bar-chart-2" as const, label: "Measure", description: "Track progress", route: "/(tabs)/tools?category=Measure" },
  { icon: "book-open" as const, label: "Library", description: "Read, listen, and use", route: "/(tabs)/learn" },
];

export function WelcomeExperience({ topPad, bottomPad, signedIn = false }: { topPad: number; bottomPad: number; signedIn?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const autoTourStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void shouldAutoPresentGuidedTour().then(async (shouldPresent) => {
        if (cancelled || !shouldPresent || autoTourStarted.current) return;
        autoTourStarted.current = true;
        await beginGuidedTour();
        router.push("/tour" as Href);
      });
    }, 900);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const open = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as Href);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 34 }}
      showsVerticalScrollIndicator={false}
      testID="screen-logged-out-home"
    >
      <View style={styles.page}>
        <SpartanHeader actionLabel={signedIn ? undefined : "Sign in"} />

        <View style={styles.badge}><Text style={styles.badgeText}>HOSPICE SALES PRO</Text></View>
        <Text style={styles.title}>Start with what you need.</Text>
          <Text style={styles.body}>Choose where to begin. The app separates daily field tools, Library learning, private practice, and saved continuity.</Text>

        <Text style={styles.sectionLabel}>OPEN A WORKSPACE</Text>
        <View style={styles.productMap} accessibilityLabel="Open planning, practice, measurement, or the Library">
          {PILLARS.map((pillar) => (
            <ProductPillar key={pillar.label} {...pillar} onPress={() => open(pillar.route)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>RECOMMENDED START</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plan the next conversation"
          onPress={() => open("/sales-workflow")}
          style={({ pressed }) => [styles.recommendedCard, pressed && styles.pressed]}
          testID="home-recommended-plan"
        >
          <View style={styles.recommendedIcon}><Feather name="target" size={23} color="#FFFFFF" /></View>
          <View style={styles.recommendedCopy}>
            <Text style={styles.recommendedEyebrow}>PREPARE FOR THE ROOM</Text>
            <Text style={styles.recommendedTitle}>Plan the next conversation</Text>
            <Text style={styles.recommendedBody}>Set the purpose, likely resistance, talking points, and one clear next move.</Text>
          </View>
          <Feather name="arrow-up-right" size={21} color="#FFFFFF" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => open("/(tabs)/tools")}
          style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
          testID="button-explore-all-tools"
        >
          <View>
            <Text style={styles.exploreTitle}>Explore all {FIELD_KIT_TOOLS.length} field tools</Text>
            <Text style={styles.exploreBody}>Browse tools by Plan, Prepare, Practice, Measure, or Outreach.</Text>
          </View>
          <Feather name="grid" size={22} color={colors.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => open("/tour")}
          style={({ pressed }) => [styles.tourRow, pressed && styles.pressed]}
          testID="button-guided-tour"
        >
          <View style={styles.tourIcon}><Feather name="compass" size={20} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tourTitle}>Take the complete app tour</Text>
            <Text style={styles.tourBody}>Learn every destination, tool family, Library experience, saved work flow, and website connection.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.membershipCard}>
          <Text style={styles.membershipEyebrow}>CHOOSE THE ACCESS THAT FITS</Text>
          <View style={styles.planRow}>
            <View style={styles.planCopy}>
              <Text style={styles.planName}>Standard</Text>
              <Text style={styles.planPrice}>$14.99 weekly</Text>
              <Text style={styles.planValue}>Complete planning, practice, measurement, Library, downloads, saved work, and offline access.</Text>
            </View>
            <View style={styles.planDivider} />
            <View style={styles.planCopy}>
              <Text style={styles.planName}>Elite</Text>
              <Text style={styles.planPrice}>$19.99 weekly</Text>
              <Text style={styles.planValue}>Everything in Standard plus private Coach, voice rehearsal, transcription, and advanced feedback.</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => open("/membership")}
            style={({ pressed }) => [styles.membershipButton, pressed && styles.pressed]}
            testID="button-choose-membership"
          >
            <Text style={styles.membershipButtonText}>Compare and subscribe through Apple</Text>
            <Feather name="arrow-right" size={19} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.purchaseNote}>{signedIn ? "Purchase securely through Apple." : "No Spartan account is required before Apple purchase."}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => open("/(tabs)/contact")}
          style={({ pressed }) => [styles.consulting, pressed && styles.pressed]}
        >
          <Text style={styles.consultingText}>Need human consulting or company access?</Text>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </Pressable>

        <View style={styles.trust}>
          <Feather name="lock" size={17} color={colors.primary} />
          <Text style={styles.trustText}>No patient PHI. Raw Coach conversations stay private and expire after 90 days.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ProductPillar({ icon, label, description, route, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; description: string; route: string; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      accessibilityHint={`Opens ${route.includes("library") ? "the Library" : `${label} tools`}`}
      onPress={onPress}
      style={({ pressed }) => [styles.productPillar, pressed && styles.productPillarPressed]}
      testID={`home-pillar-${label.toLowerCase()}`}
    >
      <View style={styles.productPillarTop}>
        <View style={styles.productPillarIcon}><Feather name={icon} size={20} color={colors.primary} /></View>
        <Feather name="arrow-up-right" size={17} color={colors.primary} />
      </View>
      <Text style={styles.productPillarLabel}>{label}</Text>
      <Text style={styles.productPillarDescription}>{description}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    page: { paddingHorizontal: 24 },
    badge: { alignSelf: "flex-start", marginTop: 16, borderRadius: 999, backgroundColor: colors.secondary, paddingHorizontal: 11, paddingVertical: 7 },
    badgeText: { color: colors.primary, fontSize: 9, letterSpacing: 0.3, ...font("bold") },
    title: { color: colors.foreground, fontSize: 40, lineHeight: 46, letterSpacing: -1.5, marginTop: 24, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 16, lineHeight: 23, marginTop: 4, maxWidth: 355, ...font("regular") },
    sectionLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.8, marginTop: 26, marginBottom: 10, ...font("bold") },
    productMap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    productPillar: { flexBasis: "47%", flexGrow: 1, minHeight: 118, justifyContent: "space-between", padding: 15, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
    productPillarPressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
    productPillarTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    productPillarIcon: { width: 38, height: 38, borderRadius: 12, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    productPillarLabel: { color: colors.foreground, fontSize: 16, marginTop: 12, ...font("heavy") },
    productPillarDescription: { color: colors.mutedForeground, fontSize: 11, lineHeight: 15, marginTop: 3, ...font("regular") },
    recommendedCard: { minHeight: 150, flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 22, borderCurve: "continuous", backgroundColor: colors.heroBackground, borderWidth: 1, borderColor: colors.primary },
    recommendedIcon: { width: 50, height: 50, borderRadius: 16, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
    recommendedCopy: { flex: 1, gap: 5 },
    recommendedEyebrow: { color: colors.primary, fontSize: 8, letterSpacing: 1.5, ...font("bold") },
    recommendedTitle: { color: colors.heroForeground, fontSize: 18, lineHeight: 22, ...font("heavy") },
    recommendedBody: { color: colors.heroMuted, fontSize: 12, lineHeight: 18, ...font("regular") },
    exploreButton: { minHeight: 82, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    exploreTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    exploreBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4, maxWidth: 300, ...font("regular") },
    tourRow: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    tourIcon: { width: 44, height: 44, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    tourTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    tourBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3, ...font("regular") },
    membershipCard: { borderRadius: 22, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 17, marginTop: 24, gap: 13 },
    membershipEyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 1.5, ...font("bold") },
    planRow: { flexDirection: "row", gap: 13 },
    planCopy: { flex: 1, gap: 3 },
    planDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
    planName: { color: colors.foreground, fontSize: 17, ...font("heavy") },
    planPrice: { color: colors.primary, fontSize: 12, ...font("bold") },
    planValue: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4, ...font("regular") },
    membershipButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, borderCurve: "continuous", backgroundColor: colors.primary, paddingHorizontal: 14 },
    membershipButtonText: { color: "#FFFFFF", fontSize: 14, textAlign: "center", ...font("bold") },
    purchaseNote: { color: colors.mutedForeground, fontSize: 10, textAlign: "center", ...font("regular") },
    consulting: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
    consultingText: { color: colors.primary, fontSize: 12, textAlign: "center", ...font("bold") },
    trust: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 16, backgroundColor: colors.primaryMuted, padding: 14 },
    trustText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  });
}
