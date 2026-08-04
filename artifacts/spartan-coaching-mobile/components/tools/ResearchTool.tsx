import React, { useState } from "react";
import { Share, Text, TextInput, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { CitationsBlock, type CitationItem } from "@/components/ui/CitationsBlock";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";

export function ResearchTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (query.trim().length < 5) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{
        text: string;
        sources?: Array<{ title: string; uri: string }>;
        spartanCitations?: CitationItem[];
      }>("/api/research", { query, useGrounding: true });
      setResult(data.text || "");
      setSources(data.sources || []);
      setCitations(data.spartanCitations || []);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Grounded Research"
      subtitle="Territory and market questions with sources."
      category="Prepare"
      ctaTitle="Research"
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={query.trim().length < 5}
      testID="tool-research"
    >
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>
        Territory or market question
      </Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. Latest Medicare hospice regulations on continuous care"
        placeholderTextColor={colors.mutedForeground}
        value={query}
        onChangeText={setQuery}
        multiline
        textAlignVertical="top"
      />
      {!!error && (
        <Text style={[styles.errorText, { color: colors.primary }, font("regular")]}>{error}</Text>
      )}
      {!!result && (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultText, { color: colors.foreground }, font("regular")]}>{result}</Text>
          <CitationsBlock items={citations} title="Spartan Method grounding" />
          {sources.length > 0 && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("semibold")]}>
                Web sources
              </Text>
              {sources.slice(0, 5).map((s, i) => (
                <Text key={i} style={[{ color: colors.primary, fontSize: 12 }, font("regular")]}>
                  • {s.title}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      {!!result && (
        <Pressable
          onPress={() => void Share.share({ message: result })}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 10,
            paddingVertical: 11,
            marginTop: 12,
            minHeight: 44,
          }}
        >
          <Feather name="share" size={15} color={colors.mutedForeground} />
          <Text style={[{ color: colors.mutedForeground, fontSize: 14 }, font("semibold")]}>Share</Text>
        </Pressable>
      )}
    </ToolShell>
  );
}
