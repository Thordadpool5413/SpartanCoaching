import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  cancelReminder,
  REMINDER_PRESETS,
  scheduleFollowUpReminder,
} from "@/lib/notifications";

interface Props {
  title: string;
  body: string;
  label?: string;
  contact?: string;
}

export function ReminderPicker({ title, body, label = "Set follow-up reminder", contact }: Props) {
  const colors = useColors();
  const [scheduledId, setScheduledId] = useState<string | null>(null);
  const [scheduledLabel, setScheduledLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [contactInput, setContactInput] = useState("");

  if (Platform.OS === "web") return null;

  const contactName = contact ?? contactInput.trim();

  const buildBody = () => {
    if (contactName) {
      return `Follow up with ${contactName} — ${body}`;
    }
    return body;
  };

  const handleSchedule = async (minutes: number, presetLabel: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(presetLabel);

    if (scheduledId) {
      await cancelReminder(scheduledId);
    }

    const id = await scheduleFollowUpReminder({
      title,
      body: buildBody(),
      delayMinutes: minutes,
    });
    setLoading(null);

    if (!id) {
      setDenied(true);
      return;
    }

    setScheduledId(id);
    setScheduledLabel(presetLabel);
    setDenied(false);
  };

  const handleCancel = async () => {
    if (!scheduledId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelReminder(scheduledId);
    setScheduledId(null);
    setScheduledLabel(null);
  };

  if (scheduledId && scheduledLabel) {
    return (
      <View style={[styles.confirmedRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bell" size={16} color={colors.primary} />
        <Text style={[styles.confirmedText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
          {contactName ? (
            <>
              Reminder for{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>{contactName}</Text>
              {" "}set for{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>{scheduledLabel}</Text>
            </>
          ) : (
            <>
              Reminder set for{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>{scheduledLabel}</Text>
            </>
          )}
        </Text>
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Feather name="bell" size={14} color={colors.mutedForeground} />
        <Text style={[styles.labelText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {label}
        </Text>
      </View>

      {!contact && (
        <TextInput
          style={[
            styles.contactInput,
            {
              borderColor: colors.border,
              color: colors.foreground,
              backgroundColor: colors.card,
              fontFamily: "Inter_400Regular",
            },
          ]}
          placeholder="Contact name (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={contactInput}
          onChangeText={setContactInput}
          returnKeyType="done"
          autoCorrect={false}
        />
      )}

      {denied && (
        <Text style={[styles.deniedText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Notifications are disabled. Enable them in Settings to set reminders.
        </Text>
      )}

      <View style={styles.presetRow}>
        {REMINDER_PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            onPress={() => handleSchedule(preset.minutes, preset.label)}
            disabled={!!loading}
            style={({ pressed }) => [
              styles.presetBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
              pressed && { opacity: 0.75 },
              !!loading && { opacity: 0.6 },
            ]}
          >
            {loading === preset.label ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.presetBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {preset.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelText: { fontSize: 13 },
  contactInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  presetBtnText: { fontSize: 13 },
  confirmedRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  confirmedText: { flex: 1, fontSize: 13 },
  deniedText: { fontSize: 12, lineHeight: 18 },
});
