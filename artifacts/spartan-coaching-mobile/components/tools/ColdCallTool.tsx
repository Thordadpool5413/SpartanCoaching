import React, { useState } from "react";
import { Share, Text, TextInput, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { ToolShell } from "./ToolShell";
import { toolStyles as styles } from "./toolStyles";

export function ColdCallTool() {
  const colors = useColors();
  const { canUseFieldKit } = useAuth();
  const [prospectType, setProspectType] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prospectType.trim() || situation.trim().length < 10) return;
    if (!canUseFieldKit) {
      setError("Hospice Sales Pro access required. Sign in from Account.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ script?: string; text?: string; result?: string }>(
        "/api/cold-call-script",
        {
          prospectType,
          prospectName: prospectName || undefined,
          situation,
        },
      );
      setResult(data.script || data.text || data.result || JSON.stringify(data));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Cold Call Script"
      subtitle="Openers, objection handlers, and a clear next-step ask."
      category="Prepare"
      ctaTitle="Generate script"
      onCta={generate}
      ctaLoading={loading}
      ctaDisabled={!prospectType.trim() || situation.trim().length < 10}
      testID="tool-cold"
    >
      <Text style={[styles.label, { color: colors.foreground }, font("semibold")]}>Prospect type</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. SNF DON, hospitalist, home health agency"
        placeholderTextColor={colors.mutedForeground}
        value={prospectType}
        onChangeText={setProspectType}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Prospect name (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="e.g. Director Martinez"
        placeholderTextColor={colors.mutedForeground}
        value={prospectName}
        onChangeText={setProspectName}
      />
      <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }, font("semibold")]}>
        Situation
      </Text>
      <TextInput
        style={[
          styles.textarea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          font("regular"),
        ]}
        placeholder="Why you are calling and what you know (no PHI)"
        placeholderTextColor={colors.mutedForeground}
        value={situation}
        onChangeText={setSituation}
        multiline
        textAlignVertical="top"
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
    </ToolShell>
  );
}
