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
import { font } from "@/lib/typography";
import { VAULT } from "@/lib/clinicalVaultTheme";
import {
  ClinicalVaultBadge,
  ClinicalVaultHubBanner,
} from "@/components/ClinicalVaultChrome";

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
            borderColor: vault ? VAULT.border : colors.border,
            backgroundColor: vault ? VAULT.surface : colors.card,
            opacity: enabled ? 1 : 0.65,
            borderLeftWidth: vault ? 3 : 3,
            borderLeftColor: vault
              ? VAULT.accent
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
          <Text
            style={[
              styles.category,
              { color: vault ? VAULT.accent : colors.primary },
              font("bold"),
            ]}
          >
            {tool.category}
          </Text>
          {tool.containsPhi ? <ClinicalVaultBadge /> : null}
        </View>
        <Text style={[styles.name, { color: colors.foreground }, font("bold")]}>
          {tool.name}
        </Text>
        <Text style={[styles.summary, { color: colors.mutedForeground }, font("regular")]}>
          {tool.description}
        </Text>
        {enabled ? (
          <View style={styles.openRow}>
            <Text
              style={[
                { color: vault ? VAULT.accent : colors.primary },
                font("semibold"),
              ]}
            >
              {vault ? "Open vault tool" : "Open tool"}
            </Text>
            <Feather
              name="arrow-right"
              size={17}
              color={vault ? VAULT.accent : colors.primary}
            />
          </View>
        ) : (
          <Text style={[{ color: colors.mutedForeground }, font("semibold")]}>
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
      <Pressable onPress={() => router.back()} style={styles.back} testID="advanced-back">
        <Feather name="arrow-left" size={18} color={colors.primary} />
        <Text style={[{ color: colors.primary }, font("semibold")]}>Tools</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }, font("bold")]}>
        Advanced library
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }, font("regular")]}>
        Advanced field tools for Elite members. Clinical guidance accepts deidentified information only and always requires human approval.
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          backgroundColor: colors.primaryMuted,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          marginBottom: 12,
        }}
      >
        <Feather name="shield" size={12} color={colors.primary} />
        <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 0.6 }, font("bold")]}>
          ELITE TOOLS · HUMAN APPROVAL REQUIRED
        </Text>
      </View>
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
            <Text style={[{ color: colors.primary }, font("semibold")]}>Retry</Text>
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
          <ClinicalVaultHubBanner />
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
            <Text style={[{ color: colors.foreground, fontSize: 16 }, font("bold")]}>
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
              <Text style={{ color: "#fff", ...font("bold") }}>
                Open Portal tools
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
  title: { fontSize: 32, lineHeight: 38, ...font("bold") },
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
  sectionTitle: { fontSize: 18, ...font("bold") },
  sectionDesc: { fontSize: 14, lineHeight: 21, marginBottom: 4 },
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
  },
  name: { fontSize: 19 },
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
