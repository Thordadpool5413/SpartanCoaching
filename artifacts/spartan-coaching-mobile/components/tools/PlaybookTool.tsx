import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { ReminderPicker } from "@/components/ReminderPicker";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import { MOBILE_FIELD_RESULT_ACTIONS } from "@workspace/field-kit-catalog";

const TOOL_ID = "playbook";

export function PlaybookTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const [scenario, setScenario] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (scenario.trim().length < 10) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ playbook: string }>("/api/playbooks", {
        scenario,
        desiredOutcomes: desiredOutcomes || undefined,
      });
      setResult(data.playbook);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        setError("No playbook was created while you were offline. Reconnect and submit again; your input was not saved.");
      } else {
        setError(userFacingApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Playbook Generator"
      subtitle="Custom talking points and a clear next step for this visit."
      category="Prepare"
      catalogToolId="playbooks"
      whenToUse="Before an account visit when you need a specific approach, not a generic script."
      howSteps={["Describe the scenario (no PHI).", "Optional: desired outcomes.", "Generate and execute."]}
      ctaTitle={result ? "Create another playbook" : "Build playbook"}
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={scenario.trim().length < 10}
      testID="tool-playbook"
    >
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
        nextAction={MOBILE_FIELD_RESULT_ACTIONS.playbooks}
      />
      {!!result && (
        <>
          <ReminderPicker
            title="Execute your playbook"
            body="Your playbook is ready. Set a reminder to put it into action."
            storageKey="playbook"
          />
        </>
      )}
    </ToolShell>
  );
}
