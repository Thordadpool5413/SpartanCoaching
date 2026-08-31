import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { AI_REQUEST_TIMEOUT_MS, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import { MOBILE_FIELD_RESULT_ACTIONS } from "@workspace/field-kit-catalog";

export function ColdCallTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const [prospectType, setProspectType] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prospectType.trim() || situation.trim().length < 10) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ script?: string; text?: string; result?: string }>(
        "/api/cold-call-script",
        {
          prospectType,
          prospectName: prospectName || undefined,
          situation,
        },
        { retry: true, timeoutMs: AI_REQUEST_TIMEOUT_MS },
      );
      const text = data.script || data.text || data.result || "";
      if (!text) throw new Error("Empty script response");
      setResult(text);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        setError("No call script was created while you were offline. Reconnect and submit again; your input was not saved.");
      } else {
        setError(userFacingApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Cold Call Script"
      subtitle="Openers, objection handlers, and a clear next-step ask."
      category="Prepare"
      catalogToolId="cold-call"
      ctaTitle="Generate script"
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={!prospectType.trim() || situation.trim().length < 10}
      testID="tool-cold"
    >
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>Prospect type</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. SNF DON, hospitalist, home health agency"
        placeholderTextColor={colors.mutedForeground}
        value={prospectType}
        onChangeText={setProspectType}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Prospect name (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. Director Martinez"
        placeholderTextColor={colors.mutedForeground}
        value={prospectName}
        onChangeText={setProspectName}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Situation
      </Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="Why you are calling and what you know (no PHI)"
        placeholderTextColor={colors.mutedForeground}
        value={situation}
        onChangeText={setSituation}
        multiline
        textAlignVertical="top"
      />
      <FieldResultPanel
        title="Cold call script"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        nextAction={MOBILE_FIELD_RESULT_ACTIONS["cold-call"]}
      />
    </ToolShell>
  );
}
