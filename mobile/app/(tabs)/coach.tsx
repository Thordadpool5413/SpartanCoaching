import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { api, apiErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { recordActivity, STORAGE_KEYS, useStoredJson, useStoredValue } from "@/lib/storage";
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const STARTER_MESSAGES: ChatMessage[] = [
  {
    id: "starter-1",
    role: "assistant",
    content:
      "Welcome back. I can help you draft a call, build a plan, sharpen an objection response, or review a submission.",
    createdAt: new Date().toISOString(),
  },
];

const QUICK_PROMPTS = [
  "Help me handle a family that says they are not ready.",
  "Build a weekly plan for a busy territory.",
  "Give me a sharper follow-up email.",
  "Coach my response to a competitor objection.",
  "Draft a cold call opener for a DON.",
];

export default function CoachScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useStoredValue(STORAGE_KEYS.chatDraft, "");
  const [messages, setMessages] = useStoredJson<ChatMessage[]>(STORAGE_KEYS.chatHistory, STARTER_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages(STARTER_MESSAGES);
    }
  }, [messages.length, setMessages]);

  async function sendPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);

    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ];

    setMessages(nextMessages);
    setDraft("");

    try {
      const response = await api.chat({
        prompt: trimmed,
        conversationHistory: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages([...nextMessages, assistantMessage]);
      recordActivity({
        title: "AI chat response",
        subtitle: trimmed.slice(0, 90),
        kind: "chat",
      });
    } catch (chatError) {
      setError(apiErrorMessage(chatError, "Chat request failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenScrollView
        ref={scrollRef}
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: 140 }}
      >
        <View style={{ gap: 10 }}>
          <Pill tone="accent">AI coach</Pill>
          <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
            Ask for coaching, not noise.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
            Use this screen like a field sidekick: get a script, a follow-up, a sharper answer, or a coaching summary.
          </Text>
        </View>

        <Card>
          <SectionHeader title="Quick prompts" subtitle="Tap one to start with a strong default." />
          <View style={{ gap: spacing.sm }}>
            {QUICK_PROMPTS.map((prompt) => (
              <PressableCard
                key={prompt}
                onPress={() => sendPrompt(prompt)}
                style={{ paddingVertical: 14 }}
              >
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{prompt}</Text>
              </PressableCard>
            ))}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Conversation"
            subtitle="The thread persists locally so testers can refresh or background the app without losing context."
            action={<SecondaryButton title="Role play" onPress={() => router.push("/roleplay")} />}
          />

          <View style={{ gap: 12 }}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  {
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    backgroundColor: message.role === "user" ? colors.accent : colors.surfaceAlt,
                    borderRadius: radius.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: message.role === "user" ? "rgba(255,255,255,0.08)" : colors.border,
                  },
                ]}
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
            ))}
          </View>

          {error ? (
            <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 8 }}>
              {error}
            </Text>
          ) : null}
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
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask for a script, objection response, weekly plan, review, or coaching summary..."
            style={{ minHeight: 88 }}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Clear"
                onPress={() => {
                  setDraft("");
                  setMessages(STARTER_MESSAGES);
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Send"
                loading={loading}
                onPress={() => sendPrompt(draft)}
              />
            </View>
          </View>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

