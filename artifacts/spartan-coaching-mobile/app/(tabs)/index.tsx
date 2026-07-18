import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";

const SUGGESTIONS = [
  "What are hospice eligibility criteria for heart failure?",
  "How do I handle the 'not ready' objection?",
  "What is the Medicare hospice benefit?",
  "Best strategies for building physician referrals?",
];

const QUICK_TOOLS = [
  { label: "Objection Handler", icon: "shield" as const, tab: "tools", color: "#e8291e" },
  { label: "Sales Playbooks", icon: "book-open" as const, tab: "tools", color: "#e8291e" },
  { label: "Email Templates", icon: "mail" as const, tab: "tools", color: "#e8291e" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={["#080808", "#0f0f0f", "#1a0404"]}
        style={[styles.hero, { paddingTop: topPad + 20 }]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>Hospice Sales{"\n"}Coaching</Text>
        <Text style={styles.heroTagline}>
          The Authority in Hospice Excellence
        </Text>
        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeDot} />
          <Text style={styles.heroBadgeText}>2026 Programs Now Open</Text>
        </View>
      </LinearGradient>

      {/* Ask Spartan */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Feather name="zap" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ask Spartan
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
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
              <Feather name="arrow-right" size={16} color="#fff" />
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
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
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

      {/* Mission */}
      <View style={[styles.missionSection, { backgroundColor: "#080808" }]}>
        <Text style={styles.missionOverline}>The Real Problem</Text>
        <Text style={styles.missionTitle}>
          The Gap Is Not Clinical. It Is Conversational.
        </Text>
        <Text style={styles.missionBody}>
          Eligible patients are not receiving hospice care because the right conversations are not happening. Spartan Coaching exists to close that gap, one prepared visit at a time.
        </Text>
        <Pressable
          onPress={() => router.push("/contact")}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.ctaBtnText}>Get in Touch</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
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
    color: "#e8291e",
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 44,
    fontFamily: "Inter_700Bold",
  },
  heroTagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    letterSpacing: 0.5,
    fontFamily: "Inter_400Regular",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 20,
  },
  heroBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#86efac",
    fontFamily: "Inter_600SemiBold",
  },
  section: { paddingHorizontal: 20, paddingVertical: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 14, marginBottom: 16, fontFamily: "Inter_400Regular" },
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
  missionSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  missionOverline: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ed3b31",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    fontFamily: "Inter_700Bold",
  },
  missionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 16,
    lineHeight: 30,
    fontFamily: "Inter_700Bold",
  },
  missionBody: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 23,
    marginBottom: 24,
    fontFamily: "Inter_400Regular",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e8291e",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});
