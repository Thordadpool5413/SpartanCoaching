import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import { useColors } from "@/hooks/useColors";
import { useReminderHistory } from "@/hooks/useReminderHistory";
import { ApiError, apiGet, apiPost, fetchOnboardingMobile, updateOnboardingMobile } from "@/lib/api";
import { cancelReminder, removeReminderFromHistory } from "@/lib/notifications";
import { useAuth } from "@/lib/AuthContext";
import {
  formatTrialRemaining,
  isChecklistDone,
  START_HERE,
  visibleChecklist,
  type ChecklistId,
} from "@/lib/onboarding";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SpartanButton } from "@/components/ui/SpartanButton";

import { font } from "@/lib/typography";
import { getWebSiteUrl } from "@/lib/api";
import { useMission } from "@/lib/useMission";
import { PaywallCard } from "@/components/ui/PaywallCard";

const SUGGESTIONS = [
  "What are hospice eligibility criteria for heart failure?",
  "How do I handle the 'not ready' objection?",
  "What is the Medicare hospice benefit?",
  "Best strategies for building physician referrals?",
];

const QUICK_TOOLS = [
  { label: "Sales Command Center", icon: "calendar" as const, route: "/sales-workflow" as const, toolTab: undefined },
  { label: "Objection Handler", icon: "shield" as const, route: undefined, toolTab: "objection" },
  { label: "Sales Playbooks", icon: "book-open" as const, route: undefined, toolTab: "playbook" },
  { label: "Email Templates", icon: "mail" as const, route: undefined, toolTab: "email" },
  { label: "Role-Play", icon: "users" as const, route: undefined, toolTab: "roleplay" },
  { label: "Share Brand Film", icon: "film" as const, route: "/brand-video" as const, toolTab: undefined },
];

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

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated, user, logout, refresh } = useAuth();
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
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reminders, load: reloadReminders, removeReminder } = useReminderHistory();

  const [jobRole, setJobRole] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  /** Coach query is secondary — collapsed by default so one primary path wins */
  const [coachOpen, setCoachOpen] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

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

  const handleAsk = async (prompt: string) => {
    if (!prompt.trim()) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from the Account tab.");
      return;
    }
    setLoading(true);
    setResponse("");
    setError(null);
    try {
      const data = await apiPost<{ response: string }>("/api/chat", {
        prompt,
        conversationHistory: [],
      });
      setResponse(data.response);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: unknown) {
      // ApiError exposes HTTP status on `.status` (message is the server text, not "401: …").
      const status = e instanceof ApiError ? e.status : undefined;
      if (status === 401 || status === 403) {
        setError("Hospice Sales Pro access required. Sign in with an approved client account.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery("");
    setResponse("");
    setError(null);
  };

  const handleCancelReminder = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelReminder(id);
    await removeReminder(id);
  };

  const items = useMemo(() => visibleChecklist(jobRole), [jobRole]);
  const doneCount = items.filter((i) => isChecklistDone(checklist, i.id)).length;
  const progressPct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const startHere = START_HERE[jobRole || "other"] || START_HERE.other;
  const trialLabel = formatTrialRemaining(user?.fieldKit?.hoursRemaining);
  const firstName = user?.member?.name?.split(" ")[0] || "";
  const needsRole = !jobRole;
  const isFirstSession = needsRole || doneCount === 0;
  const incomplete = items.filter((i) => !isChecklistDone(checklist, i.id));
  const nextItem = incomplete[0] ?? null;

  const openStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (startHere.route) router.push(startHere.route as any);
    else if (startHere.toolTab) {
      router.push({ pathname: "/tool/[tab]", params: { tab: startHere.toolTab } } as any);
    } else {
      router.push("/(tabs)/tools");
    }
  };

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

  const toggleItem = async (id: ChecklistId, done: boolean) => {
    setToggling(id);
    setChecklist((prev) => {
      const next = { ...prev };
      if (done) next[id] = new Date().toISOString();
      else delete next[id];
      return next;
    });
    try {
      const data = await updateOnboardingMobile({ checklistItem: { id, done } });
      setChecklist(data.member.checklistProgress || {});
      await refresh();
    } catch {
      await loadOnboarding();
    } finally {
      setToggling(null);
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

  const siteUrl = getWebSiteUrl();

  // ── Shell A: Logged-out — dual doors ──────────────────────────────
  if (!isAuthenticated) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: bottomPad,
          flexGrow: 1,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        testID="screen-logged-out-home"
      >
        <LinearGradient
          colors={[colors.heroBackground, colors.background]}
          style={[styles.hero, { paddingTop: topPad + 28, paddingBottom: 32, marginHorizontal: -16 }]}
        >
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <SectionKicker>Spartan Coaching</SectionKicker>
          <Text style={[styles.heroTitle, { color: colors.heroForeground, marginTop: 12 }, font("heavy")]}>
            Field-ready hospice sales coaching.
          </Text>
          <Text style={[styles.heroTagline, { color: colors.heroMuted, marginTop: 12 }, font("regular")]}>
            Two clear offers: human consulting, or Hospice Sales Pro tools on this iPhone.
          </Text>
        </LinearGradient>

        <View style={{ gap: 12, marginTop: 8 }}>
          <SpartanCard variant="emphasis" testID="door-consulting">
            <SectionKicker>Offer 1 · Human</SectionKicker>
            <Text style={[{ color: colors.foreground, fontSize: 18, marginTop: 8 }, font("bold")]}>
              Consulting
            </Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 19 }, font("regular")]}>
              Strategy calls, team systems, and coaching that holds when the week is hard.
            </Text>
            <SpartanButton
              title="Book a strategy call"
              onPress={() => router.push("/(tabs)/contact")}
              style={{ marginTop: 14 }}
              testID="button-book-call-logged-out"
            />
          </SpartanCard>

          <SpartanCard variant="default" testID="door-hospice-sales-pro">
            <SectionKicker>Offer 2 · Tools</SectionKicker>
            <Text style={[{ color: colors.foreground, fontSize: 18, marginTop: 8 }, font("bold")]}>
              Hospice Sales Pro
            </Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 19 }, font("regular")]}>
              Command Center, objections, role-play, weekly plans — $14.99/wk · cancel anytime.
            </Text>
            <SpartanButton
              title="Client login"
              onPress={() => router.push("/login")}
              style={{ marginTop: 14 }}
              testID="button-client-login"
            />
            <SpartanButton
              title="See what's inside"
              variant="outline"
              onPress={() => void Linking.openURL(`${siteUrl}/hospice-sales-pro`)}
              style={{ marginTop: 10 }}
              testID="button-hospice-sales-pro-logged-out"
            />
          </SpartanCard>
        </View>
      </ScrollView>
    );
  }

  // ── Shell B: Authenticated but locked ─────────────────────────────
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
        if (!cancelled) {
          setPersonalization({
            continueItems: data.continueItems || [],
            recommendedToday: data.recommendedToday || [],
            emptyHistory: !!data.emptyHistory,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setPersonalization(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, canUseFieldKit]);

  if (!canUseFieldKit) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 16, paddingTop: topPad + 16 }}
        showsVerticalScrollIndicator={false}
        testID="screen-locked-home"
      >
        <SectionKicker>Hospice Sales Pro</SectionKicker>
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
            title={
              user?.organization?.status === "suspended"
                ? "Update billing to restore access"
                : "$14.99/week · cancel anytime"
            }
            body="Subscribe on Account (Stripe). When you return to the app, access refreshes automatically."
            primaryLabel="Go to Account"
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
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.heroBackground, colors.background, colors.card]}
        style={[styles.fieldHero, { paddingTop: topPad + 16 }]}
      >
        <SectionKicker>Portal · Hospice Sales Pro</SectionKicker>
        <Text
          style={{
            color: colors.heroForeground,
            fontSize: 30,
            fontWeight: "800",
            marginTop: 10,
            letterSpacing: -0.6,
            lineHeight: 36,
            fontFamily: "Inter_700Bold",
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
            fontFamily: "Inter_400Regular",
          }}
        >
          {isFirstSession
            ? "Same as the web: role → Command Center → one real tool → debrief."
            : "Today starts in Command Center. Practice and plan tools support the next visit."}
        </Text>
        {user?.organization?.status === "trial" && trialLabel ? (
          <View
            style={{
              marginTop: 14,
              alignSelf: "flex-start",
              backgroundColor: colors.warning ? `${colors.warning}22` : colors.muted,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Feather name="clock" size={14} color={colors.warning || colors.primary} />
            <Text style={{ color: colors.heroForeground, fontWeight: "700", fontSize: 13 }}>{trialLabel}</Text>
            <Pressable onPress={() => router.push("/(tabs)/contact")}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13, textDecorationLine: "underline" }}>
                Debrief
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              alignSelf: "flex-start",
              backgroundColor: colors.muted,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.success || colors.primary, fontWeight: "700", fontSize: 13 }}>
              Hospice Sales Pro · active
            </Text>
          </View>
        )}
      </LinearGradient>

      {activation && !activation.activated && activation.nextStep ? (
        <View style={[styles.section, { paddingTop: 16 }]} testID="section-activation-loop">
          <SectionKicker>
            {`First value · ${activation.completedRequired}/${activation.totalRequired}`}
          </SectionKicker>
          <SpartanCard variant="emphasis">
            <Text style={[{ color: colors.foreground, fontSize: 17 }, font("bold")]}>
              {activation.nextStep.title}
            </Text>
            <Text
              style={[
                { color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 18 },
                font("regular"),
              ]}
            >
              {activation.nextStep.why}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <SpartanButton
                title="Open in product"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const href = activation.nextStep!.mobileHref;
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
                }}
              />
              <SpartanButton
                title="Mark done"
                variant="outline"
                onPress={() => {
                  void (async () => {
                    try {
                      const data = await updateOnboardingMobile({
                        activationStep: { id: activation.nextStep!.id, done: true },
                      });
                      if (data.activation) setActivation(data.activation);
                    } catch {
                      // ignore
                    }
                  })();
                }}
              />
              <SpartanButton
                title="Skip (experienced)"
                variant="ghost"
                onPress={() => {
                  void (async () => {
                    try {
                      const data = await updateOnboardingMobile({ skipActivation: true });
                      if (data.activation) setActivation(data.activation);
                    } catch {
                      // ignore
                    }
                  })();
                }}
              />
            </View>
          </SpartanCard>
        </View>
      ) : null}

      {personalization &&
      (personalization.continueItems.length > 0 ||
        personalization.recommendedToday.length > 0) ? (
        <View style={[styles.section, { paddingTop: 16 }]} testID="section-personalization">
          <SectionKicker>For you · synced</SectionKicker>
          {personalization.continueItems.slice(0, 3).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.href.includes("sales-workflow")) {
                  router.push("/(tabs)/command");
                } else if (item.href.includes("objection")) {
                  router.push("/tool/objection" as any);
                } else {
                  router.push("/(tabs)/tools");
                }
              }}
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.why}`}
            >
              <Text style={[{ color: colors.foreground, fontSize: 15 }, font("bold")]}>
                {item.title}
              </Text>
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
          {personalization.recommendedToday.slice(0, 2).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/tools");
              }}
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.why}`}
            >
              <Text style={[{ color: colors.primary, fontSize: 14 }, font("semibold")]}>
                {item.title}
              </Text>
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
        </View>
      ) : null}

      {/* Mission next — ONE emphasis card; secondary Command is a quiet chip row */}
      <View style={[styles.section, { paddingTop: 16 }]} testID="section-mission-next">
        <SpartanCard variant="emphasis">
          <SectionKicker>Next action</SectionKicker>
          <Text style={[{ color: colors.foreground, fontSize: 20, marginTop: 8 }, font("heavy")]}>
            {mission.primary?.title ??
              (needsRole ? "Pick your role" : nextItem ? nextItem.title : "Open Sales Command Center")}
          </Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 6, lineHeight: 19 }, font("regular")]}>
            {mission.primary?.subtitle ??
              (needsRole
                ? "Personalizes checklist and recommended tools."
                : nextItem
                  ? nextItem.desc
                  : "Plan → prepare → practice → capture outcome → next step.")}
          </Text>
          <SpartanButton
            title={
              mission.primary?.ctaLabel ??
              (needsRole ? "Choose role below" : nextItem ? "Do this next" : "Open Command Center")
            }
            onPress={() => {
              if (needsRole) return;
              if (nextItem) openChecklistItem(nextItem);
              else if (mission.primary?.href) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(mission.primary.href as any);
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/(tabs)/command" as any);
              }
            }}
            disabled={needsRole}
            style={{ marginTop: 14 }}
            testID="button-mission-next"
          />
        </SpartanCard>

        {/* Today stack — max 3 quiet chips (not second emphasis cards) */}
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

      {/* First-session 3-step path */}
      {isFirstSession && (
        <View style={[styles.section, { paddingTop: 8 }]} testID="section-first-session">
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 }}>
            FIRST SESSION — DO THESE THREE
          </Text>

          {/* Step 1 role */}
          <View
            style={[
              styles.startCard,
              {
                backgroundColor: colors.card,
                borderColor: needsRole ? colors.primary : "rgba(74,222,128,0.4)",
                marginBottom: 10,
              },
            ]}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "800" }}>
              {needsRole ? "1 · PICK YOUR ROLE" : "1 · ROLE SAVED"}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700", marginTop: 4 }}>
              Sets your recommended tool and checklist
            </Text>
            {needsRole ? (
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
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                    }}
                    testID={`button-role-${r.id}`}
                  >
                    <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 13 }}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.success || colors.primary, fontWeight: "700", marginTop: 8, textTransform: "capitalize" }}>
                {jobRole}
              </Text>
            )}
          </View>

          {/* Step 2 tool */}
          <Pressable
            onPress={needsRole ? undefined : openStart}
            disabled={needsRole}
            style={[
              styles.startCard,
              {
                backgroundColor: colors.card,
                borderColor: !needsRole ? colors.primary : colors.border,
                marginBottom: 10,
                opacity: needsRole ? 0.55 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "800" }}>
              2 · RUN ONE REAL TOOL
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800", marginTop: 6 }}>
              {needsRole ? "Choose a role first" : startHere.title}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
              {needsRole ? "Then we point you at the best first move." : startHere.blurb}
            </Text>
            {!needsRole && (
              <Text style={{ color: colors.primary, fontWeight: "800", marginTop: 10 }}>Open →</Text>
            )}
          </Pressable>

          {/* Step 3 debrief */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/contact");
            }}
            style={[styles.startCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "800" }}>
              3 · BOOK A DEBRIEF
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800", marginTop: 6 }}>
              While evaluation is open
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
              Turn what you saw into seats, coaching, or a clear next step.
            </Text>
            <Text style={{ color: colors.primary, fontWeight: "800", marginTop: 10 }}>Contact →</Text>
          </Pressable>
        </View>
      )}

      {/* Next up when mid-session */}
      {!isFirstSession && nextItem && (
        <View style={[styles.section, { paddingTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Next up
          </Text>
          <Pressable
            onPress={() => openChecklistItem(nextItem)}
            style={[styles.startCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
          >
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>
              CONTINUE
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800", marginTop: 6 }}>
              {nextItem.title}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{nextItem.desc}</Text>
            <Text style={{ color: colors.primary, fontWeight: "800", marginTop: 10 }}>Open →</Text>
          </Pressable>
        </View>
      )}

      {/* Recommended when past first session */}
      {!isFirstSession && (
        <View style={[styles.section, { paddingTop: 8 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Recommended move
          </Text>
          <Pressable
            onPress={openStart}
            style={[styles.startCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>{startHere.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{startHere.blurb}</Text>
            <Text style={{ color: colors.primary, fontWeight: "800", marginTop: 10 }}>Open →</Text>
          </Pressable>
        </View>
      )}

      {/* Checklist */}
      <View style={[styles.section, { paddingTop: 8 }]}>
        <View style={styles.sectionHeader}>
          <Feather name="check-square" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            First-session checklist
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
          {doneCount} of {items.length} · {progressPct}%
        </Text>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${progressPct}%`, backgroundColor: colors.primary }} />
        </View>

        {items.map((item) => {
          const done = isChecklistDone(checklist, item.id);
          return (
            <View
              key={item.id}
              style={[
                styles.checkRow,
                {
                  backgroundColor: colors.card,
                  borderColor: done ? colors.success || colors.primary : colors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => toggleItem(item.id, !done)}
                disabled={toggling === item.id}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Feather
                  name={done ? "check-circle" : "circle"}
                  size={22}
                  color={done ? colors.success || colors.primary : colors.mutedForeground}
                />
              </Pressable>
              <Pressable onPress={() => openChecklistItem(item)} style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontWeight: "700",
                    fontSize: 14,
                    textDecorationLine: done ? "line-through" : "none",
                    opacity: done ? 0.75 : 1,
                  }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                  {item.desc}
                </Text>
              </Pressable>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>
          );
        })}
      </View>

      {/* Reminders */}
      {Platform.OS !== "web" && reminders.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
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
                    style={[styles.reminderTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
                    numberOfLines={1}
                  >
                    {reminder.title}
                  </Text>
                  {reminder.contact ? (
                    <Text
                      style={[styles.reminderContact, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                      numberOfLines={1}
                    >
                      {reminder.contact}
                    </Text>
                  ) : null}
                  <Text style={[styles.reminderMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
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

      {/* Quick Tools — satellite to Command Center */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 4 }]}>
          Satellite tools
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 12, fontFamily: "Inter_400Regular" }}>
          Support the spine — not a second product
        </Text>
        <View style={styles.toolsGrid}>
          {QUICK_TOOLS.map((tool, i) => (
            <Pressable
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (tool.route) router.push(tool.route as any);
                else if (tool.toolTab) {
                  router.push({ pathname: "/tool/[tab]", params: { tab: tool.toolTab } } as any);
                } else {
                  router.push("/(tabs)/tools");
                }
              }}
              style={({ pressed }) => [
                styles.toolCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.toolIcon, { backgroundColor: colors.accent }]}>
                <Feather name={tool.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.toolLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {tool.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Ask Spartan — secondary, collapsed by default */}
      <View style={[styles.section, { backgroundColor: colors.background, paddingTop: 8 }]}>
        <Pressable
          onPress={() => setCoachOpen((o) => !o)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 44,
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: coachOpen }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="zap" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 17 }]}>
              Ask Spartan
            </Text>
          </View>
          <Feather
            name={coachOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, fontFamily: "Inter_400Regular" }}>
          Instant field answers — no PHI · optional
        </Text>

        {coachOpen && (
          <View style={{ marginTop: 14 }}>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Ask any hospice sales question..."
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleAsk(query)}
                returnKeyType="send"
                multiline={false}
              />
              {query.trim().length > 0 && (
                <Pressable
                  onPress={() => handleAsk(query)}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
                </Pressable>
              )}
            </View>

            {!response && !loading && (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setQuery(s);
                      handleAsk(s);
                    }}
                    style={({ pressed }) => [
                      styles.suggestion,
                      { backgroundColor: colors.muted, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={[styles.suggestionText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {loading && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Finding the best answer...
                </Text>
              </View>
            )}

            {!!error && (
              <View style={[styles.errorCard, { backgroundColor: colors.accent }]}>
                <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{error}</Text>
              </View>
            )}

            {!!response && !loading && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.responseText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {response}
                </Text>
                <Pressable
                  onPress={reset}
                  style={({ pressed }) => [
                    styles.resetBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Text style={[styles.resetBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    Ask another question
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={[styles.section, { paddingTop: 0 }]}>
        <Pressable
          onPress={() => router.push("/(tabs)/contact")}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, alignSelf: "stretch", justifyContent: "center" },
          ]}
        >
          <Text style={[styles.ctaBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
            Book a debrief call
          </Text>
          <Feather name="phone" size={16} color={colors.primaryForeground} />
        </Pressable>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: "center", marginTop: 12 }}>
          Do not enter PHI · Coaching aid only
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
