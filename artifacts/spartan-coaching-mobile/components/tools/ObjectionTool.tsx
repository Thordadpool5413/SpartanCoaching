import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import { impactLight, notifySuccess } from "@/lib/iosProductQuality";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useColors } from "@/hooks/useColors";
import { AI_REQUEST_TIMEOUT_MS, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { CitationsBlock, type CitationItem } from "@/components/ui/CitationsBlock";
import { ReminderPicker } from "@/components/ReminderPicker";
import {
  ToolAnatomyEvidence,
  ToolAnatomyNextMove,
  ToolAnatomyRelated,
  ToolAnatomyResult,
  ToolAnatomyWhy,
} from "@/components/ToolAnatomy";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import {
  getToolById,
  MOBILE_FIELD_RESULT_ACTIONS,
  recommendRelated,
  relatedToAnatomyItems,
} from "@workspace/field-kit-catalog";

const TOOL_ID = "objection";

export function ObjectionTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const { reduceMotion } = useAccessibilityPrefs();
  const relatedItems = relatedToAnatomyItems(
    recommendRelated(
      "objections",
      {
        platform: "ios",
        canUseFieldKit: !!canUseFieldKit,
        contextTags: ["objection", "practice"],
        limit: 4,
      },
      getToolById,
    ),
  );
  const [objection, setObjection] = useState("");
  const [result, setResult] = useState("");
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (objection.trim().length < 5) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void impactLight(reduceMotion);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ response: string; citations?: CitationItem[] }>(
        "/api/objections",
        { objection },
        { retry: true, timeoutMs: AI_REQUEST_TIMEOUT_MS },
      );
      setResult(data.response);
      setCitations(data.citations || []);
      void notifySuccess(reduceMotion);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        setError("No response was created while you were offline. Reconnect and submit again; your input was not saved.");
      } else {
        setError(userFacingApiError(e));
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
      catalogToolId="objections"
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
      {/* context + guidance from ToolShell; unique free-text input preserved */}
      <ToolAnatomyWhy>
        Acknowledge the concern, reframe the goal (comfort, support, timing), then offer one clear
        next step — never invent clinical claims.
      </ToolAnatomyWhy>

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
        accessibilityLabel="Objection input"
      />
      <ToolAnatomyResult
        title="Talk track"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        nextAction={MOBILE_FIELD_RESULT_ACTIONS.objections}
      >
        {result ? (
          <ToolAnatomyEvidence>
            <CitationsBlock items={citations} title="Spartan Method sources" />
          </ToolAnatomyEvidence>
        ) : null}
      </ToolAnatomyResult>
      {!!result && (
        <>
          <ToolAnatomyNextMove>
            <ReminderPicker
              title="Follow up after your visit"
              body="You practiced an objection — set a reminder to follow up."
              storageKey="objection"
            />
          </ToolAnatomyNextMove>
        </>
      )}
      <ToolAnatomyRelated items={relatedItems} />
    </ToolShell>
  );
}
