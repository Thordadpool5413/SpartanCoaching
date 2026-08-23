import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { FieldResultPanel } from "@/components/FieldResultPanel";
import { ReminderPicker } from "@/components/ReminderPicker";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";
import { MOBILE_FIELD_RESULT_ACTIONS } from "@workspace/field-kit-catalog";

const EMAIL_TYPES = [
  { value: "follow_up" as const, label: "Follow Up" },
  { value: "thank_you" as const, label: "Thank You" },
  { value: "value_add" as const, label: "Value Add" },
];

export function EmailTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const [emailType, setEmailType] = useState<"follow_up" | "thank_you" | "value_add">("follow_up");
  const [recipientName, setRecipientName] = useState("");
  const [emailContext, setEmailContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (emailContext.trim().length < 10) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ template: string }>("/api/email-templates", {
        templateType: emailType,
        recipientName: recipientName || undefined,
        context: emailContext,
      });
      setResult(data.template);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      if (shouldEnqueueOnError(e)) {
        setError("No email draft was created while you were offline. Reconnect and submit again; your input was not saved.");
      } else {
        setError(userFacingApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Email Templates"
      subtitle="Follow up, thank you, or value add drafts for referral partners."
      category="Prepare"
      ctaTitle={result ? "Create another draft" : "Generate email"}
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={emailContext.trim().length < 10}
      testID="tool-email"
    >
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>Template type</Text>
      <View style={styles.emailTypePicker}>
        {EMAIL_TYPES.map((et) => (
          <Pressable
            key={et.value}
            onPress={() => setEmailType(et.value)}
            style={[
              styles.emailTypeBtn,
              {
                borderColor: emailType === et.value ? colors.primary : colors.border,
                backgroundColor: emailType === et.value ? colors.accent : colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.emailTypeBtnText,
                { color: emailType === et.value ? colors.primary : colors.mutedForeground },
                font(emailType === et.value ? "semibold" : "regular"),
              ]}
            >
              {et.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Recipient name (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="Dr. Smith"
        placeholderTextColor={colors.mutedForeground}
        value={recipientName}
        onChangeText={setRecipientName}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>Context</Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. Met at a care conference, discussed their CHF patients..."
        placeholderTextColor={colors.mutedForeground}
        value={emailContext}
        onChangeText={setEmailContext}
        multiline
        textAlignVertical="top"
      />
      <FieldResultPanel
        title="Email draft"
        content={result || undefined}
        loading={loading && !result}
        error={error}
        nextAction={MOBILE_FIELD_RESULT_ACTIONS["email-templates"]}
      />
      {!!result && (
        <>
          <ReminderPicker
            title="Send your follow up email"
            body="Your email is ready. Set a reminder to send it."
            storageKey="email"
          />
        </>
      )}
    </ToolShell>
  );
}
