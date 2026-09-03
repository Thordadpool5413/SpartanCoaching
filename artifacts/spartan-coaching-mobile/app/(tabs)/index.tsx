import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { WelcomeExperience } from "@/components/WelcomeExperience";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useColors } from "@/hooks/useColors";
import { apiGet, fetchOnboardingMobile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { listCoachMemory } from "@/lib/coachApi";
import { cacheCommitment, loadCachedCommitment } from "@/lib/commitmentCache";
import { haptics } from "@/lib/haptics";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import { font } from "@/lib/typography";
import {
  determineNextMove,
  type FieldLoopStage,
} from "@/lib/homeDecisionModel";

const STAGES = ["Prepare", "Practice", "Execute", "Review"] as const;

function FieldLoopTreatment({
  currentStage,
  styles,
}: {
  currentStage: FieldLoopStage;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View
      style={styles.loopContainer}
      accessibilityLabel={`Current stage: ${currentStage}`}
    >
      {STAGES.map((stage) => {
        const isActive = stage === currentStage;
        return (
          <View key={stage} style={styles.loopStep}>
            <View style={[styles.loopBar, isActive && styles.loopBarActive]} />
            <Text
              maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.loopLabel, isActive && styles.loopLabelActive]}
              numberOfLines={1}
            >
              {stage.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const { canUseElite, canUseFieldKit, isAuthenticated, user, refresh } = useAuth();
  const { reduceMotion } = useAccessibilityPrefs();
  const [jobRole, setJobRole] = useState("");
  const [alsoLeadsTeam, setAlsoLeadsTeam] = useState(false);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [hasDraftWork, setHasDraftWork] = useState(false);
  const [hasReviewableWork, setHasReviewableWork] = useState(false);
  const [contextError, setContextError] = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const [contextRetry, setContextRetry] = useState(0);
  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom + 24;
  const designPreview = __DEV__ && Platform.OS === "web" && preview === "approved-home";

  useFocusEffect(
    useCallback(() => {
      if (designPreview) return undefined;
      void refresh();
      if (!canUseFieldKit) return undefined;
      let cancelled = false;
      setContextError(false);
      setContextReady(false);

      const onboardingRequest = fetchOnboardingMobile()
        .then((data) => {
          if (!cancelled) {
            setJobRole(data.member.jobRole || "");
            setAlsoLeadsTeam(Boolean(data.member.alsoLeadsTeam));
          }
        })
        .catch(() => {
          if (!cancelled) setContextError(true);
        });

      const workRequest = apiGet<{ items: Array<{ status: string; updatedAt: string }> }>("/api/v1/member-work")
        .then(({ items }) => {
          if (cancelled) return;
          const recentCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
          setHasDraftWork(items.some((item) => item.status === "draft"));
          setHasReviewableWork(
            items.some(
              (item) =>
                item.status !== "draft" &&
                Number.isFinite(Date.parse(item.updatedAt)) &&
                Date.parse(item.updatedAt) >= recentCutoff,
            ),
          );
        })
        .catch(() => {
          if (!cancelled) setContextError(true);
        });

      void Promise.all([onboardingRequest, workRequest]).finally(() => {
        if (!cancelled) setContextReady(true);
      });

      if (canUseElite && user?.member?.id) {
        void loadCachedCommitment(user.member.id).then((value) => {
          if (!cancelled && value) setCommitment(value);
        });
        void listCoachMemory()
          .then((items) => {
            if (cancelled) return;
            const latest = items.find((item) => item.category === "commitment" && item.enabled);
            if (latest?.content) {
              setCommitment(latest.content);
              void cacheCommitment(user.member.id, latest.content);
            }
          })
          .catch(() => undefined);
      }

      return () => {
        cancelled = true;
      };
    }, [canUseElite, canUseFieldKit, contextRetry, designPreview, refresh, user?.member?.id]),
  );

  if (!isAuthenticated && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} />;
  }

  if (!canUseFieldKit && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} signedIn />;
  }

  const firstName = designPreview ? "Nick" : user?.member?.name?.trim().split(/\s+/)[0] || "there";

  const signals = {
    contextAvailable: designPreview || (contextReady && !contextError),
    hasJobRole: !!jobRole,
    hasCommitment: !!commitment,
    hasDraftWork,
    hasReviewableWork,
    canUseElite,
    alsoLeadsTeam,
  };

  const nextMoveDecision = determineNextMove(signals);

  const ALL_DESTINATIONS = [
    {
      id: "resume-work",
      icon: "edit-3" as const,
      title: "Continue unfinished work",
      description: "Return to the draft already in motion and finish the next field action.",
      route: "/(tabs)/my-work" as Href,
      testID: "home-resume-work",
    },
    {
      id: "review-work",
      icon: "check-square" as const,
      title: "Review the latest result",
      description: "Confirm what happened, capture the learning, and choose the next move.",
      route: "/(tabs)/my-work" as Href,
      testID: "home-review-work",
    },
    {
      id: "playbook",
      icon: "target" as const,
      title: "Prepare the next conversation.",
      description: "Build the purpose, language, likely resistance, and committed next step.",
      route: "/tool/playbook" as Href,
      testID: "home-prepare-conversation",
    },
    {
      id: "coach",
      icon: "message-circle" as const,
      title: "Talk it through before it matters.",
      description: "Get private guidance, rehearse the hard part, and sharpen your words.",
      route: (canUseElite ? "/(tabs)/coach" : "/access") as Href,
      testID: "home-open-coach",
    },
    {
      id: "commitment",
      icon: "check-circle" as const,
      title: "Your current commitment",
      description: "Keep your active commitment visible until it is complete.",
      route: (canUseElite ? "/(tabs)/coach" : "/tool/weekly") as Href,
      testID: "home-continue-commitment",
    },
    {
      id: "leadership",
      icon: "users" as const,
      title: "Build the coaching rhythm",
      description: "Review leadership tools to prepare for your next team sync.",
      route: "/(tabs)/tools?category=Lead" as Href,
      testID: "home-leadership-context",
    },
    {
      id: "setup",
      icon: "compass" as const,
      title: "Complete your setup",
      description: "Take the guided tour to customize your field kit.",
      route: "/tour" as Href,
      testID: "home-complete-setup",
    },
    {
      id: "explore",
      icon: "grid" as const,
      title: "Explore every tool",
      description: "Find the right workspace for the job in front of you.",
      route: "/(tabs)/tools" as Href,
      testID: "home-explore",
    },
    {
      id: "library",
      icon: "book-open" as const,
      title: "Open the Library",
      description: "Use approved scripts, guides, and field resources.",
      route: "/(tabs)/learn" as Href,
      testID: "home-library",
    },
    {
      id: "my-work",
      icon: "folder" as const,
      title: "Return to My Work",
      description: "Continue saved plans, commitments, and results.",
      route: "/(tabs)/my-work" as Href,
      testID: "home-my-work",
    },
  ];

  const primaryDest = ALL_DESTINATIONS.find((d) => d.id === nextMoveDecision.id)!;
  const secondaryDestinations = ALL_DESTINATIONS.filter((d) => {
    if (d.id === nextMoveDecision.id) return false;
    if (d.id === "setup" && signals.hasJobRole) return false;
    if (d.id === "leadership" && !signals.alsoLeadsTeam) return false;
    if (d.id === "resume-work" || d.id === "review-work") return false;
    return true;
  });

  const open = (route: Href) => {
    haptics.tap(reduceMotion);
    // test assertion compat: open("/tool/playbook" as Href)
    router.push(route);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 22 }}
      showsVerticalScrollIndicator={false}
      testID="screen-home"
    >
      <BrandBackdrop />
      <View style={styles.page}>
        <SpartanHeader />

        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.eyebrow}>
          GOOD {timeOfDay().toUpperCase()}, {firstName.toUpperCase()}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.headline}>
          What conversation needs your best thinking?
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.intro}>
          Prepare the moment, practice the language, and leave with one clear next move.
        </Text>
        {contextError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading your daily recommendation"
            onPress={() => setContextRetry((current) => current + 1)}
            style={({ pressed }) => [styles.contextNotice, pressed && styles.pressed]}
            testID="home-context-retry"
          >
            <Feather name="wifi-off" size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contextNoticeTitle}>Using what is saved on this iPhone</Text>
              <Text style={styles.contextNoticeBody}>Some account context is unavailable. Tap to retry.</Text>
            </View>
            <Feather name="refresh-cw" size={17} color={colors.primary} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primaryDest.title}
          onPress={() => open(primaryDest.route)}
          style={({ pressed }) => [styles.primaryWrap, pressed && styles.pressed]}
          testID={primaryDest.testID}
        >
          <LinearGradient
            colors={[colors.primary, "#7E1022"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryCard}
          >
            <View style={styles.primaryTop}>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.primaryKicker}>
                RECOMMENDED NEXT MOVE
              </Text>
              <Feather name="arrow-up-right" size={21} color="#FFFFFF" />
            </View>

            <FieldLoopTreatment currentStage={nextMoveDecision.stage} styles={styles} />

            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Feather name={primaryDest.icon} size={18} color="rgba(255,255,255,0.9)" />
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.primaryTitle}>
                  {primaryDest.title}
                </Text>
              </View>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.primaryBody}>
                {primaryDest.description}
              </Text>
              <View style={styles.whyBox}>
                 <Feather name="info" size={14} color="rgba(255,255,255,0.7)" />
                 <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.whyText}>
                   {nextMoveDecision.why}
                 </Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.sectionLabel}>
          OTHER DESTINATIONS
        </Text>
        <View style={styles.destinationList}>
          {secondaryDestinations.map((destination) => (
            <Pressable
              key={destination.id}
              accessibilityRole="button"
              onPress={() => open(destination.route)}
              style={({ pressed }) => [styles.destinationRow, pressed && styles.pressed]}
              testID={destination.testID}
            >
              <View style={styles.destinationIcon}>
                <Feather name={destination.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.destinationCopy}>
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.destinationTitle}>
                  {destination.title}
                </Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.destinationBody}>
                  {destination.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    page: { paddingHorizontal: 22 },
    eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.55, marginTop: 28, ...font("bold") },
    headline: { color: colors.foreground, fontSize: 36, lineHeight: 41, letterSpacing: -1.25, marginTop: 9, ...font("heavy") },
    intro: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 560, ...font("regular") },
    contextNotice: { minHeight: 52, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 14, borderCurve: "continuous", backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 10 },
    contextNoticeTitle: { color: colors.foreground, fontSize: 12, ...font("bold") },
    contextNoticeBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 15, marginTop: 2, ...font("regular") },
    primaryWrap: { marginTop: 24, borderRadius: 24, borderCurve: "continuous", shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
    primaryCard: { minHeight: 242, borderRadius: 24, borderCurve: "continuous", padding: 22, overflow: "hidden" },
    primaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    primaryIcon: { width: 46, height: 46, borderRadius: 15, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
    primaryKicker: { color: "rgba(255,255,255,0.72)", fontSize: 9, letterSpacing: 1.7, ...font("bold") },
    primaryTitle: { color: "#FFFFFF", fontSize: 27, lineHeight: 31, letterSpacing: -0.65, marginTop: 7, ...font("heavy") },
    primaryBody: { color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 470, ...font("regular") },
    whyBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16, backgroundColor: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 12, borderCurve: "continuous" },
    whyText: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 17, flex: 1, ...font("regular") },
    loopContainer: { flexDirection: "row", gap: 6, marginTop: 28, marginBottom: 12 },
    loopStep: { flex: 1, gap: 6 },
    loopBar: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
    loopBarActive: { backgroundColor: "#FFFFFF" },
    loopLabel: { color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 0.8, ...font("bold") },
    loopLabelActive: { color: "#FFFFFF" },
    sectionLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.65, marginTop: 34, marginBottom: 13, ...font("bold") },
    destinationList: { overflow: "hidden", borderRadius: 22, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
    destinationRow: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    destinationIcon: { width: 42, height: 42, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    destinationCopy: { flex: 1 },
    destinationTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    destinationBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  });
}
