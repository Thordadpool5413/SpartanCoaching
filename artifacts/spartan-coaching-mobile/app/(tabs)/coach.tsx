import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { ApiError } from "@/lib/api";
import {
  createCoachConversation,
  deleteCoachConversation,
  getCoachPreferences,
  listCoachConversations,
  loadCoachConversation,
  saveCoachMemory,
  saveCoachPreferences,
  sendCoachMessage,
  type CoachConversation,
  type CoachPreference,
} from "@/lib/coachApi";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";
import {
  useAppearancePreference,
  type AppearancePreference,
} from "@/lib/AppearanceContext";

type BriefingPhase = "read" | "practice" | "commit";

const BRIEFING = {
  account: "Oncology referral source",
  time: "11:30 AM",
  goal: "Secure a 15 minute hospice education follow up",
  insightBody: "Lead with what he is seeing. Position education as added support.",
  commitment: "Ask for a 15 minute hospice education follow up",
} as const;

const PHASES: Array<{ id: BriefingPhase; number: string; label: string }> = [
  { id: "read", number: "1", label: "Read" },
  { id: "practice", number: "2", label: "Practice" },
  { id: "commit", number: "3", label: "Commit" },
];

export default function CoachScreen() {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const appearance = useAppearancePreference();
  const inputRef = useRef<TextInput>(null);
  const [phase, setPhase] = useState<BriefingPhase>("practice");
  const [rehearsing, setRehearsing] = useState(false);
  const [practiceText, setPracticeText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preference, setPreference] = useState<CoachPreference>({
    memoryEnabled: false,
    responseStyle: "balanced",
  });

  useEffect(() => {
    void Promise.all([listCoachConversations(), getCoachPreferences()])
      .then(([items, prefs]) => {
        setConversations(items);
        setPreference(prefs);
      })
      .catch(() => undefined);
  }, []);

  function beginRehearsal() {
    setRehearsing(true);
    setFeedback(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function finishRehearsal() {
    if (!rehearsing) return;
    setRehearsing(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function requestFeedback() {
    const rehearsal = practiceText.trim();
    if (!rehearsal || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      let id = conversationId;
      if (!id) {
        const created = await createCoachConversation("Oncology field briefing");
        id = created.id;
        setConversationId(id);
        setConversations((current) => [created, ...current]);
      }
      const requestId = Crypto.randomUUID();
      const prompt = [
        "Review this hospice sales opening for empathy, clarity, and a specific next step.",
        "The goal is a short education follow up with an oncology referral source.",
        "Give direct coaching in three concise parts, then provide one improved version.",
        `Opening: ${rehearsal}`,
      ].join("\n");
      const answer = await sendCoachMessage(id, prompt, requestId);
      setFeedback(answer.content);
      setPhase("commit");
      setConversations(await listCoachConversations());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === "POTENTIAL_PHI_DETECTED"
          ? "Remove patient names and identifying information before asking Coach to review it."
          : error instanceof ApiError && error.status === 401
            ? "Sign in again. Your rehearsal is still here."
            : "Coach could not review this rehearsal. Your wording is still here.";
      Alert.alert("Review not available", message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCommitment() {
    if (busy) return;
    setBusy(true);
    try {
      await saveCoachMemory("commitment", BRIEFING.commitment);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Commitment saved",
        "It is now private in Today. You decide if a summary is ever shared.",
        [{ text: "Open Today", onPress: () => router.replace("/(tabs)") }],
      );
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? "Sign in again, then save this commitment."
          : "The commitment was not saved. Try again in a moment.";
      Alert.alert("Could not save", message);
    } finally {
      setBusy(false);
    }
  }

  async function openConversation(item: CoachConversation) {
    setHistoryOpen(false);
    setBusy(true);
    try {
      const loaded = await loadCoachConversation(item.id);
      const lastCoach = [...loaded.messages].reverse().find((message) => message.role === "assistant");
      setConversationId(item.id);
      setFeedback(lastCoach?.content ?? null);
      setPhase(lastCoach ? "commit" : "practice");
    } catch {
      Alert.alert("Conversation unavailable", "Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function removeConversation(item: CoachConversation) {
    await deleteCoachConversation(item.id);
    setConversations((current) => current.filter((entry) => entry.id !== item.id));
    if (conversationId === item.id) {
      setConversationId(null);
      setFeedback(null);
      setPracticeText("");
      setPhase("practice");
    }
  }

  async function updatePreference(next: CoachPreference) {
    setPreference(next);
    try {
      setPreference(await saveCoachPreferences(next));
    } catch {
      Alert.alert("Settings not saved", "Try again in a moment.");
    }
  }

  const styles = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.safe} testID="screen-elite-coach">
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={4}
      >
        <ScrollView
          style={styles.safe}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={require("@/assets/images/clinical-bg.png")}
            resizeMode="cover"
            style={styles.heroImage}
            imageStyle={styles.heroImageAsset}
          >
            <View style={styles.imageWash} />
            <View style={styles.brandRow}>
              <Pressable accessibilityLabel="Open Coach conversations" onPress={() => setHistoryOpen(true)} style={styles.utilityButton}>
                <Feather name="menu" size={20} color={colors.foreground} />
              </Pressable>
              <View style={styles.wordmark} accessibilityLabel="Spartan Coaching Elite">
                <View style={styles.wordmarkLine}>
                  <Text style={styles.wordmarkSpartan}>SPARTAN</Text>
                  <Text style={styles.wordmarkCoaching}>COACHING</Text>
                </View>
                <Text style={styles.elite}>ELITE</Text>
              </View>
              <Pressable accessibilityLabel="Open Coach settings" onPress={() => setSettingsOpen(true)} style={styles.settingsInline}>
                <Feather name="sliders" size={19} color={colors.foreground} />
              </Pressable>
              <Pressable accessibilityLabel="Open account" onPress={() => router.push("/(tabs)/account")} style={styles.profileButton}>
                <Text style={styles.profileText}>SL</Text>
              </Pressable>
            </View>

            <View style={styles.briefingHeader}>
              <View style={styles.missionStem} />
              <View style={styles.briefingCopy}>
                <Text style={styles.briefingTitle} maxFontSizeMultiplier={1.15}>FIELD BRIEFING</Text>
                <Text style={styles.accountName} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{BRIEFING.account}</Text>
                <View style={styles.timeRow}>
                  <Feather name="clock" size={20} color={colors.time} />
                  <Text style={styles.timeText}>{BRIEFING.time}</Text>
                </View>
                <Text style={styles.goal} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{BRIEFING.goal}</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.missionBody}>
            <PhaseRail phase={phase} onChange={setPhase} colors={colors} styles={styles} />

            <View style={styles.insight}>
              <Text style={styles.quoteMark}>“</Text>
              <View style={styles.insightCopy}>
                <Text style={styles.insightLead} maxFontSizeMultiplier={1.25}>
                  He may hear hospice as <Text style={styles.insightAccent}>giving up.</Text>
                </Text>
                <Text style={styles.insightBody} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{BRIEFING.insightBody}</Text>
              </View>
            </View>

            {phase === "read" ? (
              <View style={styles.readPanel}>
                <Text style={styles.sectionKicker}>READ THE ROOM</Text>
                <Text style={styles.readTitle}>Start with observation, not explanation.</Text>
                <Text style={styles.readBody}>Ask what the physician is seeing. Reflect the concern. Then offer education as added support.</Text>
                <Pressable onPress={() => setPhase("practice")} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Practice the opening</Text>
                  <Feather name="chevron-right" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : null}

            {phase !== "read" ? (
              <View style={styles.practiceSection}>
                <Text style={styles.practicePrompt}>Try the opening in your own words.</Text>
                <View style={styles.signalRow}>
                  <View style={styles.signalLine} />
                  {Platform.OS === "ios" ? (
                    <SymbolView name="waveform" size={46} tintColor={colors.mission} />
                  ) : (
                    <Feather name="activity" size={42} color={colors.mission} />
                  )}
                  <View style={styles.signalLine} />
                </View>
                <View style={styles.practiceControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Hold while rehearsing"
                    onPressIn={beginRehearsal}
                    onPressOut={finishRehearsal}
                    style={({ pressed }) => [styles.rehearsalButton, (pressed || rehearsing) && styles.rehearsalButtonActive]}
                  >
                    <Feather name={rehearsing ? "square" : "mic"} size={32} color={colors.mission} />
                    <Text style={styles.rehearsalLabel}>{rehearsing ? "Release to review" : "Hold while rehearsing"}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Type the opening instead" onPress={() => inputRef.current?.focus()} style={styles.typeButton}>
                    <Feather name="type" size={24} color={colors.mutedForeground} />
                    <Text style={styles.typeLabel}>Type instead</Text>
                  </Pressable>
                </View>
                <Text style={styles.privatePractice}>The rehearsal timer does not record audio. Coach reviews only the wording you choose to type.</Text>

                <View style={styles.inputShell}>
                  <TextInput
                    ref={inputRef}
                    accessibilityLabel="Opening for private Coach feedback"
                    value={practiceText}
                    onChangeText={setPracticeText}
                    placeholder="Type the opening you used"
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    maxLength={1800}
                    style={styles.input}
                  />
                  <Pressable accessibilityLabel="Ask Coach to review this opening" disabled={!practiceText.trim() || busy} onPress={() => void requestFeedback()} style={[styles.reviewButton, (!practiceText.trim() || busy) && styles.disabled]}>
                    {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.reviewButtonText}>Review with Coach</Text><Feather name="arrow-up-right" size={18} color="#FFFFFF" /></>}
                  </Pressable>
                </View>

                <View style={styles.criteria}>
                  <CriteriaRow icon="heart" label="Empathy" value="Name what they may fear" tone="good" colors={colors} styles={styles} />
                  <CriteriaRow icon="message-circle" label="Clarity" value="Use one direct sentence" tone="watch" colors={colors} styles={styles} />
                  <CriteriaRow icon="flag" label="Next step" value="Make the ask specific" tone="neutral" colors={colors} styles={styles} />
                </View>

                {feedback ? (
                  <View style={styles.feedbackPanel} accessibilityLiveRegion="polite">
                    <Text style={styles.sectionKicker}>PRIVATE COACH REVIEW</Text>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  </View>
                ) : null}

                <View style={styles.commitmentCard}>
                  <View style={styles.commitmentTarget}><View style={styles.commitmentDot} /></View>
                  <View style={styles.commitmentCopy}>
                    <Text style={styles.commitmentTitle}>Commitment ready</Text>
                    <Text style={styles.commitmentBody}>{BRIEFING.commitment}</Text>
                  </View>
                </View>

                <Pressable accessibilityRole="button" onPress={() => void saveCommitment()} disabled={busy} style={[styles.primaryButton, busy && styles.disabled]} testID="button-save-elite-commitment">
                  <Feather name="check-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Save and finish</Text>
                  <Feather name="chevron-right" size={20} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setPracticeText("");
                    setFeedback(null);
                    setPhase("practice");
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  style={styles.secondaryButton}
                >
                  <Feather name="rotate-ccw" size={20} color={colors.mutedForeground} />
                  <Text style={styles.secondaryButtonText}>Try again</Text>
                  <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <HistoryModal visible={historyOpen} onClose={() => setHistoryOpen(false)} conversations={conversations} onOpen={openConversation} onDelete={removeConversation} colors={colors} styles={styles} />
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preference={preference}
        onChange={updatePreference}
        appearance={appearance.preference}
        onChangeAppearance={appearance.setPreference}
        colors={colors}
        styles={styles}
      />

    </SafeAreaView>
  );
}

function PhaseRail({ phase, onChange, colors, styles }: { phase: BriefingPhase; onChange: (phase: BriefingPhase) => void; colors: ReturnType<typeof useColors>; styles: ReturnType<typeof makeStyles> }) {
  const activeIndex = PHASES.findIndex((item) => item.id === phase);
  return (
    <View style={styles.phaseRail} accessibilityLabel={`Briefing phase ${activeIndex + 1} of 3`}>
      <View style={styles.phaseTrack} />
      <View style={[styles.phaseProgress, { width: `${(activeIndex / 2) * 88}%` }]} />
      {PHASES.map((item, index) => {
        const active = item.id === phase;
        const complete = index < activeIndex;
        return (
          <Pressable key={item.id} onPress={() => onChange(item.id)} style={styles.phaseItem}>
            <View style={[styles.phaseNumber, (active || complete) && styles.phaseNumberActive]}>
              <Text style={[styles.phaseNumberText, (active || complete) && { color: colors.mission }]}>{item.number}</Text>
            </View>
            <Text style={[styles.phaseLabel, active && styles.phaseLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CriteriaRow({ icon, label, value, tone, colors, styles }: { icon: "heart" | "message-circle" | "flag"; label: string; value: string; tone: "good" | "watch" | "neutral"; colors: ReturnType<typeof useColors>; styles: ReturnType<typeof makeStyles> }) {
  const toneColor = tone === "good" ? colors.success : tone === "watch" ? colors.warning : colors.mutedForeground;
  return (
    <View style={styles.criteriaRow}>
      <Feather name={icon} size={22} color={colors.mission} />
      <Text style={styles.criteriaText}><Text style={styles.criteriaLabel}>{label}</Text>{`  ${value}`}</Text>
      <Feather name={tone === "good" ? "check-circle" : tone === "watch" ? "alert-circle" : "minus-circle"} size={20} color={toneColor} />
    </View>
  );
}

function HistoryModal({ visible, onClose, conversations, onOpen, onDelete, colors, styles }: { visible: boolean; onClose: () => void; conversations: CoachConversation[]; onOpen: (item: CoachConversation) => Promise<void>; onDelete: (item: CoachConversation) => Promise<void>; colors: ReturnType<typeof useColors>; styles: ReturnType<typeof makeStyles> }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <View><Text style={styles.modalKicker}>PRIVATE TO YOU</Text><Text style={styles.modalTitle}>Coach history</Text></View>
          <Pressable onPress={onClose}><Text style={styles.done}>Done</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.historyList}>
          {conversations.length === 0 ? <Text style={styles.emptyHistory}>Your private Coach reviews will appear here.</Text> : conversations.map((item) => (
            <Pressable key={item.id} onPress={() => void onOpen(item)} style={styles.historyRow}>
              <View style={styles.historyCopy}><Text numberOfLines={1} style={styles.historyTitle}>{item.title}</Text><Text style={styles.historyDate}>{new Date(item.updatedAt).toLocaleDateString()}</Text></View>
              <Pressable accessibilityLabel={`Delete ${item.title}`} onPress={() => void onDelete(item)} hitSlop={12}><Feather name="trash-2" size={18} color={colors.mutedForeground} /></Pressable>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SettingsModal({ visible, onClose, preference, onChange, appearance, onChangeAppearance, colors, styles }: { visible: boolean; onClose: () => void; preference: CoachPreference; onChange: (next: CoachPreference) => Promise<void>; appearance: AppearancePreference; onChangeAppearance: (next: AppearancePreference) => Promise<void>; colors: ReturnType<typeof useColors>; styles: ReturnType<typeof makeStyles> }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Coach settings</Text><Pressable onPress={onClose}><Text style={styles.done}>Done</Text></Pressable></View>
        <View style={styles.settingCard}>
          <View style={styles.settingCopy}><Text style={styles.settingTitle}>Personal memory</Text><Text style={styles.settingBody}>Off by default. Coach uses only the items you choose to save.</Text></View>
          <Switch value={preference.memoryEnabled} onValueChange={(memoryEnabled) => void onChange({ ...preference, memoryEnabled })} trackColor={{ true: colors.primary }} />
        </View>
        <Text style={styles.modalKicker}>RESPONSE STYLE</Text>
        {(["concise", "balanced", "detailed"] as const).map((responseStyle) => (
          <Pressable key={responseStyle} onPress={() => void onChange({ ...preference, responseStyle })} style={styles.option}>
            <Text style={styles.optionText}>{responseStyle[0].toUpperCase() + responseStyle.slice(1)}</Text>
            {preference.responseStyle === responseStyle ? <Feather name="check" size={20} color={colors.primary} /> : null}
          </Pressable>
        ))}
        <Text style={styles.modalKicker}>APPEARANCE</Text>
        <View style={styles.appearancePicker}>
          {(["system", "light", "dark"] as const).map((choice) => (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ selected: appearance === choice }}
              onPress={() => void onChangeAppearance(choice)}
              style={[styles.appearanceChoice, appearance === choice && styles.appearanceChoiceSelected]}
            >
              <Feather
                name={choice === "system" ? "smartphone" : choice === "light" ? "sun" : "moon"}
                size={18}
                color={appearance === choice ? colors.primaryForeground : colors.foreground}
              />
              <Text style={[styles.appearanceText, appearance === choice && styles.appearanceTextSelected]}>
                {choice[0].toUpperCase() + choice.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.privacyNote}>Raw conversations remain private. Only a summary and commitments can be shared, and only when you explicitly choose to share them.</Text>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: Platform.OS === "ios" ? 118 : 96 },
    heroImage: { minHeight: 344, overflow: "hidden" },
    heroImageAsset: { opacity: isDark ? 0.78 : 0.28 },
    imageWash: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.imageWash },
    brandRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 18, paddingTop: 12 },
    utilityButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    wordmark: { flex: 1, marginLeft: 12, paddingTop: 2 },
    wordmarkLine: { flexDirection: "row", alignItems: "center", gap: 6 },
    wordmarkSpartan: { color: colors.foreground, fontSize: 15, letterSpacing: 1.2, ...font("heavy") },
    wordmarkCoaching: { color: colors.mission, fontSize: 15, letterSpacing: 1.2, ...font("heavy") },
    elite: { color: colors.time, fontSize: 12, letterSpacing: 2.8, marginTop: 5, ...font("bold") },
    profileButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    profileText: { color: colors.foreground, fontSize: 16, ...font("semibold") },
    briefingHeader: { flexDirection: "row", paddingHorizontal: 30, paddingTop: 72, paddingBottom: 32 },
    missionStem: { width: 3, borderRadius: 2, backgroundColor: colors.mission, marginRight: 24 },
    briefingCopy: { flex: 1 },
    briefingTitle: { color: colors.foreground, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, ...font("heavy") },
    accountName: { color: colors.mutedForeground, fontSize: 17, marginTop: 6, ...font("medium") },
    timeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
    timeText: { color: colors.time, fontSize: 18, letterSpacing: 0.3, ...font("semibold") },
    goal: { color: colors.foreground, fontSize: 20, lineHeight: 27, marginTop: 16, maxWidth: 320, ...font("medium") },
    missionBody: { paddingHorizontal: 24, borderLeftWidth: 3, borderLeftColor: colors.mission, marginLeft: 30 },
    phaseRail: { height: 92, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", position: "relative", paddingTop: 2 },
    phaseTrack: { position: "absolute", left: 22, right: 22, top: 24, height: 2, backgroundColor: colors.borderStrong },
    phaseProgress: { position: "absolute", left: 22, top: 24, height: 2, backgroundColor: colors.mission, maxWidth: "88%" },
    phaseItem: { width: 76, alignItems: "center", zIndex: 1 },
    phaseNumber: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.background },
    phaseNumberActive: { borderColor: colors.mission, borderWidth: 2 },
    phaseNumberText: { color: colors.mutedForeground, fontSize: 18, ...font("medium") },
    phaseLabel: { color: colors.mutedForeground, fontSize: 14, marginTop: 7, ...font("medium") },
    phaseLabelActive: { color: colors.mission, ...font("semibold") },
    insight: { flexDirection: "row", paddingBottom: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    quoteMark: { color: colors.mission, fontSize: 52, lineHeight: 54, width: 54, fontFamily: Platform.OS === "ios" ? "Georgia" : undefined },
    insightCopy: { flex: 1, paddingTop: 8 },
    insightLead: { color: colors.foreground, fontSize: 25, lineHeight: 32, fontFamily: Platform.OS === "ios" ? "Georgia" : undefined },
    insightAccent: { color: colors.mission },
    insightBody: { color: colors.mutedForeground, fontSize: 16, lineHeight: 23, marginTop: 12, ...font("regular") },
    readPanel: { paddingTop: 28 },
    sectionKicker: { color: colors.mission, fontSize: 11, letterSpacing: 1.8, ...font("bold") },
    readTitle: { color: colors.foreground, fontSize: 23, lineHeight: 29, marginTop: 10, ...font("bold") },
    readBody: { color: colors.mutedForeground, fontSize: 16, lineHeight: 24, marginTop: 10, ...font("regular") },
    practiceSection: { paddingTop: 26 },
    practicePrompt: { color: colors.foreground, fontSize: 18, lineHeight: 24, ...font("medium") },
    signalRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
    signalLine: { flex: 1, height: 2, backgroundColor: colors.signal },
    practiceControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 14 },
    rehearsalButton: { width: 164, height: 164, borderRadius: 82, borderWidth: 1, borderColor: colors.signal, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.card },
    rehearsalButtonActive: { borderColor: colors.mission, borderWidth: 3, backgroundColor: colors.primaryMuted, transform: [{ scale: 0.98 }] },
    rehearsalLabel: { color: colors.foreground, fontSize: 14, textAlign: "center", ...font("semibold") },
    typeButton: { minWidth: 82, minHeight: 86, alignItems: "center", justifyContent: "center", gap: 10 },
    typeLabel: { color: colors.mutedForeground, fontSize: 14, ...font("medium") },
    privatePractice: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 14, ...font("regular") },
    inputShell: { marginTop: 18, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.card },
    input: { minHeight: 92, maxHeight: 180, color: colors.foreground, fontSize: 16, lineHeight: 23, textAlignVertical: "top", ...font("regular") },
    reviewButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, marginTop: 10 },
    reviewButtonText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    disabled: { opacity: 0.45 },
    criteria: { marginTop: 22 },
    criteriaRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    criteriaText: { flex: 1, color: colors.mutedForeground, fontSize: 14, lineHeight: 20, ...font("regular") },
    criteriaLabel: { color: colors.foreground, ...font("semibold") },
    feedbackPanel: { marginTop: 20, padding: 18, borderLeftWidth: 3, borderLeftColor: colors.mission, backgroundColor: colors.card },
    feedbackText: { color: colors.foreground, fontSize: 15, lineHeight: 23, marginTop: 10, ...font("regular") },
    commitmentCard: { flexDirection: "row", alignItems: "center", gap: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 22, backgroundColor: colors.card },
    commitmentTarget: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: colors.signal, alignItems: "center", justifyContent: "center" },
    commitmentDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.mission, shadowColor: colors.mission, shadowRadius: 12, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 } },
    commitmentCopy: { flex: 1 },
    commitmentTitle: { color: colors.foreground, fontSize: 18, ...font("semibold") },
    commitmentBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 3, ...font("regular") },
    primaryButton: { minHeight: 58, borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, backgroundColor: colors.primary, marginTop: 16, shadowColor: colors.primary, shadowOpacity: isDark ? 0.30 : 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    primaryButtonText: { flex: 1, color: "#FFFFFF", fontSize: 17, ...font("semibold") },
    secondaryButton: { minHeight: 56, borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border, marginTop: 12, backgroundColor: colors.card },
    secondaryButtonText: { flex: 1, color: colors.mutedForeground, fontSize: 16, ...font("medium") },
    settingsInline: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, marginRight: 8 },
    modal: { flex: 1, backgroundColor: colors.background, padding: 20 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
    modalKicker: { color: colors.mission, fontSize: 11, letterSpacing: 1.5, marginTop: 22, ...font("bold") },
    modalTitle: { color: colors.foreground, fontSize: 28, marginTop: 3, ...font("heavy") },
    done: { color: colors.primary, fontSize: 16, ...font("bold") },
    historyList: { gap: 10, paddingBottom: 32 },
    historyRow: { minHeight: 70, borderRadius: 16, padding: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 },
    historyCopy: { flex: 1 },
    historyTitle: { color: colors.foreground, fontSize: 15, ...font("semibold") },
    historyDate: { color: colors.mutedForeground, fontSize: 12, marginTop: 5, ...font("regular") },
    emptyHistory: { color: colors.mutedForeground, textAlign: "center", marginTop: 56, lineHeight: 22, ...font("regular") },
    settingCard: { flexDirection: "row", gap: 16, alignItems: "center", padding: 18, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    settingCopy: { flex: 1 },
    settingTitle: { color: colors.foreground, fontSize: 17, ...font("bold") },
    settingBody: { color: colors.mutedForeground, lineHeight: 19, marginTop: 5, fontSize: 13, ...font("regular") },
    option: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    optionText: { color: colors.foreground, fontSize: 16, ...font("semibold") },
    appearancePicker: { flexDirection: "row", gap: 8, marginTop: 10 },
    appearanceChoice: { flex: 1, minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: colors.card },
    appearanceChoiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    appearanceText: { color: colors.foreground, fontSize: 12, ...font("semibold") },
    appearanceTextSelected: { color: colors.primaryForeground },
    privacyNote: { color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginTop: 28, ...font("regular") },
  });
}
