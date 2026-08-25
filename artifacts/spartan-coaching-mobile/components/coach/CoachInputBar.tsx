import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

const QUICK_PROMPTS = [
  "Make this sound more natural",
  "What should I ask next?",
];

interface CoachInputBarProps {
  followUp: string;
  busy: boolean;
  followUpInputRef: React.RefObject<TextInput | null>;
  onFollowUpChange: (text: string) => void;
  onSendFollowUp: () => void;
  onPromptSelect: (prompt: string) => void;
}

export function CoachInputBar({
  followUp,
  busy,
  followUpInputRef,
  onFollowUpChange,
  onSendFollowUp,
  onPromptSelect,
}: CoachInputBarProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <View style={styles.promptRow}>
        {QUICK_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onPromptSelect(prompt)}
            style={styles.promptChip}
          >
            <Text style={styles.promptChipText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.coachComposerBox}>
        <TextInput
          ref={followUpInputRef}
          value={followUp}
          onChangeText={onFollowUpChange}
          placeholder="Ask Coach anything about this conversation"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={4000}
          textAlignVertical="top"
          style={styles.coachFollowUpInput}
          accessibilityLabel="Message Spartan Coach"
        />
        <Pressable
          disabled={!followUp.trim() || busy}
          onPress={onSendFollowUp}
          style={[
            styles.sendButton,
            (!followUp.trim() || busy) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message to Coach"
        >
          <Feather name="arrow-up" size={21} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text style={styles.coachPrivacyNote}>
        Continue without patient names, dates, or identifying details.
      </Text>
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    promptRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    promptChip: {
      minHeight: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      paddingHorizontal: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    promptChipText: {
      color: colors.foreground,
      fontSize: 12,
      ...font("semibold"),
    },
    coachComposerBox: {
      minHeight: 66,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      paddingLeft: 14,
      paddingRight: 8,
      paddingVertical: 8,
      marginTop: 12,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
    },
    coachFollowUpInput: {
      flex: 1,
      minHeight: 48,
      maxHeight: 150,
      color: colors.foreground,
      fontSize: 15,
      lineHeight: 21,
      paddingVertical: 10,
      ...font("regular"),
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.4 },
    coachPrivacyNote: {
      color: colors.mutedForeground,
      fontSize: 10,
      lineHeight: 15,
      textAlign: "center",
      marginTop: 8,
      ...font("regular"),
    },
  });
}
