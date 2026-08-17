import { Feather } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

const CAPABILITIES = [
  { icon: "calendar" as const, title: "Run the field", body: "Plan the week, prepare priority accounts, and leave every visit with a next move." },
  { icon: "message-circle" as const, title: "Practice the conversation", body: "Work objections, rehearse the ask, and turn feedback into one clear commitment." },
  { icon: "book-open" as const, title: "Use trusted field intelligence", body: "Read, listen, and use hospice sales resources in the moment you need them." },
];

export function WelcomeExperience({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: topPad + 14, paddingBottom: bottomPad + 34 }]} showsVerticalScrollIndicator={false} testID="screen-logged-out-home">
      <View style={styles.brandBar}>
        <HelmetMark size={58} />
        <View style={{ flex: 1 }}><Text style={styles.brandName}>SPARTAN COACHING</Text><Text style={styles.brandProduct}>HOSPICE SALES PRO</Text></View>
        <Pressable style={styles.signInSmall} onPress={() => router.push("/login")} accessibilityRole="button"><Text style={styles.signInSmallText}>Sign in</Text></Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>THE FIELD SYSTEM FOR HOSPICE GROWTH</Text>
        <Text style={styles.heroTitle}>Know the next move before the moment arrives.</Text>
        <Text style={styles.heroBody}>A complete iPhone workspace for hospice sales professionals who want stronger preparation, better conversations, and disciplined follow through.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/register" as Href)} testID="button-create-account-logged-out"><Text style={styles.primaryButtonText}>Create your account</Text><Feather name="arrow-right" size={20} color="#FFFFFF" /></Pressable>
        <Text style={styles.primaryNote}>Explore the system first. Choose Standard or Elite when you are ready.</Text>
      </View>

      <View style={styles.proofStrip}>
        <View style={styles.proofItem}><Text style={styles.proofValue}>1</Text><Text style={styles.proofLabel}>field system</Text></View><View style={styles.proofDivider} />
        <View style={styles.proofItem}><Text style={styles.proofValue}>90 days</Text><Text style={styles.proofLabel}>private Coach retention</Text></View><View style={styles.proofDivider} />
        <View style={styles.proofItem}><Text style={styles.proofValue}>0 PHI</Text><Text style={styles.proofLabel}>patient data accepted</Text></View>
      </View>

      <Text style={styles.sectionKicker}>WHAT THE APP DOES</Text><Text style={styles.sectionTitle}>One clear system from preparation to follow through.</Text>
      <View style={styles.capabilityList}>{CAPABILITIES.map((item, index) => <View key={item.title} style={styles.capabilityRow}><View style={styles.capabilityNumber}><Text style={styles.capabilityNumberText}>0{index + 1}</Text></View><View style={styles.capabilityIcon}><Feather name={item.icon} size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.capabilityTitle}>{item.title}</Text><Text style={styles.capabilityBody}>{item.body}</Text></View></View>)}</View>

      <Text style={styles.sectionKicker}>CHOOSE THE RIGHT ACCESS</Text><Text style={styles.sectionTitle}>Two individual memberships. One shared account across iPhone and web.</Text>
      <View style={styles.planStack}>
        <PlanCard eyebrow="STANDARD" price="$14.99" title="Hospice Sales Pro" body="The complete field system for planning, practice, account work, resources, and saved progress." features={["Sales Command Center", "Objection and role play tools", "Weekly planning and field library"]} styles={styles} colors={colors} />
        <PlanCard featured eyebrow="ELITE" price="$19.99" title="Hospice Sales Pro Elite" body="Everything in Standard, plus the private Spartan Coach and deidentified clinical education tools." features={["Private voice or text rehearsal", "Emotionally intelligent Coach feedback", "Suggested output with compliance approval"]} styles={styles} colors={colors} />
      </View>

      <View style={styles.privacyCard}><View style={styles.privacyIcon}><Feather name="shield" size={22} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>Private by design</Text><Text style={styles.privacyBody}>Raw Coach conversations stay private and expire after 90 days. Only a summary or commitment leaves Coach, and only when you explicitly share it. Never enter patient PHI.</Text></View></View>

      <Pressable style={styles.consultingCard} onPress={() => router.push("/(tabs)/contact")} testID="button-book-call-logged-out"><View style={styles.consultingIcon}><Feather name="users" size={21} color={colors.heroForeground} /></View><View style={{ flex: 1 }}><Text style={styles.consultingEyebrow}>SEPARATE FROM THE APP MEMBERSHIP</Text><Text style={styles.consultingTitle}>Human consulting and company teams</Text><Text style={styles.consultingBody}>Strategy consulting, team enrollment, contracted seats, and volume pricing are handled directly with Spartan Coaching.</Text></View><Feather name="chevron-right" size={21} color={colors.heroForeground} /></Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.push("/login")} testID="button-client-login"><Text style={styles.secondaryButtonText}>Already a member? Sign in</Text></Pressable>
    </ScrollView>
  );
}

function PlanCard({ eyebrow, price, title, body, features, featured, styles, colors }: { eyebrow: string; price: string; title: string; body: string; features: string[]; featured?: boolean; styles: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.planCard, featured && styles.planFeatured]}><View style={styles.planTop}><Text style={styles.planEyebrow}>{eyebrow}</Text><Text style={styles.planPrice}>{price}<Text style={[styles.planCadence, featured && { color: colors.heroMuted }]}> / week</Text></Text></View><Text style={[styles.planTitle, featured && { color: colors.heroForeground }]}>{title}</Text><Text style={[styles.planBody, featured && { color: colors.heroMuted }]}>{body}</Text><View style={styles.featureList}>{features.map((feature) => <View key={feature} style={styles.featureRow}><Feather name="check" size={16} color={featured ? colors.success : colors.primary} /><Text style={[styles.featureText, featured && { color: colors.heroForeground }]}>{feature}</Text></View>)}</View></View>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20 },
    brandBar: { flexDirection: "row", alignItems: "center", gap: 12 }, brandName: { color: colors.foreground, fontSize: 13, letterSpacing: 1.9, ...font("heavy") }, brandProduct: { color: colors.primary, fontSize: 9, letterSpacing: 2.2, marginTop: 4, ...font("bold") }, signInSmall: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 }, signInSmallText: { color: colors.primary, fontSize: 14, ...font("bold") },
    hero: { paddingTop: 44, paddingBottom: 28 }, kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2.25, ...font("bold") }, heroTitle: { color: colors.foreground, fontSize: 41, lineHeight: 44, letterSpacing: -1.45, marginTop: 13, ...font("heavy") }, heroBody: { color: colors.mutedForeground, fontSize: 16, lineHeight: 24, marginTop: 15, ...font("regular") },
    primaryButton: { minHeight: 60, borderRadius: 18, backgroundColor: colors.primary, paddingHorizontal: 19, marginTop: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, primaryButtonText: { color: "#FFFFFF", fontSize: 16, ...font("bold") }, primaryNote: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 10, ...font("regular") },
    proofStrip: { minHeight: 90, borderRadius: 20, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, marginBottom: 36 }, proofItem: { flex: 1, alignItems: "center", paddingHorizontal: 5 }, proofValue: { color: colors.foreground, fontSize: 15, ...font("heavy") }, proofLabel: { color: colors.mutedForeground, fontSize: 9, lineHeight: 13, textAlign: "center", marginTop: 4, ...font("medium") }, proofDivider: { width: StyleSheet.hairlineWidth, height: 42, backgroundColor: colors.borderStrong },
    sectionKicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, marginTop: 8, ...font("bold") }, sectionTitle: { color: colors.foreground, fontSize: 27, lineHeight: 32, letterSpacing: -0.75, marginTop: 8, ...font("heavy") }, capabilityList: { marginTop: 18, marginBottom: 34 }, capabilityRow: { minHeight: 116, flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, capabilityNumber: { paddingTop: 4 }, capabilityNumberText: { color: colors.mutedForeground, fontSize: 9, letterSpacing: 1, ...font("bold") }, capabilityIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }, capabilityTitle: { color: colors.foreground, fontSize: 17, ...font("bold") }, capabilityBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 5, ...font("regular") },
    planStack: { gap: 13, marginTop: 19, marginBottom: 18 }, planCard: { borderRadius: 22, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, padding: 19 }, planFeatured: { backgroundColor: colors.heroBackground, borderColor: colors.primary, borderWidth: 1 }, planTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, planEyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, ...font("bold") }, planPrice: { color: colors.primary, fontSize: 17, fontVariant: ["tabular-nums"], ...font("heavy") }, planCadence: { color: colors.mutedForeground, fontSize: 10, ...font("regular") }, planTitle: { color: colors.foreground, fontSize: 22, marginTop: 13, ...font("heavy") }, planBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 7, ...font("regular") }, featureList: { gap: 9, marginTop: 16 }, featureRow: { flexDirection: "row", gap: 9, alignItems: "flex-start" }, featureText: { color: colors.foreground, flex: 1, fontSize: 12, lineHeight: 17, ...font("medium") },
    privacyCard: { flexDirection: "row", gap: 13, backgroundColor: colors.primaryMuted, borderRadius: 20, padding: 17, marginVertical: 14 }, privacyIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, privacyTitle: { color: colors.foreground, fontSize: 15, ...font("bold") }, privacyBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 4, ...font("regular") },
    consultingCard: { backgroundColor: colors.heroBackground, borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }, consultingIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }, consultingEyebrow: { color: colors.primary, fontSize: 8, letterSpacing: 1.4, ...font("bold") }, consultingTitle: { color: colors.heroForeground, fontSize: 16, marginTop: 5, ...font("bold") }, consultingBody: { color: colors.heroMuted, fontSize: 11, lineHeight: 16, marginTop: 4, ...font("regular") }, secondaryButton: { minHeight: 56, borderRadius: 17, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center", marginTop: 14 }, secondaryButtonText: { color: colors.foreground, fontSize: 14, ...font("bold") },
  });
}
