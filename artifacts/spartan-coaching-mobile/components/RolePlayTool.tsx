import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPost } from "@/lib/api";
import { ReminderPicker } from "@/components/ReminderPicker";
import { SavedResponsesSection } from "@/components/SavedResponsesSection";
import { useSavedResponses } from "@/hooks/useSavedResponses";
import { font } from "@/lib/typography";

type RoleplayPhase = "select" | "active" | "feedback";

interface ChatMessage {
  role: "user" | "character";
  content: string;
}

interface RoleplaySession {
  id: number;
  scenarioId: string;
  scenarioTitle: string;
  status: string;
  feedback: string | null;
  rating: number | null;
  createdAt: number;
}

interface ScenarioStat {
  count: number;
  lastPracticedAt: number | null;
}

const ROLEPLAY_SCENARIOS: {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}[] = [
  {
    id: "skeptical_oncologist",
    title: "Skeptical Oncologist",
    description: "Push through hesitation about hospice timing with a doubting specialist.",
    icon: "activity",
  },
  {
    id: "family_not_ready",
    title: "Family Not Ready",
    description: "Navigate grief and resistance when a patient's family resists the conversation.",
    icon: "users",
  },
  {
    id: "busy_hospitalist",
    title: "Busy Hospitalist",
    description: "Capture attention and earn referrals from a time-pressed hospital doctor.",
    icon: "clock",
  },
  {
    id: "insurance_concerns",
    title: "Insurance Concerns",
    description: "Address fears about coverage, costs, and what hospice actually covers.",
    icon: "file-text",
  },
  {
    id: "ltc_facility_director",
    title: "LTC Facility Director",
    description: "Break through gatekeeping at a long-term care facility and earn a trial referral.",
    icon: "home",
  },
  {
    id: "hospital_social_worker",
    title: "Hospital Social Worker",
    description:
      "Connect with an overwhelmed social worker juggling discharge deadlines and referral choices.",
    icon: "heart",
  },
  {
    id: "reluctant_pcp",
    title: "Reluctant Primary Care Physician",
    description:
      "Persuade a PCP who resists hospice referrals for fear of upsetting long-standing patients.",
    icon: "user",
  },
  {
    id: "veteran_family",
    title: "Veteran's Family",
    description: "Navigate VA benefit confusion and emotional resistance with a proud veteran's family.",
    icon: "award",
  },
  {
    id: "palliative_care_coordinator",
    title: "Palliative Care Coordinator",
    description:
      "Collaborate — not compete — with a palliative coordinator who guards her patient relationships.",
    icon: "plus-circle",
  },
  {
    id: "home_health_rn",
    title: "Home Health RN",
    description: "Build a cross-referral partnership with a home health nurse who has overlapping patients.",
    icon: "briefcase",
  },
];

function formatSavedDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Dedicated Role-Play tool surface (extracted from tools.tsx monolith).
 * Owns select → active chat → feedback phases.
 */
export function RolePlayTool({
  canUseFieldKit,
  tabBarHeight,
  bottomPad,
}: {
  canUseFieldKit: boolean;
  tabBarHeight: number;
  bottomPad: number;
}) {
  const colors = useColors();
  const roleplaySaved = useSavedResponses("roleplay");
  const scrollRef = useRef<ScrollView>(null);

  const [roleplayPhase, setRoleplayPhase] = useState<RoleplayPhase>("select");
  const [roleplaySession, setRoleplaySession] = useState<RoleplaySession | null>(null);
  const [roleplayMessages, setRoleplayMessages] = useState<ChatMessage[]>([]);
  const [roleplayInput, setRoleplayInput] = useState("");
  const [roleplayLoading, setRoleplayLoading] = useState(false);
  const [roleplayError, setRoleplayError] = useState<string | null>(null);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
  const [roleplayRating, setRoleplayRating] = useState<number | null>(null);
  const [roleplaySavedId, setRoleplaySavedId] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const [customScenarioExpanded, setCustomScenarioExpanded] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [scenarioStats, setScenarioStats] = useState<Record<string, ScenarioStat>>({});
  const [roleplayHistory, setRoleplayHistory] = useState<RoleplaySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  useEffect(() => {
    if (roleplayPhase !== "select") return;
    apiGet<{ scenarioId: string; count: number; lastPracticedAt: number | null }[]>(
      "/api/roleplay/stats",
    )
      .then((rows) => {
        const map: Record<string, ScenarioStat> = {};
        for (const row of rows) {
          map[row.scenarioId] = { count: row.count, lastPracticedAt: row.lastPracticedAt };
        }
        setScenarioStats(map);
      })
      .catch(() => {});

    setHistoryLoading(true);
    apiGet<RoleplaySession[]>("/api/roleplay/sessions")
      .then((sessions) => {
        setRoleplayHistory(
          sessions
            .filter((s) => s.status === "completed" && s.feedback)
            .sort((a, b) => b.createdAt - a.createdAt),
        );
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [roleplayPhase]);

  const requireAccess = (): boolean => canUseFieldKit;

  const startRoleplay = async (
    scenarioId: string,
    scenarioTitle: string,
    scenarioDescription?: string,
  ) => {
    if (!requireAccess()) {
      setRoleplayError("Membership access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRoleplayLoading(true);
    setRoleplayError(null);
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayRating(null);
    try {
      const body: Record<string, string> = { scenarioId, scenarioTitle };
      if (scenarioDescription) body.scenarioDescription = scenarioDescription;
      const data = await apiPost<{ session: RoleplaySession; initialMessage: string }>(
        "/api/roleplay/sessions",
        body,
      );
      setRoleplaySession(data.session);
      setRoleplayMessages([{ role: "character", content: data.initialMessage }]);
      setRoleplayPhase("active");
    } catch {
      setRoleplayError("Could not start the session. Please try again.");
    } finally {
      setRoleplayLoading(false);
    }
  };

  const sendRoleplayMessage = async () => {
    const content = roleplayInput.trim();
    if (!content || !roleplaySession || roleplayLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoleplayInput("");
    setRoleplayMessages((prev) => [...prev, { role: "user", content }]);
    setRoleplayLoading(true);
    setRoleplayError(null);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const data = await apiPost<{ response: string }>(
        `/api/roleplay/sessions/${roleplaySession.id}/messages`,
        { content },
      );
      setRoleplayMessages((prev) => [...prev, { role: "character", content: data.response }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setRoleplayError("Failed to get a response. Please try again.");
    } finally {
      setRoleplayLoading(false);
    }
  };

  const endRoleplaySession = async () => {
    if (!roleplaySession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEndingSession(true);
    setRoleplayError(null);
    try {
      const data = await apiPost<{ feedback: string; rating: number }>(
        `/api/roleplay/sessions/${roleplaySession.id}/feedback`,
        {},
      );
      setRoleplayFeedback(data.feedback);
      setRoleplayRating(data.rating);
      setRoleplayPhase("feedback");
    } catch {
      setRoleplayError("Could not generate feedback. Please try again.");
    } finally {
      setEndingSession(false);
    }
  };

  const resetRoleplay = () => {
    setRoleplayPhase("select");
    setRoleplaySession(null);
    setRoleplayMessages([]);
    setRoleplayInput("");
    setRoleplayFeedback(null);
    setRoleplayRating(null);
    setRoleplaySavedId(null);
    setRoleplayError(null);
    setCustomScenarioExpanded(false);
    setCustomTitle("");
    setCustomDescription("");
  };

  const handleSaveRoleplay = async () => {
    if (!roleplayFeedback || roleplaySavedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const title = roleplaySession?.scenarioTitle || "Role-play session";
    const parts = [
      roleplayRating != null ? `Rating: ${roleplayRating}/5` : "",
      roleplayFeedback,
    ]
      .filter(Boolean)
      .join("\n\n");
    await roleplaySaved.saveResponse(title, parts);
    setRoleplaySavedId("saved");
  };

  const handleShareRoleplay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parts: string[] = [];
    if (roleplaySession?.scenarioTitle) parts.push(`Scenario: ${roleplaySession.scenarioTitle}`);
    if (roleplayRating !== null) parts.push(`Rating: ${roleplayRating}/5`);
    if (roleplayFeedback) parts.push(`\nCoach Feedback:\n${roleplayFeedback}`);
    await Share.share({ message: parts.join("\n") });
  };

  // ── Active live chat ──────────────────────────────────────────────
  if (roleplayPhase === "active" && roleplaySession) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={tabBarHeight}
      >
        <View style={[styles.sessionHeader, { marginHorizontal: 20, marginTop: 16, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sessionTitle, { color: colors.foreground }, font("bold")]}>
              {roleplaySession.scenarioTitle}
            </Text>
            <Text style={[styles.sessionSubtitle, { color: colors.mutedForeground }, font("regular")]}>
              Live practice session
            </Text>
          </View>
          <Pressable
            onPress={endRoleplaySession}
            disabled={endingSession || roleplayMessages.length < 3}
            style={({ pressed }) => [
              styles.endBtn,
              { borderColor: colors.primary },
              (endingSession || roleplayMessages.length < 3) && { opacity: 0.45 },
              pressed && { opacity: 0.7 },
            ]}
          >
            {endingSession ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[{ color: colors.primary, fontSize: 14 }, font("semibold")]}>End</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chatList}>
            {roleplayMessages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.bubbleWrap,
                  msg.role === "user" ? styles.bubbleWrapUser : styles.bubbleWrapChar,
                ]}
              >
                {msg.role === "character" && (
                  <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                    <Feather name="user" size={11} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    msg.role === "user"
                      ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                      : [styles.bubbleChar, { backgroundColor: colors.card, borderColor: colors.border }],
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: msg.role === "user" ? "#fff" : colors.foreground },
                      font("regular"),
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}
            {roleplayLoading && (
              <View style={[styles.bubbleWrap, styles.bubbleWrapChar]}>
                <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                  <Feather name="user" size={11} color="#fff" />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleChar,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {!!roleplayError && (
          <Text
            style={[
              { color: colors.primary, marginHorizontal: 20, marginBottom: 4, fontSize: 14 },
              font("regular"),
            ]}
          >
            {roleplayError}
          </Text>
        )}

        <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: tabBarHeight + 8 }}>
          <View
            style={[styles.chatInputRow, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <TextInput
              style={[styles.chatInput, { color: colors.foreground }, font("regular")]}
              placeholder="Your response…"
              placeholderTextColor={colors.mutedForeground}
              value={roleplayInput}
              onChangeText={setRoleplayInput}
              multiline
              maxLength={800}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendRoleplayMessage}
            />
            <Pressable
              onPress={sendRoleplayMessage}
              disabled={roleplayLoading || roleplayInput.trim().length === 0}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: colors.primary },
                (roleplayLoading || roleplayInput.trim().length === 0) && { opacity: 0.45 },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Feather name="send" size={18} color="#fff" />
            </Pressable>
          </View>
          <Text
            style={[
              { color: colors.mutedForeground, fontSize: 12, textAlign: "center", marginTop: 10 },
              font("regular"),
            ]}
          >
            Tap &quot;End&quot; after a few exchanges to get your feedback and rating.
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Select + feedback (scrollable) ────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 20, paddingTop: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {roleplayPhase === "select" && (
          <View>
            <Text style={[{ color: colors.foreground, fontSize: 20, marginBottom: 6 }, font("bold")]}>
              Choose a Scenario
            </Text>
            <Text
              style={[
                { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginBottom: 20 },
                font("regular"),
              ]}
            >
              Practice a live sales conversation with an AI character. Get feedback and a rating when
              you&apos;re done.
            </Text>
            {!!roleplayError && (
              <Text style={[{ color: colors.primary, marginBottom: 8, fontSize: 14 }, font("regular")]}>
                {roleplayError}
              </Text>
            )}
            {roleplayLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[{ color: colors.mutedForeground, fontSize: 14 }, font("regular")]}>
                  Starting session…
                </Text>
              </View>
            ) : (
              <>
                {ROLEPLAY_SCENARIOS.map((s) => {
                  const stat = scenarioStats[s.id];
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => startRoleplay(s.id, s.title)}
                      style={({ pressed }) => [
                        styles.scenarioCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View
                        style={[
                          styles.scenarioIconWrap,
                          { backgroundColor: colors.accent ?? colors.muted },
                        ]}
                      >
                        <Feather name={s.icon} size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[{ color: colors.foreground, fontSize: 16 }, font("semibold")]}>
                          {s.title}
                        </Text>
                        <Text
                          style={[
                            { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 3 },
                            font("regular"),
                          ]}
                        >
                          {s.description}
                        </Text>
                        {stat && stat.count > 0 && (
                          <View style={styles.statRow}>
                            <Feather name="check-circle" size={11} color={colors.primary} />
                            <Text style={[{ color: colors.primary, fontSize: 11 }, font("semibold")]}>
                              {stat.count}×
                              {stat.lastPracticedAt
                                ? ` · ${formatSavedDate(stat.lastPracticedAt)}`
                                : ""}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    </Pressable>
                  );
                })}

                <View
                  style={[
                    styles.scenarioCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: 0,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCustomScenarioExpanded((v) => !v);
                    }}
                    style={({ pressed }) => [
                      { flexDirection: "row", alignItems: "center", gap: 14, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.scenarioIconWrap,
                        { backgroundColor: colors.accent ?? colors.muted },
                      ]}
                    >
                      <Feather name="edit-3" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: colors.foreground, fontSize: 16 }, font("semibold")]}>
                        Custom Scenario
                      </Text>
                      <Text
                        style={[
                          { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 3 },
                          font("regular"),
                        ]}
                      >
                        Describe your own situation and practice it live.
                      </Text>
                    </View>
                    <Feather
                      name={customScenarioExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                  {customScenarioExpanded && (
                    <View style={{ marginTop: 14, gap: 10 }}>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: colors.foreground,
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            minHeight: 44,
                          },
                          font("regular"),
                        ]}
                        placeholder="Scenario title (e.g. Reluctant SNF Administrator)"
                        placeholderTextColor={colors.mutedForeground}
                        value={customTitle}
                        onChangeText={setCustomTitle}
                        maxLength={80}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: colors.foreground,
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            minHeight: 88,
                          },
                          font("regular"),
                        ]}
                        placeholder="Describe the character and situation…"
                        placeholderTextColor={colors.mutedForeground}
                        value={customDescription}
                        onChangeText={setCustomDescription}
                        multiline
                        textAlignVertical="top"
                        maxLength={500}
                      />
                      <Pressable
                        onPress={() => {
                          if (customTitle.trim().length < 3) return;
                          startRoleplay(
                            "custom",
                            customTitle.trim(),
                            customDescription.trim() || undefined,
                          );
                        }}
                        disabled={customTitle.trim().length < 3}
                        style={({ pressed }) => [
                          styles.primaryBtn,
                          { backgroundColor: colors.primary },
                          customTitle.trim().length < 3 && { opacity: 0.45 },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={[{ color: colors.primaryForeground, fontSize: 16 }, font("bold")]}>
                          Start Custom Session
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {(historyLoading || roleplayHistory.length > 0) && (
                  <View style={{ marginTop: 28 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <Feather name="clock" size={14} color={colors.mutedForeground} />
                      <Text
                        style={[
                          { color: colors.mutedForeground, fontSize: 13, textTransform: "uppercase" },
                          font("semibold"),
                        ]}
                      >
                        Past Sessions
                        {roleplayHistory.length > 0 ? ` (${roleplayHistory.length})` : ""}
                      </Text>
                    </View>
                    {historyLoading ? (
                      <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 12 }} />
                    ) : (
                      roleplayHistory.map((session) => {
                        const isOpen = expandedHistoryId === session.id;
                        return (
                          <View
                            key={session.id}
                            style={[
                              styles.historyCard,
                              { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                          >
                            <Pressable
                              onPress={() => {
                                Haptics.selectionAsync();
                                setExpandedHistoryId(isOpen ? null : session.id);
                              }}
                              style={({ pressed }) => [
                                { flexDirection: "row", alignItems: "center", padding: 14, opacity: pressed ? 0.75 : 1 },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[{ color: colors.foreground, fontSize: 14 }, font("semibold")]}
                                  numberOfLines={1}
                                >
                                  {session.scenarioTitle}
                                </Text>
                                <View
                                  style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}
                                >
                                  <Text
                                    style={[
                                      { color: colors.mutedForeground, fontSize: 12 },
                                      font("regular"),
                                    ]}
                                  >
                                    {formatSavedDate(session.createdAt)}
                                  </Text>
                                  {session.rating !== null && (
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <Feather
                                          key={n}
                                          name="star"
                                          size={12}
                                          color={
                                            n <= session.rating! ? "#F59E0B" : colors.mutedForeground
                                          }
                                        />
                                      ))}
                                    </View>
                                  )}
                                </View>
                              </View>
                              <Feather
                                name={isOpen ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={colors.mutedForeground}
                              />
                            </Pressable>
                            {isOpen && session.feedback && (
                              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 14 }}>
                                <Text
                                  style={[
                                    {
                                      color: colors.mutedForeground,
                                      fontSize: 12,
                                      marginBottom: 8,
                                      textTransform: "uppercase",
                                    },
                                    font("semibold"),
                                  ]}
                                >
                                  Coach Feedback
                                </Text>
                                <Text
                                  style={[
                                    { color: colors.foreground, fontSize: 14, lineHeight: 21 },
                                    font("regular"),
                                  ]}
                                >
                                  {session.feedback}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {roleplayPhase === "feedback" && (
          <View>
            <View
              style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[{ color: colors.foreground, fontSize: 20 }, font("bold")]}>
                Session Complete
              </Text>
              <Text
                style={[
                  { color: colors.mutedForeground, fontSize: 14, marginBottom: 16, marginTop: 4 },
                  font("regular"),
                ]}
              >
                {roleplaySession?.scenarioTitle}
              </Text>
              {roleplayRating !== null && (
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Feather
                      key={star}
                      name="star"
                      size={22}
                      color={star <= roleplayRating ? "#F59E0B" : colors.mutedForeground}
                    />
                  ))}
                  <Text style={[{ color: colors.mutedForeground, marginLeft: 6 }, font("semibold")]}>
                    {roleplayRating}/5
                  </Text>
                </View>
              )}
              {roleplayFeedback && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text
                    style={[
                      {
                        color: colors.mutedForeground,
                        fontSize: 13,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      },
                      font("semibold"),
                    ]}
                  >
                    Coach Feedback
                  </Text>
                  <Text
                    style={[{ color: colors.foreground, fontSize: 15, lineHeight: 23 }, font("regular")]}
                  >
                    {roleplayFeedback}
                  </Text>
                </>
              )}
            </View>

            {roleplayFeedback && (
              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleSaveRoleplay}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      borderColor: roleplaySavedId ? colors.primary : colors.border,
                      backgroundColor: roleplaySavedId ? `${colors.primary}18` : "transparent",
                      opacity: pressed ? 0.75 : 1,
                      flex: 1,
                    },
                  ]}
                >
                  <Feather
                    name={roleplaySavedId ? "check" : "bookmark"}
                    size={15}
                    color={roleplaySavedId ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      {
                        color: roleplaySavedId ? colors.primary : colors.mutedForeground,
                        fontSize: 14,
                      },
                      font("semibold"),
                    ]}
                  >
                    {roleplaySavedId ? "Saved" : "Save"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShareRoleplay}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.75 : 1, flex: 1 },
                  ]}
                >
                  <Feather name="share" size={15} color={colors.mutedForeground} />
                  <Text style={[{ color: colors.mutedForeground, fontSize: 14 }, font("semibold")]}>
                    Share
                  </Text>
                </Pressable>
              </View>
            )}

            <ReminderPicker
              title="Apply what you practiced"
              body="You just completed a role-play — set a reminder to use these techniques in your next call."
              storageKey="roleplay"
            />

            <Pressable
              onPress={resetRoleplay}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, marginTop: 16 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[{ color: colors.primaryForeground, fontSize: 16 }, font("bold")]}>
                Practice Another Scenario
              </Text>
            </Pressable>
          </View>
        )}

        <SavedResponsesSection
          items={roleplaySaved.savedItems}
          onDelete={roleplaySaved.deleteResponse}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 16,
    gap: 12,
  },
  sessionTitle: { fontSize: 17 },
  sessionSubtitle: { fontSize: 12, marginTop: 2 },
  endBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: "center",
  },
  chatList: { gap: 12, marginBottom: 16 },
  bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleWrapUser: { justifyContent: "flex-end" },
  bubbleWrapChar: { justifyContent: "flex-start" },
  avatarDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleChar: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  chatInputRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-end",
    gap: 8,
  },
  chatInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 4 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  loadingWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  scenarioCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  scenarioIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11,
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  historyCard: { borderWidth: 1, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  feedbackCard: { borderWidth: 1, borderRadius: 14, padding: 20 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  divider: { height: 1, marginVertical: 16 },
});
