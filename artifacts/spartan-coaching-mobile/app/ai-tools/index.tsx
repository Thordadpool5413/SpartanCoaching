import { Feather } from "@expo/vector-icons";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function AiToolsIndex() {
  const colors = useColors();
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
      <View style={styles.grid}>
        {SPARTAN_AI_TOOLS.map((tool) => (
          <Pressable
            key={tool.id}
            accessibilityRole="button"
            onPress={() => router.push(tool.mobilePath as never)}
            style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.category, { color: colors.primary }]}>{tool.category}</Text>
              {tool.containsPhi && <Feather name="shield" size={16} color="#D97706" />}
            </View>
            <Text style={[styles.name, { color: colors.foreground }]}>{tool.name}</Text>
            <Text style={[styles.summary, { color: colors.mutedForeground }]}>{tool.description}</Text>
            <View style={styles.openRow}>
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Open tool</Text>
              <Feather name="arrow-right" size={17} color={colors.primary} />
            </View>
          </Pressable>
        ))}
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
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 9 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  category: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter_700Bold" },
  name: { fontSize: 19, fontFamily: "Inter_700Bold" },
  summary: { fontSize: 14, lineHeight: 21 },
  openRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
});
