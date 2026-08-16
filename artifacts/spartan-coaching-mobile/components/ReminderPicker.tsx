import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  addReminderToHistory,
  cancelReminder,
  removeReminderFromHistory,
  REMINDER_PRESETS,
  scheduleFollowUpReminder,
} from "@/lib/notifications";
import { buildToolDeepLink, REMINDER_KEY_TO_TAB } from "@/lib/deepLinks";
import { font } from "@/lib/typography";

interface Props {
  title: string;
  body: string;
  label?: string;
  contact?: string;
  storageKey?: string;
  onScheduled?: () => void;
  onCancelled?: () => void;
}

export function ReminderPicker({ title, body, label = "Set follow-up reminder", contact, storageKey, onScheduled, onCancelled }: Props) {
  const colors = useColors();
  const [scheduledId, setScheduledId] = useState<string | null>(null);
  const [scheduledLabel, setScheduledLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [contactInput, setContactInput] = useState("");

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(`reminder_contact_${storageKey}`).then((stored) => {
      if (stored) setContactInput(stored);
    });
  }, [storageKey]);

  const handleContactChange = (text: string) => {
    setContactInput(text);
    if (storageKey) {
      AsyncStorage.setItem(`reminder_contact_${storageKey}`, text);
    }
  };

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
      await removeReminderFromHistory(scheduledId);
    }

    const tab = storageKey ? REMINDER_KEY_TO_TAB[storageKey] : undefined;
    const id = await scheduleFollowUpReminder({
      title,
      body: buildBody(),
      delayMinutes: minutes,
      data: tab
        ? { deepLink: buildToolDeepLink(tab), tab, toolTab: tab }
        : { deepLink: "spartan-coaching-mobile://command" },
    });
    setLoading(null);

    if (!id) {
      setDenied(true);
      return;
    }

    await addReminderToHistory(id, {
      title,
      body: buildBody(),
      delayMinutes: minutes,
      contact: contactName || undefined,
      presetLabel,
    });

    setScheduledId(id);
    setScheduledLabel(presetLabel);
    setDenied(false);
    onScheduled?.();
  };

  const handleCancel = async () => {
    if (!scheduledId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelReminder(scheduledId);
    await removeReminderFromHistory(scheduledId);
    setScheduledId(null);
    setScheduledLabel(null);
    onCancelled?.();
  };

  if (scheduledId && scheduledLabel) {
    return (
      <View style={[styles.confirmedRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bell" size={16} color={colors.primary} />
        <Text style={[styles.confirmedText, { color: colors.foreground, ...font("regular") }]}>
          {contactName ? (
            <>
              Reminder for{" "}
              <Text style={{ ...font("semibold") }}>{contactName}</Text>
              {" "}set for{" "}
              <Text style={{ ...font("semibold") }}>{scheduledLabel}</Text>
            </>
          ) : (
            <>
              Reminder set for{" "}
              <Text style={{ ...font("semibold") }}>{scheduledLabel}</Text>
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
        <Text style={[styles.labelText, { color: colors.mutedForeground, ...font("medium") }]}>
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
              ...font("regular"),
            },
          ]}
          placeholder="Contact name (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={contactInput}
          onChangeText={handleContactChange}
          returnKeyType="done"
          autoCorrect={false}
        />
      )}

      {denied && (
        <Text style={[styles.deniedText, { color: colors.mutedForeground, ...font("regular") }]}>
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
              <Text style={[styles.presetBtnText, { color: colors.foreground, ...font("medium") }]}>
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
