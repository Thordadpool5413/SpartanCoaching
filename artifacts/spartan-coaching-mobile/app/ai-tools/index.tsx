import { Feather } from "@expo/vector-icons";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
      setError(
        "Your authorized tool catalog could not be loaded. Tools remain locked.",
      );
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
  const fieldFacing = authorizedTools.filter((t) => !t.containsPhi);
  const clinical = authorizedTools.filter((t) => t.containsPhi);

  const renderCard = (
    tool: (typeof SPARTAN_AI_TOOLS)[number],
    vault: boolean,
  ) => {
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
            borderColor: vault ? "#D9770655" : colors.border,
            backgroundColor: colors.card,
            opacity: enabled ? 1 : 0.65,
            borderLeftWidth: 3,
            borderLeftColor: vault
              ? "#D97706"
              : tool.category === "Sales"
                ? colors.primary
                : tool.category === "Content"
                  ? "#0EA5E9"
                  : tool.category === "Learning"
                    ? "#8B5CF6"
                    : colors.primary,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.category, { color: colors.primary }]}>
            {tool.category}
          </Text>
          {tool.containsPhi && (
            <View style={styles.vaultBadge}>
              <Feather name="shield" size={12} color="#B45309" />
              <Text style={styles.vaultBadgeText}>Vault</Text>
            </View>
          )}
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {tool.name}
        </Text>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>
          {tool.description}
        </Text>
        {enabled ? (
          <View style={styles.openRow}>
            <Text
              style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
            >
              Open tool
            </Text>
            <Feather name="arrow-right" size={17} color={colors.primary} />
          </View>
        ) : (
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Not enabled
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
          Field Kit
        </Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Advanced library
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Specialized Field AI plus a separate clinical vault. Daily tools stay on
        the Tools tab.
      </Text>
      {availability === null && (
        <View accessibilityRole="progressbar" style={styles.statusRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.mutedForeground }}>
            Loading authorized tools…
          </Text>
        </View>
      )}
      {!!error && (
        <View
          accessibilityRole="alert"
          style={[styles.errorCard, { borderColor: colors.destructive }]}
        >
          <Text style={{ color: colors.destructive }}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry tool catalog"
            onPress={() => void loadCatalog()}
          >
            <Text
              style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      {fieldFacing.length > 0 && (
        <View style={styles.section} testID="section-ai-field-tools">
          <View style={styles.sectionHead}>
            <Feather name="zap" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Field AI
            </Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Content, learning, and sales enablement — no PHI.
          </Text>
          <View style={styles.grid}>
            {fieldFacing.map((t) => renderCard(t, false))}
          </View>
        </View>
      )}

      {clinical.length > 0 && (
        <View style={styles.section} testID="section-ai-clinical-vault">
          <View
            style={[
              styles.vaultBanner,
              { borderColor: "#D9770655", backgroundColor: "#D9770614" },
            ]}
          >
            <Feather name="shield" size={20} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Clinical access vault
              </Text>
              <Text
                style={[styles.sectionDesc, { color: colors.mutedForeground, marginBottom: 0 }]}
              >
                Authorized roles only. Ephemeral runs. Not the consumer Field Kit
                no-PHI tools.
              </Text>
            </View>
          </View>
          <View style={styles.grid}>
            {clinical.map((t) => renderCard(t, true))}
          </View>
        </View>
      )}

      {availability !== null &&
        authorizedTools.length === 0 &&
        !error && (
          <View
            style={[
              styles.empty,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>
              No tools available yet
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 8,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              Your account may not have advanced library access. Open primary Field
              Kit tools instead.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/tools" as never)}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: "#fff", fontFamily: "Inter_700Bold" }}>
                Open Field Kit tools
              </Text>
            </Pressable>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 64, gap: 16 },
  back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 32, lineHeight: 38, fontFamily: "Inter_700Bold" },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 4 },
  grid: { gap: 12 },
  statusRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  section: { gap: 10, marginTop: 8 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionDesc: { fontSize: 14, lineHeight: 21, marginBottom: 4 },
  vaultBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 4,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 9 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_700Bold",
  },
  vaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D9770622",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vaultBadgeText: {
    color: "#B45309",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  name: { fontSize: 19, fontFamily: "Inter_700Bold" },
  summary: { fontSize: 14, lineHeight: 21 },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 12,
  },
  emptyBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
