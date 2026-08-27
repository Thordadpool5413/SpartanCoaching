import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { CitationsBlock, type CitationItem } from "@/components/ui/CitationsBlock";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import { MOBILE_FIELD_RESULT_ACTIONS } from "@workspace/field-kit-catalog";

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
      const text = data.text || "";
      setResult(text);
      setSources(data.sources || []);
      setCitations(data.spartanCitations || []);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        setError("No research result was created while you were offline. Reconnect and submit again; your input was not saved.");
      } else {
        setError(userFacingApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Grounded Research"
      subtitle="Territory and market questions with sources."
      category="Prepare"
      catalogToolId="research"
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
      <FieldResultPanel
        title="Research"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        nextAction={MOBILE_FIELD_RESULT_ACTIONS.research}
      >
        {result ? (
          <View style={{ paddingHorizontal: 22, gap: 12 }}>
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
        ) : null}
      </FieldResultPanel>
    </ToolShell>
  );
}
