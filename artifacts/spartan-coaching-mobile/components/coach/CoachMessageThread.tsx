import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { type CoachMessage } from "@/lib/coachApi";
import { font } from "@/lib/typography";
import { cleanFieldCopy } from "@/components/FieldResultPanel";

export type { CoachMessage };

interface CoachMessageThreadProps {
  messages: CoachMessage[];
  feedback: string | null;
  coachReplying: boolean;
  onReturnToRehearsal: () => void;
}

function CoachMessageBody({
  content,
  styles,
  colors,
}: {
  content: string;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  const sections = cleanFieldCopy(content)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <View style={styles.coachMessageBody}>
      {sections.map((section, index) => {
        const lines = section
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const first = lines[0] ?? "";
        const heading =
          first.length < 64 &&
          /^(what|why|stronger|next|try|focus|commitment|recommendation|response|approach)/i.test(
            first,
          );
        return (
          <View key={`${first}:${index}`} style={styles.coachMessageSection}>
            {heading ? (
              <Text style={styles.coachMessageHeading}>
                {first.replace(/:$/, "")}
              </Text>
            ) : null}
            {lines.slice(heading ? 1 : 0).map((line, lineIndex) => {
              const bullet = line.startsWith("• ");
              return bullet ? (
                <View key={lineIndex} style={styles.coachMessageBulletRow}>
                  <View style={styles.coachMessageBullet} />
                  <Text selectable style={styles.feedbackText}>
                    {line.slice(2)}
                  </Text>
                </View>
              ) : (
                <Text key={lineIndex} selectable style={styles.feedbackText}>
                  {line}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function CoachMessageThread({
  messages,
  feedback,
  coachReplying,
  onReturnToRehearsal,
}: CoachMessageThreadProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!feedback) {
    return (
      <View style={styles.emptyReview}>
        <Text style={styles.emptyReviewText}>
          Complete a rehearsal to receive feedback.
        </Text>
        <Pressable onPress={onReturnToRehearsal}>
          <Text style={styles.inlineLink}>Return to rehearsal</Text>
        </Pressable>
      </View>
    );
  }

  const displayMessages =
    messages.length > 0
      ? messages
      : [
          {
            id: "initial-feedback",
            role: "assistant" as const,
            content: feedback,
            createdAt: "",
            clientRequestId: "initial-feedback",
          },
        ];

  return (
    <View style={styles.feedbackCard} accessibilityLiveRegion="polite">
      <View style={styles.feedbackHeader}>
        <View style={styles.feedbackMark}>
          <Feather name="message-circle" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.feedbackHeadingCopy}>
          <Text style={styles.feedbackTitle}>Private coaching conversation</Text>
          <Text style={styles.feedbackSubtitle}>Only visible to you</Text>
        </View>
      </View>
      <View style={styles.messageStack}>
        {displayMessages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === "user" ? styles.userBubble : styles.coachBubble,
            ]}
          >
            <Text style={styles.messageRole}>
              {message.role === "user" ? "YOU" : "COACH"}
            </Text>
            <CoachMessageBody
              content={message.content}
              styles={styles}
              colors={colors}
            />
          </View>
        ))}
        {coachReplying ? (
          <View
            style={[
              styles.messageBubble,
              styles.coachBubble,
              styles.thinkingBubble,
            ]}
          >
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.thinkingText}>Coach is thinking</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    feedbackCard: {
      marginTop: 20,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 18,
    },
    feedbackHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 15,
    },
    feedbackMark: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    feedbackHeadingCopy: { flex: 1 },
    feedbackTitle: { color: colors.foreground, fontSize: 17, ...font("bold") },
    feedbackSubtitle: {
      color: colors.mutedForeground,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 1,
      ...font("regular"),
    },
    messageStack: { gap: 16 },
    messageBubble: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    coachBubble: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      marginRight: 18,
    },
    userBubble: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
      marginLeft: 28,
    },
    messageRole: {
      color: colors.primary,
      fontSize: 9,
      letterSpacing: 1.4,
      marginBottom: 6,
      ...font("bold"),
    },
    feedbackText: {
      color: colors.foreground,
      fontSize: 15,
      lineHeight: 23,
      ...font("regular"),
    },
    coachMessageBody: { gap: 18 },
    coachMessageSection: { gap: 8 },
    coachMessageHeading: {
      color: colors.foreground,
      fontSize: 16,
      lineHeight: 21,
      ...font("heavy"),
    },
    coachMessageBulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
    },
    coachMessageBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    thinkingBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    thinkingText: {
      color: colors.mutedForeground,
      fontSize: 13,
      ...font("semibold"),
    },
    emptyReview: {
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      marginTop: 20,
    },
    emptyReviewText: {
      color: colors.mutedForeground,
      fontSize: 14,
      ...font("regular"),
    },
    inlineLink: {
      color: colors.primary,
      fontSize: 14,
      marginTop: 8,
      ...font("semibold"),
    },
  });
}
