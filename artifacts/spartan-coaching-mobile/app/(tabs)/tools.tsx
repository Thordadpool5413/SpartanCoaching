import React, { useContext, useEffect, useRef, useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPost } from "@/lib/api";
import { ReminderPicker } from "@/components/ReminderPicker";
import { useSavedResponses, type SavedResponse } from "@/hooks/useSavedResponses";
import { useAuth } from "@/lib/AuthContext";
import { router, useLocalSearchParams } from "expo-router";

type ToolTab = "objection" | "playbook" | "email" | "roleplay";

const VALID_TABS = new Set<ToolTab>(["objection", "playbook", "email", "roleplay"]);

const TOOL_TABS: { key: ToolTab; label: string; icon: "shield" | "book-open" | "mail" | "users" }[] = [
  { key: "objection", label: "Objections", icon: "shield" },
  { key: "playbook", label: "Playbooks", icon: "book-open" },
  { key: "email", label: "Email", icon: "mail" },
  { key: "roleplay", label: "Role-Play", icon: "users" },
];

const EMAIL_TYPES = [
  { value: "follow_up", label: "Follow-Up" },
  { value: "thank_you", label: "Thank You" },
  { value: "value_add", label: "Value Add" },
];

const ROLEPLAY_SCENARIOS = [
  {
    id: "skeptical_oncologist",
    title: "Skeptical Oncologist",
    description: "Push through hesitation about hospice timing with a doubting specialist.",
    icon: "🩺",
  },
  {
    id: "family_not_ready",
    title: "Family Not Ready",
    description: "Navigate grief and resistance when a patient's family resists the conversation.",
    icon: "👨‍👩‍👧",
  },
  {
    id: "busy_hospitalist",
    title: "Busy Hospitalist",
    description: "Capture attention and earn referrals from a time-pressed hospital doctor.",
    icon: "⏱️",
  },
  {
    id: "insurance_concerns",
    title: "Insurance Concerns",
    description: "Address fears about coverage, costs, and what hospice actually covers.",
    icon: "📋",
  },
  {
    id: "ltc_facility_director",
    title: "LTC Facility Director",
    description: "Break through gatekeeping at a long-term care facility and earn a trial referral.",
    icon: "🏠",
  },
  {
    id: "hospital_social_worker",
    title: "Hospital Social Worker",
    description: "Connect with an overwhelmed social worker juggling discharge deadlines and referral choices.",
    icon: "👩‍⚕️",
  },
  {
    id: "reluctant_pcp",
    title: "Reluctant Primary Care Physician",
    description: "Persuade a PCP who resists hospice referrals for fear of upsetting long-standing patients.",
    icon: "🩻",
  },
  {
    id: "veteran_family",
    title: "Veteran's Family",
    description: "Navigate VA benefit confusion and emotional resistance with a proud veteran's family.",
    icon: "🎖️",
  },
  {
    id: "palliative_care_coordinator",
    title: "Palliative Care Coordinator",
    description: "Collaborate — not compete — with a palliative coordinator who guards her patient relationships.",
    icon: "💊",
  },
  {
    id: "home_health_rn",
    title: "Home Health RN",
    description: "Build a cross-referral partnership with a home health nurse who has overlapping patients.",
    icon: "🏥",
  },
];

type RoleplayPhase = "select" | "active" | "feedback";

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

interface SavedSectionProps {
  items: SavedResponse[];
  onDelete: (id: string) => Promise<void>;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}

function SavedSection({ items, onDelete, colors }: SavedSectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (item: SavedResponse) => {
    await Clipboard.setStringAsync(item.response);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((prev) => (prev === item.id ? null : prev)), 2000);
  };

  const handleShare = async (item: SavedResponse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: item.response, title: item.title });
  };

  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 28 }}>
      <View style={savedStyles.sectionHeader}>
        <Feather name="bookmark" size={14} color={colors.mutedForeground} />
        <Text style={[savedStyles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          Saved ({items.length})
        </Text>
      </View>
      {items.map((item) => {
        const isOpen = expanded === item.id;
        const isCopied = copiedId === item.id;
        return (
          <View key={item.id} style={[savedStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setExpanded(isOpen ? null : item.id)}
              style={({ pressed }) => [savedStyles.cardHeader, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[savedStyles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[savedStyles.cardDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {formatSavedDate(item.savedAt)}
                </Text>
              </View>
              <View style={savedStyles.cardActions}>
                <Pressable
                  onPress={() => onDelete(item.id)}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                </Pressable>
                <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </View>
            </Pressable>
            {isOpen && (
              <View style={[savedStyles.cardBody, { borderTopColor: colors.border }]}>
                <Text style={[savedStyles.cardBodyText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {item.response}
                </Text>
                <View style={savedStyles.cardBodyActions}>
                  <Pressable
                    onPress={() => handleCopy(item)}
                    style={({ pressed }) => [
                      savedStyles.actionBtn,
                      { borderColor: isCopied ? colors.primary : colors.border, backgroundColor: isCopied ? colors.primary + "18" : "transparent" },
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name={isCopied ? "check" : "copy"} size={14} color={isCopied ? colors.primary : colors.mutedForeground} />
                    <Text style={[savedStyles.actionBtnText, { color: isCopied ? colors.primary : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                      {isCopied ? "Copied!" : "Copy"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleShare(item)}
                    style={({ pressed }) => [
                      savedStyles.actionBtn,
                      { borderColor: colors.border },
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name="share" size={14} color={colors.mutedForeground} />
                    <Text style={[savedStyles.actionBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const savedStyles = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { borderWidth: 1, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  cardTitle: { fontSize: 14, marginBottom: 2 },
  cardDate: { fontSize: 12 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  cardBody: { borderTopWidth: 1, padding: 14 },
  cardBodyText: { fontSize: 14, lineHeight: 21 },
  cardBodyActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnText: { fontSize: 13 },
});

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

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const rnTabBarHeight = useContext(BottomTabBarHeightContext);
  const tabBarHeight = rnTabBarHeight ?? insets.bottom + 49;
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const [activeTab, setActiveTab] = useState<ToolTab>("objection");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : tabBarHeight;

  useEffect(() => {
    const raw = params.tab;
    const tab = Array.isArray(raw) ? raw[0] : raw;
    if (tab && VALID_TABS.has(tab as ToolTab)) {
      setActiveTab(tab as ToolTab);
    }
  }, [params.tab]);

  const requireAccess = (): boolean => {
    if (canUseFieldKit) return true;
    return false;
  };

  // Saved responses hooks
  const objectionSaved = useSavedResponses("objection");
  const playbookSaved = useSavedResponses("playbook");
  const emailSaved = useSavedResponses("email");

  // Objection Handler state
  const [objection, setObjection] = useState("");
  const [objectionResult, setObjectionResult] = useState("");
  const [objectionLoading, setObjectionLoading] = useState(false);
  const [objectionError, setObjectionError] = useState<string | null>(null);
  const [objectionSavedId, setObjectionSavedId] = useState<string | null>(null);

  // Playbook state
  const [scenario, setScenario] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [playbookResult, setPlaybookResult] = useState("");
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [playbookSavedId, setPlaybookSavedId] = useState<string | null>(null);

  // Email Template state
  const [emailType, setEmailType] = useState<"follow_up" | "thank_you" | "value_add">("follow_up");
  const [recipientName, setRecipientName] = useState("");
  const [emailContext, setEmailContext] = useState("");
  const [emailResult, setEmailResult] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSavedId, setEmailSavedId] = useState<string | null>(null);

  // Role-Play state
  const [roleplayPhase, setRoleplayPhase] = useState<RoleplayPhase>("select");
  const [roleplaySession, setRoleplaySession] = useState<RoleplaySession | null>(null);
  const [roleplayMessages, setRoleplayMessages] = useState<ChatMessage[]>([]);
  const [roleplayInput, setRoleplayInput] = useState("");
  const [roleplayLoading, setRoleplayLoading] = useState(false);
  const [roleplayError, setRoleplayError] = useState<string | null>(null);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
  const [roleplayRating, setRoleplayRating] = useState<number | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Custom scenario state
  const [customScenarioExpanded, setCustomScenarioExpanded] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Scenario practice stats
  const [scenarioStats, setScenarioStats] = useState<Record<string, ScenarioStat>>({});

  // Role-play history
  const [roleplayHistory, setRoleplayHistory] = useState<RoleplaySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab !== "roleplay" || roleplayPhase !== "select") return;
    apiGet<{ scenarioId: string; count: number; lastPracticedAt: number | null }[]>("/api/roleplay/stats")
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
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [activeTab, roleplayPhase]);

  const handleObjection = async () => {
    if (objection.trim().length < 5) return;
    if (!requireAccess()) {
      setObjectionError("Field Kit access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setObjectionLoading(true);
    setObjectionResult("");
    setObjectionError(null);
    setObjectionSavedId(null);
    try {
      const data = await apiPost<{ response: string }>("/api/objections", { objection });
      setObjectionResult(data.response);
    } catch {
      setObjectionError("Something went wrong. Please try again.");
    } finally {
      setObjectionLoading(false);
    }
  };

  const handleSaveObjection = async () => {
    if (!objectionResult || objectionSavedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const title = objection.length > 60 ? objection.slice(0, 57) + "…" : objection;
    await objectionSaved.saveResponse(title, objectionResult);
    setObjectionSavedId("saved");
  };

  const handleShareObjection = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: objectionResult });
  };

  const handlePlaybook = async () => {
    if (scenario.trim().length < 10) return;
    if (!requireAccess()) {
      setPlaybookError("Field Kit access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaybookLoading(true);
    setPlaybookResult("");
    setPlaybookError(null);
    setPlaybookSavedId(null);
    try {
      const data = await apiPost<{ playbook: string }>("/api/playbooks", {
        scenario,
        desiredOutcomes: desiredOutcomes || undefined,
      });
      setPlaybookResult(data.playbook);
    } catch {
      setPlaybookError("Something went wrong. Please try again.");
    } finally {
      setPlaybookLoading(false);
    }
  };

  const handleSavePlaybook = async () => {
    if (!playbookResult || playbookSavedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const title = scenario.length > 60 ? scenario.slice(0, 57) + "…" : scenario;
    await playbookSaved.saveResponse(title, playbookResult);
    setPlaybookSavedId("saved");
  };

  const handleSharePlaybook = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: playbookResult });
  };

  const handleEmail = async () => {
    if (emailContext.trim().length < 10) return;
    if (!requireAccess()) {
      setEmailError("Field Kit access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailLoading(true);
    setEmailResult("");
    setEmailError(null);
    setEmailSavedId(null);
    try {
      const data = await apiPost<{ template: string }>("/api/email-templates", {
        templateType: emailType,
        recipientName: recipientName || undefined,
        context: emailContext,
      });
      setEmailResult(data.template);
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailResult || emailSavedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const typeLabel = EMAIL_TYPES.find((et) => et.value === emailType)?.label ?? emailType;
    const title = recipientName ? `${typeLabel} — ${recipientName}` : typeLabel;
    await emailSaved.saveResponse(title, emailResult);
    setEmailSavedId("saved");
  };

  const handleShareEmail = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: emailResult });
  };

  const handleShareRoleplay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parts: string[] = [];
    if (roleplaySession?.scenarioTitle) parts.push(`Scenario: ${roleplaySession.scenarioTitle}`);
    if (roleplayRating !== null) parts.push(`Rating: ${roleplayRating}/5`);
    if (roleplayFeedback) parts.push(`\nCoach Feedback:\n${roleplayFeedback}`);
    await Share.share({ message: parts.join("\n") });
  };

  const startRoleplay = async (scenarioId: string, scenarioTitle: string, scenarioDescription?: string) => {
    if (!requireAccess()) {
      setRoleplayError("Field Kit access required. Sign in from Home.");
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
        body
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
    const userMsg: ChatMessage = { role: "user", content };
    setRoleplayMessages((prev) => [...prev, userMsg]);
    setRoleplayLoading(true);
    setRoleplayError(null);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const data = await apiPost<{ response: string }>(
        `/api/roleplay/sessions/${roleplaySession.id}/messages`,
        { content }
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
        {}
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
    setRoleplayError(null);
    setCustomScenarioExpanded(false);
    setCustomTitle("");
    setCustomDescription("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header — always pinned above content */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Quick Actions
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {canUseFieldKit ? "Powered by hospice expertise" : "Private Field Kit — sign in to unlock"}
        </Text>
      </View>

      {!canUseFieldKit && (
        <Pressable
          onPress={() => router.push(isAuthenticated ? "/(tabs)/account" : "/login")}
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 4,
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: colors.card,
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700", marginBottom: 4 }}>
            {isAuthenticated ? "Field Kit access not active" : "Member access required"}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 18 }}>
            {isAuthenticated
              ? "Your evaluation may have ended. Open Account to continue as a client or book a debrief."
              : "Sign in with an approved client account. Request evaluation access on the website if you need a login."}
          </Text>
          <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 8 }}>
            {isAuthenticated ? "Open account →" : "Client login →"}
          </Text>
        </Pressable>
      )}
      {canUseFieldKit && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            marginBottom: 2,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: "rgba(232,41,30,0.08)",
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: "center" }}>
            Field mode · Do not enter PHI · Coaching aid only
          </Text>
        </View>
      )}

      {/* Tool tabs — always pinned */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {TOOL_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab.key);
            }}
            style={({ pressed }) => [
              styles.tabBtn,
              activeTab === tab.key && styles.tabBtnActive,
              activeTab === tab.key && { borderBottomColor: colors.primary },
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather
              name={tab.icon}
              size={15}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
                { fontFamily: activeTab === tab.key ? "Inter_600SemiBold" : "Inter_400Regular" },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Active roleplay chat — flex layout with sticky input bar */}
      {activeTab === "roleplay" && roleplayPhase === "active" && roleplaySession ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={tabBarHeight}
        >
          {/* Session header */}
          <View style={[styles.sessionHeader, { marginHorizontal: 20, marginTop: 16, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sessionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {roleplaySession.scenarioTitle}
              </Text>
              <Text style={[styles.sessionSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
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
                <Text style={[styles.endBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  End
                </Text>
              )}
            </Pressable>
          </View>

          {/* Scrollable message list */}
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
                        { color: msg.role === "user" ? "#fff" : colors.foreground, fontFamily: "Inter_400Regular" },
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
                  <View style={[styles.bubble, styles.bubbleChar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator color={colors.primary} size="small" />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {!!roleplayError && (
            <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular", marginHorizontal: 20, marginBottom: 4 }]}>
              {roleplayError}
            </Text>
          )}

          {/* Sticky input bar — sits just above the tab bar */}
          <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: tabBarHeight + 8 }}>
            <View style={[styles.chatInputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.chatInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
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
            <Text style={[styles.endHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Tap "End" after a few exchanges to get your feedback and rating.
            </Text>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* All other tabs + roleplay select/feedback — normal scrollable layout */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingBottom: bottomPad }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        <View style={styles.content}>
          {/* Objection Handler */}
          {activeTab === "objection" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                What objection are you hearing?
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'The patient is not ready for hospice yet...'"
                placeholderTextColor={colors.mutedForeground}
                value={objection}
                onChangeText={setObjection}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleObjection}
                disabled={objectionLoading || objection.trim().length < 5}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (objectionLoading || objection.trim().length < 5) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {objectionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold" }]}>Generate Response</Text>
                )}
              </Pressable>
              {!!objectionError && <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{objectionError}</Text>}
              {!!objectionResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{objectionResult}</Text>
                </View>
              )}
              {!!objectionResult && (
                <View style={styles.resultActionRow}>
                  <Pressable
                    onPress={handleSaveObjection}
                    disabled={!!objectionSavedId}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      styles.resultActionBtn,
                      { borderColor: colors.primary },
                      !!objectionSavedId && { opacity: 0.5 },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name={objectionSavedId ? "check" : "bookmark"} size={15} color={colors.primary} />
                    <Text style={[styles.saveBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {objectionSavedId ? "Saved" : "Save"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleShareObjection}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      styles.resultActionBtn,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name="share" size={15} color={colors.mutedForeground} />
                    <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              )}
              {!!objectionResult && (
                <ReminderPicker
                  title="Follow up after your visit"
                  body="You practiced handling an objection — set a reminder to follow up with your contact."
                  storageKey="objection"
                />
              )}
              <SavedSection
                items={objectionSaved.savedItems}
                onDelete={objectionSaved.deleteResponse}
                colors={colors}
              />
            </View>
          )}

          {/* Playbooks */}
          {activeTab === "playbook" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Describe the sales scenario
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'First meeting with a new oncologist who is skeptical about hospice timing...'"
                placeholderTextColor={colors.mutedForeground}
                value={scenario}
                onChangeText={setScenario}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Desired outcomes (optional)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'Build trust, schedule a facility tour'"
                placeholderTextColor={colors.mutedForeground}
                value={desiredOutcomes}
                onChangeText={setDesiredOutcomes}
              />
              <Pressable
                onPress={handlePlaybook}
                disabled={playbookLoading || scenario.trim().length < 10}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (playbookLoading || scenario.trim().length < 10) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {playbookLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold" }]}>Build Playbook</Text>
                )}
              </Pressable>
              {!!playbookError && <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{playbookError}</Text>}
              {!!playbookResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{playbookResult}</Text>
                </View>
              )}
              {!!playbookResult && (
                <View style={styles.resultActionRow}>
                  <Pressable
                    onPress={handleSavePlaybook}
                    disabled={!!playbookSavedId}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      styles.resultActionBtn,
                      { borderColor: colors.primary },
                      !!playbookSavedId && { opacity: 0.5 },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name={playbookSavedId ? "check" : "bookmark"} size={15} color={colors.primary} />
                    <Text style={[styles.saveBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {playbookSavedId ? "Saved" : "Save"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSharePlaybook}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      styles.resultActionBtn,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name="share" size={15} color={colors.mutedForeground} />
                    <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              )}
              {!!playbookResult && (
                <ReminderPicker
                  title="Execute your playbook"
                  body="Your sales playbook is ready — set a reminder to put it into action."
                  storageKey="playbook"
                />
              )}
              <SavedSection
                items={playbookSaved.savedItems}
                onDelete={playbookSaved.deleteResponse}
                colors={colors}
              />
            </View>
          )}

          {/* Email Templates */}
          {activeTab === "email" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Template type
              </Text>
              <View style={styles.emailTypePicker}>
                {EMAIL_TYPES.map((et) => (
                  <Pressable
                    key={et.value}
                    onPress={() => setEmailType(et.value as typeof emailType)}
                    style={({ pressed }) => [
                      styles.emailTypeBtn,
                      { borderColor: emailType === et.value ? colors.primary : colors.border, backgroundColor: emailType === et.value ? colors.accent : colors.card },
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emailTypeBtnText,
                        { color: emailType === et.value ? colors.primary : colors.mutedForeground },
                        { fontFamily: emailType === et.value ? "Inter_600SemiBold" : "Inter_400Regular" },
                      ]}
                    >
                      {et.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Recipient name (optional)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="Dr. Smith"
                placeholderTextColor={colors.mutedForeground}
                value={recipientName}
                onChangeText={setRecipientName}
              />

              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Context
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'Met at a care conference, discussed their CHF patients...'"
                placeholderTextColor={colors.mutedForeground}
                value={emailContext}
                onChangeText={setEmailContext}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleEmail}
                disabled={emailLoading || emailContext.trim().length < 10}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (emailLoading || emailContext.trim().length < 10) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {emailLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold" }]}>Generate Email</Text>
                )}
              </Pressable>
              {!!emailError && <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{emailError}</Text>}
              {!!emailResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{emailResult}</Text>
                </View>
              )}
              {!!emailResult && (
                <View style={styles.resultActionRow}>
                  <Pressable
                    onPress={handleSaveEmail}
                    disabled={!!emailSavedId}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      styles.resultActionBtn,
                      { borderColor: colors.primary },
                      !!emailSavedId && { opacity: 0.5 },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name={emailSavedId ? "check" : "bookmark"} size={15} color={colors.primary} />
                    <Text style={[styles.saveBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {emailSavedId ? "Saved" : "Save"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleShareEmail}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      styles.resultActionBtn,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name="share" size={15} color={colors.mutedForeground} />
                    <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              )}
              {!!emailResult && (
                <ReminderPicker
                  title="Send your follow-up email"
                  body="Your email template is ready — set a reminder to send it and keep the relationship warm."
                  storageKey="email"
                  contact={recipientName || undefined}
                />
              )}
              <SavedSection
                items={emailSaved.savedItems}
                onDelete={emailSaved.deleteResponse}
                colors={colors}
              />
            </View>
          )}

          {/* Role-Play */}
          {activeTab === "roleplay" && (
            <View>
              {/* Phase: Select scenario */}
              {roleplayPhase === "select" && (
                <View>
                  <Text style={[styles.roleplayIntroTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Choose a Scenario
                  </Text>
                  <Text style={[styles.roleplayIntroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Practice a live sales conversation with an AI character. Get feedback and a rating when you're done.
                  </Text>
                  {!!roleplayError && (
                    <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular", marginBottom: 8 }]}>
                      {roleplayError}
                    </Text>
                  )}
                  {roleplayLoading ? (
                    <View style={styles.roleplayLoadingWrap}>
                      <ActivityIndicator color={colors.primary} size="large" />
                      <Text style={[styles.roleplayLoadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
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
                            <Text style={styles.scenarioEmoji}>{s.icon}</Text>
                            <View style={styles.scenarioTextWrap}>
                              <Text style={[styles.scenarioTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                                {s.title}
                              </Text>
                              <Text style={[styles.scenarioDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                                {s.description}
                              </Text>
                              {stat && stat.count > 0 && (
                                <View style={styles.scenarioStatRow}>
                                  <Feather name="check-circle" size={11} color={colors.primary} />
                                  <Text style={[styles.scenarioStatText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                                    {stat.count}×{stat.lastPracticedAt ? ` · ${formatSavedDate(stat.lastPracticedAt)}` : ""}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                          </Pressable>
                        );
                      })}

                      {/* Custom Scenario card */}
                      <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "column", alignItems: "stretch", gap: 0 }]}>
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setCustomScenarioExpanded((v) => !v);
                          }}
                          style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 14, opacity: pressed ? 0.8 : 1 }]}
                        >
                          <Text style={styles.scenarioEmoji}>✏️</Text>
                          <View style={styles.scenarioTextWrap}>
                            <Text style={[styles.scenarioTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                              Custom Scenario
                            </Text>
                            <Text style={[styles.scenarioDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                              Describe your own situation and practice it live.
                            </Text>
                          </View>
                          <Feather name={customScenarioExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                        </Pressable>

                        {customScenarioExpanded && (
                          <View style={{ marginTop: 14, gap: 10 }}>
                            <TextInput
                              style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, fontFamily: "Inter_400Regular", minHeight: 44, marginBottom: 0 }]}
                              placeholder="Scenario title (e.g. Reluctant SNF Administrator)"
                              placeholderTextColor={colors.mutedForeground}
                              value={customTitle}
                              onChangeText={setCustomTitle}
                              maxLength={80}
                            />
                            <TextInput
                              style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, fontFamily: "Inter_400Regular", marginBottom: 0 }]}
                              placeholder="Describe the character and situation (e.g. A nursing home administrator who already works with two hospice companies and is satisfied with both…)"
                              placeholderTextColor={colors.mutedForeground}
                              value={customDescription}
                              onChangeText={setCustomDescription}
                              multiline
                              numberOfLines={4}
                              textAlignVertical="top"
                              maxLength={500}
                            />
                            <Pressable
                              onPress={() => {
                                if (customTitle.trim().length < 3) return;
                                startRoleplay("custom", customTitle.trim(), customDescription.trim() || undefined);
                              }}
                              disabled={customTitle.trim().length < 3}
                              style={({ pressed }) => [
                                styles.submitBtn,
                                { backgroundColor: colors.primary, marginTop: 2 },
                                customTitle.trim().length < 3 && { opacity: 0.45 },
                                pressed && { opacity: 0.85 },
                              ]}
                            >
                              <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold" }]}>Start Custom Session</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                      {/* Past Sessions history */}
                      {(historyLoading || roleplayHistory.length > 0) && (
                        <View style={{ marginTop: 28 }}>
                          <View style={[savedStyles.sectionHeader, { marginBottom: 12 }]}>
                            <Feather name="clock" size={14} color={colors.mutedForeground} />
                            <Text style={[savedStyles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                              Past Sessions{roleplayHistory.length > 0 ? ` (${roleplayHistory.length})` : ""}
                            </Text>
                          </View>

                          {historyLoading ? (
                            <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 12 }} />
                          ) : (
                            roleplayHistory.map((session) => {
                              const isOpen = expandedHistoryId === session.id;
                              return (
                                <View key={session.id} style={[savedStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                  <Pressable
                                    onPress={() => {
                                      Haptics.selectionAsync();
                                      setExpandedHistoryId(isOpen ? null : session.id);
                                    }}
                                    style={({ pressed }) => [savedStyles.cardHeader, { opacity: pressed ? 0.75 : 1 }]}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text style={[savedStyles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                                        {session.scenarioTitle}
                                      </Text>
                                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                                        <Text style={[savedStyles.cardDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                                          {formatSavedDate(session.createdAt)}
                                        </Text>
                                        {session.rating !== null && (
                                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                            <Text style={{ fontSize: 12, color: "#F59E0B" }}>{"★".repeat(session.rating)}{"☆".repeat(5 - session.rating)}</Text>
                                            <Text style={[savedStyles.cardDate, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                                              {session.rating}/5
                                            </Text>
                                          </View>
                                        )}
                                      </View>
                                    </View>
                                    <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                                  </Pressable>

                                  {isOpen && session.feedback && (
                                    <View style={[savedStyles.cardBody, { borderTopColor: colors.border }]}>
                                      <Text style={[savedStyles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", marginBottom: 8 }]}>
                                        Coach Feedback
                                      </Text>
                                      <Text style={[savedStyles.cardBodyText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
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

              {/* Phase: Feedback */}
              {roleplayPhase === "feedback" && (
                <View>
                  <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.feedbackTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      Session Complete
                    </Text>
                    <Text style={[styles.feedbackScenario, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {roleplaySession?.scenarioTitle}
                    </Text>

                    {/* Rating stars */}
                    {roleplayRating !== null && (
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text key={star} style={styles.star}>
                            {star <= roleplayRating ? "★" : "☆"}
                          </Text>
                        ))}
                        <Text style={[styles.ratingNum, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                          {roleplayRating}/5
                        </Text>
                      </View>
                    )}

                    {/* Feedback text */}
                    {roleplayFeedback && (
                      <>
                        <View style={[styles.feedbackDivider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.feedbackLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                          Coach Feedback
                        </Text>
                        <Text style={[styles.feedbackBody, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                          {roleplayFeedback}
                        </Text>
                      </>
                    )}
                  </View>

                  {roleplayFeedback && (
                    <View style={styles.resultActionRow}>
                      <Pressable
                        onPress={handleShareRoleplay}
                        style={({ pressed }) => [
                          styles.saveBtn,
                          styles.resultActionBtn,
                          { borderColor: colors.border },
                          pressed && { opacity: 0.75 },
                        ]}
                      >
                        <Feather name="share" size={15} color={colors.mutedForeground} />
                        <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
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
                      styles.submitBtn,
                      { backgroundColor: colors.primary, marginTop: 16 },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold" }]}>Practice Another Scenario</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {},
  tabLabel: { fontSize: 12 },
  content: { padding: 20 },
  label: { fontSize: 15, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 110,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    minHeight: 50,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorText: { fontSize: 14, marginTop: 8 },
  resultCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  resultText: { fontSize: 15, lineHeight: 23 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 10,
  },
  resultActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  resultActionBtn: {
    flex: 1,
    marginTop: 0,
  },
  saveBtnText: { fontSize: 14 },
  emailTypePicker: { flexDirection: "row", gap: 8 },
  emailTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  emailTypeBtnText: { fontSize: 13 },

  // Role-Play: Scenario selection
  roleplayIntroTitle: { fontSize: 20, marginBottom: 6 },
  roleplayIntroSub: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  roleplayLoadingWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  roleplayLoadingText: { fontSize: 14 },
  scenarioCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  scenarioEmoji: { fontSize: 28 },
  scenarioTextWrap: { flex: 1 },
  scenarioTitle: { fontSize: 16, marginBottom: 3 },
  scenarioDesc: { fontSize: 13, lineHeight: 19 },
  scenarioStatRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  scenarioStatText: { fontSize: 11 },

  // Role-Play: Active session
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
  endBtnText: { fontSize: 14 },
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
  chatInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  endHint: { fontSize: 12, textAlign: "center", marginTop: 10 },

  // Role-Play: Feedback
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },
  feedbackTitle: { fontSize: 20, marginBottom: 4 },
  feedbackScenario: { fontSize: 14, marginBottom: 16 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  star: { fontSize: 26, color: "#F59E0B" },
  ratingNum: { fontSize: 16, marginLeft: 6 },
  feedbackDivider: { height: 1, marginVertical: 16 },
  feedbackLabel: { fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  feedbackBody: { fontSize: 15, lineHeight: 23 },
});
