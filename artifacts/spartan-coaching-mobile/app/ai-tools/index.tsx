import { Feather } from "@expo/vector-icons";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";

export default function AiToolsIndex() {
  const colors = useColors();
  const [availability, setAvailability] = useState<Map<string, boolean> | null>(
    null,
  );
  const [error, setError] = useState("");
  const loadCatalog = useCallback(async () => {
    setError("");
    try {
      const response = await apiGet<{
        tools: Array<{ id: string; availability: { enabled: boolean } }>;
      }>("/api/ai-tools");
      setAvailability(
        new Map(
          response.tools.map((tool) => [tool.id, tool.availability.enabled]),
        ),
      );
    } catch {
      setAvailability(new Map());
      setError("Your authorized tool catalog could not be loaded. Tools remain locked.");
    }
  }, []);
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);
  const authorizedTools = useMemo(
    () =>
      availability
        ? SPARTAN_AI_TOOLS.filter((tool) => availability.has(tool.id))
        : [],
    [availability],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Field Kit</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>AI Tool Library</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Fourteen purpose-built tools with saved history, structured results, and protected clinical workflows.
      </Text>
      {availability === null && (
        <View accessibilityRole="progressbar" style={styles.statusRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.mutedForeground }}>Loading authorized tools…</Text>
        </View>
      )}
      {!!error && (
        <View accessibilityRole="alert" style={[styles.errorCard, { borderColor: colors.destructive }]}>
          <Text style={{ color: colors.destructive }}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry tool catalog"
            onPress={() => void loadCatalog()}
          >
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Retry</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.grid}>
        {authorizedTools.map((tool) => {
          const enabled = availability?.get(tool.id) === true;
          return (
          <Pressable
            key={tool.id}
            accessibilityRole="button"
            accessibilityLabel={`${tool.name}${enabled ? "" : ", not enabled"}`}
            accessibilityState={{ disabled: !enabled }}
            disabled={!enabled}
            onPress={() => router.push(tool.mobilePath as never)}
            style={[
              styles.card,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                opacity: enabled ? 1 : 0.65,
              },
            ]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.category, { color: colors.primary }]}>{tool.category}</Text>
              {tool.containsPhi && <Feather name="shield" size={16} color="#D97706" />}
            </View>
            <Text style={[styles.name, { color: colors.foreground }]}>{tool.name}</Text>
            <Text style={[styles.summary, { color: colors.mutedForeground }]}>{tool.description}</Text>
            {enabled ? (
              <View style={styles.openRow}>
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Open tool</Text>
                <Feather name="arrow-right" size={17} color={colors.primary} />
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>
                Not enabled
              </Text>
            )}
          </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 64, gap: 16 },
  back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 32, lineHeight: 38, fontFamily: "Inter_700Bold" },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
  grid: { gap: 12 },
  statusRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 9 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  category: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter_700Bold" },
  name: { fontSize: 19, fontFamily: "Inter_700Bold" },
  summary: { fontSize: 14, lineHeight: 21 },
  openRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
});
