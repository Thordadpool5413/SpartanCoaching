import * as Crypto from "expo-crypto";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
} from "react-native";
import { ApiError } from "@/lib/api";
import {
  createCoachConversation,
  deleteCoachConversation,
  getCoachPreferences,
  listCoachConversations,
  loadCoachConversation,
  saveCoachPreferences,
  sendCoachMessage,
  type CoachConversation,
  type CoachMessage,
  type CoachPreference,
} from "@/lib/coachApi";
import { useColors } from "@/hooks/useColors";

const STARTERS = [
  "Who should I prioritize today?",
  "Help me prepare for a difficult referral source.",
  "Give me a stronger way to ask for the next step.",
];

export default function CoachScreen() {
  const colors = useColors();
  const listRef = useRef<FlatList<CoachMessage>>(null);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preference, setPreference] = useState<CoachPreference>({ memoryEnabled: false, responseStyle: "balanced" });

  useEffect(() => {
    void Promise.all([listCoachConversations(), getCoachPreferences()]).then(([items, prefs]) => {
      setConversations(items);
      setPreference(prefs);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages]);

  async function openConversation(item: CoachConversation) {
    setHistoryOpen(false);
    setBusy(true);
    try {
      const loaded = await loadCoachConversation(item.id);
      setConversationId(item.id);
      setMessages(loaded.messages);
    } finally { setBusy(false); }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setHistoryOpen(false);
  }

  async function submit(value = draft) {
    const text = value.trim();
    if (!text || busy) return;
    const requestId = Crypto.randomUUID();
    const optimistic: CoachMessage = { id: `local-${requestId}`, clientRequestId: requestId, role: "user", content: text, createdAt: new Date().toISOString() };
    setDraft("");
    setMessages((current) => [...current, optimistic]);
    setBusy(true);
    try {
      let id = conversationId;
      if (!id) {
        const created = await createCoachConversation();
        id = created.id;
        setConversationId(id);
        setConversations((current) => [created, ...current]);
      }
      const answer = await sendCoachMessage(id, text, requestId);
      setMessages((current) => [...current, answer]);
      const refreshed = await listCoachConversations();
      setConversations(refreshed);
    } catch (error) {
      setDraft(text);
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      const message = error instanceof ApiError && error.code === "POTENTIAL_PHI_DETECTED"
        ? "Remove patient names, phone numbers, dates of birth, MRNs, and addresses before sending."
        : error instanceof ApiError && error.status === 401
          ? "Your session expired. Sign in again, then your draft will still be here."
          : "Spartan Coach could not answer. Your draft has been restored.";
      Alert.alert("Message not sent", message);
    } finally { setBusy(false); }
  }

  async function updatePreference(next: CoachPreference) {
    setPreference(next);
    try { setPreference(await saveCoachPreferences(next)); }
    catch { Alert.alert("Settings not saved", "Try again in a moment."); }
  }

  async function removeConversation(item: CoachConversation) {
    await deleteCoachConversation(item.id);
    setConversations((current) => current.filter((entry) => entry.id !== item.id));
    if (conversationId === item.id) newConversation();
  }

  const styles = makeStyles(colors);
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={6}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Conversation history" onPress={() => setHistoryOpen(true)} style={styles.iconButton}><Feather name="menu" size={21} color={colors.foreground} /></Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>SPARTAN COACH</Text>
            <Text style={styles.private}>Private to you</Text>
          </View>
          <Pressable accessibilityLabel="Coach settings" onPress={() => setSettingsOpen(true)} style={styles.iconButton}><Feather name="sliders" size={20} color={colors.foreground} /></Pressable>
        </View>

        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.empty} keyboardShouldPersistTaps="handled">
            <View style={styles.mark}><Feather name="compass" size={32} color="#fff" /></View>
            <Text style={styles.hero}>Know who to call.{"\n"}Know what to say.{"\n"}Know what comes next.</Text>
            <Text style={styles.subhead}>Direct sales coaching built around Discipline, Empathy, and Strategy.</Text>
            <View style={styles.starters}>
              {STARTERS.map((starter) => <Pressable key={starter} onPress={() => void submit(starter)} style={styles.starter}><Text style={styles.starterText}>{starter}</Text><Feather name="arrow-up-right" size={17} color={colors.primary} /></Pressable>)}
            </View>
            <Text style={styles.safety}>Do not enter patient names or other identifying information.</Text>
          </ScrollView>
        ) : (
          <FlatList ref={listRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={styles.messages} renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.coachBubble]}>
              {item.role === "assistant" && <Text style={styles.bubbleLabel}>COACH</Text>}
              <Text style={[styles.messageText, item.role === "user" && styles.userText]}>{item.content}</Text>
            </View>
          )} />
        )}

        <View style={styles.composer}>
          <TextInput accessibilityLabel="Message Spartan Coach" value={draft} onChangeText={setDraft} placeholder="Ask Spartan Coach…" placeholderTextColor={colors.mutedForeground} multiline maxLength={4000} style={styles.input} />
          <Pressable accessibilityLabel="Send" disabled={!draft.trim() || busy} onPress={() => void submit()} style={[styles.send, (!draft.trim() || busy) && styles.sendDisabled]}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="arrow-up" size={20} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={historyOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHistoryOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Conversations</Text><Pressable onPress={() => setHistoryOpen(false)}><Text style={styles.done}>Done</Text></Pressable></View>
          <Pressable onPress={newConversation} style={styles.newButton}><Feather name="plus" size={19} color="#fff" /><Text style={styles.newText}>New conversation</Text></Pressable>
          <FlatList data={conversations} keyExtractor={(item) => item.id} contentContainerStyle={styles.historyList} ListEmptyComponent={<Text style={styles.emptyHistory}>Your private conversation history will appear here.</Text>} renderItem={({ item }) => (
            <Pressable onPress={() => void openConversation(item)} style={styles.historyRow}>
              <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.historyTitle}>{item.title}</Text><Text style={styles.historyDate}>{new Date(item.updatedAt).toLocaleDateString()}</Text></View>
              <Pressable accessibilityLabel={`Delete ${item.title}`} onPress={() => void removeConversation(item)} hitSlop={12}><Feather name="trash-2" size={18} color={colors.mutedForeground} /></Pressable>
            </Pressable>
          )} />
        </SafeAreaView>
      </Modal>

      <Modal visible={settingsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Coach settings</Text><Pressable onPress={() => setSettingsOpen(false)}><Text style={styles.done}>Done</Text></Pressable></View>
          <View style={styles.settingCard}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Personal memory</Text><Text style={styles.settingBody}>Off by default. When enabled, Coach can use memory items you choose to save.</Text></View><Switch value={preference.memoryEnabled} onValueChange={(memoryEnabled) => void updatePreference({ ...preference, memoryEnabled })} /></View>
          <Text style={styles.sectionLabel}>RESPONSE STYLE</Text>
          {(["concise", "balanced", "detailed"] as const).map((responseStyle) => <Pressable key={responseStyle} onPress={() => void updatePreference({ ...preference, responseStyle })} style={styles.option}><Text style={styles.optionText}>{responseStyle[0].toUpperCase() + responseStyle.slice(1)}</Text>{preference.responseStyle === responseStyle && <Feather name="check" size={20} color={colors.primary} />}</Pressable>)}
          <Text style={styles.privacyNote}>Your raw conversations remain private. Nothing is shared with a manager unless you explicitly share a summary and commitments.</Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { height: 66, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
    titleBlock: { flex: 1, alignItems: "center" }, eyebrow: { color: colors.foreground, fontSize: 14, fontWeight: "900", letterSpacing: 1.8 }, private: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
    empty: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 28 }, mark: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 26 },
    hero: { color: colors.foreground, fontSize: 34, lineHeight: 40, fontWeight: "900", letterSpacing: -1.1 }, subhead: { color: colors.mutedForeground, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 360 },
    starters: { gap: 10, marginTop: 30 }, starter: { minHeight: 58, borderRadius: 18, paddingHorizontal: 17, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", gap: 12 }, starterText: { flex: 1, color: colors.foreground, fontSize: 15, fontWeight: "700", lineHeight: 21 }, safety: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 22 },
    messages: { padding: 16, paddingBottom: 22, gap: 14 }, bubble: { maxWidth: "88%", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 13 }, userBubble: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 6 }, coachBubble: { alignSelf: "flex-start", backgroundColor: colors.card, borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, bubbleLabel: { color: colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginBottom: 7 }, messageText: { color: colors.foreground, fontSize: 16, lineHeight: 24 }, userText: { color: "#fff" },
    composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 8 : 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background }, input: { flex: 1, maxHeight: 130, minHeight: 48, borderRadius: 24, paddingHorizontal: 17, paddingTop: 13, paddingBottom: 12, backgroundColor: colors.card, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }, send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }, sendDisabled: { opacity: 0.4 },
    modal: { flex: 1, backgroundColor: colors.background, padding: 18 }, modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, modalTitle: { color: colors.foreground, fontSize: 28, fontWeight: "900" }, done: { color: colors.primary, fontSize: 16, fontWeight: "800" }, newButton: { height: 52, borderRadius: 16, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }, newText: { color: "#fff", fontWeight: "800", fontSize: 16 }, historyList: { gap: 8 }, historyRow: { minHeight: 66, borderRadius: 16, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }, historyTitle: { color: colors.foreground, fontWeight: "700", fontSize: 15 }, historyDate: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 }, emptyHistory: { color: colors.mutedForeground, textAlign: "center", marginTop: 50, lineHeight: 21 },
    settingCard: { flexDirection: "row", gap: 16, alignItems: "center", padding: 18, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, settingTitle: { color: colors.foreground, fontWeight: "800", fontSize: 17 }, settingBody: { color: colors.mutedForeground, lineHeight: 19, marginTop: 5, fontSize: 13 }, sectionLabel: { color: colors.mutedForeground, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, marginTop: 28, marginBottom: 8 }, option: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, optionText: { color: colors.foreground, fontWeight: "700", fontSize: 16 }, privacyNote: { color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginTop: 28 },
  });
}
