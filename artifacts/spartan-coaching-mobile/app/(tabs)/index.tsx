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
import { fetchOnboardingMobile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { listCoachMemory } from "@/lib/coachApi";
import { cacheCommitment, loadCachedCommitment } from "@/lib/commitmentCache";
import { haptics } from "@/lib/haptics";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import { font } from "@/lib/typography";

type Destination = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
  route: Href;
  testID: string;
};

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
  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom + 24;
  const designPreview = __DEV__ && Platform.OS === "web" && preview === "approved-home";

  useFocusEffect(
    useCallback(() => {
      if (designPreview) return undefined;
      void refresh();
      if (!canUseFieldKit) return undefined;
      let cancelled = false;

      void fetchOnboardingMobile()
        .then((data) => {
          if (!cancelled) {
            setJobRole(data.member.jobRole || "");
            setAlsoLeadsTeam(Boolean(data.member.alsoLeadsTeam));
          }
        })
        .catch(() => undefined);

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
    }, [canUseElite, canUseFieldKit, designPreview, refresh, user?.member?.id]),
  );

  if (!isAuthenticated && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} />;
  }

  if (!canUseFieldKit && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} signedIn />;
  }

  const firstName = designPreview ? "Nick" : user?.member?.name?.trim().split(/\s+/)[0] || "there";
  const destinations: Destination[] = [
    {
      icon: "grid",
      title: "Explore every tool",
      description: "Find the right workspace for the job in front of you.",
      route: "/(tabs)/tools" as Href,
      testID: "home-explore",
    },
    {
      icon: "book-open",
      title: "Open the Library",
      description: "Use approved scripts, guides, and field resources.",
      route: "/(tabs)/learn" as Href,
      testID: "home-library",
    },
    {
      icon: "check-circle",
      title: "Return to My Work",
      description: "Continue saved plans, commitments, and results.",
      route: "/(tabs)/my-work" as Href,
      testID: "home-my-work",
    },
  ];

  const open = (route: Href) => {
    haptics.tap(reduceMotion);
    router.push(route);
  };

  const openCoach = () => open(canUseElite ? "/(tabs)/coach" as Href : "/access" as Href);

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Prepare the next conversation"
          onPress={() => open("/tool/playbook" as Href)}
          style={({ pressed }) => [styles.primaryWrap, pressed && styles.pressed]}
          testID="home-prepare-conversation"
        >
          <LinearGradient
            colors={[colors.primary, "#7E1022"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryCard}
          >
            <View style={styles.primaryTop}>
              <View style={styles.primaryIcon}>
                <Feather name="target" size={22} color="#FFFFFF" />
              </View>
              <Feather name="arrow-up-right" size={21} color="#FFFFFF" />
            </View>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.primaryKicker}>
              START HERE
            </Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.primaryTitle}>
              Prepare the next conversation.
            </Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.primaryBody}>
              Build the purpose, language, likely resistance, and committed next step.
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canUseElite ? "Open Spartan AI Coach" : "View Spartan Coach access"}
          onPress={openCoach}
          style={({ pressed }) => [styles.coachCard, pressed && styles.pressed]}
          testID="home-open-coach"
        >
          <View style={styles.coachMark}>
            <Feather name="message-circle" size={25} color="#FFFFFF" />
          </View>
          <View style={styles.coachCopy}>
            <View style={styles.coachLabelRow}>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.coachKicker}>
                SPARTAN AI COACH
              </Text>
              {!canUseElite ? (
                <View style={styles.elitePill}>
                  <Text style={styles.elitePillText}>ELITE</Text>
                </View>
              ) : null}
            </View>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.coachTitle}>
              Talk it through before it matters.
            </Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.coachBody}>
              Get private guidance, rehearse the hard part, and sharpen your words.
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.sectionHeading}>
          <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.sectionHeadingLabel}>
            FOLLOW THROUGH
          </Text>
          <Pressable accessibilityRole="button" onPress={() => open("/(tabs)/my-work" as Href)} hitSlop={8}>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.sectionLink}>
              My Work
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => open(canUseElite ? "/(tabs)/coach" as Href : "/tool/weekly" as Href)}
          style={({ pressed }) => [styles.commitmentCard, pressed && styles.pressed]}
          testID="home-continue-commitment"
        >
          <View style={styles.commitmentTop}>
            <View style={styles.privateLabel}>
              <Feather name="lock" size={13} color={colors.primary} />
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.privateText}>
                PRIVATE
              </Text>
            </View>
            <Feather name="arrow-up-right" size={19} color={colors.primary} />
          </View>
          <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.commitmentTitle}>
            {commitment ? "Your current commitment" : "Set one clear commitment"}
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.commitmentBody}>
            {commitment || "Decide what you will do next and keep it visible until it is complete."}
          </Text>
        </Pressable>

        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.sectionLabel}>
          GO SOMEWHERE
        </Text>
        <View style={styles.destinationList}>
          {destinations.map((destination) => (
            <Pressable
              key={destination.title}
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

        {alsoLeadsTeam ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => open("/(tabs)/tools?category=Lead" as Href)}
            style={({ pressed }) => [styles.leadershipCard, pressed && styles.pressed]}
            testID="home-leadership-context"
          >
            <View style={styles.destinationIcon}>
              <Feather name="users" size={20} color={colors.primary} />
            </View>
            <View style={styles.destinationCopy}>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.coachKicker}>
                TEAM LEADERSHIP
              </Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.destinationTitle}>
                Build the coaching rhythm
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
        ) : null}

        {!jobRole ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => open("/tour" as Href)}
            style={({ pressed }) => [styles.tourRow, pressed && styles.pressed]}
            testID="home-complete-setup"
          >
            <Feather name="compass" size={19} color={colors.primary} />
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.tourText}>
              New here? Take the guided tour
            </Text>
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
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
    primaryWrap: { marginTop: 24, borderRadius: 24, borderCurve: "continuous", shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
    primaryCard: { minHeight: 242, borderRadius: 24, borderCurve: "continuous", padding: 22, overflow: "hidden" },
    primaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    primaryIcon: { width: 46, height: 46, borderRadius: 15, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
    primaryKicker: { color: "rgba(255,255,255,0.72)", fontSize: 9, letterSpacing: 1.7, marginTop: 30, ...font("bold") },
    primaryTitle: { color: "#FFFFFF", fontSize: 27, lineHeight: 31, letterSpacing: -0.65, marginTop: 7, ...font("heavy") },
    primaryBody: { color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 470, ...font("regular") },
    coachCard: { minHeight: 150, flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16, padding: 18, borderRadius: 22, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: 1, borderColor: "rgba(182,25,42,0.34)" },
    coachMark: { width: 50, height: 50, borderRadius: 17, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
    coachCopy: { flex: 1 },
    coachLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    coachKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.3, ...font("bold") },
    elitePill: { borderRadius: 999, backgroundColor: colors.primaryMuted, paddingHorizontal: 7, paddingVertical: 3 },
    elitePillText: { color: colors.primary, fontSize: 8, letterSpacing: 0.8, ...font("bold") },
    coachTitle: { color: colors.foreground, fontSize: 19, lineHeight: 23, marginTop: 6, ...font("heavy") },
    coachBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 5, ...font("regular") },
    sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 34, marginBottom: 13 },
    sectionHeadingLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.65, ...font("bold") },
    sectionLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.65, marginTop: 34, marginBottom: 13, ...font("bold") },
    sectionLink: { color: colors.primary, fontSize: 12, ...font("bold") },
    commitmentCard: { minHeight: 136, borderRadius: 22, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondary, padding: 18 },
    commitmentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    privateLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
    privateText: { color: colors.primary, fontSize: 9, letterSpacing: 1.2, ...font("bold") },
    commitmentTitle: { color: colors.foreground, fontSize: 19, marginTop: 17, ...font("heavy") },
    commitmentBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, ...font("regular") },
    destinationList: { overflow: "hidden", borderRadius: 22, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
    destinationRow: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    destinationIcon: { width: 42, height: 42, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    destinationCopy: { flex: 1 },
    destinationTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    destinationBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    leadershipCard: { minHeight: 86, flexDirection: "row", alignItems: "center", gap: 13, marginTop: 14, padding: 16, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.borderStrong },
    tourRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14, paddingHorizontal: 4 },
    tourText: { flex: 1, color: colors.primary, fontSize: 12, ...font("bold") },
    pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  });
}
