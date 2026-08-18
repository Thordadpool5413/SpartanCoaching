import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppleSubscriptionActions, type AppleSubscriptionDisplayPrices } from "@/components/AppleSubscriptionActions";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

type Plan = "standard_weekly" | "elite_weekly";

const FEATURES = [
  { label: "Conversation planning and field tools", standard: true, elite: true },
  { label: "Objections, playbooks, email, and weekly planning", standard: true, elite: true },
  { label: "Calculators, Library, downloads, and saved work", standard: true, elite: true },
  { label: "Private Spartan Coach", standard: false, elite: true },
  { label: "Voice rehearsal and transcription", standard: false, elite: true },
  { label: "Deidentified clinical education tools", standard: false, elite: true },
];

export default function MembershipScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, canUseFieldKit, canUseElite, refresh, user } = useAuth();
  const [plan, setPlan] = useState<Plan>("elite_weekly");
  const [prices, setPrices] = useState<AppleSubscriptionDisplayPrices>({});
  const [purchased, setPurchased] = useState(false);

  const selectPlan = (next: Plan) => {
    void Haptics.selectionAsync();
    setPlan(next);
  };

  if (canUseElite) {
    const personal = user?.organization?.type === "personal";
    return (
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.kicker}>MEMBERSHIP ACTIVE</Text>
        <Text style={styles.title}>{canUseElite ? "Elite is ready." : "Standard is ready."}</Text>
        <Text style={styles.subtitle}>Your current access follows you across this iPhone and the Spartan Coaching web workspace.</Text>
        <View style={styles.successCard}>
          <Feather name="check-circle" size={30} color={colors.success} />
          <Text style={styles.successTitle}>Everything included in your plan is unlocked.</Text>
        </View>
        {personal ? <AppleSubscriptionActions isAuthenticated showManage onEntitlementChanged={refresh} /> : null}
        <SpartanButton title="Go to Home" onPress={() => router.replace("/(tabs)")} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}
      showsVerticalScrollIndicator={false}
      testID="screen-membership"
    >
      <View style={styles.brandHeader}>
        <BrandStamp width={176} height={104} />
        <Text style={styles.brandLine}>CHOOSE YOUR FIELD ADVANTAGE</Text>
      </View>

      <View style={styles.content}>
        {purchased && !isAuthenticated ? (
          <View style={styles.purchaseComplete} testID="purchase-complete">
            <View style={styles.completeIcon}><Feather name="check" size={24} color="#FFFFFF" /></View>
            <Text style={styles.completeTitle}>Apple confirmed your membership.</Text>
            <Text style={styles.completeBody}>Now protect your purchase and sync your work. Create a Spartan account or sign in. You will not be charged again.</Text>
            <SpartanButton title="Create my account" onPress={() => router.push("/register")} style={{ marginTop: 8 }} />
            <SpartanButton title="I already have an account" variant="outline" onPress={() => router.push("/login")} />
          </View>
        ) : (
          <>
            <Text style={styles.kicker}>{canUseFieldKit ? "STANDARD MEMBERSHIP ACTIVE" : "INDIVIDUAL MEMBERSHIP"}</Text>
            <Text style={styles.title}>{canUseFieldKit ? "Add private Coach to your field system." : "Subscribe first. Create your account next."}</Text>
            <Text style={styles.subtitle}>{canUseFieldKit ? "Upgrade to Elite through Apple. StoreKit applies the change within the same subscription group, and your account and saved work stay intact." : "Choose the access you want and pay securely through Apple. No Spartan account is required before purchase."}</Text>

            {canUseFieldKit ? <View style={styles.currentPlanBanner}><Feather name="check-circle" size={19} color={colors.success} /><View style={{ flex: 1 }}><Text style={styles.currentPlanTitle}>Standard is active</Text><Text style={styles.currentPlanBody}>Field tools, Library, planning, and saved work are already unlocked.</Text></View></View> : null}

            <View accessibilityRole="radiogroup" style={styles.planGrid}>
              <PlanCard
                selected={!canUseFieldKit && plan === "standard_weekly"}
                title="Standard"
                price={prices.standard_weekly || "$14.99"}
                descriptor="The complete field system"
                badge={canUseFieldKit ? "CURRENT" : undefined}
                disabled={canUseFieldKit}
                onPress={() => selectPlan("standard_weekly")}
              />
              <PlanCard
                selected={plan === "elite_weekly"}
                title="Elite"
                price={prices.elite_weekly || "$19.99"}
                descriptor="Field system plus private Coach"
                badge="RECOMMENDED"
                onPress={() => selectPlan("elite_weekly")}
              />
            </View>

            <View style={styles.compareCard}>
              <View style={styles.compareHeader}>
                <Text style={[styles.compareFeature, styles.compareHeading]}>WHAT YOU GET</Text>
                <Text style={styles.comparePlan}>STANDARD</Text>
                <Text style={styles.comparePlan}>ELITE</Text>
              </View>
              {FEATURES.map((feature) => (
                <View key={feature.label} style={styles.compareRow}>
                  <Text style={styles.compareFeature}>{feature.label}</Text>
                  <AccessIcon enabled={feature.standard} color={colors.primary} muted={colors.mutedForeground} />
                  <AccessIcon enabled={feature.elite} color={colors.primary} muted={colors.mutedForeground} />
                </View>
              ))}
            </View>

            <View style={styles.purchaseCard}>
              <AppleSubscriptionActions
                plan={plan}
                isAuthenticated={isAuthenticated}
                showPurchase
                onPricesLoaded={setPrices}
                onPurchaseComplete={async () => {
                  if (isAuthenticated) {
                    await refresh();
                  } else {
                    setPurchased(true);
                  }
                }}
                onEntitlementChanged={isAuthenticated ? refresh : undefined}
              />
              {!isAuthenticated ? <Text style={styles.accountNote}>After Apple confirms payment, you will create or sign in to one private Spartan account to sync access and saved work.</Text> : null}
            </View>

            <View style={styles.teamCard}>
              <Feather name="users" size={21} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.teamTitle}>Enrolling a company team?</Text>
                <Text style={styles.teamBody}>Team access uses a separate provider agreement, contracted seats, and discounted pricing.</Text>
                <Pressable onPress={() => router.push("/(tabs)/contact")} style={styles.teamLink}>
                  <Text style={styles.teamLinkText}>Request team access</Text>
                  <Feather name="chevron-right" size={17} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            {!isAuthenticated ? (
              <Pressable onPress={() => router.push("/login")} style={styles.signInLink}>
                <Text style={styles.signInText}>Already have a Spartan account? Sign in</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function PlanCard({ selected, title, price, descriptor, badge, disabled = false, onPress }: { selected: boolean; title: string; price: string; descriptor: string; badge?: string; disabled?: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={[stylesStatic.planCard, { backgroundColor: selected ? colors.primaryMuted : colors.card, borderColor: selected ? colors.primary : colors.borderStrong, borderWidth: selected ? 2 : 1, opacity: disabled ? 0.78 : 1 }]}> 
      {badge ? <Text style={[stylesStatic.badge, { color: colors.primary }]}>{badge}</Text> : null}
      <Text style={[stylesStatic.planTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[stylesStatic.planPrice, { color: colors.primary }]}>{price}<Text style={[stylesStatic.planCadence, { color: colors.mutedForeground }]}> / week</Text></Text>
      <Text style={[stylesStatic.planDescriptor, { color: colors.mutedForeground }]}>{descriptor}</Text>
      <View style={[stylesStatic.radio, { borderColor: selected ? colors.primary : colors.borderStrong }]}>{selected ? <View style={[stylesStatic.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
    </Pressable>
  );
}

function AccessIcon({ enabled, color, muted }: { enabled: boolean; color: string; muted: string }) {
  return <View style={stylesStatic.accessCell}><Feather name={enabled ? "check-circle" : "minus"} size={17} color={enabled ? color : muted} /></View>;
}

const stylesStatic = StyleSheet.create({
  planCard: { flex: 1, minHeight: 154, borderRadius: 20, borderCurve: "continuous", padding: 15, position: "relative" },
  badge: { fontSize: 8, letterSpacing: 1.2, fontWeight: "800", minHeight: 18 },
  planTitle: { fontSize: 20, fontWeight: "800" },
  planPrice: { fontSize: 20, fontWeight: "800", marginTop: 9, fontVariant: ["tabular-nums"] },
  planCadence: { fontSize: 10, fontWeight: "500" },
  planDescriptor: { fontSize: 11, lineHeight: 16, marginTop: 7, maxWidth: 120 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center", position: "absolute", right: 13, top: 13 },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  accessCell: { width: 62, alignItems: "center" },
});

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    brandHeader: { minHeight: 196, backgroundColor: colors.heroBackground, alignItems: "center", justifyContent: "flex-end", paddingBottom: 22 },
    brandLine: { color: colors.heroMuted, fontSize: 9, letterSpacing: 2.2, ...font("bold") },
    content: { paddingHorizontal: 20, paddingTop: 28, gap: 14 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 32, lineHeight: 37, letterSpacing: -0.9, ...font("heavy") },
    subtitle: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, ...font("regular") },
    planGrid: { flexDirection: "row", gap: 10, marginTop: 7 },
    compareCard: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 20, borderCurve: "continuous", overflow: "hidden", marginTop: 5 },
    compareHeader: { minHeight: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, backgroundColor: colors.muted },
    compareHeading: { color: colors.mutedForeground, fontSize: 9, letterSpacing: 1.1, ...font("bold") },
    comparePlan: { width: 62, color: colors.primary, fontSize: 8, textAlign: "center", letterSpacing: 0.8, ...font("bold") },
    compareRow: { minHeight: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    compareFeature: { flex: 1, color: colors.foreground, fontSize: 12, lineHeight: 17, ...font("semibold") },
    purchaseCard: { borderRadius: 20, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 17, marginTop: 4 },
    accountNote: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 10, ...font("regular") },
    teamCard: { flexDirection: "row", gap: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 16 },
    teamTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    teamBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 4, ...font("regular") },
    teamLink: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
    teamLinkText: { color: colors.primary, fontSize: 12, ...font("bold") },
    signInLink: { minHeight: 48, alignItems: "center", justifyContent: "center" },
    signInText: { color: colors.primary, fontSize: 13, ...font("bold") },
    purchaseComplete: { borderRadius: 22, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card, padding: 20, gap: 10 },
    completeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
    completeTitle: { color: colors.foreground, fontSize: 25, lineHeight: 30, ...font("heavy") },
    completeBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, ...font("regular") },
    successCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 18, alignItems: "center", gap: 10, marginVertical: 8 },
    successTitle: { color: colors.foreground, fontSize: 17, textAlign: "center", ...font("bold") },
    currentPlanBanner: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderRadius: 17, backgroundColor: "rgba(47,118,84,0.12)", borderWidth: 1, borderColor: "rgba(47,118,84,0.32)", padding: 14 },
    currentPlanTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    currentPlanBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
  });
}
