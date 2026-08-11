import React, { useEffect, useState } from "react";
import { Share, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { useSavedResponses } from "@/hooks/useSavedResponses";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import {
  TrustedAiResultSections,
  type TrustedAiResult,
} from "@/components/TrustedAiResultSections";
import { CitationsBlock, type CitationItem } from "@/components/ui/CitationsBlock";
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
import { enqueueGenerate, shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";

const TOOL_ID = "objection";

export function ObjectionTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const saved = useSavedResponses("objection");
  const [objection, setObjection] = useState("");
  const [result, setResult] = useState("");
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [trustedResult, setTrustedResult] = useState<TrustedAiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    void (async () => {
      const draft = await loadToolDraft<{ objection?: string }>(TOOL_ID);
      if (draft?.objection) setObjection(draft.objection);
      const last = await loadToolLastResult(TOOL_ID);
      if (last) {
        setResult(last);
        setFromCache(true);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void saveToolDraft(TOOL_ID, { objection });
    }, 400);
    return () => clearTimeout(t);
  }, [objection]);

  const generate = async () => {
    if (objection.trim().length < 5) return;
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
      const data = await apiPost<{
        response: string;
        citations?: CitationItem[];
        trustedResult?: TrustedAiResult;
      }>("/api/objections", {
        objection,
      });
      setResult(data.response);
      setCitations(data.citations || []);
      setTrustedResult(data.trustedResult ?? null);
      await saveToolLastResult(TOOL_ID, data.response);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        await enqueueGenerate({
          toolId: TOOL_ID,
          path: "/api/objections",
          body: { objection },
          label: "Objection Handler",
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
      title="Objection Handler"
      subtitle="Paste a real line you heard — field-ready talk track in seconds."
      category="Practice"
      whenToUse="Before or after a visit when you hear 'not ready,' preferred hospice, or timing pushback."
      howSteps={[
        "Paste the objection (no patient names or PHI).",
        "Generate a Spartan Method response.",
        "Copy or set a follow-up reminder.",
      ]}
      ctaTitle="Generate response"
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={objection.trim().length < 5}
      testID="tool-objection"
    >
      {fromCache && result ? (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[{ color: colors.primary, fontSize: 12 }, font("semibold")]}>
            Showing last successful result (may be offline / cached)
          </Text>
        </View>
      ) : null}
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>
        What objection are you hearing?
      </Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. 'The patient is not ready for hospice yet...'"
        placeholderTextColor={colors.mutedForeground}
        value={objection}
        onChangeText={setObjection}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <FieldResultPanel
        title="Talk track"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        disclaimer={
          trustedResult?.trustNotice || "Do not enter PHI · Coaching aid only"
        }
        onSave={
          result
            ? async () => {
                const title = objection.length > 60 ? objection.slice(0, 57) + "…" : objection;
                // Local device cache (offline)
                await saved.saveResponse(title, result);
                // Backend trusted save when envelope present
                if (trustedResult && trustedResult.actions?.canSave !== false) {
                  try {
                    await apiPost("/api/v1/ai-results/saved", {
                      title,
                      result: trustedResult,
                    });
                  } catch {
                    // Local save already succeeded; backend may be offline.
                  }
                }
                setSavedId("saved");
              }
            : undefined
        }
        saved={!!savedId}
      >
        {result && trustedResult ? (
          <TrustedAiResultSections result={trustedResult} omitWording />
        ) : result ? (
          <CitationsBlock items={citations} title="Spartan Method sources" />
        ) : null}
      </FieldResultPanel>
      {!!result && (
        <>
          <ReminderPicker
            title="Follow up after your visit"
            body="You practiced an objection — set a reminder to follow up."
            storageKey="objection"
          />
          <SavedResponsesSection items={saved.savedItems} onDelete={saved.deleteResponse} />
        </>
      )}
    </ToolShell>
  );
}
