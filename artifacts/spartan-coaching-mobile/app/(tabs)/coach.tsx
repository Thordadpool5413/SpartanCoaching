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
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useAppearancePreference,
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
  type CoachMessage,
  type CoachPreference,
} from "@/lib/coachApi";
import { font } from "@/lib/typography";
import { trackProductOutcome } from "@/lib/analytics";
import { cacheCommitment } from "@/lib/commitmentCache";
import { userFacingApiError } from "@/lib/offlineQueue";
import { useCoachSession } from "@/lib/CoachSessionContext";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { cleanFieldCopy } from "@/components/FieldResultPanel";
import { CoachEliteGate } from "@/components/coach/CoachEliteGate";
import { CoachSettingsPanel } from "@/components/coach/CoachSettingsPanel";
import { CoachMessageThread } from "@/components/coach/CoachMessageThread";
import { CoachInputBar } from "@/components/coach/CoachInputBar";
import { CoachShell, type CoachStep } from "@/components/coach/CoachShell";

const defaultPreference: CoachPreference = {
  memoryEnabled: false,
  responseStyle: "balanced",
};

export default function CoachScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, isLoading: authLoading, isAuthenticated, canUseElite } = useAuth();
  const appearance = useAppearancePreference();
  const { setVoiceActive } = useCoachSession();
  const rehearsalInput = useRef<TextInput>(null);
  const followUpInput = useRef<TextInput>(null);
  const coachScroll = useRef<ScrollView>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [step, setStep] = useState<CoachStep>("prepare");
  const [situation, setSituation] = useState("");
  const [intention, setIntention] = useState("");
  const [rehearsal, setRehearsal] = useState("");
  const [commitment, setCommitment] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [preference, setPreference] = useState(defaultPreference);
  const [busy, setBusy] = useState(false);
  const [coachReplying, setCoachReplying] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [landingVisible, setLandingVisible] = useState(true);
  const [landingPrompt, setLandingPrompt] = useState("");

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
      setVoiceActive(true);
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
      setVoiceActive(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error("Recording file was not created");
      setRehearsal(await transcribeAudio(recorder.uri));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setVoiceActive(false);
      const message =
        error instanceof ApiError && error.status === 403
          ? "Hospice Sales Pro Elite is required for private voice rehearsal."
          : userFacingApiError(
              error,
              "The recording could not be transcribed. You can still type your rehearsal.",
            );
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
      setMessages([answer]);
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
              : userFacingApiError(
                  error,
                  "Coach could not review this rehearsal. Your wording remains here.",
                );
      Alert.alert("Review unavailable", message);
    } finally {
      setBusy(false);
    }
  }

  async function sendFollowUp() {
    const text = followUp.trim();
    if (!conversationId || !text || busy) return;
    const requestId = Crypto.randomUUID();
    const optimisticUser: CoachMessage = {
      id: requestId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      clientRequestId: requestId,
    };
    setMessages((current) => [...current, optimisticUser]);
    setFollowUp("");
    setBusy(true);
    setCoachReplying(true);
    requestAnimationFrame(() => coachScroll.current?.scrollToEnd({ animated: true }));
    try {
      const answer = await sendCoachMessage(conversationId, text, requestId);
      setMessages((current) => [...current, answer]);
      setFeedback(answer.content);
      setConversations(await listCoachConversations());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      requestAnimationFrame(() => coachScroll.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== requestId));
      setFollowUp(text);
      const message =
        error instanceof ApiError && error.code === "POTENTIAL_PHI_DETECTED"
          ? "Remove names, dates, contact details, and other patient identifiers."
          : error instanceof ApiError && error.code === "ELITE_REQUIRED"
            ? "Your account needs Hospice Sales Pro Elite to continue with Coach."
            : error instanceof ApiError && error.status === 401
              ? "Sign in again to continue this private conversation."
              : userFacingApiError(
                  error,
                  "Coach could not respond. Your message is still here so you can try again.",
                );
      Alert.alert("Coach unavailable", message);
    } finally {
      setCoachReplying(false);
      setBusy(false);
    }
  }

  async function startDirectConversation() {
    const text = landingPrompt.trim();
    if (!text || busy) return;
    setBusy(true);
    setCoachReplying(true);
    try {
      const created = await createCoachConversation(text.slice(0, 76));
      const requestId = Crypto.randomUUID();
      const userMessage: CoachMessage = {
        id: requestId,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
        clientRequestId: requestId,
      };
      const answer = await sendCoachMessage(created.id, text, requestId);
      setConversationId(created.id);
      setSituation(text);
      setMessages([userMessage, answer]);
      setFeedback(answer.content);
      setLandingPrompt("");
      setStep("review");
      setLandingVisible(false);
      setConversations(await listCoachConversations());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === "POTENTIAL_PHI_DETECTED"
          ? "Remove names, dates, contact details, and other patient identifiers."
          : userFacingApiError(
              error,
              "Coach could not start the conversation. Your message is still here so you can try again.",
            );
      Alert.alert("Coach unavailable", message);
    } finally {
      setCoachReplying(false);
      setBusy(false);
    }
  }

  async function saveCommitment() {
    if (!feedback || !commitment.trim() || busy) return;
    setBusy(true);
    const savedCommitment = commitment.trim();
    try {
      // Cache + account sync first: the local mutation remains queued on a
      // weak connection, while the existing Coach memory stays in step online.
      if (user?.member?.id) await cacheCommitment(user.member.id, savedCommitment);
      await saveCoachMemory("commitment", savedCommitment);
      void trackProductOutcome("next_action_confirmation", { toolId: "spartan_coach", platform: "ios" });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Commitment saved",
        "It is private. Nothing is shared unless you explicitly share a summary or commitment.",
        [{ text: "Open Home", onPress: () => router.replace("/(tabs)") }],
      );
    } catch {
      Alert.alert(
        user?.member?.id ? "Commitment saved locally" : "Commitment not saved",
        user?.member?.id
          ? "It will sync to your account when you reconnect."
          : "Sign in to keep this commitment across devices.",
      );
    } finally {
      setBusy(false);
    }
  }

  function resetSession(showLanding = true) {
    setStep("prepare");
    setSituation("");
    setIntention("");
    setRehearsal("");
    setCommitment("");
    setFeedback(null);
    setMessages([]);
    setFollowUp("");
    setConversationId(null);
    setLandingVisible(showLanding);
  }

  async function openConversation(item: CoachConversation) {
    setHistoryOpen(false);
    setBusy(true);
    try {
      const loaded = await loadCoachConversation(item.id);
      const lastCoach = [...loaded.messages]
        .reverse()
        .find((message) => message.role === "assistant");
      const visibleMessages = loaded.messages.filter(
        (message) =>
          !(
            message.role === "user" &&
            message.content.startsWith("Coach this private hospice sales rehearsal.")
          ),
      );
      setConversationId(item.id);
      setCommitment("");
      setSituation(item.title);
      setFeedback(lastCoach?.content ?? null);
      setMessages(visibleMessages);
      setFollowUp("");
      setStep(lastCoach ? "review" : "rehearse");
      setLandingVisible(false);
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

  // ── Auth / loading states ──────────────────────────────────────────────────

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !canUseElite) {
    return <CoachEliteGate isAuthenticated={isAuthenticated} />;
  }

  // ── Landing / home screen ──────────────────────────────────────────────────

  if (landingVisible) {
    return (
      <SafeAreaView
        style={styles.safe}
        edges={["top"]}
        testID="screen-elite-coach-home"
      >
        <ScrollView
          contentContainerStyle={styles.coachHomeContent}
          showsVerticalScrollIndicator={false}
        >
          <SpartanHeader title="Coach" />
          <HelmetMark size={52} />
          <View style={styles.coachHomeBadge}>
            <Text style={styles.coachHomeBadgeText}>ELITE · PRIVATE</Text>
          </View>
          <Text style={styles.coachHomeTitle}>
            Practice the conversation before it matters.
          </Text>
          <Text style={styles.coachHomeBody}>
            Spartan Coach listens for the concern beneath the words, asks when
            context is missing, and helps you leave with one commitment.
          </Text>

          <View
            style={styles.coachComposer}
            testID="coach-direct-conversation"
          >
            <Text style={styles.coachComposerKicker}>START HERE</Text>
            <Text style={styles.coachComposerTitle}>What are you preparing for?</Text>
            <Text style={styles.coachHomeBody}>What is on your mind?</Text>
            <TextInput
              value={landingPrompt}
              onChangeText={setLandingPrompt}
              placeholder="Tell Coach what happened, what feels difficult, or what you want to practice"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={4000}
              textAlignVertical="top"
              style={styles.coachLandingInput}
              accessibilityLabel="Start a private Coach conversation"
            />
            <Pressable
              disabled={!landingPrompt.trim() || busy}
              onPress={() => void startDirectConversation()}
              style={[
                styles.landingSendButton,
                (!landingPrompt.trim() || busy) && styles.disabled,
              ]}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.landingSendText}>Talk with Coach</Text>
                  <Feather name="arrow-up" size={19} color="#FFFFFF" />
                </>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLandingVisible(false);
                setStep("prepare");
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.guidedRehearsalButton}
              testID="coach-begin-preparation"
            >
              <Feather name="mic" size={18} color={colors.primary} />
              <Text style={styles.guidedRehearsalText}>
                Use guided voice rehearsal
              </Text>
              <Feather name="chevron-right" size={18} color={colors.primary} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              conversations.length
                ? setHistoryOpen(true)
                : setLandingVisible(false)
            }
            style={({ pressed }) => [
              styles.resumeCard,
              pressed && styles.rowPressed,
            ]}
            testID="coach-resume-private-conversation"
          >
            <Feather
              name={conversations.length ? "clock" : "message-circle"}
              size={21}
              color={colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeTitle}>
                {conversations.length
                  ? "Resume a private conversation"
                  : "Start your first private conversation"}
              </Text>
              <Text style={styles.resumeBody}>
                {conversations.length
                  ? `${conversations.length} private ${
                      conversations.length === 1
                        ? "conversation"
                        : "conversations"
                    } available`
                  : "Begin with the professional situation and the outcome you want."}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>

          <View style={styles.coachPrivacyCard}>
            <Feather name="shield" size={22} color={colors.foreground} />
            <View style={{ flex: 1 }}>
              <Text style={styles.coachPrivacyTitle}>
                Your privacy is protected
              </Text>
              <Text style={styles.coachPrivacyBody}>
                Raw Coach conversations stay private and expire after 90 days.
                Nothing is shared unless you explicitly share a summary or
                commitment.
              </Text>
            </View>
          </View>
        </ScrollView>

        <HistorySheet
          visible={historyOpen}
          conversations={conversations}
          onClose={() => setHistoryOpen(false)}
          onOpen={openConversation}
          onDelete={confirmDelete}
          styles={styles}
          colors={colors}
        />
      </SafeAreaView>
    );
  }

  // ── Main guided session ────────────────────────────────────────────────────

  return (
    <CoachShell
      firstName={firstName}
      step={step}
      coachScrollRef={coachScroll}
      onStepChange={setStep}
      onHistoryOpen={() => setHistoryOpen(true)}
      onSettingsOpen={() => setSettingsOpen(true)}
      modals={
        <>
          <HistorySheet
            visible={historyOpen}
            conversations={conversations}
            onClose={() => setHistoryOpen(false)}
            onOpen={openConversation}
            onDelete={confirmDelete}
            styles={styles}
            colors={colors}
          />
          <CoachSettingsPanel
            visible={settingsOpen}
            preference={preference}
            appearance={appearance.preference}
            initials={initials}
            onClose={() => setSettingsOpen(false)}
            onPreference={updatePreference}
            onAppearance={appearance.setPreference}
          />
        </>
      }
    >
      {/* ── Prepare step ── */}
      {step === "prepare" ? (
        <View style={styles.section}>
          <Text style={styles.sectionNumber}>01</Text>
          <Text style={styles.sectionTitle}>Brief the Coach</Text>
          <Text style={styles.sectionBody}>
            Describe the professional situation without patient names, dates,
            contact details, or identifying facts.
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

      {/* ── Rehearse step ── */}
      {step === "rehearse" ? (
        <View style={styles.section}>
          <Text style={styles.sectionNumber}>02</Text>
          <Text style={styles.sectionTitle}>Say it out loud</Text>
          <Text style={styles.sectionBody}>
            Practice the exact words you want to use. Coach evaluates clarity,
            empathy, and the strength of your next step.
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
              Audio is used for transcription. The transcript is sent only when
              you request Coach feedback.
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
                <Text style={styles.primaryButtonText}>
                  Get private feedback
                </Text>
                <Feather name="arrow-up-right" size={19} color="#FFFFFF" />
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => setStep("prepare")}
            style={styles.textButton}
          >
            <Feather name="arrow-left" size={17} color={colors.mutedForeground} />
            <Text style={styles.textButtonLabel}>Edit briefing</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── Review step ── */}
      {step === "review" ? (
        <View style={styles.section}>
          <Text style={styles.sectionNumber}>03</Text>
          <Text style={styles.sectionTitle}>
            Keep the conversation going
          </Text>
          <Text style={styles.sectionBody}>
            Private coaching conversation. Only visible to you. Ask Coach anything about this conversation,
            challenge the advice, or practice another version.
            Continue without patient names, dates, or identifying details.
          </Text>

          <CoachMessageThread
            messages={messages}
            feedback={feedback}
            coachReplying={coachReplying}
            onReturnToRehearsal={() => setStep("rehearse")}
          />

          {feedback ? (
            <View accessibilityLabel="Send message to Coach" accessibilityHint="Make this sound more natural. What should I ask next?">
              <CoachInputBar
                followUp={followUp}
                busy={busy}
                followUpInputRef={followUpInput}
                onFollowUpChange={setFollowUp}
                onSendFollowUp={() => void sendFollowUp()}
                onPromptSelect={(prompt) => {
                  setFollowUp(prompt);
                  requestAnimationFrame(() => followUpInput.current?.focus());
                }}
              />
            </View>
          ) : null}

          <View style={styles.commitmentDivider} />
          <Text style={styles.commitmentTitle}>
            Turn the conversation into action
          </Text>
          <Text style={styles.commitmentBody}>
            When you are ready, choose the one move you will make next.
          </Text>
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
          <Pressable
            onPress={() => resetSession(false)}
            style={styles.secondaryButton}
          >
            <Feather name="plus" size={18} color={colors.foreground} />
            <Text style={styles.secondaryButtonText}>
              Start a new rehearsal
            </Text>
          </Pressable>
        </View>
      ) : null}
    </CoachShell>
  );
}

// ── Local helper components ────────────────────────────────────────────────

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
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
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
              <Feather
                name="message-circle"
                size={28}
                color={colors.mutedForeground}
              />
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
                  <Feather
                    name="trash-2"
                    size={17}
                    color={colors.destructive}
                  />
                </Pressable>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

function formatDuration(milliseconds = 0) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
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
    commitmentDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginTop: 24,
      marginBottom: 18,
    },
    commitmentTitle: {
      color: colors.foreground,
      fontSize: 18,
      lineHeight: 23,
      ...font("bold"),
    },
    commitmentBody: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
      marginBottom: 14,
      ...font("regular"),
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
    coachHomeContent: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 44,
    },
    coachHomeBadge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 12,
    },
    coachHomeBadgeText: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 0.8,
      ...font("bold"),
    },
    coachHomeTitle: {
      color: colors.foreground,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.9,
      marginTop: 24,
      maxWidth: 390,
      ...font("heavy"),
    },
    coachHomeBody: {
      color: colors.mutedForeground,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      maxWidth: 390,
      ...font("regular"),
    },
    coachComposer: {
      minHeight: 290,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 26,
      borderCurve: "continuous",
      backgroundColor: colors.card,
      padding: 20,
      marginTop: 34,
    },
    coachComposerKicker: {
      color: colors.primary,
      fontSize: 9,
      letterSpacing: 1.7,
      ...font("bold"),
    },
    coachComposerTitle: {
      color: colors.foreground,
      fontSize: 21,
      marginTop: 6,
      ...font("heavy"),
    },
    coachLandingInput: {
      minHeight: 112,
      maxHeight: 180,
      color: colors.foreground,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 17,
      borderCurve: "continuous",
      padding: 15,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 14,
      ...font("regular"),
    },
    landingSendButton: {
      minHeight: 52,
      borderRadius: 16,
      borderCurve: "continuous",
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      marginTop: 12,
    },
    landingSendText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    guidedRehearsalButton: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 10,
      paddingHorizontal: 4,
    },
    guidedRehearsalText: {
      flex: 1,
      color: colors.primary,
      fontSize: 13,
      ...font("bold"),
    },
    resumeCard: {
      minHeight: 104,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 20,
      backgroundColor: colors.card,
      padding: 16,
      marginTop: 20,
    },
    resumeTitle: { color: colors.foreground, fontSize: 17, ...font("bold") },
    resumeBody: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 5,
      ...font("regular"),
    },
    coachPrivacyCard: {
      minHeight: 144,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 24,
      borderCurve: "continuous",
      backgroundColor: colors.secondary,
      padding: 20,
      marginTop: 24,
    },
    coachPrivacyTitle: {
      color: colors.foreground,
      fontSize: 17,
      ...font("bold"),
    },
    coachPrivacyBody: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 8,
      ...font("regular"),
    },
    rowPressed: { opacity: 0.68 },
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
  });
}
