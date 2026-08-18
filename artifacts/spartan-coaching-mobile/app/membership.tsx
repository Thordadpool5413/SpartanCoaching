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
import { MEMBERSHIP_ACCESS } from "@/lib/productExperience";
import { font } from "@/lib/typography";

type Plan = "standard_weekly" | "elite_weekly";

const SHARED = [
  "Home and guided planning",
  "Sales tools and role play",
  "Playbooks, research, outreach, and calculators",
  "Weekly planning and saved work",
  "Library, Method, drills, quiz, and approved resources",
];

const ELITE_ONLY = [
  "Private Spartan Coach",
  "Voice rehearsal and transcription",
  "Optional editable Coach memory",
  "Advanced AI coaching",
  "Deidentified clinical education tools",
];

export default function MembershipScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, canUseFieldKit, canUseElite, refresh, user } = useAuth();
  const [plan, setPlan] = useState<Plan>(canUseFieldKit && !canUseElite ? "elite_weekly" : "standard_weekly");
  const [prices, setPrices] = useState<AppleSubscriptionDisplayPrices>({});
  const [purchased, setPurchased] = useState(false);

  const companyAccess = user?.organization?.type === "company";
  const personalAccess = user?.organization?.type === "personal";
  const standardPrice = prices.standard_weekly || "$14.99";
  const elitePrice = prices.elite_weekly || "$19.99";

  const selectPlan = (next: Plan) => {
    if (canUseFieldKit && !canUseElite && next === "standard_weekly") return;
    void Haptics.selectionAsync();
    setPlan(next);
  };

  if (companyAccess) {
    return (
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.brandHeader}><BrandStamp width={168} height={98} /><Text style={styles.brandLine}>COMPANY ACCESS</Text></View>
        <Text style={styles.kicker}>CONTRACTED MEMBERSHIP</Text>
        <Text style={styles.title}>Your access is provided by your organization.</Text>
        <Text style={styles.subtitle}>Company seats are governed by the provider agreement, contracted tier, seat count, and activation status. They are separate from an individual Apple subscription.</Text>
        <View style={styles.statusCard}>
          <Feather name="briefcase" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{canUseElite ? "Company Elite" : canUseFieldKit ? "Company Standard" : "Company seat pending"}</Text>
            <Text style={styles.statusBody}>Your account history, commitments, preferences, and saved work stay with the same account when company access changes.</Text>
          </View>
        </View>
        <SpartanButton title="See everything in my access" onPress={() => router.push("/access" as any)} />
        <SpartanButton title="Back to Home" variant="outline" onPress={() => router.replace("/(tabs)" as any)} />
      </ScrollView>
    );
  }

  if (canUseElite) {
    return (
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.brandHeader}><BrandStamp width={168} height={98} /><Text style={styles.brandLine}>ELITE ACTIVE</Text></View>
        <Text style={styles.kicker}>YOUR MEMBERSHIP</Text>
        <Text style={styles.title}>Elite is unlocked.</Text>
        <Text style={styles.subtitle}>{MEMBERSHIP_ACCESS.elite.summary}</Text>
        <View style={styles.statusCard}>
          <Feather name="check-circle" size={25} color={colors.success} />
          <View style={{ flex: 1 }}><Text style={styles.statusTitle}>Complete individual access</Text><Text style={styles.statusBody}>Coach, voice rehearsal, advanced AI, field tools, Library, and saved work are available to this account.</Text></View>
        </View>
        {personalAccess ? <AppleSubscriptionActions isAuthenticated showManage onEntitlementChanged={refresh} onPricesLoaded={setPrices} /> : null}
        <SpartanButton title="See everything in my access" onPress={() => router.push("/access" as any)} />
        <SpartanButton title="Go to Home" variant="outline" onPress={() => router.replace("/(tabs)" as any)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}
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
            <Text style={styles.completeBody}>Payment is complete. Create or connect one Spartan account now to protect the purchase and sync your work. You will not be charged again.</Text>
            <SpartanButton title="Create my Spartan account" onPress={() => router.push("/register" as any)} />
            <SpartanButton title="I already have an account" variant="outline" onPress={() => router.push("/login" as any)} />
          </View>
        ) : (
          <>
            <Text style={styles.kicker}>{canUseFieldKit ? "STANDARD ACTIVE" : "INDIVIDUAL MEMBERSHIP"}</Text>
            <Text style={styles.title}>{canUseFieldKit ? "Add private Coach when you want the complete system." : "Know exactly what you are buying before Apple asks you to confirm."}</Text>
            <Text style={styles.subtitle}>{canUseFieldKit ? "Your Standard access, history, preferences, commitments, and saved work stay intact when you upgrade." : "Browse the app first. Choose Standard or Elite here. Payment happens through Apple before Spartan account creation."}</Text>

            <Pressable onPress={() => router.push("/access" as any)} style={styles.accessMapRow} accessibilityRole="button">
              <View style={styles.accessMapIcon}><Feather name="grid" size={19} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.accessMapTitle}>See the complete access map</Text><Text style={styles.accessMapBody}>Every destination, capability, offline rule, and privacy boundary before you subscribe.</Text></View>
              <Feather name="chevron-right" size={20} color={colors.primary} />
            </Pressable>

            {canUseFieldKit ? <View style={styles.currentPlanBanner}><Feather name="check-circle" size={19} color={colors.success} /><View style={{ flex: 1 }}><Text style={styles.currentPlanTitle}>Standard is already active</Text><Text style={styles.currentPlanBody}>The only individual upgrade is Elite. There is no second Standard purchase.</Text></View></View> : null}

            <View accessibilityRole="radiogroup" style={styles.planGrid}>
              <PlanCard
                selected={!canUseFieldKit && plan === "standard_weekly"}
                title="Standard"
                price={standardPrice}
                descriptor="The complete field system"
                badge={canUseFieldKit ? "CURRENT" : undefined}
                disabled={canUseFieldKit}
                onPress={() => selectPlan("standard_weekly")}
              />
              <PlanCard
                selected={plan === "elite_weekly"}
                title="Elite"
                price={elitePrice}
                descriptor="Field system plus private Coach"
                badge="COMPLETE"
                onPress={() => selectPlan("elite_weekly")}
              />
            </View>

            <View style={styles.compareCard}>
              <Text style={styles.compareKicker}>BOTH PLANS INCLUDE</Text>
              {SHARED.map((feature) => <FeatureRow key={feature} label={feature} included />)}
              <View style={styles.compareDivider} />
              <Text style={styles.compareKicker}>ELITE ADDS</Text>
              {ELITE_ONLY.map((feature) => <FeatureRow key={feature} label={feature} included elite />)}
            </View>

            <View style={styles.purchaseCard}>
              <Text style={styles.purchaseTitle}>{plan === "elite_weekly" ? "Purchase Elite through Apple" : "Purchase Standard through Apple"}</Text>
              <Text style={styles.purchaseBody}>Apple shows the final localized price and confirmation. Restore Purchases is available without signing in to Spartan Coaching.</Text>
              <AppleSubscriptionActions
                plan={plan}
                isAuthenticated={isAuthenticated}
                showPurchase
                onPricesLoaded={setPrices}
                onPurchaseComplete={async () => {
                  if (isAuthenticated) await refresh();
                  else setPurchased(true);
                }}
                onEntitlementChanged={isAuthenticated ? refresh : undefined}
              />
            </View>

            <View style={styles.separateCard}>
              <Feather name="users" size={21} color={colors.primary} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.separateTitle}>Company seats and consulting are separate.</Text>
                <Text style={styles.separateBody}>Company access uses a signed provider agreement and contracted seats. Human consulting is separately scoped and contracted. Neither is an Apple individual subscription.</Text>
                <Pressable onPress={() => router.push("/(tabs)/contact" as any)} style={styles.inlineLink}><Text style={styles.inlineLinkText}>Open consulting and team requests</Text><Feather name="chevron-right" size={17} color={colors.primary} /></Pressable>
              </View>
            </View>

            {!isAuthenticated ? <Pressable onPress={() => router.push("/login" as any)} style={styles.signInLink}><Text style={styles.signInText}>Already have a Spartan account? Sign in</Text></Pressable> : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function PlanCard({ selected, title, price, descriptor, badge, disabled = false, onPress }: { selected: boolean; title: string; price: string; descriptor: string; badge?: string; disabled?: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={[stylesStatic.planCard, { backgroundColor: selected ? colors.primaryMuted : colors.card, borderColor: selected ? colors.primary : colors.borderStrong, borderWidth: selected ? 2 : 1, opacity: disabled ? 0.72 : 1 }]}>
      {badge ? <Text style={[stylesStatic.badge, { color: colors.primary }]}>{badge}</Text> : null}
      <Text style={[stylesStatic.planTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[stylesStatic.planPrice, { color: colors.primary }]}>{price}<Text style={[stylesStatic.planCadence, { color: colors.mutedForeground }]}> / week</Text></Text>
      <Text style={[stylesStatic.planDescriptor, { color: colors.mutedForeground }]}>{descriptor}</Text>
      <View style={[stylesStatic.radio, { borderColor: selected ? colors.primary : colors.borderStrong }]}>{selected ? <View style={[stylesStatic.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
    </Pressable>
  );
}

function FeatureRow({ label, included, elite = false }: { label: string; included: boolean; elite?: boolean }) {
  const colors = useColors();
  return <View style={stylesStatic.featureRow}><Feather name={included ? "check-circle" : "minus"} size={18} color={elite ? colors.primary : colors.success} /><Text style={[stylesStatic.featureLabel, { color: colors.foreground }]}>{label}</Text>{elite ? <Text style={[stylesStatic.eliteTag, { color: colors.primary }]}>ELITE</Text> : null}</View>;
}

const stylesStatic = StyleSheet.create({
  planCard: { flex: 1, minHeight: 156, borderRadius: 20, borderCurve: "continuous", padding: 15, position: "relative" },
  badge: { fontSize: 8, letterSpacing: 1.2, fontWeight: "800", minHeight: 18 },
  planTitle: { fontSize: 20, fontWeight: "800" },
  planPrice: { fontSize: 20, fontWeight: "800", marginTop: 9, fontVariant: ["tabular-nums"] },
  planCadence: { fontSize: 10, fontWeight: "500" },
  planDescriptor: { fontSize: 11, lineHeight: 16, marginTop: 7, maxWidth: 120 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center", position: "absolute", right: 13, top: 13 },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  featureRow: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10 },
  featureLabel: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  eliteTag: { fontSize: 8, letterSpacing: 1, fontWeight: "800" },
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
    statusCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, borderCurve: "continuous", padding: 16 },
    statusTitle: { color: colors.foreground, fontSize: 16, ...font("bold") },
    statusBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 4, ...font("regular") },
    accessMapRow: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, paddingVertical: 13 },
    accessMapIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    accessMapTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    accessMapBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3, ...font("regular") },
    currentPlanBanner: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderRadius: 17, backgroundColor: "rgba(47,118,84,0.12)", borderWidth: 1, borderColor: "rgba(47,118,84,0.32)", padding: 14 },
    currentPlanTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    currentPlanBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    planGrid: { flexDirection: "row", gap: 10, marginTop: 5 },
    compareCard: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 20, borderCurve: "continuous", paddingHorizontal: 15, paddingVertical: 12 },
    compareKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.3, marginVertical: 6, ...font("bold") },
    compareDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: 7 },
    purchaseCard: { borderRadius: 20, borderCurve: "continuous", borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card, padding: 17, gap: 8 },
    purchaseTitle: { color: colors.foreground, fontSize: 18, ...font("heavy") },
    purchaseBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, ...font("regular") },
    separateCard: { flexDirection: "row", gap: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 16 },
    separateTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    separateBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("regular") },
    inlineLink: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 4 },
    inlineLinkText: { color: colors.primary, fontSize: 11, ...font("bold") },
    signInLink: { minHeight: 48, alignItems: "center", justifyContent: "center" },
    signInText: { color: colors.primary, fontSize: 13, ...font("bold") },
    purchaseComplete: { borderRadius: 22, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card, padding: 20, gap: 10 },
    completeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
    completeTitle: { color: colors.foreground, fontSize: 25, lineHeight: 30, ...font("heavy") },
    completeBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, ...font("regular") },
  });
}
