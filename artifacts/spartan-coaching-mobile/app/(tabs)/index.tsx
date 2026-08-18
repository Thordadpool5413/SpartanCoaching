import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { WelcomeExperience } from "@/components/WelcomeExperience";
import { useColors } from "@/hooks/useColors";
import { fetchOnboardingMobile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { listCoachMemory } from "@/lib/coachApi";
import { font } from "@/lib/typography";
import { cacheCommitment, loadCachedCommitment } from "@/lib/commitmentCache";

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
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const { canUseElite, canUseFieldKit, isAuthenticated, user, refresh } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [jobRole, setJobRole] = useState("");
  const [coachCommitment, setCoachCommitment] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 32 : insets.bottom + 18;
  const designPreview = __DEV__ && Platform.OS === "web" && preview === "approved-home";

  useFocusEffect(
    useCallback(() => {
      if (designPreview) {
        setJobRole("");
        setCoachCommitment(null);
        return undefined;
      }
      void refresh();
      if (!canUseFieldKit) return undefined;

      let cancelled = false;
      if (canUseElite && user?.member?.id) {
        void loadCachedCommitment(user.member.id).then((value) => {
          if (!cancelled && value) setCoachCommitment(value);
        });
      }
      void fetchOnboardingMobile()
        .then((data) => {
          if (!cancelled) setJobRole(data.member.jobRole || "");
        })
        .catch(() => {
          if (!cancelled) setJobRole("");
        });

      if (canUseElite) void listCoachMemory()
        .then((items) => {
          if (cancelled) return;
          const latest = items.find((item) => item.category === "commitment" && item.enabled);
          setCoachCommitment(latest?.content ?? null);
          if (user?.member?.id) void cacheCommitment(user.member.id, latest?.content ?? null);
        })
        .catch(() => {
          // Keep the last private device copy visible when the secure service is offline.
        });

      return () => {
        cancelled = true;
      };
    }, [canUseElite, canUseFieldKit, designPreview, refresh, user?.member?.id]),
  );

  if (!isAuthenticated && !designPreview) {
    return <WelcomeExperience topPad={topPad} bottomPad={bottomPad} />;
  }

  if (!canUseFieldKit && !designPreview) {
    return <LockedHome topPad={topPad} bottomPad={bottomPad} />;
  }

  const firstName = designPreview ? "Nick" : user?.member?.name?.trim().split(/\s+/)[0] || "there";
  const actions: FieldAction[] = [
    {
      icon: "shield",
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
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingBottom: bottomPad + 10 }}
      showsVerticalScrollIndicator={false}
      testID="screen-home"
    >
      <View style={styles.heroShell}>
        <ImageBackground
          source={require("@/assets/images/field-guide-navy-texture.png")}
          resizeMode="cover"
          style={[styles.heroField, { paddingTop: topPad + 8 }]}
        >
          <View style={styles.heroTopRow}>
            <BrandStamp width={174} height={104} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Account"
              onPress={() => router.push("/(tabs)/account" as Href)}
              style={({ pressed }) => [styles.avatarButton, pressed && styles.rowPressed]}
              testID="home-account-avatar"
            >
              <Text style={styles.avatarInitials}>{firstName.slice(0, 2).toUpperCase()}</Text>
            </Pressable>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroGreeting}>Good morning, {firstName}</Text>
            <Text style={styles.heroPromise}>Your field guide is ready.</Text>
          </View>
        </ImageBackground>
        <ImageBackground
          source={require("@/assets/images/field-guide-hero-separator.png")}
          resizeMode="stretch"
          style={styles.heroSeparator}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.promptRule} />
        <Text style={styles.prompt}>What are you walking into?</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens the playbook builder"
          onPress={() => press(() => router.push("/tool/playbook" as Href))}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          testID="home-prepare-conversation"
        >
          <ImageBackground
            source={require("@/assets/images/field-guide-crimson-texture.png")}
            resizeMode="cover"
            imageStyle={styles.primaryActionImage}
            style={styles.primaryActionInner}
          >
            <View style={styles.primaryIcon}>
              <Feather name="message-square" size={29} color="#FFFFFF" />
            </View>
            <View style={styles.primaryCopy}>
              <Text style={styles.primaryTitle}>Prepare for a conversation</Text>
              <Text style={styles.primaryBody}>Get a focused plan, key talking points, and your next best move.</Text>
            </View>
            <Feather name="chevron-right" size={28} color="#FFFFFF" />
          </ImageBackground>
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
                <Feather name={action.icon} size={23} color={colors.foreground} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionBody} numberOfLines={2}>{action.body}</Text>
              </View>
              <Feather name="chevron-right" size={24} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {!jobRole ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tour" as Href)}
            style={({ pressed }) => [styles.setupRow, pressed && styles.rowPressed]}
            testID="home-complete-setup"
          >
            <View style={styles.setupIcon}>
              <Feather name="compass" size={21} color={colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>New here?</Text>
              <Text style={styles.actionBody}>Take a quick tour to see how Spartan Coaching works.</Text>
            </View>
            <Text style={styles.setupLink}>Take the tour</Text>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tour" as Href)}
            style={({ pressed }) => [styles.tourTextButton, pressed && styles.rowPressed]}
            testID="button-open-tour"
          >
            <Feather name="compass" size={17} color={colors.primary} />
            <Text style={styles.tourText}>Take the guided tour again</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/access" as Href)}
          style={({ pressed }) => [styles.setupRow, pressed && styles.rowPressed]}
          testID="home-access-map"
        >
          <View style={styles.setupIcon}>
            <Feather name="grid" size={21} color={colors.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>See everything in your access</Text>
            <Text style={styles.actionBody}>{canUseElite ? "Elite is active. Review every destination, privacy rule, and offline capability." : "Standard is active. See everything included and exactly what Elite adds."}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>

        {coachCommitment ? (
          <View testID="card-private-coach-commitment" style={styles.commitmentNote}>
            <Feather name="lock" size={16} color={colors.primary} />
            <Text style={styles.commitmentText}>This commitment is private until you explicitly share it.</Text>
          </View>
        ) : null}
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
      <View style={[styles.lockedBrandField, { paddingTop: topPad + 8 }]}>
        <BrandStamp width={160} height={92} />
        <Text style={styles.brandPromise}>Your field guide is ready.</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.greeting}>See how the system works first.</Text>
        <Text style={styles.prompt}>Preview the system, then choose your access.</Text>
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
        <Pressable accessibilityRole="button" onPress={() => router.push("/membership" as Href)} style={styles.membershipButton}>
          <Text style={styles.membershipButtonText}>Compare memberships and subscribe</Text>
          <Feather name="chevron-right" size={19} color={colors.primary} />
        </Pressable>
        <View style={styles.accessSection}>
          <Text style={styles.accessEyebrow}>WHAT THE APP CONTAINS</Text>
          <Text style={styles.accessTitle}>Clear access before you pay</Text>
          <HomeAccessRow icon="tool" title="Standard field tools" detail="Planning, objections, outreach, measurement, Library, and saved work" state="$14.99/wk" onPress={() => router.push("/(tabs)/tools" as Href)} />
          <HomeAccessRow icon="mic" title="Elite Coach" detail="Everything in Standard plus private voice practice and advanced education" state="$19.99/wk" onPress={() => router.push("/(tabs)/coach" as Href)} />
        </View>
      </View>
    </ScrollView>
  );
}

function HomeAccessRow({ icon, title, detail, state, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; detail: string; state: string; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.accessRow}>
      <View style={styles.accessIcon}><Feather name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}><Text style={styles.accessRowTitle}>{title}</Text><Text style={styles.accessRowDetail}>{detail}</Text></View>
      <View style={styles.accessState}><Text style={styles.accessStateText}>{state}</Text><Feather name="chevron-right" size={15} color={colors.primary} /></View>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    heroShell: { backgroundColor: colors.background },
    heroField: { minHeight: 282, paddingHorizontal: 24, paddingBottom: 26, justifyContent: "space-between" },
    heroTopRow: { minHeight: 108, alignItems: "center", justifyContent: "center" },
    heroCopy: { alignItems: "center", gap: 6 },
    heroGreeting: { color: "#FFFFFF", textAlign: "center", fontSize: 31, lineHeight: 36, letterSpacing: -1, ...font("heavy") },
    heroPromise: { color: "#C8D2E2", textAlign: "center", fontSize: 16, lineHeight: 22, ...font("regular") },
    heroSeparator: { width: "100%", height: 53, marginTop: -1 },
    avatarButton: { position: "absolute", right: 0, top: 7, width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "rgba(255,255,255,0.76)", backgroundColor: "#E7EDF5", alignItems: "center", justifyContent: "center" },
    avatarInitials: { color: "#081A33", fontSize: 15, letterSpacing: 0.5, ...font("bold") },
    lockedBrandField: { minHeight: 214, backgroundColor: colors.heroBackground, paddingHorizontal: 22, paddingBottom: 24, justifyContent: "space-between" },
    brandPromise: { color: colors.heroForeground, fontSize: 16, marginTop: 7, ...font("semibold") },
    content: { paddingHorizontal: 22, paddingTop: 10, gap: 0 },
    greeting: { color: colors.foreground, fontSize: 30, lineHeight: 35, letterSpacing: -0.8, ...font("heavy") },
    promptRule: { width: 28, height: 3, borderRadius: 2, backgroundColor: colors.primary, marginBottom: 15 },
    prompt: { color: colors.foreground, fontSize: 27, lineHeight: 33, letterSpacing: -0.7, marginBottom: 18, ...font("heavy") },
    primaryAction: { minHeight: 116, borderRadius: 18, borderCurve: "continuous", overflow: "hidden", shadowColor: colors.primary, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
    primaryActionImage: { borderRadius: 18 },
    primaryActionInner: { minHeight: 116, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
    primaryIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.44)", backgroundColor: "rgba(110,0,8,0.18)", alignItems: "center", justifyContent: "center" },
    primaryCopy: { flex: 1, gap: 4 },
    primaryEyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 9, letterSpacing: 1.7, ...font("bold") },
    primaryTitle: { color: "#FFFFFF", fontSize: 18, lineHeight: 22, ...font("heavy") },
    primaryBody: { color: "rgba(255,255,255,0.88)", fontSize: 12, lineHeight: 17, ...font("regular") },
    pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
    actionList: { marginTop: 14 },
    actionRow: { minHeight: 77, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 5, paddingVertical: 12 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    rowPressed: { opacity: 0.6 },
    accessSection: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 22, padding: 17, marginTop: 12 },
    accessHeadingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 },
    accessEyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 1.7, ...font("bold") },
    accessTitle: { color: colors.foreground, fontSize: 20, letterSpacing: -0.3, marginTop: 4, ...font("heavy") },
    activePill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, backgroundColor: "rgba(47,118,84,0.13)", paddingHorizontal: 9, paddingVertical: 6 },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    activePillText: { color: colors.success, fontSize: 8, letterSpacing: 1, ...font("bold") },
    accessRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingVertical: 12 },
    accessIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    accessRowTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    accessRowDetail: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    accessState: { alignItems: "flex-end", gap: 3 },
    accessStateText: { color: colors.primary, fontSize: 9, letterSpacing: 0.5, ...font("bold") },
    actionIcon: { width: 45, height: 45, borderRadius: 23, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    actionCopy: { flex: 1, gap: 4 },
    actionTitle: { color: colors.foreground, fontSize: 16, ...font("bold") },
    actionBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    commitmentNote: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryMuted, borderRadius: 14, padding: 13 },
    commitmentText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 16, ...font("medium") },
    setupRow: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, paddingHorizontal: 13, paddingVertical: 11, marginTop: 12 },
    setupIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    setupLink: { color: colors.primary, fontSize: 12, ...font("bold") },
    tourTextButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
    tourText: { color: colors.primary, fontSize: 13, ...font("semibold") },
    boundaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingVertical: 17 },
    boundaryText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17, ...font("regular") },
    lockedBody: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, ...font("regular") },
    membershipButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
    membershipButtonText: { color: colors.primary, fontSize: 15, ...font("bold") },
  });
}
