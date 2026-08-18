import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useAppearancePreference,
  type AppearancePreference,
} from "@/lib/AppearanceContext";
import { useAuth } from "@/lib/AuthContext";
import { ApiError, transcribeAudio } from "@/lib/api";
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
import { font } from "@/lib/typography";
import { HelmetMark } from "@/components/brand/HelmetMark";

type CoachStep = "prepare" | "rehearse" | "review";
const STEPS: Array<{ id: CoachStep; label: string }> = [
  { id: "prepare", label: "Prepare" },
  { id: "rehearse", label: "Rehearse" },
  { id: "review", label: "Commit" },
];
const defaultPreference: CoachPreference = {
  memoryEnabled: false,
  responseStyle: "balanced",
};

export default function CoachScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, isLoading: authLoading, isAuthenticated, canUseElite } = useAuth();
  const appearance = useAppearancePreference();
  const rehearsalInput = useRef<TextInput>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [step, setStep] = useState<CoachStep>("prepare");
  const [situation, setSituation] = useState("");
  const [intention, setIntention] = useState("");
  const [rehearsal, setRehearsal] = useState("");
  const [commitment, setCommitment] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [preference, setPreference] = useState(defaultPreference);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!canUseElite) return;
    void Promise.all([listCoachConversations(), getCoachPreferences()])
      .then(([items, saved]) => {
        setConversations(items);
        setPreference(saved);
      })
      .catch(() => undefined);
  }, [canUseElite]);

  const firstName = user?.member?.name?.trim().split(/\s+/)[0] || "there";
  const initials = (user?.member?.name || "SC")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function goToRehearsal() {
    if (!situation.trim() || !intention.trim()) {
      Alert.alert(
        "Complete the briefing",
        "Add the situation and the outcome you want before rehearsing.",
      );
      return;
    }
    setStep("rehearse");
    void Haptics.selectionAsync();
    requestAnimationFrame(() => rehearsalInput.current?.focus());
  }

  async function startRecording() {
    if (busy || recorderState.isRecording) return;
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Microphone access is off",
        "Allow microphone access in iPhone Settings, or type your rehearsal instead.",
      );
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert(
        "Recording did not start",
        "Type your rehearsal while microphone access is checked.",
      );
    }
  }

  async function stopAndTranscribe() {
    if (!recorderState.isRecording || busy) return;
    setBusy(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error("Recording file was not created");
      setRehearsal(await transcribeAudio(recorder.uri));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 403
          ? "Hospice Sales Pro Elite is required for private voice rehearsal."
          : "The recording could not be transcribed. You can still type your rehearsal.";
      Alert.alert("Transcription unavailable", message);
    } finally {
      setBusy(false);
    }
  }

  async function requestFeedback() {
    if (!rehearsal.trim() || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      let id = conversationId;
      if (!id) {
        const created = await createCoachConversation(
          situation.trim().slice(0, 76) || "Private rehearsal",
        );
        id = created.id;
        setConversationId(id);
        setConversations((current) => [created, ...current]);
      }
      const prompt = [
        "Coach this private hospice sales rehearsal.",
        `Situation: ${situation.trim()}`,
        `Desired outcome: ${intention.trim()}`,
        `Rehearsal: ${rehearsal.trim()}`,
        "Respond with exactly four short sections: What landed, What to sharpen, A stronger version, and One commitment.",
        "Use emotionally intelligent, direct language. Do not invent patient facts. If identifying patient information appears, stop and ask the user to remove it.",
      ].join("\n");
      const answer = await sendCoachMessage(id, prompt, Crypto.randomUUID());
      setFeedback(answer.content);
      if (!commitment.trim()) setCommitment(intention.trim());
      setStep("review");
      setConversations(await listCoachConversations());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === "POTENTIAL_PHI_DETECTED"
          ? "Remove names, dates, contact details, and other patient identifiers."
          : error instanceof ApiError && error.code === "ELITE_REQUIRED"
            ? "Your account needs Hospice Sales Pro Elite to use Spartan Coach."
            : error instanceof ApiError && error.status === 401
              ? "Sign in again. Your rehearsal remains on this iPhone."
              : "Coach could not review this rehearsal. Your wording remains here.";
      Alert.alert("Review unavailable", message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCommitment() {
    if (!feedback || !commitment.trim() || busy) return;
    setBusy(true);
    try {
      await saveCoachMemory("commitment", commitment.trim());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Commitment saved",
        "It is private. Nothing is shared unless you explicitly share a summary or commitment.",
        [{ text: "Open Today", onPress: () => router.replace("/(tabs)") }],
      );
    } catch {
      Alert.alert(
        "Commitment not saved",
        "Try again when your connection is available.",
      );
    } finally {
      setBusy(false);
    }
  }

  function resetSession() {
    setStep("prepare");
    setSituation("");
    setIntention("");
    setRehearsal("");
    setCommitment("");
    setFeedback(null);
    setConversationId(null);
  }

  async function openConversation(item: CoachConversation) {
    setHistoryOpen(false);
    setBusy(true);
    try {
      const loaded = await loadCoachConversation(item.id);
      const lastCoach = [...loaded.messages]
        .reverse()
        .find((message) => message.role === "assistant");
      setConversationId(item.id);
      setSituation(item.title);
      setFeedback(lastCoach?.content ?? null);
      setStep(lastCoach ? "review" : "rehearse");
    } catch {
      Alert.alert(
        "Conversation unavailable",
        "Try again when your connection is available.",
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(item: CoachConversation) {
    Alert.alert("Delete private conversation?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteCoachConversation(item.id).then(() => {
            setConversations((current) =>
              current.filter((entry) => entry.id !== item.id),
            );
            if (conversationId === item.id) resetSession();
          });
        },
      },
    ]);
  }

  async function updatePreference(next: CoachPreference) {
    setPreference(next);
    try {
      setPreference(await saveCoachPreferences(next));
    } catch {
      Alert.alert(
        "Settings not saved",
        "Try again when your connection is available.",
      );
    }
  }

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !canUseElite) {
    return (
      <SafeAreaView
        style={styles.safe}
        edges={["top"]}
        testID="screen-elite-coach-gate"
      >
        <ScrollView contentContainerStyle={styles.gateContent}>
          <BrandLockup styles={styles} />
          <View style={styles.gateBadge}>
            <Feather name="shield" size={15} color={colors.primary} />
            <Text style={styles.gateBadgeText}>HOSPICE SALES PRO ELITE</Text>
          </View>
          <Text style={styles.gateTitle}>
            Private practice that prepares you for the room.
          </Text>
          <Text style={styles.gateBody}>
            Rehearse by voice or text, receive direct coaching, and leave with
            one clear commitment.
          </Text>
          <View style={styles.valueCard}>
            <ValueRow icon="mic" text="Private voice rehearsal and transcription" styles={styles} colors={colors} />
            <ValueRow icon="message-circle" text="Emotionally intelligent Spartan Coach feedback" styles={styles} colors={colors} />
            <ValueRow icon="lock" text="Raw conversations stay private and expire after 90 days" styles={styles} colors={colors} />
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/membership" as any)}
          >
            <Text style={styles.primaryButtonText}>
              Compare Elite and subscribe
            </Text>
            <Feather name="arrow-right" size={19} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.gatePrice}>
            Hospice Sales Pro Elite is $19.99 per week. Cancel anytime.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top"]}
      testID="screen-elite-coach"
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          style={styles.safe}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Open private Coach history"
              onPress={() => setHistoryOpen(true)}
              style={styles.iconButton}
            >
              <Feather name="clock" size={20} color={colors.foreground} />
            </Pressable>
            <BrandLockup compact styles={styles} />
            <Pressable
              accessibilityLabel="Open Coach settings"
              onPress={() => setSettingsOpen(true)}
              style={styles.iconButton}
            >
              <Feather name="sliders" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.intro}>
            <View style={styles.eliteRow}>
              <View style={styles.redRule} />
              <Text style={styles.eliteLabel}>SPARTAN COACH</Text>
            </View>
            <Text style={styles.title}>
              Prepare for the conversation that matters.
            </Text>
            <Text style={styles.subtitle}>
              Good {timeOfDay()}, {firstName}. No patient information. Your raw
              rehearsal stays private.
            </Text>
          </View>

          <StepRail step={step} onChange={setStep} styles={styles} colors={colors} />

          {step === "prepare" ? (
            <View style={styles.section}>
              <Text style={styles.sectionNumber}>01</Text>
              <Text style={styles.sectionTitle}>Brief the Coach</Text>
              <Text style={styles.sectionBody}>
                Describe the professional situation without patient names,
                dates, contact details, or identifying facts.
              </Text>
              <Field
                label="WHAT ARE YOU WALKING INTO?"
                placeholder="Example: A case manager is hesitant to introduce hospice earlier"
                value={situation}
                onChangeText={setSituation}
                maxLength={700}
                styles={styles}
                colors={colors}
              />
              <Field
                label="WHAT OUTCOME DO YOU WANT?"
                placeholder="Example: Earn agreement for a 15 minute education follow up"
                value={intention}
                onChangeText={setIntention}
                maxLength={350}
                styles={styles}
                colors={colors}
              />
              <PrivacyBar styles={styles} colors={colors} />
              <Pressable
                style={[
                  styles.primaryButton,
                  (!situation.trim() || !intention.trim()) && styles.disabled,
                ]}
                onPress={goToRehearsal}
              >
                <Text style={styles.primaryButtonText}>Start rehearsal</Text>
                <Feather name="arrow-right" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          {step === "rehearse" ? (
            <View style={styles.section}>
              <Text style={styles.sectionNumber}>02</Text>
              <Text style={styles.sectionTitle}>Say it out loud</Text>
              <Text style={styles.sectionBody}>
                Practice the exact words you want to use. Coach evaluates
                clarity, empathy, and the strength of your next step.
              </Text>
              <View
                style={[
                  styles.recorderCard,
                  recorderState.isRecording && styles.recorderCardActive,
                ]}
              >
                <View style={styles.recordingStatusRow}>
                  <View
                    style={[
                      styles.recordingDot,
                      recorderState.isRecording && styles.recordingDotActive,
                    ]}
                  />
                  <Text style={styles.recordingStatus}>
                    {recorderState.isRecording
                      ? formatDuration(recorderState.durationMillis)
                      : busy
                        ? "TRANSCRIBING"
                        : "READY"}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={
                    recorderState.isRecording
                      ? "Stop recording and transcribe"
                      : "Start private rehearsal recording"
                  }
                  onPress={() =>
                    recorderState.isRecording
                      ? void stopAndTranscribe()
                      : void startRecording()
                  }
                  disabled={busy}
                  style={[
                    styles.recordButton,
                    recorderState.isRecording && styles.recordButtonActive,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Feather
                      name={recorderState.isRecording ? "square" : "mic"}
                      size={30}
                      color="#FFFFFF"
                    />
                  )}
                </Pressable>
                <Text style={styles.recordingInstruction}>
                  {recorderState.isRecording ? "Tap to stop" : "Tap to record"}
                </Text>
                <Text style={styles.recordingPrivacy}>
                  Audio is used for transcription. The transcript is sent only
                  when you request Coach feedback.
                </Text>
              </View>

              <View style={styles.transcriptHeader}>
                <Text style={styles.fieldLabel}>YOUR REHEARSAL</Text>
                <Text style={styles.characterCount}>{rehearsal.length}/1800</Text>
              </View>
              <TextInput
                ref={rehearsalInput}
                value={rehearsal}
                onChangeText={setRehearsal}
                placeholder="Your transcript appears here. You can also type or edit it."
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={1800}
                textAlignVertical="top"
                style={styles.rehearsalInput}
              />
              <Pressable
                disabled={!rehearsal.trim() || busy}
                onPress={() => void requestFeedback()}
                style={[
                  styles.primaryButton,
                  (!rehearsal.trim() || busy) && styles.disabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Get private feedback</Text>
                    <Feather name="arrow-up-right" size={19} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
              <Pressable onPress={() => setStep("prepare")} style={styles.textButton}>
                <Feather name="arrow-left" size={17} color={colors.mutedForeground} />
                <Text style={styles.textButtonLabel}>Edit briefing</Text>
              </Pressable>
            </View>
          ) : null}

          {step === "review" ? (
            <View style={styles.section}>
              <Text style={styles.sectionNumber}>03</Text>
              <Text style={styles.sectionTitle}>Leave with one move</Text>
              <Text style={styles.sectionBody}>
                Review the coaching, then decide what you will do. Coach cannot
                save a commitment for you.
              </Text>
              {feedback ? (
                <View style={styles.feedbackCard} accessibilityLiveRegion="polite">
                  <View style={styles.feedbackHeader}>
                    <View style={styles.feedbackMark}>
                      <Feather name="zap" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.feedbackTitle}>Private Coach review</Text>
                  </View>
                  <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
              ) : (
                <View style={styles.emptyReview}>
                  <Text style={styles.emptyReviewText}>
                    Complete a rehearsal to receive feedback.
                  </Text>
                  <Pressable onPress={() => setStep("rehearse")}>
                    <Text style={styles.inlineLink}>Return to rehearsal</Text>
                  </Pressable>
                </View>
              )}
              <Field
                label="MY COMMITMENT"
                placeholder="Write one specific action you will take"
                value={commitment}
                onChangeText={setCommitment}
                maxLength={350}
                styles={styles}
                colors={colors}
              />
              <Pressable
                disabled={!feedback || !commitment.trim() || busy}
                onPress={() => void saveCommitment()}
                style={[
                  styles.primaryButton,
                  (!feedback || !commitment.trim() || busy) && styles.disabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Save commitment</Text>
                    <Feather name="check" size={20} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
              <Pressable onPress={resetSession} style={styles.secondaryButton}>
                <Feather name="plus" size={18} color={colors.foreground} />
                <Text style={styles.secondaryButtonText}>
                  Start a new rehearsal
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <HistorySheet
        visible={historyOpen}
        conversations={conversations}
        onClose={() => setHistoryOpen(false)}
        onOpen={openConversation}
        onDelete={confirmDelete}
        styles={styles}
        colors={colors}
      />
      <SettingsSheet
        visible={settingsOpen}
        preference={preference}
        appearance={appearance.preference}
        onClose={() => setSettingsOpen(false)}
        onPreference={updatePreference}
        onAppearance={appearance.setPreference}
        styles={styles}
        colors={colors}
        initials={initials}
      />
    </SafeAreaView>
  );
}

function BrandLockup({
  compact = false,
  styles,
}: {
  compact?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View
      style={[styles.brandShell, compact && styles.brandShellCompact]}
      accessibilityLabel="Spartan Coaching"
    >
      <HelmetMark size={compact ? 38 : 92} />
      {!compact ? <Text style={styles.brandWord}>SPARTAN COACH</Text> : null}
    </View>
  );
}

function StepRail({
  step,
  onChange,
  styles,
  colors,
}: {
  step: CoachStep;
  onChange: (next: CoachStep) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  const current = STEPS.findIndex((item) => item.id === step);
  return (
    <View
      style={styles.stepRail}
      accessibilityLabel={`Coach step ${current + 1} of 3`}
    >
      {STEPS.map((item, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={styles.stepItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label}, step ${index + 1} of 3`}
          >
            <View
              style={[
                styles.stepCircle,
                (active || complete) && styles.stepCircleActive,
              ]}
            >
              {complete ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    active && { color: colors.primaryForeground },
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  maxLength,
  styles,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength: number;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldMeta}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.characterCount}>{value.length}/{maxLength}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        style={styles.fieldInput}
      />
    </View>
  );
}

function PrivacyBar({
  styles,
  colors,
}: {
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.privacyBar}>
      <Feather name="lock" size={17} color={colors.success} />
      <Text style={styles.privacyText}>
        Raw conversations stay private for 90 days. Only summaries and
        commitments you explicitly share can leave Coach.
      </Text>
    </View>
  );
}

function ValueRow({
  icon,
  text,
  styles,
  colors,
}: {
  icon: "mic" | "message-circle" | "lock";
  text: string;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.valueRow}>
      <View style={styles.valueIcon}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.valueText}>{text}</Text>
    </View>
  );
}

function HistorySheet({
  visible,
  conversations,
  onClose,
  onOpen,
  onDelete,
  styles,
  colors,
}: {
  visible: boolean;
  conversations: CoachConversation[];
  onClose: () => void;
  onOpen: (item: CoachConversation) => Promise<void>;
  onDelete: (item: CoachConversation) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetKicker}>PRIVATE TO YOU</Text>
            <Text style={styles.sheetTitle}>Coach history</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close Coach history"
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.sheetList}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.retentionNote}>
            Raw conversations are automatically removed after 90 days.
          </Text>
          {conversations.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="message-circle" size={28} color={colors.mutedForeground} />
              <Text style={styles.emptyHistoryText}>
                Your private rehearsals will appear here.
              </Text>
            </View>
          ) : (
            conversations.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => void onOpen(item)}
                style={styles.historyRow}
              >
                <View style={styles.historyCopy}>
                  <Text numberOfLines={2} style={styles.historyTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Delete ${item.title}`}
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onDelete(item);
                  }}
                  hitSlop={12}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={17} color={colors.destructive} />
                </Pressable>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SettingsSheet({
  visible,
  preference,
  appearance,
  onClose,
  onPreference,
  onAppearance,
  styles,
  colors,
  initials,
}: {
  visible: boolean;
  preference: CoachPreference;
  appearance: AppearancePreference;
  onClose: () => void;
  onPreference: (next: CoachPreference) => Promise<void>;
  onAppearance: (next: AppearancePreference) => Promise<void>;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
  initials: string;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetKicker}>SPARTAN COACH</Text>
            <Text style={styles.sheetTitle}>Preferences</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close Coach preferences"
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.settingsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileStrip}>
            <View style={styles.initials}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.profileTitle}>Private coaching space</Text>
              <Text style={styles.profileBody}>
                Raw conversations are visible only to you.
              </Text>
            </View>
          </View>
          <Text style={styles.settingsLabel}>MEMORY</Text>
          <View style={styles.settingCard}>
            <View style={styles.flex}>
              <Text style={styles.settingTitle}>Personal memory</Text>
              <Text style={styles.settingBody}>
                Off by default. Coach uses only the items you explicitly save.
              </Text>
            </View>
            <Switch
              value={preference.memoryEnabled}
              accessibilityLabel="Personal memory"
              onValueChange={(memoryEnabled) =>
                void onPreference({ ...preference, memoryEnabled })
              }
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
            />
          </View>
          <Text style={styles.settingsLabel}>RESPONSE STYLE</Text>
          <View style={styles.optionGroup}>
            {(["concise", "balanced", "detailed"] as const).map(
              (responseStyle) => (
                <Pressable
                  key={responseStyle}
                  onPress={() =>
                    void onPreference({ ...preference, responseStyle })
                  }
                  style={styles.optionRow}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: preference.responseStyle === responseStyle }}
                >
                  <Text style={styles.optionText}>
                    {responseStyle[0].toUpperCase() + responseStyle.slice(1)}
                  </Text>
                  {preference.responseStyle === responseStyle ? (
                    <View style={styles.selectedCheck}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              ),
            )}
          </View>
          <Text style={styles.settingsLabel}>APPEARANCE</Text>
          <View style={styles.appearanceRow}>
            {(["system", "light", "dark"] as const).map((choice) => (
              <Pressable
                key={choice}
                onPress={() => void onAppearance(choice)}
                style={[
                  styles.appearanceChoice,
                  appearance === choice && styles.appearanceChoiceSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: appearance === choice }}
              >
                <Feather
                  name={
                    choice === "system"
                      ? "smartphone"
                      : choice === "light"
                        ? "sun"
                        : "moon"
                  }
                  size={19}
                  color={appearance === choice ? "#FFFFFF" : colors.foreground}
                />
                <Text
                  style={[
                    styles.appearanceText,
                    appearance === choice && styles.appearanceTextSelected,
                  ]}
                >
                  {choice[0].toUpperCase() + choice.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <PrivacyBar styles={styles} colors={colors} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatDuration(milliseconds = 0) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    content: { paddingHorizontal: 20, paddingBottom: 36 },
    topBar: {
      height: 66,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
    },
    brandShell: {
      height: 126,
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    brandShellCompact: { width: 44, height: 44, borderRadius: 14, borderWidth: 0, backgroundColor: "transparent" },
    brandWord: { color: colors.foreground, fontSize: 10, letterSpacing: 2.2, ...font("bold") },
    intro: { paddingTop: 18, paddingBottom: 22 },
    eliteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 10,
    },
    redRule: { width: 24, height: 2, backgroundColor: colors.primary },
    eliteLabel: {
      color: colors.primary,
      fontSize: 11,
      letterSpacing: 2.1,
      ...font("bold"),
    },
    title: {
      color: colors.foreground,
      fontSize: 32,
      lineHeight: 37,
      letterSpacing: -0.9,
      ...font("heavy"),
    },
    subtitle: {
      color: colors.mutedForeground,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
      ...font("regular"),
    },
    stepRail: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 14,
      marginBottom: 26,
    },
    stepItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    stepCircle: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleActive: { backgroundColor: colors.primary },
    stepNumber: {
      color: colors.mutedForeground,
      fontSize: 12,
      ...font("semibold"),
    },
    stepLabel: {
      color: colors.mutedForeground,
      fontSize: 12,
      ...font("semibold"),
    },
    stepLabelActive: { color: colors.foreground },
    section: { paddingBottom: 24 },
    sectionNumber: {
      color: colors.primary,
      fontSize: 11,
      letterSpacing: 2.2,
      ...font("bold"),
    },
    sectionTitle: {
      color: colors.foreground,
      fontSize: 25,
      lineHeight: 31,
      letterSpacing: -0.4,
      marginTop: 7,
      ...font("bold"),
    },
    sectionBody: {
      color: colors.mutedForeground,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 7,
      marginBottom: 4,
      ...font("regular"),
    },
    fieldGroup: { marginTop: 20 },
    fieldMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    fieldLabel: {
      color: colors.foreground,
      fontSize: 11,
      letterSpacing: 1.4,
      ...font("bold"),
    },
    characterCount: {
      color: colors.mutedForeground,
      fontSize: 11,
      ...font("regular"),
    },
    fieldInput: {
      minHeight: 112,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      padding: 15,
      color: colors.foreground,
      fontSize: 16,
      lineHeight: 23,
      ...font("regular"),
    },
    privacyBar: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      borderRadius: 14,
      padding: 13,
      marginTop: 18,
      backgroundColor: colors.secondary,
    },
    privacyText: {
      flex: 1,
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      ...font("regular"),
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 15,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 18,
      marginTop: 18,
    },
    primaryButtonText: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 16,
      ...font("bold"),
    },
    disabled: { opacity: 0.4 },
    recorderCard: {
      marginTop: 20,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      padding: 22,
    },
    recorderCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    recordingStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    recordingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.borderStrong,
    },
    recordingDotActive: { backgroundColor: colors.primary },
    recordingStatus: {
      color: colors.mutedForeground,
      fontSize: 11,
      letterSpacing: 1.5,
      ...font("bold"),
    },
    recordButton: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },
    recordButtonActive: { backgroundColor: colors.destructive },
    recordingInstruction: {
      color: colors.foreground,
      fontSize: 16,
      marginTop: 13,
      ...font("semibold"),
    },
    recordingPrivacy: {
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 8,
      maxWidth: 300,
      ...font("regular"),
    },
    transcriptHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 22,
      marginBottom: 8,
    },
    rehearsalInput: {
      minHeight: 150,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      padding: 15,
      color: colors.foreground,
      fontSize: 16,
      lineHeight: 24,
      ...font("regular"),
    },
    textButton: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    textButtonLabel: {
      color: colors.mutedForeground,
      fontSize: 14,
      ...font("semibold"),
    },
    feedbackCard: {
      marginTop: 20,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 18,
    },
    feedbackHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 15,
    },
    feedbackMark: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    feedbackTitle: {
      color: colors.foreground,
      fontSize: 17,
      ...font("bold"),
    },
    feedbackText: {
      color: colors.foreground,
      fontSize: 15,
      lineHeight: 23,
      ...font("regular"),
    },
    emptyReview: {
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      marginTop: 20,
    },
    emptyReviewText: {
      color: colors.mutedForeground,
      fontSize: 14,
      ...font("regular"),
    },
    inlineLink: {
      color: colors.primary,
      fontSize: 14,
      marginTop: 8,
      ...font("semibold"),
    },
    secondaryButton: {
      minHeight: 54,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      marginTop: 12,
    },
    secondaryButtonText: {
      color: colors.foreground,
      fontSize: 15,
      ...font("semibold"),
    },
    gateContent: {
      paddingHorizontal: 22,
      paddingTop: 14,
      paddingBottom: 40,
    },
    gateBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 28,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
    },
    gateBadgeText: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.3,
      ...font("bold"),
    },
    gateTitle: {
      color: colors.foreground,
      fontSize: 34,
      lineHeight: 39,
      letterSpacing: -1,
      marginTop: 16,
      ...font("heavy"),
    },
    gateBody: {
      color: colors.mutedForeground,
      fontSize: 17,
      lineHeight: 25,
      marginTop: 12,
      ...font("regular"),
    },
    valueCard: {
      marginTop: 24,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
      gap: 15,
    },
    valueRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    valueIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    valueText: {
      flex: 1,
      color: colors.foreground,
      fontSize: 14,
      lineHeight: 20,
      ...font("medium"),
    },
    gatePrice: {
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 12,
      ...font("regular"),
    },
    sheet: { flex: 1, backgroundColor: colors.background },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sheetKicker: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.6,
      ...font("bold"),
    },
    sheetTitle: {
      color: colors.foreground,
      fontSize: 27,
      marginTop: 3,
      ...font("heavy"),
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetList: { padding: 20, paddingBottom: 38 },
    retentionNote: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 16,
      ...font("regular"),
    },
    historyRow: {
      minHeight: 76,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    historyCopy: { flex: 1 },
    historyTitle: {
      color: colors.foreground,
      fontSize: 15,
      lineHeight: 20,
      ...font("semibold"),
    },
    historyDate: {
      color: colors.mutedForeground,
      fontSize: 12,
      marginTop: 5,
      ...font("regular"),
    },
    deleteButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyHistory: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 72,
      gap: 12,
    },
    emptyHistoryText: {
      color: colors.mutedForeground,
      fontSize: 14,
      ...font("regular"),
    },
    settingsContent: { padding: 20, paddingBottom: 42 },
    profileStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingBottom: 22,
    },
    initials: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    initialsText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    profileTitle: {
      color: colors.foreground,
      fontSize: 16,
      ...font("bold"),
    },
    profileBody: {
      color: colors.mutedForeground,
      fontSize: 12,
      marginTop: 3,
      ...font("regular"),
    },
    settingsLabel: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.6,
      marginTop: 22,
      marginBottom: 9,
      ...font("bold"),
    },
    settingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
    },
    settingTitle: {
      color: colors.foreground,
      fontSize: 16,
      ...font("semibold"),
    },
    settingBody: {
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      ...font("regular"),
    },
    optionGroup: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    optionRow: {
      minHeight: 54,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    optionText: {
      color: colors.foreground,
      fontSize: 15,
      ...font("medium"),
    },
    selectedCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    appearanceRow: { flexDirection: "row", gap: 8 },
    appearanceChoice: {
      flex: 1,
      minHeight: 64,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    appearanceChoiceSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    appearanceText: {
      color: colors.foreground,
      fontSize: 12,
      ...font("semibold"),
    },
    appearanceTextSelected: { color: "#FFFFFF" },
  });
}
