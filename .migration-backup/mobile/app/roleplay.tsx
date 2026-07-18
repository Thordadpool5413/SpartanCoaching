import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";

import { api, apiErrorMessage } from "@/lib/api";
import { ROLEPLAY_SCENARIOS } from "@/lib/catalog";
import { formatRelativeTime } from "@/lib/format";
import { recordActivity, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import {
  Card,
  Field,
  Pill,
  PrimaryButton,
  PressableCard,
  ScreenScrollView,
  SectionHeader,
  SecondaryButton,
} from "@/components/ui";
import { colors, radius, spacing } from "@/lib/theme";

type RoleplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type RoleplayState = {
  sessionId: number | null;
  scenarioId: string;
  scenarioTitle: string;
  messages: RoleplayMessage[];
  feedback: string;
  rating: number | null;
  draft: string;
};

const initialState: RoleplayState = {
  sessionId: null,
  scenarioId: ROLEPLAY_SCENARIOS[0].id,
  scenarioTitle: ROLEPLAY_SCENARIOS[0].title,
  messages: [],
  feedback: "",
  rating: null,
  draft: "",
};

export default function RoleplayScreen() {
  const [state, setState] = useStoredJson<RoleplayState>(STORAGE_KEYS.roleplay, initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateState(patch: Partial<RoleplayState>) {
    setState({
      ...state,
      ...patch,
    });
  }

  const selectedScenario = useMemo(
    () => ROLEPLAY_SCENARIOS.find((scenario) => scenario.id === state.scenarioId) ?? ROLEPLAY_SCENARIOS[0],
    [state.scenarioId]
  );

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createRoleplaySession({
        scenarioId: selectedScenario.id,
        scenarioTitle: selectedScenario.title,
      });

      const initialMessage: RoleplayMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: response.initialMessage,
        createdAt: new Date().toISOString(),
      };

      updateState({
        sessionId: response.session.id,
        scenarioId: selectedScenario.id,
        scenarioTitle: selectedScenario.title,
        messages: [initialMessage],
        feedback: "",
        rating: null,
      });

      recordActivity({
        title: "Started roleplay",
        subtitle: selectedScenario.title,
        kind: "roleplay",
      });
    } catch (sessionError) {
      setError(apiErrorMessage(sessionError, "Unable to start the roleplay session."));
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const content = state.draft.trim();
    if (!content || loading || !state.sessionId) return;

    const nextMessages: RoleplayMessage[] = [
      ...state.messages,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      },
    ];

    updateState({
      messages: nextMessages,
      draft: "",
    });
    setLoading(true);
    setError(null);

    try {
      const response = await api.sendRoleplayMessage(state.sessionId, { content });
      updateState({
        messages: [
          ...nextMessages,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            content: response.response,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      recordActivity({
        title: "Roleplay message",
        subtitle: selectedScenario.title,
        kind: "roleplay",
      });
    } catch (messageError) {
      setError(apiErrorMessage(messageError, "Unable to send the roleplay message."));
    } finally {
      setLoading(false);
    }
  }

  async function finishSession() {
    if (!state.sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.submitRoleplayFeedback(state.sessionId);
      updateState({
        feedback: response.feedback,
        rating: response.rating,
      });
      recordActivity({
        title: "Finished roleplay",
        subtitle: selectedScenario.title,
        kind: "roleplay",
      });
    } catch (feedbackError) {
      setError(apiErrorMessage(feedbackError, "Unable to score the roleplay."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 140 }}>
        <View style={{ gap: 10, paddingTop: 8 }}>
          <Pill tone="good">Role play</Pill>
          <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
            Practice the conversation before it happens.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
            Start a live scenario, send back-and-forth messages, and end with feedback from the backend coach.
          </Text>
        </View>

        <Card>
          <SectionHeader title="Scenario picker" subtitle="Choose the situation you want to practice." />
          <View style={{ gap: spacing.sm }}>
            {ROLEPLAY_SCENARIOS.map((scenario) => (
              <PressableCard
                key={scenario.id}
                onPress={() =>
                  updateState({
                    scenarioId: scenario.id,
                    scenarioTitle: scenario.title,
                  })
                }
                style={{
                  borderColor: state.scenarioId === scenario.id ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{scenario.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>
                  {scenario.subtitle}
                </Text>
              </PressableCard>
            ))}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Scenario context"
            subtitle="Use the context to ground your next response."
            action={<SecondaryButton title="Start session" onPress={startSession} />}
          />
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
            {selectedScenario.context}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pill tone="neutral">{state.sessionId ? `Session ${state.sessionId}` : "No live session yet"}</Pill>
            {state.rating !== null ? <Pill tone="good">Rating {state.rating}/5</Pill> : null}
          </View>
        </Card>

        <Card>
          <SectionHeader title="Chat" subtitle="Go back and forth the same way the field does." />
          <View style={{ gap: 12 }}>
            {state.messages.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
                Start a session to generate the first assistant reply.
              </Text>
            ) : (
              state.messages.map((message) => (
                <View
                  key={message.id}
                  style={{
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    backgroundColor: message.role === "user" ? colors.accent : colors.surfaceAlt,
                    borderRadius: radius.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: message.role === "user" ? "rgba(255,255,255,0.08)" : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: message.role === "user" ? colors.text : colors.muted,
                      fontSize: 11,
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {message.role === "user" ? "You" : "Coach"}
                  </Text>
                  <Text selectable style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
                    {message.content}
                  </Text>
                  <Text style={{ color: message.role === "user" ? "rgba(255,255,255,0.78)" : colors.muted, fontSize: 11 }}>
                    {formatRelativeTime(message.createdAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          {state.feedback ? (
            <View style={{ marginTop: 16, gap: 8 }}>
              <Pill tone="warning">Feedback</Pill>
              <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                {state.feedback}
              </Text>
            </View>
          ) : null}

          {error ? <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text> : null}
        </Card>
      </ScreenScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.lg,
          paddingTop: spacing.md,
          backgroundColor: "rgba(7,17,30,0.96)",
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Card style={{ gap: spacing.md }}>
          <Field
            multiline
            value={state.draft}
            onChangeText={(draft) => updateState({ draft })}
            placeholder="Type your response, ask for feedback, or continue the conversation..."
            style={{ minHeight: 88 }}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Finish"
                onPress={finishSession}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={loading ? "Sending..." : state.sessionId ? "Send" : "Start"}
                loading={loading}
                onPress={state.sessionId ? sendMessage : startSession}
              />
            </View>
          </View>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
