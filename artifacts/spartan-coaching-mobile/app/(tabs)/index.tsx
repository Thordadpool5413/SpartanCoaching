import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { WelcomeExperience } from "@/components/WelcomeExperience";
import { useColors } from "@/hooks/useColors";
import { fetchOnboardingMobile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { listCoachMemory } from "@/lib/coachApi";
import { font } from "@/lib/typography";

type FieldAction = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  body: string;
  onPress: () => void;
  testID: string;
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseElite, canUseFieldKit, isAuthenticated, user, refresh } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [jobRole, setJobRole] = useState("");
  const [coachCommitment, setCoachCommitment] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 32 : insets.bottom + 18;

  useFocusEffect(
    useCallback(() => {
      void refresh();
      if (!canUseFieldKit) return undefined;

      let cancelled = false;
      void fetchOnboardingMobile()
        .then((data) => {
          if (!cancelled) setJobRole(data.member.jobRole || "");
        })
        .catch(() => {
          if (!cancelled) setJobRole("");
        });

      void listCoachMemory()
        .then((items) => {
          if (cancelled) return;
          const latest = items.find((item) => item.category === "commitment" && item.enabled);
          setCoachCommitment(latest?.content ?? null);
        })
        .catch(() => {
          if (!cancelled) setCoachCommitment(null);
        });

      return () => {
        cancelled = true;
      };
    }, [canUseFieldKit, refresh]),
  );

  if (!isAuthenticated) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} />;
  }

  if (!canUseFieldKit) {
    return <LockedHome topPad={topPad} bottomPad={bottomPad} />;
  }

  const firstName = user?.member?.name?.trim().split(/\s+/)[0] || "there";
  const actions: FieldAction[] = [
    {
      icon: "message-square",
      title: "Practice an objection",
      body: canUseElite ? "Rehearse privately with Spartan Coach feedback." : "Build and refine a response with the field tools.",
      onPress: () => router.push(canUseElite ? "/(tabs)/coach" : "/tool/objection" as Href),
      testID: "home-practice-objection",
    },
    {
      icon: "check-circle",
      title: coachCommitment ? "Continue your commitment" : "Set your next commitment",
      body: coachCommitment || "Leave the next conversation with one clear follow through.",
      onPress: () => router.push(canUseElite ? "/(tabs)/coach" : "/tool/weekly" as Href),
      testID: "home-continue-commitment",
    },
  ];

  const press = (callback: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: bottomPad + 16 }}
      showsVerticalScrollIndicator={false}
      testID="screen-home"
    >
      <View style={[styles.brandField, { paddingTop: topPad + 8 }]}>
        <View style={styles.brandTopRow}>
          <BrandStamp width={140} height={80} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tour" as Href)}
            style={styles.tourButton}
            testID="button-open-tour"
          >
            <Feather name="compass" size={16} color={colors.heroForeground} />
            <Text style={styles.tourButtonText}>Tour</Text>
          </Pressable>
        </View>
        <View>
          <Text style={styles.brandKicker}>FIELD GUIDE</Text>
          <Text style={styles.brandPromise}>Prepare. Practice. Follow through.</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Good morning, {firstName}</Text>
        <Text style={styles.prompt}>What are you walking into?</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => press(() => router.push("/tool/objection" as Href))}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          testID="home-prepare-conversation"
        >
          <View style={styles.primaryIcon}>
            <HelmetMark size={48} />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryEyebrow}>START HERE</Text>
            <Text style={styles.primaryTitle}>Prepare for a conversation</Text>
            <Text style={styles.primaryBody}>Build a focused plan for the person, the moment, and the outcome.</Text>
          </View>
          <Feather name="arrow-right" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.actionList}>
          {actions.map((action, index) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={() => press(action.onPress)}
              style={({ pressed }) => [styles.actionRow, index > 0 && styles.rowDivider, pressed && styles.rowPressed]}
              testID={action.testID}
            >
              <View style={styles.actionIcon}>
                <Feather name={action.icon} size={21} color={colors.primary} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionBody} numberOfLines={2}>{action.body}</Text>
              </View>
              <Feather name="chevron-right" size={21} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {coachCommitment ? (
          <View testID="card-private-coach-commitment" style={styles.commitmentNote}>
            <Feather name="lock" size={16} color={colors.primary} />
            <Text style={styles.commitmentText}>This commitment is private until you explicitly share it.</Text>
          </View>
        ) : null}

        {!jobRole ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tour" as Href)}
            style={styles.setupRow}
            testID="home-complete-setup"
          >
            <View style={styles.setupIcon}>
              <Feather name="compass" size={19} color={colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>New here?</Text>
              <Text style={styles.actionBody}>Take the guided tour and personalize the app around your role.</Text>
            </View>
            <Text style={styles.setupLink}>Start</Text>
          </Pressable>
        ) : null}

        <View style={styles.boundaryRow}>
          <Feather name="shield" size={17} color={colors.mutedForeground} />
          <Text style={styles.boundaryText}>Never enter patient PHI. Clinical outputs are suggestions and require appropriate approval.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function LockedHome({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
      showsVerticalScrollIndicator={false}
      testID="screen-locked-home"
    >
      <View style={[styles.brandField, { paddingTop: topPad + 8 }]}>
        <BrandStamp width={160} height={92} />
        <Text style={styles.brandPromise}>Your field guide is ready.</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.greeting}>See how the system works first.</Text>
        <Text style={styles.prompt}>No blind subscription. No mystery buttons.</Text>
        <Text style={styles.lockedBody}>Walk through a realistic hospice sales conversation, see Coach feedback, and understand what Standard and Elite unlock.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/tour" as Href)}
          style={styles.primaryAction}
          testID="locked-guided-tour"
        >
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryEyebrow}>GUIDED PREVIEW</Text>
            <Text style={styles.primaryTitle}>Tour the complete app</Text>
            <Text style={styles.primaryBody}>Use fictional information and experience the real workflow.</Text>
          </View>
          <Feather name="arrow-right" size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/account")} style={styles.membershipButton}>
          <Text style={styles.membershipButtonText}>View memberships in Account</Text>
          <Feather name="chevron-right" size={19} color={colors.primary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    brandField: {
      minHeight: 214,
      backgroundColor: colors.heroBackground,
      paddingHorizontal: 22,
      paddingBottom: 24,
      justifyContent: "space-between",
    },
    brandTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    tourButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.30)" },
    tourButtonText: { color: colors.heroForeground, fontSize: 13, ...font("semibold") },
    brandKicker: { color: colors.primary, fontSize: 10, letterSpacing: 2.4, ...font("bold") },
    brandPromise: { color: colors.heroForeground, fontSize: 16, marginTop: 7, ...font("semibold") },
    content: { paddingHorizontal: 22, paddingTop: 31, gap: 12 },
    greeting: { color: colors.foreground, fontSize: 30, lineHeight: 35, letterSpacing: -0.8, ...font("heavy") },
    prompt: { color: colors.mutedForeground, fontSize: 21, lineHeight: 28, ...font("regular") },
    primaryAction: { minHeight: 142, borderRadius: 22, borderCurve: "continuous", backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", gap: 14, padding: 18, marginTop: 12 },
    primaryIcon: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
    primaryCopy: { flex: 1, gap: 4 },
    primaryEyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 9, letterSpacing: 1.7, ...font("bold") },
    primaryTitle: { color: "#FFFFFF", fontSize: 20, lineHeight: 24, ...font("heavy") },
    primaryBody: { color: "rgba(255,255,255,0.84)", fontSize: 12, lineHeight: 18, ...font("regular") },
    pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
    actionList: { marginTop: 11 },
    actionRow: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 16 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    rowPressed: { opacity: 0.6 },
    actionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    actionCopy: { flex: 1, gap: 4 },
    actionTitle: { color: colors.foreground, fontSize: 16, ...font("bold") },
    actionBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    commitmentNote: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryMuted, borderRadius: 14, padding: 13 },
    commitmentText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 16, ...font("medium") },
    setupRow: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, padding: 15, marginTop: 9 },
    setupIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    setupLink: { color: colors.primary, fontSize: 13, ...font("bold") },
    boundaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingVertical: 17 },
    boundaryText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17, ...font("regular") },
    lockedBody: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, ...font("regular") },
    membershipButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
    membershipButtonText: { color: colors.primary, fontSize: 15, ...font("bold") },
  });
}
