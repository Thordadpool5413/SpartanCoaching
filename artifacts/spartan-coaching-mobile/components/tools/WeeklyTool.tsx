import React, { useEffect, useState } from "react";
import { Share, Text, TextInput, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import {
  loadToolDraft,
  loadToolLastResult,
  saveToolDraft,
  saveToolLastResult,
} from "@/lib/toolDraftCache";
import { enqueueGenerate, shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import { ToolAnatomyRelated } from "@/components/ToolAnatomy";
import {
  getToolById,
  recommendRelated,
  relatedToAnatomyItems,
} from "@workspace/field-kit-catalog";

const TOOL_ID = "weekly";

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
  const [fromCache, setFromCache] = useState(false);
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

  useEffect(() => {
    void (async () => {
      const draft = await loadToolDraft<{
        accounts?: string;
        goal?: string;
        focus?: string;
        challenges?: string;
      }>(TOOL_ID);
      if (draft?.accounts) setAccounts(draft.accounts);
      if (draft?.goal) setGoal(draft.goal);
      if (draft?.focus) setFocus(draft.focus);
      if (draft?.challenges) setChallenges(draft.challenges);
      const last = await loadToolLastResult(TOOL_ID);
      if (last) {
        setResult(last);
        setFromCache(true);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void saveToolDraft(TOOL_ID, { accounts, goal, focus, challenges });
    }, 400);
    return () => clearTimeout(t);
  }, [accounts, goal, focus, challenges]);

  const generate = async () => {
    if (accounts.trim().length < 10 || !goal.trim()) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    setFromCache(false);
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
      await saveToolLastResult(TOOL_ID, text);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        await enqueueGenerate({
          toolId: TOOL_ID,
          path: "/api/weekly-plan-builder",
          body: {
            accounts,
            weeklyGoal: goal,
            territoryFocus: focus || undefined,
            challenges: challenges || undefined,
          },
          label: "Weekly Plan",
        });
        setError("Offline or network error — queued to retry. Showing last result if available.");
      } else {
        setError(userFacingApiError(e));
      }
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
      {fromCache && result ? (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[{ color: colors.primary, fontSize: 12 }, font("semibold")]}>
            Showing last successful result (may be offline / cached)
          </Text>
        </View>
      ) : null}
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
      {!!error && (
        <Text style={[styles.errorText, { color: colors.primary }, font("regular")]}>{error}</Text>
      )}
      {!!result && (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultText, { color: colors.foreground }, font("regular")]}>{result}</Text>
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
      <ToolAnatomyRelated items={relatedItems} />
    </ToolShell>
  );
}
