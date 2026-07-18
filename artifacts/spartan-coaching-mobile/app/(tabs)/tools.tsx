import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";

type ToolTab = "objection" | "playbook" | "email";

const TOOL_TABS: { key: ToolTab; label: string; icon: "shield" | "book-open" | "mail" }[] = [
  { key: "objection", label: "Objections", icon: "shield" },
  { key: "playbook", label: "Playbooks", icon: "book-open" },
  { key: "email", label: "Email", icon: "mail" },
];

const EMAIL_TYPES = [
  { value: "follow_up", label: "Follow-Up" },
  { value: "thank_you", label: "Thank You" },
  { value: "value_add", label: "Value Add" },
];

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ToolTab>("objection");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  // Objection Handler state
  const [objection, setObjection] = useState("");
  const [objectionResult, setObjectionResult] = useState("");
  const [objectionLoading, setObjectionLoading] = useState(false);
  const [objectionError, setObjectionError] = useState<string | null>(null);

  // Playbook state
  const [scenario, setScenario] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [playbookResult, setPlaybookResult] = useState("");
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);

  // Email Template state
  const [emailType, setEmailType] = useState<"follow_up" | "thank_you" | "value_add">("follow_up");
  const [recipientName, setRecipientName] = useState("");
  const [emailContext, setEmailContext] = useState("");
  const [emailResult, setEmailResult] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleObjection = async () => {
    if (objection.trim().length < 5) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setObjectionLoading(true);
    setObjectionResult("");
    setObjectionError(null);
    try {
      const data = await apiPost<{ response: string }>("/api/objections", { objection });
      setObjectionResult(data.response);
    } catch {
      setObjectionError("Something went wrong. Please try again.");
    } finally {
      setObjectionLoading(false);
    }
  };

  const handlePlaybook = async () => {
    if (scenario.trim().length < 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaybookLoading(true);
    setPlaybookResult("");
    setPlaybookError(null);
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

  const handleEmail = async () => {
    if (emailContext.trim().length < 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailLoading(true);
    setEmailResult("");
    setEmailError(null);
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          AI Tools
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Powered by hospice expertise
        </Text>
      </View>

      {/* Tab bar */}
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
              size={16}
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
          </View>
        )}
      </View>
    </ScrollView>
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
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {},
  tabLabel: { fontSize: 14 },
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
