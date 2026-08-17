import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import { useColors } from "@/hooks/useColors";
import { useReminderHistory } from "@/hooks/useReminderHistory";
import { apiGet, fetchOnboardingMobile, updateOnboardingMobile } from "@/lib/api";
import { cancelReminder, removeReminderFromHistory } from "@/lib/notifications";
import { useAuth } from "@/lib/AuthContext";
import {
  formatTrialRemaining,
  isChecklistDone,
  visibleChecklist,
} from "@/lib/onboarding";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { MissionCard } from "@/components/ui/MissionCard";
import { EntitlementBanner } from "@/components/ui/EntitlementBanner";
import { PaywallCard } from "@/components/ui/PaywallCard";

import { font } from "@/lib/typography";
import { useMission } from "@/lib/useMission";
import { trackMobileEvent } from "@/lib/analytics";
import { listCoachMemory } from "@/lib/coachApi";

function formatScheduledTime(ts: number): string {
  const now = Date.now();
  const diffMs = ts - now;
  if (diffMs <= 0) return "soon";

  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 60) return `in ${diffMin}m`;

  const diffHr = Math.round(diffMs / 3_600_000);
  if (diffHr < 24) return `in ${diffHr}h`;

  const diffDays = Math.round(diffMs / 86_400_000);
  return `in ${diffDays}d`;
}

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, canUseElite, isAuthenticated, user, logout, refresh } = useAuth();
  const [personalization, setPersonalization] = useState<{
    continueItems: Array<{ id: string; title: string; href: string; why: string }>;
    recommendedToday: Array<{ id: string; title: string; href: string; why: string }>;
    emptyHistory: boolean;
  } | null>(null);
  const [activation, setActivation] = useState<{
    activated: boolean;
    skipped: boolean;
    role: string;
    nextStep: { id: string; title: string; why: string; mobileHref: string } | null;
    completedRequired: number;
    totalRequired: number;
  } | null>(null);
  const mission = useMission();
  const { reminders, load: reloadReminders, removeReminder } = useReminderHistory();

  const [jobRole, setJobRole] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  /** Secondary chrome collapsed so one primary path wins (craft P1) */
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [coachCommitment, setCoachCommitment] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  const loadOnboarding = useCallback(async () => {
    if (!canUseFieldKit) {
      setOnboardingLoaded(true);
      return;
    }
    try {
      const data = (await fetchOnboardingMobile()) as {
        member: {
          jobRole?: string | null;
          territoryNote?: string | null;
          topObjections?: string | null;
          checklistProgress?: Record<string, boolean | string>;
        };
        activation?: {
          activated: boolean;
          skipped: boolean;
          role: string;
          nextStep: { id: string; title: string; why: string; mobileHref: string } | null;
          completedRequired: number;
          totalRequired: number;
        };
      };
      if (data.activation) setActivation(data.activation);
      setJobRole(data.member.jobRole || "");
      setChecklist(data.member.checklistProgress || {});
      mission.setJobRoleLocal(data.member.jobRole || "");
      mission.setChecklistLocal(data.member.checklistProgress || {});
    } catch {
      // keep local
    } finally {
      setOnboardingLoaded(true);
    }
  }, [canUseFieldKit, mission.setJobRoleLocal, mission.setChecklistLocal]);

  useFocusEffect(
    useCallback(() => {
      reloadReminders();
      loadOnboarding();
      // Entitlement may have changed after web checkout
      void refresh();
    }, [reloadReminders, loadOnboarding, refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!canUseFieldKit) {
        setCoachCommitment(null);
        return undefined;
      }
      let cancelled = false;
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
    }, [canUseFieldKit]),
  );

  useEffect(() => {
    if (Platform.OS === "web") return;

    const receivedSub = Notifications.addNotificationReceivedListener(async (notification) => {
      const id = notification.request.identifier;
      await removeReminderFromHistory(id);
      await reloadReminders();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const id = response.notification.request.identifier;
      await removeReminderFromHistory(id);
      await reloadReminders();
    });

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        reloadReminders();
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    const pollInterval = setInterval(() => {
      if (AppState.currentState === "active") {
        reloadReminders();
      }
    }, 30_000);

    return () => {
      receivedSub.remove();
      responseSub.remove();
      appStateSub.remove();
      clearInterval(pollInterval);
    };
  }, [reloadReminders]);

  useEffect(() => {
    if (!isAuthenticated || !canUseFieldKit) {
      setPersonalization(null);
      return;
    }
    let cancelled = false;
    void apiGet<{
      continueItems: Array<{ id: string; title: string; href: string; why: string }>;
      recommendedToday: Array<{ id: string; title: string; href: string; why: string }>;
      emptyHistory: boolean;
    }>("/api/v1/personalization")
      .then((data) => {
        if (!cancelled) setPersonalization({
          continueItems: data.continueItems || [],
          recommendedToday: data.recommendedToday || [],
          emptyHistory: !!data.emptyHistory,
        });
      })
      .catch(() => { if (!cancelled) setPersonalization(null); });
    return () => { cancelled = true; };
  }, [isAuthenticated, canUseFieldKit]);

  const handleCancelReminder = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelReminder(id);
    await removeReminder(id);
  };

  const items = useMemo(() => visibleChecklist(jobRole), [jobRole]);
  const doneCount = items.filter((i) => isChecklistDone(checklist, i.id)).length;
  const trialLabel = formatTrialRemaining(user?.fieldKit?.hoursRemaining);
  const firstName = user?.member?.name?.split(" ")[0] || "";
  const needsRole = !jobRole;
  const isFirstSession = needsRole || doneCount === 0;

  const saveRole = async (role: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJobRole(role);
    try {
      const data = await updateOnboardingMobile({ jobRole: role });
      setJobRole(data.member.jobRole || role);
      setChecklist(data.member.checklistProgress || checklist);
      await refresh();
    } catch {
      // keep local role
    }
  };

  const openChecklistItem = (item: (typeof items)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.route) router.push(item.route as any);
    else if (item.toolTab) {
      router.push({ pathname: "/tool/[tab]", params: { tab: item.toolTab } } as any);
    } else {
      router.push("/(tabs)/tools");
    }
  };


  if (!isAuthenticated) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: bottomPad,
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: topPad + 12,
        }}
        showsVerticalScrollIndicator={false}
        testID="screen-logged-out-home"
      >
        <View style={[styles.loggedOutBrand, { backgroundColor: colors.heroBackground }]}>
          <Image
            source={require("@/assets/images/spartan-coaching-lockup.png")}
            style={styles.loggedOutLockup}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.loggedOutKicker, { color: colors.primary }, font("bold")]}>YOUR FIELD ADVANTAGE</Text>
        <Text style={[styles.loggedOutTitle, { color: colors.foreground }, font("heavy")]}>Prepare better. Speak with clarity. Follow through.</Text>
        <Text style={[styles.loggedOutBody, { color: colors.mutedForeground }, font("regular")]}>Spartan Coaching brings disciplined hospice sales tools and private coaching practice to your iPhone.</Text>

        <View style={[styles.membershipCard, { backgroundColor: colors.card, borderColor: colors.border }] } testID="door-hospice-sales-pro">
          <View style={styles.membershipHeading}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planEyebrow, { color: colors.primary }, font("bold")]}>ELITE TOOLS SUBSCRIPTION</Text>
              <Text style={[styles.planTitle, { color: colors.foreground }, font("bold")]}>Hospice Sales Pro</Text>
            </View>
            <View style={[styles.pricePill, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.priceText, { color: colors.primary }, font("bold")]}>from $14.99</Text>
              <Text style={[styles.priceCadence, { color: colors.primary }, font("medium")]}>per week</Text>
            </View>
          </View>
          <View style={styles.planFeatures}>
            {["Field planning and sales practice", "Private Spartan Coach with Elite", "Light, Dark, and System appearance"].map((feature) => (
              <View key={feature} style={styles.planFeature}>
                <Feather name="check" size={16} color={colors.success} />
                <Text style={[styles.planFeatureText, { color: colors.foreground }, font("medium")]}>{feature}</Text>
              </View>
            ))}
          </View>
          <Pressable style={[styles.loggedOutPrimary, { backgroundColor: colors.primary }]} onPress={() => router.push("/login")} testID="button-client-login">
            <Text style={[styles.loggedOutPrimaryText, font("bold")]}>Sign in</Text>
            <Feather name="arrow-right" size={19} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.loggedOutLink} onPress={() => router.push("/register" as Href)} testID="button-create-account-logged-out">
            <Text style={[styles.loggedOutLinkText, { color: colors.primary }, font("semibold")]}>Create an individual account</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.consultingRow, { borderColor: colors.borderStrong }]} onPress={() => router.push("/(tabs)/contact")} testID="button-book-call-logged-out">
          <View style={[styles.consultingIcon, { backgroundColor: colors.secondary }]}><Feather name="users" size={20} color={colors.foreground} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.consultingTitle, { color: colors.foreground }, font("semibold")]}>Need human consulting?</Text><Text style={[styles.consultingBody, { color: colors.mutedForeground }, font("regular")]}>Strategy, team systems, and contracted company enrollment.</Text></View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>
    );
  }

  // ── Shell B: Authenticated but locked ─────────────────────────────
  if (!canUseFieldKit) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 16, paddingTop: topPad + 16 }}
        showsVerticalScrollIndicator={false}
        testID="screen-locked-home"
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <SectionKicker>Today</SectionKicker>
            <Text style={[{ color: colors.warning, fontSize: 11, letterSpacing: 1.8, marginTop: 5 }, font("bold")]}>ELITE FIELD DESK</Text>
          </View>
          <Pressable
            accessibilityLabel="Open account"
            onPress={() => router.push("/(tabs)/account")}
            style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong }}
          >
            <Text style={[{ color: colors.foreground, fontSize: 15 }, font("semibold")]}>
              {(firstName || "S").slice(0, 2).toUpperCase()}
            </Text>
          </Pressable>
        </View>
        <Text style={[{ color: colors.foreground, fontSize: 26, marginTop: 10 }, font("heavy")]}>
          {user?.organization?.status === "suspended"
            ? "Restore access"
            : user?.organization?.status === "expired"
              ? "Access ended"
              : "One step to live tools"}
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 14, marginTop: 8, lineHeight: 20 }, font("regular")]}>
          Preview is free. Generate, save, and run tools live with an active subscription or evaluation.
        </Text>

        <View style={{ marginTop: 20 }}>
          <PaywallCard
            isAuthenticated
            orgStatus={user?.organization?.status}
            title={
              user?.organization?.status === "suspended"
                ? "Update billing to restore access"
                : user?.organization?.status === "expired"
                  ? "Access ended · subscribe to continue"
                  : "$14.99/week · cancel anytime"
            }
            body="Choose Standard or Elite in Account, then subscribe securely with Apple. Existing Apple purchases can be restored there at any time."
            primaryLabel="Choose membership"
            onPrimary={() => router.push("/(tabs)/account")}
            testID="button-locked-account"
          />
        </View>
        <SpartanButton
          title="Preview tool map"
          variant="outline"
          onPress={() => router.push("/(tabs)/tools")}
          style={{ marginTop: 12 }}
        />
        <SpartanButton
          title="Book a strategy call"
          variant="ghost"
          onPress={() => router.push("/(tabs)/contact")}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    );
  }

  // ── Field companion (logged-in + entitled) ────────────────────────
  // Single primary: activation (if required) OR useMission.primary — never both heroes.
  const activationPrimary =
    activation && !activation.activated && !activation.skipped && activation.nextStep
      ? activation.nextStep
      : null;

  const runMissionCta = () => {
    if (activationPrimary) {
      void trackMobileEvent("craft", "mission_cta_tap", {
        metadata: { surface: "home", platform: "ios", source: "activation", stepId: activationPrimary.id },
      });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const href = activationPrimary.mobileHref;
      if (href.includes("command") || href.includes("sales-workflow")) {
        router.push("/(tabs)/command");
      } else if (href.includes("objection")) {
        router.push("/tool/objection" as any);
      } else if (href.includes("playbook")) {
        router.push("/tool/playbook" as any);
      } else if (href.includes("account")) {
        router.push("/(tabs)/account");
      } else {
        router.push("/(tabs)/tools");
      }
      return;
    }
    if (needsRole) {
      setChecklistOpen(true);
      return;
    }
    void trackMobileEvent("craft", "mission_cta_tap", {
      metadata: {
        surface: "home",
        platform: "ios",
        source: mission.primary?.kind ?? "command",
      },
    });
    if (mission.primary?.href) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(mission.primary.href as any);
    } else {
      router.push("/(tabs)/command" as any);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      testID="screen-entitled-home"
    >
      <LinearGradient
        colors={[colors.heroBackground, colors.background, colors.card]}
        style={[styles.fieldHero, { paddingTop: topPad + 16 }]}
      >
        <SectionKicker>Hospice Sales Pro</SectionKicker>
        <Text
          style={{
            color: colors.heroForeground,
            fontSize: 28,
            fontWeight: "800",
            marginTop: 10,
            letterSpacing: -0.6,
            lineHeight: 34,
            ...font("bold"),
          }}
        >
          {isFirstSession
            ? `Make this session count${firstName ? `, ${firstName}` : ""}`
            : `Welcome back${firstName ? `, ${firstName}` : ""}`}
        </Text>
        <Text
          style={{
            color: colors.heroMuted,
            marginTop: 8,
            fontSize: 15,
            lineHeight: 22,
            ...font("regular"),
          }}
        >
          One clear commitment. One next conversation.
        </Text>
        <View style={{ marginTop: 14 }}>
          {user?.organization?.status === "trial" && trialLabel ? (
            <EntitlementBanner
              label={trialLabel}
              role="trial"
              actionLabel="Account"
              onAction={() => router.push("/(tabs)/account")}
              testID="banner-trial"
            />
          ) : (
            <EntitlementBanner
              label={canUseElite ? "Hospice Sales Pro Elite · active" : "Hospice Sales Pro · active"}
              role="active"
              actionLabel="Account"
              onAction={() => router.push("/(tabs)/account")}
              testID="banner-member"
            />
          )}
        </View>
      </LinearGradient>

      <View style={[styles.section, { paddingTop: 16 }]}>
        {coachCommitment ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open saved Coach commitment"
            onPress={() => router.push("/(tabs)/coach")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              marginBottom: 14,
            }}
            testID="card-private-coach-commitment"
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.signal, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.mission }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.4 }, font("bold")]}>PRIVATE COMMITMENT</Text>
              <Text style={[{ color: colors.foreground, fontSize: 16, lineHeight: 22, marginTop: 5 }, font("semibold")]}>{coachCommitment}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
        <MissionCard
          kicker={
            activationPrimary
              ? `First value · ${activation?.completedRequired ?? 0}/${activation?.totalRequired ?? 0}`
              : "Next action"
          }
          title={
            activationPrimary?.title ??
            mission.primary?.title ??
            (needsRole ? "Pick your role" : "Open Command Center")
          }
          subtitle={
            activationPrimary?.why ??
            mission.primary?.subtitle ??
            "Plan → prepare → practice → capture outcome."
          }
          ctaLabel={
            activationPrimary
              ? "Do this next"
              : mission.primary?.ctaLabel ?? (needsRole ? "Choose role below" : "Open Command Center")
          }
          onCta={runMissionCta}
          ctaDisabled={false}
          secondaryLabel={
            activationPrimary
              ? "Skip (experienced)"
              : needsRole
                ? undefined
                : "All tools"
          }
          onSecondary={
            activationPrimary
              ? () => {
                  void (async () => {
                    void trackMobileEvent("craft", "activation_step_done", {
                      metadata: {
                        surface: "home",
                        platform: "ios",
                        stepId: activationPrimary.id,
                        outcome: "skipped",
                      },
                    });
                    try {
                      const data = await updateOnboardingMobile({ skipActivation: true });
                      if (data.activation) setActivation(data.activation);
                    } catch {
                      // ignore
                    }
                  })();
                }
              : () => router.push("/(tabs)/tools")
          }
        />
        {activationPrimary ? (
          <SpartanButton
            title="Mark step done"
            variant="outline"
            style={{ marginTop: 10 }}
            onPress={() => {
              void (async () => {
                void trackMobileEvent("craft", "activation_step_done", {
                  metadata: {
                    surface: "home",
                    platform: "ios",
                    stepId: activationPrimary.id,
                    outcome: "done",
                  },
                });
                try {
                  const data = await updateOnboardingMobile({
                    activationStep: { id: activationPrimary.id, done: true },
                  });
                  if (data.activation) setActivation(data.activation);
                } catch {
                  // ignore
                }
              })();
            }}
          />
        ) : null}

        {/* Quiet chips — not second heroes */}
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}
          testID="section-today-stack"
        >
          {(jobRole === "director" || jobRole === "vp" || jobRole === "owner"
            ? ([
                { label: "Command", path: "/(tabs)/command" as const },
                { label: "Staffing", path: "/staffing" as const },
                { label: "Weekly", path: "/tool/[tab]" as const, params: { tab: "weekly" } },
              ] as const)
            : ([
                { label: "Command", path: "/(tabs)/command" as const },
                { label: "Objections", path: "/tool/[tab]" as const, params: { tab: "objection" } },
                { label: "Weekly", path: "/tool/[tab]" as const, params: { tab: "weekly" } },
              ] as const)
          ).map((chip) => (
            <Pressable
              key={chip.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if ("params" in chip && chip.params) {
                  router.push({ pathname: chip.path, params: chip.params } as any);
                } else {
                  router.push(chip.path as any);
                }
              }}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: colors.border,
                backgroundColor: colors.card,
                justifyContent: "center",
              }}
            >
              <Text style={[{ color: colors.foreground, fontSize: 13 }, font("semibold")]}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Role pick only — required for mission personalization (not a second hero) */}
      {needsRole ? (
        <View style={[styles.section, { paddingTop: 8 }]} testID="section-first-session">
          <SectionKicker>Your role</SectionKicker>
          <View
            style={[
              styles.startCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                marginTop: 8,
              },
            ]}
          >
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>
              Sets checklist and recommended tools
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {(
                [
                  { id: "rep", label: "Rep" },
                  { id: "director", label: "Director" },
                  { id: "vp", label: "VP" },
                  { id: "owner", label: "Owner" },
                  { id: "other", label: "Other" },
                ] as const
              ).map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => saveRole(r.id)}
                  style={{
                    minHeight: 44,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                  }}
                  testID={`button-role-${r.id}`}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 13 }}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* Secondary: collapsible checklist progress (not a second mission) */}
      {canUseFieldKit && items.length > 0 ? (
        <View style={[styles.section, { paddingTop: 12 }]} testID="section-checklist-secondary">
          <Pressable
            onPress={() => setChecklistOpen((v) => !v)}
            accessibilityRole="button"
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={[{ color: colors.mutedForeground, fontSize: 13 }, font("semibold")]}>
              Session checklist · {doneCount}/{items.length}
            </Text>
            <Feather
              name={checklistOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
          {checklistOpen
            ? items.slice(0, 6).map((item) => {
                const done = isChecklistDone(checklist, item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openChecklistItem(item)}
                    style={{
                      marginTop: 8,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: StyleSheet.hairlineWidth * 2,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      opacity: done ? 0.65 : 1,
                    }}
                  >
                    <Text style={[{ color: colors.foreground, fontSize: 14 }, font("semibold")]}>
                      {done ? "✓ " : ""}
                      {item.title}
                    </Text>
                  </Pressable>
                );
              })
            : null}
        </View>
      ) : null}

      {/* Secondary personalization and dedicated Coach entry */}
      <View style={[styles.section, { paddingTop: 8 }]}>
        <Pressable
          onPress={() => setMoreOpen((v) => !v)}
          accessibilityRole="button"
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          testID="section-more-toggle"
        >
          <Text style={[{ color: colors.mutedForeground, fontSize: 13 }, font("semibold")]}>
            More · continue
          </Text>
          <Feather name={moreOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
        </Pressable>
        {moreOpen ? (
          <View style={{ marginTop: 10 }}>
            {personalization?.continueItems?.slice(0, 2).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (item.href.includes("sales-workflow")) router.push("/(tabs)/command");
                  else if (item.href.includes("objection")) router.push("/tool/objection" as any);
                  else router.push("/(tabs)/tools");
                }}
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Text style={[{ color: colors.foreground, fontSize: 14 }, font("bold")]}>{item.title}</Text>
                <Text
                  style={[
                    { color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 16 },
                    font("regular"),
                  ]}
                >
                  {item.why}
                </Text>
              </Pressable>
            ))}
            <SpartanButton
              title="Open Spartan Coach"
              variant="outline"
              onPress={() => router.push("/(tabs)/coach")}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : null}
      </View>

      {/* Reminders */}
      {Platform.OS !== "web" && reminders.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, ...font("bold") }]}>
              Follow-up reminders
            </Text>
          </View>
          <View style={styles.reminderList}>
            {reminders.map((reminder) => (
              <View
                key={reminder.id}
                style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.reminderDot, { backgroundColor: colors.primary }]} />
                <View style={styles.reminderContent}>
                  <Text
                    style={[styles.reminderTitle, { color: colors.foreground, ...font("semibold") }]}
                    numberOfLines={1}
                  >
                    {reminder.title}
                  </Text>
                  {reminder.contact ? (
                    <Text
                      style={[styles.reminderContact, { color: colors.foreground, ...font("medium") }]}
                      numberOfLines={1}
                    >
                      {reminder.contact}
                    </Text>
                  ) : null}
                  <Text style={[styles.reminderMeta, { color: colors.mutedForeground, ...font("regular") }]}>
                    {reminder.presetLabel} · {formatScheduledTime(reminder.scheduledFor)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleCancelReminder(reminder.id)}
                  hitSlop={10}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.section, { paddingTop: 8 }]}>
        <SpartanButton
          title="Book a strategy call"
          variant="ghost"
          onPress={() => router.push("/(tabs)/contact")}
        />
        <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: "center", marginTop: 8 }}>
          Do not enter PHI · Coaching aid only · Same seat as web
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loggedOutBrand: { height: 126, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  loggedOutLockup: { width: "96%", height: "92%" },
  loggedOutKicker: { fontSize: 10, letterSpacing: 2, marginTop: 28 },
  loggedOutTitle: { fontSize: 34, lineHeight: 39, letterSpacing: -1, marginTop: 10 },
  loggedOutBody: { fontSize: 16, lineHeight: 24, marginTop: 11 },
  membershipCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 24 },
  membershipHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  planEyebrow: { fontSize: 9, letterSpacing: 1.5 },
  planTitle: { fontSize: 23, marginTop: 5 },
  pricePill: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, alignItems: "flex-end" },
  priceText: { fontSize: 13 },
  priceCadence: { fontSize: 10, marginTop: 1 },
  planFeatures: { gap: 11, marginTop: 18 },
  planFeature: { flexDirection: "row", alignItems: "center", gap: 9 },
  planFeatureText: { flex: 1, fontSize: 14 },
  loggedOutPrimary: { minHeight: 54, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 17, marginTop: 20 },
  loggedOutPrimaryText: { color: "#FFFFFF", fontSize: 16 },
  loggedOutLink: { minHeight: 46, alignItems: "center", justifyContent: "center" },
  loggedOutLinkText: { fontSize: 14 },
  consultingRow: { minHeight: 82, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  consultingIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  consultingTitle: { fontSize: 15 },
  consultingBody: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  hero: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  fieldHero: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(200,214,240,0.12)",
  },
  logo: { width: 64, height: 64, marginBottom: 20 },
  heroTitle: {
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroTitleAccent: {
    marginTop: -4,
  },
  heroTagline: {
    fontSize: 14,
    marginTop: 10,
    letterSpacing: 0.3,
    textAlign: "center",
    lineHeight: 20,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 20,
  },
  heroBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  heroBadgeText: { fontSize: 13, fontWeight: "700" },
  section: { paddingHorizontal: 20, paddingVertical: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  sectionSubtitle: { fontSize: 14, marginBottom: 16 },
  startCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reminderList: { gap: 8, marginTop: 12 },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reminderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 14, marginBottom: 1 },
  reminderContact: { fontSize: 13, marginBottom: 2 },
  reminderMeta: { fontSize: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inputIcon: { flexShrink: 0 },
  input: { flex: 1, fontSize: 16, minHeight: 24 },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: "100%",
  },
  suggestionText: { fontSize: 13 },
  resultCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  loadingText: { fontSize: 14, marginLeft: 8 },
  errorCard: { marginTop: 12, borderRadius: 12, padding: 14 },
  errorText: { fontSize: 14 },
  responseText: { fontSize: 15, lineHeight: 22 },
  resetBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  resetBtnText: { fontSize: 14 },
  toolsGrid: { gap: 12 },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: { fontSize: 16 },
  toolSub: { fontSize: 13, marginTop: 2 },
  missionSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  missionOverline: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    lineHeight: 30,
  },
  missionBody: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 20,
  },
  pillarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  pillarAccent: {
    width: 3,
    height: 44,
    borderRadius: 2,
    marginTop: 2,
    flexShrink: 0,
  },
  pillarName: { fontSize: 17, fontWeight: "800", marginBottom: 3 },
  pillarDesc: { fontSize: 14, lineHeight: 20 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "700" },
});
