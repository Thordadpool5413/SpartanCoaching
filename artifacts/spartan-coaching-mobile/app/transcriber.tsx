import { Feather } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { ApiError, transcribeAudio } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

function duration(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function TranscriberScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { canUseElite } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");

  const start = async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone access is off", "Allow microphone access in iPhone Settings to record a deidentified sales call reflection.");
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stop = async () => {
    if (!recorderState.isRecording) return;
    setBusy(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error("Recording file was not created");
      setTranscript(await transcribeAudio(recorder.uri));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Transcription unavailable",
        error instanceof ApiError ? error.message : "The recording could not be transcribed. Try again when you have a secure connection.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!canUseElite) {
    return (
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ELITE TOOL</Text>
        <Text style={styles.title}>Call Transcriber</Text>
        <Text style={styles.subtitle}>Capture a private, deidentified reflection and turn it into text for self coaching.</Text>
        <View style={styles.lockedCard}>
          <Feather name="mic" size={27} color={colors.primary} />
          <Text style={styles.cardTitle}>Voice transcription is included with Elite.</Text>
          <Text style={styles.cardBody}>Preview how it works, then compare Standard and Elite without creating an account first.</Text>
          <SpartanButton title="Compare Elite and subscribe" onPress={() => router.push("/membership" as any)} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>PRIVATE VOICE TOOL</Text>
      <Text style={styles.title}>Call Transcriber</Text>
      <Text style={styles.subtitle}>Record what you remember after a sales conversation. Never record a patient, caregiver, or clinical encounter.</Text>

      <View style={styles.safetyCard}>
        <Feather name="shield" size={18} color={colors.primary} />
        <Text style={styles.safetyText}>No patient names, dates, record numbers, contact details, recordings, or other PHI.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recorderState.isRecording ? "Stop recording and transcribe" : "Start recording"}
        onPress={() => void (recorderState.isRecording ? stop() : start())}
        disabled={busy}
        style={[styles.recorder, recorderState.isRecording && styles.recorderActive]}
      >
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Feather name={recorderState.isRecording ? "square" : "mic"} size={32} color="#FFFFFF" />}
        <Text style={styles.recorderTitle}>{busy ? "Transcribing securely" : recorderState.isRecording ? "Tap to stop" : "Record reflection"}</Text>
        <Text style={styles.recorderTime}>{duration(recorderState.durationMillis)}</Text>
      </Pressable>

      {transcript ? (
        <View style={styles.transcriptCard}>
          <View style={styles.transcriptHeader}>
            <View>
              <Text style={styles.transcriptLabel}>TRANSCRIPT</Text>
              <Text style={styles.cardTitle}>Your deidentified reflection</Text>
            </View>
            <Pressable onPress={() => void Clipboard.setStringAsync(transcript)} style={styles.iconButton} accessibilityLabel="Copy transcript">
              <Feather name="copy" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <Text selectable style={styles.transcript}>{transcript}</Text>
          <View style={styles.actions}>
            <SpartanButton title="Practice with Coach" onPress={() => router.push("/(tabs)/coach")} style={{ flex: 1 }} />
            <SpartanButton title="Delete" variant="outline" onPress={() => setTranscript("")} style={{ flex: 0.55 }} />
          </View>
          <Text style={styles.privateNote}>This transcript is held only on this screen unless you explicitly use it in Coach. Leaving or deleting clears it.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 14, paddingBottom: 42 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, ...font("bold") },
    title: { color: colors.foreground, fontSize: 34, lineHeight: 39, letterSpacing: -0.9, ...font("heavy") },
    subtitle: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, ...font("regular") },
    safetyCard: { flexDirection: "row", gap: 10, borderRadius: 16, backgroundColor: colors.primaryMuted, padding: 14 },
    safetyText: { color: colors.mutedForeground, flex: 1, fontSize: 12, lineHeight: 18, ...font("medium") },
    recorder: { minHeight: 210, borderRadius: 26, borderCurve: "continuous", backgroundColor: colors.heroBackground, alignItems: "center", justifyContent: "center", gap: 12, marginTop: 4 },
    recorderActive: { backgroundColor: colors.primary },
    recorderTitle: { color: "#FFFFFF", fontSize: 18, ...font("bold") },
    recorderTime: { color: colors.heroMuted, fontSize: 14, fontVariant: ["tabular-nums"], ...font("semibold") },
    transcriptCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 18, gap: 14 },
    transcriptHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    transcriptLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.6, ...font("bold") },
    transcript: { color: colors.foreground, fontSize: 15, lineHeight: 23, ...font("regular") },
    iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    actions: { flexDirection: "row", gap: 10 },
    privateNote: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, ...font("regular") },
    lockedCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card, padding: 20, gap: 10, marginTop: 10 },
    cardTitle: { color: colors.foreground, fontSize: 18, lineHeight: 23, ...font("bold") },
    cardBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 20, ...font("regular") },
  });
}
