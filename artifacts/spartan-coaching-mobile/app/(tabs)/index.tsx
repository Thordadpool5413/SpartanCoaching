import { Feather } from "@expo/vector-icons";
import { router, type Href, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { WelcomeExperience } from "@/components/WelcomeExperience";
import { StreakStrip } from "@/components/ui/StreakStrip";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { fetchOnboardingMobile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { listCoachMemory } from "@/lib/coachApi";
import { cacheCommitment, loadCachedCommitment } from "@/lib/commitmentCache";
import { haptics } from "@/lib/haptics";
import { font } from "@/lib/typography";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

const HOME_JOBS = [
  { icon: "edit-3" as const, label: "Plan", description: "Build the plan", route: "/(tabs)/tools?category=Plan" as Href },
  { icon: "message-circle" as const, label: "Practice", description: "Rehearse the moment", route: "/(tabs)/tools?category=Practice" as Href },
  { icon: "bar-chart-2" as const, label: "Measure", description: "Track progress", route: "/(tabs)/tools?category=Measure" as Href },
  { icon: "book-open" as const, label: "Library", description: "Learn and use", route: "/(tabs)/tools?view=library" as Href },
];

type HomeAction = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  body: string;
  route: Href;
  testID: string;
};

function AnimatedPillar({
  job,
  index,
  onPress,
  colors,
  styles,
  reduceMotion,
}: {
  job: (typeof HOME_JOBS)[0];
  index: number;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof makeStyles>;
  reduceMotion: boolean;
}) {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 16);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || reduceMotion) return;
    mounted.current = true;
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 160 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ flexBasis: "47%", flexGrow: 1 }, animStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${job.label}`}
        onPress={onPress}
        style={({ pressed }) => [styles.jobPillar, pressed && styles.jobPillarPressed]}
        testID={`signed-in-home-pillar-${job.label.toLowerCase()}`}
      >
        <View style={styles.jobPillarTop}>
          <View style={styles.jobPillarIcon}>
            <Feather name={job.icon} size={20} color={colors.primary} />
          </View>
          <Feather name="arrow-up-right" size={17} color={colors.primary} />
        </View>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={styles.jobPillarLabel}
        >
          {job.label}
        </Text>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={styles.jobPillarDescription}
        >
          {job.description}
        </Text>
      </Pressable>
    </Animated.View>
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
  const [streakData, setStreakData] = useState<{ streakDays?: number; toolsThisWeek?: number; nextVisitTime?: string }>({});
  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom + 24;
  const designPreview = __DEV__ && Platform.OS === "web" && preview === "approved-home";

  useFocusEffect(useCallback(() => {
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

    void fetch("/api/v1/sales-workflow/today")
      .then((r) => r.json() as Promise<{ streakDays?: number; toolsThisWeek?: number; nextVisitTime?: string }>)
      .then((data) => {
        if (!cancelled) {
          setStreakData({
            streakDays: data.streakDays,
            toolsThisWeek: data.toolsThisWeek,
            nextVisitTime: data.nextVisitTime,
          });
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
          setCommitment(latest?.content ?? null);
          void cacheCommitment(user.member.id, latest?.content ?? null);
        })
        .catch(() => undefined);
    }

    return () => { cancelled = true; };
  }, [canUseElite, canUseFieldKit, designPreview, refresh, user?.member?.id]));

  if (!isAuthenticated && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} />;
  }

  if (!canUseFieldKit && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} signedIn />;
  }

  const firstName = designPreview ? "Nick" : user?.member?.name?.trim().split(/\s+/)[0] || "there";
  const actions: HomeAction[] = [
    {
      icon: "message-square",
      title: "Plan the conversation",
      body: "Purpose, talking points, likely objection, and next move.",
      route: "/tool/playbook" as Href,
      testID: "home-prepare-conversation",
    },
    {
      icon: "shield",
      title: "Practice the hard part",
      body: canUseElite ? "Private rehearsal with Spartan Coach feedback." : "Build and refine a response with Standard tools.",
      route: canUseElite ? "/(tabs)/coach" as Href : "/tool/objection" as Href,
      testID: "home-practice-objection",
    },
    {
      icon: "grid",
      title: "Explore tools and resources",
      body: "One place for every tool, Library item, and access boundary.",
      route: "/(tabs)/tools" as Href,
      testID: "home-explore",
    },
  ];

  const open = (route: Href) => {
    haptics.tap(reduceMotion);
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
      <View style={styles.page}>
        <SpartanHeader />
        <View style={styles.badge}>
          <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={styles.badgeText}
          >
            SPARTAN COACHING
          </Text>
        </View>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={styles.greeting}
        >
          Good {timeOfDay()}, {firstName}.
        </Text>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={styles.promise}
        >
          What do you need to prepare for?
        </Text>
      </View>

      <StreakStrip data={streakData} />

      <View style={styles.page}>
        <Text style={styles.sectionLabel}>OPEN A WORKSPACE</Text>
        <View style={styles.jobMap} accessibilityLabel="Open planning, practice, measurement, or the Library">
          {HOME_JOBS.map((job, index) => (
            <AnimatedPillar
              key={job.label}
              job={job}
              index={index}
              onPress={() => open(job.route)}
              colors={colors}
              styles={styles}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>RECOMMENDED FOR YOU</Text>
        <View style={styles.actionList}>
          {actions.map((action, index) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={() => open(action.route)}
              style={({ pressed }) => [styles.actionCard, index === 0 && styles.featuredCard, pressed && styles.pressed]}
              testID={action.testID}
            >
              <View style={[styles.actionIcon, index === 0 && styles.featuredIcon]}>
                <Feather name={action.icon} size={22} color={index === 0 ? "#FFFFFF" : colors.primary} />
              </View>
              <View style={styles.actionCopy}>
                <Text
                  maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                  style={styles.actionTitle}
                >
                  {action.title}
                </Text>
                <Text
                  maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                  style={styles.actionBody}
                >
                  {action.body}
                </Text>
              </View>
              <Feather name="chevron-right" size={21} color={index === 0 ? colors.primary : colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {alsoLeadsTeam ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => open("/(tabs)/tools" as Href)}
            style={({ pressed }) => [styles.leadershipCard, pressed && styles.pressed]}
            testID="home-leadership-context"
          >
            <View style={styles.leadershipIcon}>
              <Feather name="users" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.leadershipKicker}>TEAM LEADERSHIP</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.leadershipTitle}>Build the coaching rhythm</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.leadershipBody}>Open leader tools without turning Home into a dashboard.</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionKicker}>FOLLOW THROUGH</Text>
          <Pressable accessibilityRole="button" onPress={() => open("/(tabs)/my-work" as Href)} hitSlop={8}>
            <Text style={styles.seeAll}>Open My Work</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => open(canUseElite ? "/(tabs)/coach" as Href : "/tool/weekly" as Href)}
          style={({ pressed }) => [styles.commitmentCard, pressed && styles.pressed]}
          testID="home-continue-commitment"
        >
          <View style={styles.commitmentTop}>
            <View style={styles.lockPill}>
              <Feather name="lock" size={14} color={colors.primary} />
              <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.lockText}>PRIVATE</Text>
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

        {!jobRole ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => open("/tour" as Href)}
            style={styles.tourRow}
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
    badge: { alignSelf: "flex-start", marginTop: 16, borderRadius: 999, backgroundColor: colors.secondary, paddingHorizontal: 11, paddingVertical: 7 },
    badgeText: { color: colors.primary, fontSize: 9, letterSpacing: 0.7, ...font("bold") },
    greeting: { color: colors.mutedForeground, fontSize: 15, marginTop: 22, ...font("semibold") },
    promise: { color: colors.foreground, fontSize: 38, lineHeight: 44, letterSpacing: -1.4, marginTop: 3, ...font("heavy") },
    sectionLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.8, marginTop: 34, marginBottom: 14, ...font("bold") },
    jobMap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    jobPillar: { minHeight: 118, justifyContent: "space-between", padding: 15, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
    jobPillarPressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
    jobPillarTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    jobPillarIcon: { width: 38, height: 38, borderRadius: 12, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    jobPillarLabel: { color: colors.foreground, fontSize: 16, marginTop: 12, ...font("heavy") },
    jobPillarDescription: { color: colors.mutedForeground, fontSize: 11, lineHeight: 15, marginTop: 3, ...font("regular") },
    actionList: { gap: 16 },
    actionCard: { minHeight: 104, flexDirection: "row", alignItems: "center", gap: 13, padding: 16, borderRadius: 20, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
    featuredCard: { minHeight: 112, borderColor: "rgba(182,25,42,0.32)" },
    actionIcon: { width: 46, height: 46, borderRadius: 15, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    featuredIcon: { backgroundColor: colors.primary },
    actionCopy: { flex: 1, gap: 4 },
    actionTitle: { color: colors.foreground, fontSize: 17, ...font("bold") },
    actionBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17, ...font("regular") },
    leadershipCard: { minHeight: 104, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondary, padding: 18, marginTop: 22 },
    leadershipIcon: { width: 44, height: 44, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    leadershipKicker: { color: colors.primary, fontSize: 8, letterSpacing: 1.3, ...font("bold") },
    leadershipTitle: { color: colors.foreground, fontSize: 15, marginTop: 2, ...font("bold") },
    leadershipBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 2, ...font("regular") },
    sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 38, marginBottom: 14 },
    sectionKicker: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, ...font("bold") },
    seeAll: { color: colors.primary, fontSize: 11, ...font("bold") },
    commitmentCard: { minHeight: 140, borderRadius: 22, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondary, padding: 18 },
    commitmentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    lockPill: { flexDirection: "row", alignItems: "center", gap: 6 },
    lockText: { color: colors.primary, fontSize: 9, letterSpacing: 1.2, ...font("bold") },
    commitmentTitle: { color: colors.foreground, fontSize: 19, marginTop: 18, ...font("heavy") },
    commitmentBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, ...font("regular") },
    tourRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14, paddingHorizontal: 4 },
    tourText: { flex: 1, color: colors.primary, fontSize: 12, ...font("bold") },
    pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  });
}
