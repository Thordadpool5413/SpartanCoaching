import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { useSavedResponses } from "@/hooks/useSavedResponses";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { ReminderPicker } from "@/components/ReminderPicker";
import { SavedResponsesSection } from "@/components/SavedResponsesSection";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import {
  loadToolDraft,
  loadToolLastResult,
  saveToolDraft,
  saveToolLastResult,
} from "@/lib/toolDraftCache";

const TOOL_ID = "playbook";

export function PlaybookTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const saved = useSavedResponses("playbook");
  const [scenario, setScenario] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    void (async () => {
      const draft = await loadToolDraft<{ scenario?: string; desiredOutcomes?: string }>(TOOL_ID);
      if (draft?.scenario) setScenario(draft.scenario);
      if (draft?.desiredOutcomes) setDesiredOutcomes(draft.desiredOutcomes);
      const last = await loadToolLastResult(TOOL_ID);
      if (last) {
        setResult(last);
        setFromCache(true);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void saveToolDraft(TOOL_ID, { scenario, desiredOutcomes });
    }, 400);
    return () => clearTimeout(t);
  }, [scenario, desiredOutcomes]);

  const generate = async () => {
    if (scenario.trim().length < 10) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    setSavedId(null);
    setFromCache(false);
    try {
      const data = await apiPost<{ playbook: string }>("/api/playbooks", {
        scenario,
        desiredOutcomes: desiredOutcomes || undefined,
      });
      setResult(data.playbook);
      await saveToolLastResult(TOOL_ID, data.playbook);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Something went wrong. Showing last saved result if available.");
      const last = await loadToolLastResult(TOOL_ID);
      if (last) {
        setResult(last);
        setFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Playbook Generator"
      subtitle="Custom talking points and a clear next-step ask for this visit."
      category="Prepare"
      whenToUse="Before an account visit when you need a specific approach, not a generic script."
      howSteps={["Describe the scenario (no PHI).", "Optional: desired outcomes.", "Generate and execute."]}
      ctaTitle="Build playbook"
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={scenario.trim().length < 10}
      testID="tool-playbook"
    >
      {fromCache && result ? (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[{ color: colors.primary, fontSize: 12 }, font("semibold")]}>
            Showing last successful result (may be offline / cached)
          </Text>
        </View>
      ) : null}
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>
        Describe the sales scenario
      </Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. First meeting with a new oncologist skeptical about hospice timing..."
        placeholderTextColor={colors.mutedForeground}
        value={scenario}
        onChangeText={setScenario}
        multiline
        textAlignVertical="top"
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Desired outcomes (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. Build trust, schedule a facility tour"
        placeholderTextColor={colors.mutedForeground}
        value={desiredOutcomes}
        onChangeText={setDesiredOutcomes}
      />
      <FieldResultPanel
        title="Playbook"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        onSave={
          result
            ? async () => {
                const title = scenario.length > 60 ? scenario.slice(0, 57) + "…" : scenario;
                await saved.saveResponse(title, result);
                setSavedId("saved");
              }
            : undefined
        }
        saved={!!savedId}
      />
      {!!result && (
        <>
          <ReminderPicker
            title="Execute your playbook"
            body="Your playbook is ready — set a reminder to put it into action."
            storageKey="playbook"
          />
          <SavedResponsesSection items={saved.savedItems} onDelete={saved.deleteResponse} />
        </>
      )}
    </ToolShell>
  );
}
