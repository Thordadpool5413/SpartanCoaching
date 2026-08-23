import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import { ToolAnatomyRelated } from "@/components/ToolAnatomy";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import {
  getToolById,
  MOBILE_FIELD_RESULT_ACTIONS,
  recommendRelated,
  relatedToAnatomyItems,
} from "@workspace/field-kit-catalog";

export function WeeklyTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const [accounts, setAccounts] = useState("");
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState("");
  const [challenges, setChallenges] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const relatedItems = relatedToAnatomyItems(
    recommendRelated(
      "weekly-plan",
      {
        platform: "ios",
        canUseFieldKit: !!canUseFieldKit,
        contextTags: ["territory", "week", "plan"],
        limit: 4,
      },
      getToolById,
    ),
  );

  const generate = async () => {
    if (accounts.trim().length < 10 || !goal.trim()) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ plan?: string; text?: string; result?: string }>(
        "/api/weekly-plan-builder",
        {
          accounts,
          weeklyGoal: goal,
          territoryFocus: focus || undefined,
          challenges: challenges || undefined,
        },
      );
      const text = data.plan || data.text || data.result || JSON.stringify(data);
      setResult(text);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        setError("No weekly plan was created while you were offline. Reconnect and submit again; your input was not saved.");
      } else {
        setError(userFacingApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Weekly Plan Builder"
      subtitle="Monday–Friday with win conditions before the week runs you."
      category="Plan"
      whenToUse="Sunday evening or Monday morning before the territory owns you."
      howSteps={["List priority accounts.", "Set one weekly win condition.", "Generate Mon–Fri plan."]}
      ctaTitle="Build week plan"
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={accounts.trim().length < 10 || !goal.trim()}
      testID="tool-weekly"
    >
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>
        Priority accounts this week
      </Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="List accounts and why they matter (no PHI)"
        placeholderTextColor={colors.mutedForeground}
        value={accounts}
        onChangeText={setAccounts}
        multiline
        textAlignVertical="top"
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Weekly win condition
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. 2 facility tours booked"
        placeholderTextColor={colors.mutedForeground}
        value={goal}
        onChangeText={setGoal}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Territory focus (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. South corridor SNFs"
        placeholderTextColor={colors.mutedForeground}
        value={focus}
        onChangeText={setFocus}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Biggest challenge (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. Competitor locked in at hospital A"
        placeholderTextColor={colors.mutedForeground}
        value={challenges}
        onChangeText={setChallenges}
      />
      <FieldResultPanel
        title="Your week"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        nextAction={MOBILE_FIELD_RESULT_ACTIONS["weekly-plan"]}
      />
      <ToolAnatomyRelated items={relatedItems} />
    </ToolShell>
  );
}
