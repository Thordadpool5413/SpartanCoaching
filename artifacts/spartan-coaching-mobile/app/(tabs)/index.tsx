import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Image,
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
import { apiPost, fetchOnboardingMobile, updateOnboardingMobile } from "@/lib/api";
import { cancelReminder, removeReminderFromHistory } from "@/lib/notifications";
import { useAuth } from "@/lib/AuthContext";
import {
  formatTrialRemaining,
  isChecklistDone,
  START_HERE,
  visibleChecklist,
  type ChecklistId,
} from "@/lib/onboarding";

const SUGGESTIONS = [
  "What are hospice eligibility criteria for heart failure?",
  "How do I handle the 'not ready' objection?",
  "What is the Medicare hospice benefit?",
  "Best strategies for building physician referrals?",
];

const QUICK_TOOLS = [
  { label: "Objection Handler", icon: "shield" as const },
  { label: "Sales Playbooks", icon: "book-open" as const },
  { label: "Email Templates", icon: "mail" as const },
  { label: "Role-Play", icon: "users" as const },
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
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reminders, load: reloadReminders, removeReminder } = useReminderHistory();

  const [jobRole, setJobRole] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const loadOnboarding = useCallback(async () => {
    if (!canUseFieldKit) {
      setOnboardingLoaded(true);
      return;
    }
    try {
      const data = await fetchOnboardingMobile();
      setJobRole(data.member.jobRole || "");
      setChecklist(data.member.checklistProgress || {});
    } catch {
      // keep local
    } finally {
      setOnboardingLoaded(true);
    }
  }, [canUseFieldKit]);

  useFocusEffect(
    useCallback(() => {
      reloadReminders();
      loadOnboarding();
    }, [reloadReminders, loadOnboarding]),
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
      setError("Field Kit access required. Sign in from the Account tab.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setResponse("");
    setError(null);
    try {
      const data = await apiPost<{ response: string }>("/api/chat", {
        prompt,
        conversationHistory: [],
      });
      setResponse(data.response);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.startsWith("401") || msg.startsWith("403")) {
        setError("Field Kit access required. Sign in with an approved client account.");
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
      router.push({ pathname: "/(tabs)/tools", params: { tab: startHere.toolTab } } as any);
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
      router.push({ pathname: "/(tabs)/tools", params: { tab: item.toolTab } } as any);
    } else {
      router.push("/(tabs)/tools");
    }
  };

  // ── Logged-out marketing home ─────────────────────────────────────
  if (!canUseFieldKit) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.heroBackground, "#0f0f0f", "#1a0404"]}
          style={[styles.hero, { paddingTop: topPad + 20 }]}
        >
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.heroTitle, { color: colors.heroForeground }]}>Hospice sales</Text>
          <Text style={[styles.heroTitle, { color: "rgba(255,255,255,0.55)" }]}>is not a mystery.</Text>
          <Text style={[styles.heroTitle, styles.heroTitleAccent, { color: colors.primary }]}>
            It is a promise.
          </Text>
          <Text style={[styles.heroTagline, { color: colors.heroMuted }]}>
            Practical coaching for hospice growth professionals who execute in the field — not just in meetings.
          </Text>
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: colors.heroBadgeBg, borderColor: colors.heroBadgeBorder },
            ]}
          >
            <View style={[styles.heroBadgeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.heroBadgeText, { color: colors.heroBadgeText }]}>
              {isAuthenticated ? "Access locked — continue as a client" : "Client login required for AI tools"}
            </Text>
          </View>
          <Pressable
            onPress={() => (isAuthenticated ? router.push("/(tabs)/account") : router.push("/login"))}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>
              {isAuthenticated ? "Open account" : "Client login"}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600", textAlign: "center" }}>
              Book a strategy call
            </Text>
          </Pressable>
        </LinearGradient>

        <View style={[styles.missionSection, { backgroundColor: colors.heroBackground }]}>
          <Text style={[styles.missionOverline, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            The Real Problem
          </Text>
          <Text style={[styles.missionTitle, { color: colors.heroForeground, fontFamily: "Inter_700Bold" }]}>
            The Gap Is Not Clinical. It Is Conversational.
          </Text>
          <Text style={[styles.missionBody, { color: colors.heroMuted, fontFamily: "Inter_400Regular" }]}>
            Eligible patients are not receiving hospice care because the right conversations are not happening.
            Spartan Coaching exists to close that gap, one prepared visit at a time.
          </Text>
          {[
            { name: "Discipline", desc: "The system that holds on Tuesday when caring isn't enough." },
            { name: "Empathy", desc: "The skill that hears what's underneath 'not yet.'" },
            { name: "Strategy", desc: "Knowing which five accounts in your territory actually refer." },
          ].map((pillar) => (
            <View key={pillar.name} style={styles.pillarRow}>
              <View style={[styles.pillarAccent, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pillarName, { color: "rgba(255,255,255,0.92)", fontFamily: "Inter_700Bold" }]}>
                  {pillar.name}
                </Text>
                <Text style={[styles.pillarDesc, { color: colors.heroMuted, fontFamily: "Inter_400Regular" }]}>
                  {pillar.desc}
                </Text>
              </View>
            </View>
          ))}
          <Pressable
            onPress={() => router.push("/(tabs)/contact")}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 8 },
            ]}
          >
            <Text style={[styles.ctaBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
              Get in Touch
            </Text>
            <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
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
        colors={[colors.heroBackground, "#0f0f0f", "#1a0404"]}
        style={[styles.fieldHero, { paddingTop: topPad + 16 }]}
      >
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 2 }}>
          FIELD KIT
        </Text>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 8 }}>
          {isFirstSession
            ? `Make this session count${firstName ? `, ${firstName}` : ""}`
            : `Welcome back${firstName ? `, ${firstName}` : ""}`}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6, fontSize: 14, lineHeight: 20 }}>
          {isFirstSession
            ? "Role → one real tool → debrief. That beats browsing every tab."
            : "Discipline, empathy, strategy — in the field."}
        </Text>
        {user?.organization?.status === "trial" && trialLabel ? (
          <View
            style={{
              marginTop: 14,
              alignSelf: "flex-start",
              backgroundColor: "rgba(251,191,36,0.15)",
              borderColor: "rgba(251,191,36,0.35)",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Feather name="clock" size={14} color="#fbbf24" />
            <Text style={{ color: "#fde68a", fontWeight: "700", fontSize: 13 }}>{trialLabel}</Text>
            <Pressable onPress={() => router.push("/(tabs)/contact")}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, textDecorationLine: "underline" }}>
                Debrief
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              alignSelf: "flex-start",
              backgroundColor: "rgba(74,222,128,0.12)",
              borderColor: "rgba(74,222,128,0.3)",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#86efac", fontWeight: "700", fontSize: 13 }}>Active client access</Text>
          </View>
        )}
      </LinearGradient>

      {/* First-session 3-step path */}
      {isFirstSession && (
        <View style={[styles.section, { paddingTop: 20 }]} testID="section-first-session">
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
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={{ color: "#86efac", fontWeight: "700", marginTop: 8, textTransform: "capitalize" }}>
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
                  borderColor: done ? "rgba(74,222,128,0.35)" : colors.border,
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
                  color={done ? "#4ade80" : colors.mutedForeground}
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

      {/* Ask Spartan */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Feather name="zap" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Ask Spartan
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Instant field answers — no PHI
        </Text>

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

      {/* Quick Tools */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 12 }]}>
          AI Tools
        </Text>
        <View style={styles.toolsGrid}>
          {QUICK_TOOLS.map((tool, i) => (
            <Pressable
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/tools");
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
    paddingBottom: 28,
    paddingHorizontal: 20,
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
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
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
