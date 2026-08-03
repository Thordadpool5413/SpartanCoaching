import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useColors } from "@/hooks/useColors";
import { apiPost, getWebSiteUrl } from "@/lib/api";
import { ReminderPicker } from "@/components/ReminderPicker";
import { useSavedResponses } from "@/hooks/useSavedResponses";
import { useAuth } from "@/lib/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import {
  FIELD_KIT_TOOLS,
  type FieldKitTool,
} from "@workspace/field-kit-catalog";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { CitationsBlock, type CitationItem } from "@/components/ui/CitationsBlock";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { SavedResponsesSection } from "@/components/SavedResponsesSection";
import { RolePlayTool } from "@/components/RolePlayTool";
import { TOOL_TABS, VALID_TABS, type ToolTab } from "@/lib/toolTabs";

const EMAIL_TYPES = [
  { value: "follow_up", label: "Follow-Up" },
  { value: "thank_you", label: "Thank You" },
  { value: "value_add", label: "Value Add" },
];

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const rnTabBarHeight = useContext(BottomTabBarHeightContext);
  const tabBarHeight = rnTabBarHeight ?? insets.bottom + 49;
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const [activeTab, setActiveTab] = useState<ToolTab | null>(null);
  const [browseMode, setBrowseMode] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : tabBarHeight;

  useEffect(() => {
    const raw = params.tab;
    const tab = Array.isArray(raw) ? raw[0] : raw;
    if (tab && VALID_TABS.has(tab as ToolTab)) {
      setActiveTab(tab as ToolTab);
      setBrowseMode(false);
    } else if (!tab) {
      setBrowseMode(true);
      setActiveTab(null);
    }
  }, [params.tab]);

  const openCatalogTool = (tool: FieldKitTool) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Full web tool in-app (session via tool-web) — same product surface as website
    if (tool.mobile === "webview" || tool.mobileRoute === "/tool-web") {
      router.push({
        pathname: "/tool-web",
        params: { toolId: tool.id, path: tool.path },
      } as any);
      return;
    }
    // Dedicated native screen (Command Center, staffing, brand video, …)
    if (tool.mobileRoute && !tool.mobileToolTab) {
      router.push(tool.mobileRoute as any);
      return;
    }
    // Native tool tab inside this screen
    if (tool.mobileToolTab && VALID_TABS.has(tool.mobileToolTab as ToolTab)) {
      setActiveTab(tool.mobileToolTab as ToolTab);
      setBrowseMode(false);
      router.setParams({ tab: tool.mobileToolTab });
      return;
    }
    // Fallback: never dead-end — open web path secured
    router.push({
      pathname: "/tool-web",
      params: { toolId: tool.id, path: tool.path },
    } as any);
  };

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
  const [objectionCitations, setObjectionCitations] = useState<CitationItem[]>([]);
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

  // Research state
  const [researchQuery, setResearchQuery] = useState("");
  const [researchResult, setResearchResult] = useState("");
  const [researchSources, setResearchSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [researchCitations, setResearchCitations] = useState<CitationItem[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  // Weekly plan state
  const [weeklyAccounts, setWeeklyAccounts] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [weeklyFocus, setWeeklyFocus] = useState("");
  const [weeklyChallenges, setWeeklyChallenges] = useState("");
  const [weeklyResult, setWeeklyResult] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  // Cold call state
  const [coldProspectType, setColdProspectType] = useState("");
  const [coldProspectName, setColdProspectName] = useState("");
  const [coldSituation, setColdSituation] = useState("");
  const [coldResult, setColdResult] = useState("");
  const [coldLoading, setColdLoading] = useState(false);
  const [coldError, setColdError] = useState<string | null>(null);

  const handleObjection = async () => {
    if (objection.trim().length < 5) return;
    if (!requireAccess()) {
      setObjectionError("Membership access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setObjectionLoading(true);
    setObjectionResult("");
    setObjectionCitations([]);
    setObjectionError(null);
    setObjectionSavedId(null);
    try {
      const data = await apiPost<{
        response: string;
        citations?: CitationItem[];
      }>("/api/objections", { objection });
      setObjectionResult(data.response);
      setObjectionCitations(data.citations || []);
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
      setPlaybookError("Membership access required. Sign in from Home.");
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
      setEmailError("Membership access required. Sign in from Home.");
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

  const handleResearch = async () => {
    if (researchQuery.trim().length < 5) return;
    if (!requireAccess()) {
      setResearchError("Membership access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResearchLoading(true);
    setResearchResult("");
    setResearchSources([]);
    setResearchCitations([]);
    setResearchError(null);
    try {
      const data = await apiPost<{
        text: string;
        sources?: Array<{ title: string; uri: string }>;
        spartanCitations?: CitationItem[];
      }>("/api/research", { query: researchQuery, useGrounding: true });
      setResearchResult(data.text || "");
      setResearchSources(data.sources || []);
      setResearchCitations(data.spartanCitations || []);
    } catch {
      setResearchError("Something went wrong. Please try again.");
    } finally {
      setResearchLoading(false);
    }
  };

  const handleWeeklyPlan = async () => {
    if (weeklyAccounts.trim().length < 10 || !weeklyGoal.trim()) return;
    if (!requireAccess()) {
      setWeeklyError("Membership access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeeklyLoading(true);
    setWeeklyResult("");
    setWeeklyError(null);
    try {
      const data = await apiPost<{ plan?: string; text?: string; result?: string }>(
        "/api/weekly-plan-builder",
        {
          accounts: weeklyAccounts,
          weeklyGoal,
          territoryFocus: weeklyFocus || undefined,
          challenges: weeklyChallenges || undefined,
        },
      );
      setWeeklyResult(data.plan || data.text || data.result || JSON.stringify(data));
    } catch {
      setWeeklyError("Something went wrong. Please try again.");
    } finally {
      setWeeklyLoading(false);
    }
  };

  const handleColdCall = async () => {
    if (!coldProspectType.trim() || coldSituation.trim().length < 10) return;
    if (!requireAccess()) {
      setColdError("Membership access required. Sign in from Home.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColdLoading(true);
    setColdResult("");
    setColdError(null);
    try {
      const data = await apiPost<{ script?: string; text?: string; result?: string }>(
        "/api/cold-call-script",
        {
          prospectType: coldProspectType,
          prospectName: coldProspectName || undefined,
          situation: coldSituation,
        },
      );
      setColdResult(data.script || data.text || data.result || JSON.stringify(data));
    } catch {
      setColdError("Something went wrong. Please try again.");
    } finally {
      setColdLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header — always pinned above content */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Membership tools
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {canUseFieldKit
            ? "Command Center first · satellite tools below"
            : "Sign in for live tools · coaching stays human"}
        </Text>
      </View>

      {!canUseFieldKit && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 4,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.primary,
            backgroundColor: colors.card,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View style={{ backgroundColor: "rgba(232,41,30,0.08)", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(232,41,30,0.15)" }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 3 }}>
              Spartan Membership · Not every rep has access
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "900", lineHeight: 22 }}>
              {isAuthenticated ? "Join the reps who refuse to leave a referral on the table" : "The edge that converts conversations into admissions"}
            </Text>
          </View>

          {/* Tool rows */}
          <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, gap: 8 }}>
            {[
              { title: "Objection Handler", desc: "The answer the other rep didn't have — field-ready in 30 seconds" },
              { title: "Weekly Plan Builder", desc: "The top reps planned their week on Sunday. Win conditions, every day." },
              { title: "Playbook Generator", desc: "The right ask for this account at this stage — not a generic approach" },
              { title: "Role-Play Practice", desc: "Win the hard conversation before you're in the room" },
            ].map((t) => (
              <View key={t.title} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <Feather name="check-circle" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{t.title}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{t.desc}</Text>
                </View>
              </View>
            ))}
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
              + Cold Call Scripts, Activity Calculator, ROI Calculator, and more
            </Text>
          </View>

          {/* Price + CTA */}
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "900" }}>
              $14.99<Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedForeground }}> / week · cancel anytime</Text>
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2, marginBottom: 10 }}>
              The cost of one incomplete referral conversation. Prepared conversations win the room — winging Tuesday does not.
            </Text>
            <Pressable
              onPress={() => router.push(isAuthenticated ? "/(tabs)/account" : "/login")}
              style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 11, alignItems: "center" }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 14 }}>
                {isAuthenticated ? "Open Account to get access →" : "Sign in to get access →"}
              </Text>
            </Pressable>
            {!isAuthenticated && (
              <Pressable
                onPress={() => Linking.openURL(`${getWebSiteUrl()}/membership`)}
                style={{ marginTop: 10, alignItems: "center" }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                  Built for the rep who wins. See what's inside →
                </Text>
              </Pressable>
            )}
          </View>
        </View>
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

      {/* Catalog browse — matches web Tools map by category */}
      {browseMode && (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 24, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <SectionKicker>Membership · Prioritized</SectionKicker>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 22,
              fontWeight: "900",
              marginTop: 8,
              marginBottom: 6,
              fontFamily: "Inter_700Bold",
            }}
          >
            Same hierarchy as the web
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
            Command Center first, then daily field tools, then leader math. Advanced library is secondary.
          </Text>

          {(() => {
            const command = FIELD_KIT_TOOLS.find((t) => t.id === "sales-workflow");
            const dailyIds = [
              "objections",
              "playbooks",
              "role-play",
              "weekly-plan",
              "cold-call",
              "email-templates",
            ];
            const leaderIds = ["activity-calculator", "roi", "rep-cost", "branch"];
            const daily = FIELD_KIT_TOOLS.filter((t) => dailyIds.includes(t.id));
            const leaders = FIELD_KIT_TOOLS.filter((t) => leaderIds.includes(t.id));
            const rest = FIELD_KIT_TOOLS.filter(
              (t) =>
                t.id !== "sales-workflow" &&
                !dailyIds.includes(t.id) &&
                !leaderIds.includes(t.id) &&
                t.category !== "Learn",
            );
            const renderTool = (tool: FieldKitTool, emphasized = false) => (
              <Pressable key={tool.id} onPress={() => openCatalogTool(tool)} style={{ marginBottom: 8 }}>
                <SpartanCard emphasized={emphasized}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 15 }}>
                        {tool.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.mutedForeground,
                          fontSize: 12,
                          marginTop: 4,
                          lineHeight: 17,
                        }}
                        numberOfLines={2}
                      >
                        {tool.description}
                      </Text>
                      {tool.mobile === "webview" && (
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700", marginTop: 6 }}>
                          Full web experience · same as website
                        </Text>
                      )}
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </View>
                </SpartanCard>
              </Pressable>
            );
            return (
              <>
                {command && (
                  <View style={{ marginBottom: 20 }} testID="tools-hero-command">
                    <Pressable onPress={() => openCatalogTool(command)}>
                      <SpartanCard emphasized>
                        <SectionKicker>Daily operating system</SectionKicker>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 20,
                            fontWeight: "900",
                            marginTop: 8,
                            fontFamily: "Inter_700Bold",
                          }}
                        >
                          {command.title}
                        </Text>
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 13,
                            marginTop: 6,
                            lineHeight: 19,
                          }}
                        >
                          {command.description}
                        </Text>
                        <Text style={{ color: colors.primary, fontWeight: "800", marginTop: 12 }}>
                          Open Command Center →
                        </Text>
                      </SpartanCard>
                    </Pressable>
                  </View>
                )}
                <View style={{ marginBottom: 18 }} testID="tools-daily">
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 1.4,
                      marginBottom: 8,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    DAILY FIELD TOOLS
                  </Text>
                  {daily.map((t) => renderTool(t))}
                </View>
                <View style={{ marginBottom: 18 }} testID="tools-leaders">
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 1.4,
                      marginBottom: 8,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    FOR DIRECTORS &amp; LEADERS
                  </Text>
                  {leaders.map((t) => renderTool(t))}
                </View>
                {rest.length > 0 && (
                  <View style={{ marginBottom: 18 }}>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 11,
                        fontWeight: "800",
                        letterSpacing: 1.4,
                        marginBottom: 8,
                        fontFamily: "Inter_700Bold",
                      }}
                    >
                      MORE IN THE KIT
                    </Text>
                    {rest.map((t) => renderTool(t))}
                  </View>
                )}
              </>
            );
          })()}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/ai-tools" as any)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            })}
            testID="advanced-ai-tools-library"
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.muted,
              }}
            >
              <Feather name="cpu" size={22} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontFamily: "Inter_700Bold" }}>
                Advanced library
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 3 }}>
                Specialized AI + clinical vault — secondary to daily membership tools
              </Text>
            </View>
            <Feather name="arrow-right" size={19} color={colors.mutedForeground} />
          </Pressable>
        </ScrollView>
      )}

      {/* Tool tabs — only when a native tool is open */}
      {!browseMode && (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => {
                setBrowseMode(true);
                setActiveTab(null);
                router.setParams({ tab: undefined as any });
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 12 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>← All tools</Text>
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.tabBar, { backgroundColor: colors.background, borderBottomWidth: 0, flex: 1 }]}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {TOOL_TABS.map((tab) => (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab.key);
                    setBrowseMode(false);
                  }}
                  style={({ pressed }) => [
                    styles.tabBtn,
                    activeTab === tab.key && styles.tabBtnActive,
                    activeTab === tab.key && { borderBottomColor: colors.primary },
                    { opacity: pressed ? 0.75 : 1, flex: 0, paddingHorizontal: 12, minWidth: 88 },
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
            </ScrollView>
          </View>
        </>
      )}

      {!browseMode && activeTab === "roleplay" ? (
        <RolePlayTool
          canUseFieldKit={canUseFieldKit}
          tabBarHeight={tabBarHeight}
          bottomPad={bottomPad}
        />
      ) : !browseMode && activeTab ? (
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
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Generate Response</Text>
                )}
              </Pressable>
              <FieldResultPanel
                title="Talk track"
                content={objectionResult || undefined}
                loading={objectionLoading && !objectionResult}
                error={objectionError}
                onSave={objectionResult ? handleSaveObjection : undefined}
                saved={!!objectionSavedId}
              >
                {objectionResult ? (
                  <CitationsBlock items={objectionCitations} title="Spartan Method sources" />
                ) : null}
              </FieldResultPanel>
              {!!objectionResult && (
                <ReminderPicker
                  title="Follow up after your visit"
                  body="You practiced handling an objection — set a reminder to follow up with your contact."
                  storageKey="objection"
                />
              )}
              <SavedResponsesSection
                items={objectionSaved.savedItems}
                onDelete={objectionSaved.deleteResponse}
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
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Build Playbook</Text>
                )}
              </Pressable>
              <FieldResultPanel
                title="Playbook"
                content={playbookResult || undefined}
                loading={playbookLoading && !playbookResult}
                error={playbookError}
                onSave={playbookResult ? handleSavePlaybook : undefined}
                saved={!!playbookSavedId}
              />
              {!!playbookResult && (
                <ReminderPicker
                  title="Execute your playbook"
                  body="Your sales playbook is ready — set a reminder to put it into action."
                  storageKey="playbook"
                />
              )}
              <SavedResponsesSection items={playbookSaved.savedItems} onDelete={playbookSaved.deleteResponse} />
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
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Generate Email</Text>
                )}
              </Pressable>
              <FieldResultPanel
                title="Email draft"
                content={emailResult || undefined}
                loading={emailLoading && !emailResult}
                error={emailError}
                onSave={emailResult ? handleSaveEmail : undefined}
                saved={!!emailSavedId}
              />
              {!!emailResult && (
                <ReminderPicker
                  title="Send your follow-up email"
                  body="Your email template is ready — set a reminder to send it and keep the relationship warm."
                  storageKey="email"
                  contact={recipientName || undefined}
                />
              )}
              <SavedResponsesSection items={emailSaved.savedItems} onDelete={emailSaved.deleteResponse} />
            </View>
          )}

          {/* Research */}
          {activeTab === "research" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Territory or market question
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'Latest Medicare hospice regulations on continuous care'"
                placeholderTextColor={colors.mutedForeground}
                value={researchQuery}
                onChangeText={setResearchQuery}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleResearch}
                disabled={researchLoading || researchQuery.trim().length < 5}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (researchLoading || researchQuery.trim().length < 5) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {researchLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Research</Text>
                )}
              </Pressable>
              {!!researchError && (
                <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  {researchError}
                </Text>
              )}
              {!!researchResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {researchResult}
                  </Text>
                  <CitationsBlock items={researchCitations} title="Spartan Method grounding" />
                  {researchSources.length > 0 && (
                    <View style={{ marginTop: 12, gap: 6 }}>
                      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                        Web sources
                      </Text>
                      {researchSources.slice(0, 5).map((s, i) => (
                        <Text key={i} style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                          • {s.title}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {!!researchResult && (
                <Pressable
                  onPress={() => Share.share({ message: researchResult })}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { borderColor: colors.border, marginTop: 12 },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Feather name="share" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    Share
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Weekly Plan */}
          {activeTab === "weekly" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Priority accounts this week
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="List accounts and why they matter this week (no PHI)"
                placeholderTextColor={colors.mutedForeground}
                value={weeklyAccounts}
                onChangeText={setWeeklyAccounts}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Weekly win condition
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. '2 facility tours booked, 1 new champion conversation'"
                placeholderTextColor={colors.mutedForeground}
                value={weeklyGoal}
                onChangeText={setWeeklyGoal}
              />
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Territory focus (optional)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'South corridor SNFs'"
                placeholderTextColor={colors.mutedForeground}
                value={weeklyFocus}
                onChangeText={setWeeklyFocus}
              />
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Biggest challenge (optional)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. 'Competitor locked in at hospital A'"
                placeholderTextColor={colors.mutedForeground}
                value={weeklyChallenges}
                onChangeText={setWeeklyChallenges}
              />
              <Pressable
                onPress={handleWeeklyPlan}
                disabled={weeklyLoading || weeklyAccounts.trim().length < 10 || !weeklyGoal.trim()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (weeklyLoading || weeklyAccounts.trim().length < 10 || !weeklyGoal.trim()) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {weeklyLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Build Week Plan</Text>
                )}
              </Pressable>
              {!!weeklyError && (
                <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  {weeklyError}
                </Text>
              )}
              {!!weeklyResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {weeklyResult}
                  </Text>
                </View>
              )}
              {!!weeklyResult && (
                <Pressable
                  onPress={() => Share.share({ message: weeklyResult })}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { borderColor: colors.border, marginTop: 12 },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Feather name="share" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    Share
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Cold Call Script */}
          {activeTab === "cold" && (
            <View>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Prospect type
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. SNF DON, hospitalist, home health agency"
                placeholderTextColor={colors.mutedForeground}
                value={coldProspectType}
                onChangeText={setColdProspectType}
              />
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Prospect name (optional)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="e.g. Director Martinez"
                placeholderTextColor={colors.mutedForeground}
                value={coldProspectName}
                onChangeText={setColdProspectName}
              />
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 16 }]}>
                Situation
              </Text>
              <TextInput
                style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="Why you are calling and what you know about them (no PHI)"
                placeholderTextColor={colors.mutedForeground}
                value={coldSituation}
                onChangeText={setColdSituation}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleColdCall}
                disabled={coldLoading || !coldProspectType.trim() || coldSituation.trim().length < 10}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  (coldLoading || !coldProspectType.trim() || coldSituation.trim().length < 10) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {coldLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_700Bold", color: colors.primaryForeground }]}>Generate Script</Text>
                )}
              </Pressable>
              {!!coldError && (
                <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  {coldError}
                </Text>
              )}
              {!!coldResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {coldResult}
                  </Text>
                </View>
              )}
              {!!coldResult && (
                <Pressable
                  onPress={() => Share.share({ message: coldResult })}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { borderColor: colors.border, marginTop: 12 },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Feather name="share" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.saveBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    Share
                  </Text>
                </Pressable>
              )}
            </View>
          )}


        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  headerSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {},
  tabLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  content: { padding: 20 },
  label: { fontSize: 15, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 50,
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
  submitBtnText: { fontSize: 16, fontWeight: "700" },
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

});
