import React, { useCallback, useEffect, useState } from "react";
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
import { apiPost } from "@/lib/api";
import { cancelReminder, removeReminderFromHistory } from "@/lib/notifications";

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
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reminders, load: reloadReminders, removeReminder } = useReminderHistory();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  useFocusEffect(
    useCallback(() => {
      reloadReminders();
    }, [reloadReminders])
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
    } catch {
      setError("Something went wrong. Please try again.");
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={[colors.heroBackground, "#0f0f0f", "#1a0404"]}
        style={[styles.hero, { paddingTop: topPad + 20 }]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.heroTitle, { color: colors.heroForeground }]}>
          Hospice sales teams
        </Text>
        <Text style={[styles.heroTitle, styles.heroTitleAccent, { color: colors.primary }]}>
          that consistently close.
        </Text>
        <Text style={[styles.heroTagline, { color: colors.heroMuted }]}>
          Eligible patients aren't getting hospice care because{"\n"}the right conversations aren't happening.
        </Text>
        <View style={[styles.heroBadge, { backgroundColor: colors.heroBadgeBg, borderColor: colors.heroBadgeBorder }]}>
          <View style={[styles.heroBadgeDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.heroBadgeText, { color: colors.heroBadgeText }]}>
            2026 Programs Now Open
          </Text>
        </View>
      </LinearGradient>

      {/* Pending Reminders */}
      {Platform.OS !== "web" && reminders.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Pending Reminders
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
          Instant expert answers on any hospice topic
        </Text>

        {/* Input */}
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Ask any hospice question..."
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

        {/* Suggestions */}
        {!response && !loading && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => { setQuery(s); handleAsk(s); }}
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

        {/* Loading */}
        {loading && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Finding the best answer...
            </Text>
          </View>
        )}

        {/* Error */}
        {!!error && (
          <View style={[styles.errorCard, { backgroundColor: colors.accent }]}>
            <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{error}</Text>
          </View>
        )}

        {/* Response */}
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
                router.push("/tools");
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

      {/* Outreach */}
      <View style={[styles.section, { backgroundColor: colors.background, paddingTop: 0 }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 12 }]}>
          Outreach
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/brand-video");
          }}
          style={({ pressed }) => [
            styles.toolCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View style={[styles.toolIcon, { backgroundColor: colors.accent }]}>
            <Feather name="film" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toolLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Brand Video
            </Text>
            <Text style={[styles.toolSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Preview and share the Spartan brand video with prospects
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/staffing");
          }}
          style={({ pressed }) => [
            styles.toolCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1, marginTop: 10 },
          ]}
          testID="button-open-staffing"
        >
          <View style={[styles.toolIcon, { backgroundColor: colors.accent }]}>
            <Feather name="users" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toolLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Branch Staffing
            </Text>
            <Text style={[styles.toolSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Required staffing and payroll by scenario and census
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Mission — always rendered on dark brand background */}
      <View style={[styles.missionSection, { backgroundColor: colors.heroBackground }]}>
        <Text style={[styles.missionOverline, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          The Real Problem
        </Text>
        <Text style={[styles.missionTitle, { color: colors.heroForeground, fontFamily: "Inter_700Bold" }]}>
          The Gap Is Not Clinical. It Is Conversational.
        </Text>
        <Text style={[styles.missionBody, { color: colors.heroMuted, fontFamily: "Inter_400Regular" }]}>
          Eligible patients are not receiving hospice care because the right conversations are not happening. Spartan Coaching exists to close that gap, one prepared visit at a time.
        </Text>
        <Pressable
          onPress={() => router.push("/contact")}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 24,
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
    marginBottom: 24,
  },
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
