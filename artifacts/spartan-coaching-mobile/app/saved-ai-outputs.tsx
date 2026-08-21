import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SPARTAN_AI_TOOLS,
  getAiToolExperience,
  type SpartanAiToolId,
} from "@workspace/spartan-ai-tools";
import { PremiumAiResult } from "@/components/PremiumAiResult";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";
import { font } from "@/lib/typography";
import { goBackOrReplace } from "@/lib/navigation";

type SavedRun = {
  id: string;
  toolId: SpartanAiToolId;
  status?: string;
  reviewStatus?: string;
  output?: unknown;
  createdAt: string;
  watermark?: string;
};

export default function SavedAiOutputsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const tools = SPARTAN_AI_TOOLS.filter((tool) => !tool.containsPhi);
      const responses = await Promise.all(
        tools.map(async (tool) => {
          const response = await apiGet<{ runs: SavedRun[] }>(
            `/api/ai-tools/${tool.id}/runs`,
          );
          return (response.runs ?? []).map((run) => ({ ...run, toolId: tool.id }));
        }),
      );
      setRuns(
        responses
          .flat()
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saved work could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRuns();
    }, [loadRuns]),
  );

  const visibleRuns = runs.filter((run) => {
    const tool = SPARTAN_AI_TOOLS.find((item) => item.id === run.toolId);
    const title = tool ? getAiToolExperience(tool.id).title ?? tool.name : run.toolId;
    return title.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48, paddingHorizontal: 20, gap: 18 }}
    >
      <Pressable accessibilityRole="button" onPress={() => goBackOrReplace("/(tabs)/my-work")} style={styles.back}>
        <Feather name="arrow-left" size={18} color={colors.primary} />
        <Text style={styles.backText}>My Work</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.kicker}>SAVED OUTPUTS</Text>
        <Text style={styles.title}>Your work, ready when you are.</Text>
        <Text style={styles.body}>Review completed work, reopen the tool, or continue from the result without rebuilding your thinking.</Text>
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          accessibilityLabel="Search saved outputs"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by tool"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View accessibilityRole="progressbar" style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateTitle}>Loading your saved work</Text>
        </View>
      ) : error ? (
        <View accessibilityRole="alert" style={styles.stateCard}>
          <Feather name="alert-circle" size={22} color={colors.destructive} />
          <Text style={styles.stateTitle}>Saved work is unavailable</Text>
          <Text style={styles.stateBody}>{error}</Text>
          <Pressable onPress={() => void loadRuns()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : visibleRuns.length === 0 ? (
        <View style={styles.stateCard}>
          <Feather name="folder" size={22} color={colors.primary} />
          <Text style={styles.stateTitle}>{query ? "No matching saved work" : "Your first saved output starts here"}</Text>
          <Text style={styles.stateBody}>{query ? "Try another tool name." : "Complete any advanced nonclinical tool and the result will appear here automatically."}</Text>
          {!query ? (
            <Pressable onPress={() => router.push("/ai-tools" as never)} style={styles.retryButton}>
              <Text style={styles.retryText}>Open tools</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        visibleRuns.map((run) => {
          const tool = SPARTAN_AI_TOOLS.find((item) => item.id === run.toolId)!;
          const experience = getAiToolExperience(tool.id);
          const expanded = expandedId === run.id;
          return (
            <View key={run.id} style={styles.runCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedId(expanded ? null : run.id)}
                style={styles.runHeader}
              >
                <View style={styles.runIcon}>
                  <Feather name="file-text" size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.runTitle}>{experience.title ?? tool.name}</Text>
                  <Text style={styles.runMeta}>{new Date(run.createdAt).toLocaleString()} · {run.status ?? "completed"}</Text>
                </View>
                <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
              </Pressable>
              {expanded ? (
                <View style={styles.runDetail}>
                  <PremiumAiResult output={run.output} watermark={run.watermark} reviewStatus={run.reviewStatus} />
                  <Pressable onPress={() => router.push(tool.mobilePath as never)} style={styles.continueButton}>
                    <Text style={styles.continueText}>Open {experience.title ?? tool.name}</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
    backText: { color: colors.primary, fontSize: 14, ...font("bold") },
    hero: { gap: 8 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, ...font("bold") },
    title: { color: colors.foreground, fontSize: 34, lineHeight: 40, letterSpacing: -1, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, ...font("regular") },
    searchRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 17, borderCurve: "continuous", backgroundColor: colors.card, paddingHorizontal: 15 },
    searchInput: { flex: 1, color: colors.foreground, fontSize: 15, ...font("regular") },
    stateCard: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 22, borderCurve: "continuous", backgroundColor: colors.card, padding: 24 },
    stateTitle: { color: colors.foreground, fontSize: 17, textAlign: "center", ...font("heavy") },
    stateBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, textAlign: "center", ...font("regular") },
    retryButton: { minHeight: 44, justifyContent: "center", borderRadius: 14, backgroundColor: colors.primaryMuted, paddingHorizontal: 18 },
    retryText: { color: colors.primary, fontSize: 13, ...font("bold") },
    runCard: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.card, overflow: "hidden" },
    runHeader: { minHeight: 86, flexDirection: "row", alignItems: "center", gap: 12, padding: 15 },
    runIcon: { width: 42, height: 42, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    runTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    runMeta: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4, ...font("regular") },
    runDetail: { gap: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, padding: 14 },
    continueButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, borderCurve: "continuous", backgroundColor: colors.primary, paddingHorizontal: 16 },
    continueText: { color: "#FFFFFF", fontSize: 14, ...font("bold") },
  });
}
