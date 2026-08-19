import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { beginGuidedTour, shouldAutoPresentGuidedTour } from "@/lib/guidedTour";

const STARTS = [
  {
    icon: "message-square" as const,
    title: "Plan the conversation",
    body: "Set the purpose, talking points, likely objection, and next move.",
    route: "/tour",
  },
  {
    icon: "shield" as const,
    title: "Practice with Spartan Coach",
    body: "Private text or voice rehearsal with Elite.",
    route: "/(tabs)/coach",
  },
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

        <View style={styles.badge}><Text style={styles.badgeText}>YOUR HOSPICE SALES FIELD GUIDE</Text></View>
        <Text style={styles.title}>Know what to do next.</Text>
        <Text style={styles.body}>Prepare the conversation, practice the moment, and follow through with clarity.</Text>

        <View style={styles.productMap} accessibilityLabel="Spartan Coaching includes planning, practice, measurement, and a field library">
          <ProductPillar icon="edit-3" label="Plan" />
          <ProductPillar icon="message-circle" label="Practice" />
          <ProductPillar icon="bar-chart-2" label="Measure" />
          <ProductPillar icon="book-open" label="Library" />
        </View>

        <View style={styles.startList}>
          {STARTS.map((item) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={() => open(item.route)}
              style={({ pressed }) => [styles.startCard, pressed && styles.pressed]}
            >
              <View style={styles.startIcon}><Feather name={item.icon} size={21} color={colors.primary} /></View>
              <View style={styles.startCopy}>
                <Text style={styles.startTitle}>{item.title}</Text>
                <Text style={styles.startBody}>{item.body}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.primary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => open("/tour")}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          testID="button-guided-tour"
        >
          <Text style={styles.primaryButtonText}>See how the app works</Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.priceCopy}>{signedIn ? "Standard is $14.99 per week. Elite is $19.99 per week. Purchase securely through Apple." : "Standard is $14.99 per week. Elite is $19.99 per week. Purchase through Apple without creating an account first."}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => open("/membership")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          testID="button-choose-membership"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryTitle}>Compare Standard and Elite</Text>
            <Text style={styles.secondaryBody}>See every capability, privacy rule, and offline boundary.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => open("/(tabs)/contact")}
          style={({ pressed }) => [styles.consulting, pressed && styles.pressed]}
        >
          <Text style={styles.consultingText}>Need human consulting? View separate options</Text>
        </Pressable>

        <View style={styles.trust}>
          <Feather name="lock" size={17} color={colors.primary} />
          <Text style={styles.trustText}>No patient PHI. Raw Coach conversations stay private and expire after 90 days.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ProductPillar({ icon, label }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.productPillar}><Feather name={icon} size={18} color={colors.primary} /><Text style={styles.productPillarLabel}>{label}</Text></View>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    page: { paddingHorizontal: 24 },
    badge: { alignSelf: "flex-start", marginTop: 16, borderRadius: 999, backgroundColor: colors.secondary, paddingHorizontal: 11, paddingVertical: 7 },
    badgeText: { color: colors.primary, fontSize: 9, letterSpacing: 0.3, ...font("bold") },
    title: { color: colors.foreground, fontSize: 40, lineHeight: 46, letterSpacing: -1.5, marginTop: 24, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 16, lineHeight: 23, marginTop: 4, maxWidth: 355, ...font("regular") },
    productMap: { flexDirection: "row", gap: 7, marginTop: 24 },
    productPillar: { flex: 1, minHeight: 66, alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 16, borderCurve: "continuous", backgroundColor: colors.secondary },
    productPillarLabel: { color: colors.foreground, fontSize: 9, ...font("bold") },
    startList: { gap: 12, marginTop: 36 },
    startCard: { minHeight: 98, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 20, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
    startIcon: { width: 44, height: 44, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    startCopy: { flex: 1, gap: 4 },
    startTitle: { color: colors.foreground, fontSize: 16, lineHeight: 20, ...font("bold") },
    startBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17, ...font("regular") },
    primaryButton: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.primary, marginTop: 26, paddingHorizontal: 18 },
    primaryButtonText: { color: "#FFFFFF", fontSize: 16, ...font("bold") },
    priceCopy: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 13, paddingHorizontal: 8, ...font("regular") },
    secondaryButton: { minHeight: 80, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    secondaryTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    secondaryBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, maxWidth: 305, ...font("regular") },
    consulting: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 18 },
    consultingText: { color: colors.primary, fontSize: 12, textAlign: "center", ...font("bold") },
    trust: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 16, backgroundColor: colors.primaryMuted, padding: 14, marginTop: 8 },
    trustText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  });
}
