import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

import { sharePdfDocument } from "@/components/export-document";
import { Card, EmptyState, Field, Pill, PrimaryButton, PressableCard, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { api, apiErrorMessage } from "@/lib/api";
import { TOOL_DEFINITIONS, type ToolSlug } from "@/lib/workflows";
import { formatDate, slugToLabel } from "@/lib/format";
import { recordActivity, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

type ToolDraft = {
  scenario: string;
  desiredOutcomes: string;
  objection: string;
  query: string;
  prospectType: string;
  prospectName: string;
  situation: string;
  repName: string;
  templateType: "follow_up" | "thank_you" | "value_add";
  recipientName: string;
  context: string;
  customization: string;
  accounts: string;
  weeklyGoal: string;
  territoryFocus: string;
  challenges: string;
  transcript: string;
};

const initialDraft: ToolDraft = {
  scenario: "",
  desiredOutcomes: "",
  objection: "",
  query: "",
  prospectType: "",
  prospectName: "",
  situation: "",
  repName: "",
  templateType: "follow_up",
  recipientName: "",
  context: "",
  customization: "",
  accounts: "",
  weeklyGoal: "",
  territoryFocus: "",
  challenges: "",
  transcript: "",
};

export default function ToolScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slugValue = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? "";
  const slug = slugValue as ToolSlug;
  const definition = TOOL_DEFINITIONS[slug];
  const [drafts, setDrafts] = useStoredJson<Record<string, ToolDraft>>(STORAGE_KEYS.toolDrafts, {});
  const draft = drafts[slugValue] ?? initialDraft;
  const [result, setResult] = useState<string>("");
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(patch: Partial<ToolDraft>) {
    setDrafts({
      ...drafts,
      [slugValue]: {
        ...draft,
        ...patch,
      },
    });
  }

  const title = definition?.title ?? slugToLabel(slugValue);
  const kicker = definition?.kicker ?? "Tool";
  const summary = definition?.summary ?? "Native AI workflow powered by the existing Spartan Coaching backend.";
  const resultLabel = definition?.resultLabel ?? "Result";

  const canRun = useMemo(() => {
    switch (slug) {
      case "playbooks":
        return draft.scenario.trim().length >= 10;
      case "objections":
        return draft.objection.trim().length >= 5;
      case "research":
        return draft.query.trim().length >= 5;
      case "cold-call-script":
        return draft.prospectType.trim().length >= 2 && draft.situation.trim().length >= 10;
      case "email-templates":
        return draft.context.trim().length >= 10;
      case "weekly-plan-builder":
        return draft.accounts.trim().length >= 3 && draft.weeklyGoal.trim().length >= 1;
      case "transcribe":
        return draft.transcript.trim().length >= 20;
      default:
        return false;
    }
  }, [draft, slug]);

  async function handleRun() {
    if (!definition || !canRun || loading) return;

    setLoading(true);
    setError(null);
    setResult("");
    setSources([]);

    try {
      let output = "";
      let nextSources: Array<{ title: string; uri: string }> = [];

      switch (slug) {
        case "playbooks": {
          const response = await api.getPlaybooks({
            scenario: draft.scenario.trim(),
            desiredOutcomes: draft.desiredOutcomes.trim() || undefined,
          });
          output = response.playbook;
          break;
        }
        case "objections": {
          const response = await api.getObjectionResponse({
            objection: draft.objection.trim(),
          });
          output = response.response;
          break;
        }
        case "research": {
          const response = await api.research({
            query: draft.query.trim(),
          });
          output = response.text;
          nextSources = response.sources ?? [];
          break;
        }
        case "cold-call-script": {
          const response = await api.generateColdCallScript({
            prospectType: draft.prospectType.trim(),
            prospectName: draft.prospectName.trim() || undefined,
            situation: draft.situation.trim(),
            repName: draft.repName.trim() || undefined,
          });
          output = response.script;
          break;
        }
        case "email-templates": {
          const response = await api.generateEmailTemplate({
            templateType: draft.templateType,
            recipientName: draft.recipientName.trim() || undefined,
            context: draft.context.trim(),
            customization: draft.customization.trim() || undefined,
          });
          output = response.template;
          break;
        }
        case "weekly-plan-builder": {
          const response = await api.generateWeeklyPlan({
            accounts: draft.accounts.trim(),
            weeklyGoal: draft.weeklyGoal.trim(),
            territoryFocus: draft.territoryFocus.trim() || undefined,
            challenges: draft.challenges.trim() || undefined,
          });
          output = response.plan;
          break;
        }
        case "transcribe": {
          const response = await api.analyzeTranscript({
            transcript: draft.transcript.trim(),
          });
          output = response.analysis;
          break;
        }
      }

      setResult(output);
      setSources(nextSources);
      recordActivity({
        title: `Ran ${title}`,
        subtitle: definition.title,
        kind: "tool",
      });
    } catch (runError) {
      setError(apiErrorMessage(runError, "Unable to run the tool right now."));
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!definition || !result) return;
    await sharePdfDocument({
      title: definition.exportTitle,
      subtitle: definition.exportSubtitle,
      sections: [
        { heading: "Prompt", body: promptSummary() },
        { heading: resultLabel, body: result },
        ...(sources.length > 0
          ? [
              {
                heading: "Sources",
                body: sources.map((source) => `${source.title} — ${source.uri}`),
              },
            ]
          : []),
      ],
    });
    recordActivity({
      title: `Shared ${title}`,
      subtitle: definition.title,
      kind: "tool",
    });
  }

  function promptSummary() {
    switch (slug) {
      case "playbooks":
        return [`Scenario: ${draft.scenario}`, draft.desiredOutcomes ? `Desired outcomes: ${draft.desiredOutcomes}` : ""].filter(Boolean).join("\n");
      case "objections":
        return draft.objection;
      case "research":
        return draft.query;
      case "cold-call-script":
        return [
          `Prospect type: ${draft.prospectType}`,
          draft.prospectName ? `Prospect name: ${draft.prospectName}` : "",
          `Situation: ${draft.situation}`,
          draft.repName ? `Rep name: ${draft.repName}` : "",
        ].filter(Boolean).join("\n");
      case "email-templates":
        return [
          `Template: ${draft.templateType}`,
          draft.recipientName ? `Recipient: ${draft.recipientName}` : "",
          `Context: ${draft.context}`,
          draft.customization ? `Customization: ${draft.customization}` : "",
        ].filter(Boolean).join("\n");
      case "weekly-plan-builder":
        return [
          `Accounts: ${draft.accounts}`,
          `Weekly goal: ${draft.weeklyGoal}`,
          draft.territoryFocus ? `Territory focus: ${draft.territoryFocus}` : "",
          draft.challenges ? `Challenges: ${draft.challenges}` : "",
        ].filter(Boolean).join("\n");
      case "transcribe":
        return draft.transcript;
      default:
        return "";
    }
  }

  if (!definition) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Tool unavailable" body={`We do not have a tool for "${slugToLabel(slugValue)}" yet.`} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 120 }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="accent">{kicker}</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {summary}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Pill tone="neutral">Native tool</Pill>
          <Pill tone="neutral">Local drafts</Pill>
          <Pill tone="neutral">Backend powered</Pill>
        </View>
      </View>

      <Card>
        <SectionHeader title="Inputs" subtitle="Fill in the prompt, then run the tool against the live backend." />
        <View style={{ gap: spacing.md }}>
          {slug === "playbooks" ? (
            <>
              <Field
                label="Scenario"
                value={draft.scenario}
                onChangeText={(scenario) => updateDraft({ scenario })}
                multiline
                placeholder="Describe the situation and what needs to happen."
              />
              <Field
                label="Desired outcomes"
                value={draft.desiredOutcomes}
                onChangeText={(desiredOutcomes) => updateDraft({ desiredOutcomes })}
                placeholder="What should the playbook help the rep achieve?"
              />
            </>
          ) : null}

          {slug === "objections" ? (
            <Field
              label="Objection"
              value={draft.objection}
              onChangeText={(objection) => updateDraft({ objection })}
              multiline
              placeholder="Paste the objection or concern here."
            />
          ) : null}

          {slug === "research" ? (
            <Field
              label="Research question"
              value={draft.query}
              onChangeText={(query) => updateDraft({ query })}
              multiline
              placeholder="Ask a focused, researchable question."
            />
          ) : null}

          {slug === "cold-call-script" ? (
            <>
              <Field
                label="Prospect type"
                value={draft.prospectType}
                onChangeText={(prospectType) => updateDraft({ prospectType })}
                placeholder="Hospital case manager, SNF DON, etc."
              />
              <Field
                label="Prospect name"
                value={draft.prospectName}
                onChangeText={(prospectName) => updateDraft({ prospectName })}
                placeholder="Optional"
              />
              <Field
                label="Situation"
                value={draft.situation}
                onChangeText={(situation) => updateDraft({ situation })}
                multiline
                placeholder="What is going on and why are you calling?"
              />
              <Field
                label="Rep name"
                value={draft.repName}
                onChangeText={(repName) => updateDraft({ repName })}
                placeholder="Optional"
              />
            </>
          ) : null}

          {slug === "email-templates" ? (
            <>
              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Template type</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {(["follow_up", "thank_you", "value_add"] as const).map((templateType) => (
                    <PressableCard
                      key={templateType}
                      onPress={() => updateDraft({ templateType })}
                      style={{
                        borderColor: draft.templateType === templateType ? colors.accent : colors.border,
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>
                        {templateType.replace("_", " ")}
                      </Text>
                    </PressableCard>
                  ))}
                </View>
              </View>
              <Field
                label="Recipient name"
                value={draft.recipientName}
                onChangeText={(recipientName) => updateDraft({ recipientName })}
                placeholder="Optional"
              />
              <Field
                label="Context"
                value={draft.context}
                onChangeText={(context) => updateDraft({ context })}
                multiline
                placeholder="Why are you emailing and what should the message accomplish?"
              />
              <Field
                label="Customization"
                value={draft.customization}
                onChangeText={(customization) => updateDraft({ customization })}
                multiline
                placeholder="Add tone, style, or extra instructions."
              />
            </>
          ) : null}

          {slug === "weekly-plan-builder" ? (
            <>
              <Field
                label="Accounts"
                value={draft.accounts}
                onChangeText={(accounts) => updateDraft({ accounts })}
                multiline
                placeholder="List the accounts or territory names."
              />
              <Field
                label="Weekly goal"
                value={draft.weeklyGoal}
                onChangeText={(weeklyGoal) => updateDraft({ weeklyGoal })}
                placeholder="What does success look like this week?"
              />
              <Field
                label="Territory focus"
                value={draft.territoryFocus}
                onChangeText={(territoryFocus) => updateDraft({ territoryFocus })}
                placeholder="Optional"
              />
              <Field
                label="Challenges"
                value={draft.challenges}
                onChangeText={(challenges) => updateDraft({ challenges })}
                multiline
                placeholder="What is getting in the way?"
              />
            </>
          ) : null}

          {slug === "transcribe" ? (
            <Field
              label="Transcript"
              value={draft.transcript}
              onChangeText={(transcript) => updateDraft({ transcript })}
              multiline
              placeholder="Paste the call transcript or practice conversation."
            />
          ) : null}

          {error ? <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text> : null}
          <PrimaryButton title={loading ? "Running..." : "Run tool"} loading={loading} disabled={!canRun} onPress={handleRun} />
        </View>
      </Card>

      {result ? (
        <Card>
          <SectionHeader title={resultLabel} subtitle="The response from the live backend." />
          <View style={{ gap: spacing.sm }}>
            <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
              {result}
            </Text>
            {sources.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Sources</Text>
                {sources.map((source) => (
                  <PressableCard key={source.uri} onPress={() => Linking.openURL(source.uri)}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>{source.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{source.uri}</Text>
                  </PressableCard>
                ))}
              </View>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <SecondaryButton title="Share PDF" onPress={handleShare} />
              <SecondaryButton title="Run again" onPress={handleRun} />
            </View>
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionHeader title="Prompt snapshot" subtitle="The current inputs are persisted locally on the device." />
        <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
          Updated {formatDate(new Date())}
        </Text>
      </Card>
    </ScreenScrollView>
  );
}
