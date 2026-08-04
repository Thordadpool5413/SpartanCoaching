import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { REMINDER_STORAGE_KEY } from "@/hooks/useReminderHistory";
import type { PendingReminder } from "@/hooks/useReminderHistory";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const RESCHEDULE_TASK = "SPARTAN_RESCHEDULE_NOTIFICATIONS";

TaskManager.defineTask(RESCHEDULE_TASK, async () => {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const all: PendingReminder[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduled.map((n) => n.identifier));

    // Remove past-due entries that no longer have a matching OS notification —
    // they either already fired or were dropped after a reboot.
    const live = all.filter(
      (r) => r.scheduledFor > now || scheduledIds.has(r.id)
    );
    if (live.length !== all.length) {
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(live));
    }

    const still_pending = live.filter((r) => r.scheduledFor > now);

    if (still_pending.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    for (const reminder of still_pending) {
      if (scheduledIds.has(reminder.id)) continue;

      const secondsUntil = Math.floor((reminder.scheduledFor - now) / 1000);
      if (secondsUntil <= 0) continue;

      const newId = await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: true,
          data: { deepLink: "spartan-coaching-mobile://command" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(reminder.scheduledFor),
        },
      });

      if (newId !== reminder.id) {
        const updated = live.map((r) =>
          r.id === reminder.id ? { ...r, id: newId } : r
        );
        await AsyncStorage.setItem(
          REMINDER_STORAGE_KEY,
          JSON.stringify(updated)
        );
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerRescheduleTask(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(RESCHEDULE_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(RESCHEDULE_TASK, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const existing = await Notifications.getPermissionsAsync();
  if ((existing as unknown as { granted: boolean }).granted) return true;
  if (!(existing as unknown as { canAskAgain: boolean }).canAskAgain) return false;

  const result = await Notifications.requestPermissionsAsync();
  return (result as unknown as { granted: boolean }).granted;
}

export interface ScheduleReminderOptions {
  title: string;
  body: string;
  delayMinutes: number;
  /** Deep link payload — opened when user taps the notification */
  data?: Record<string, unknown>;
}

export async function scheduleFollowUpReminder(
  opts: ScheduleReminderOptions
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const fireAt = new Date(Date.now() + opts.delayMinutes * 60 * 1000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: true,
      data: opts.data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });

  return id;
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function addReminderToHistory(
  id: string,
  opts: {
    title: string;
    body: string;
    delayMinutes: number;
    contact?: string;
    presetLabel: string;
  }
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const all: PendingReminder[] = raw ? JSON.parse(raw) : [];
    const entry: PendingReminder = {
      id,
      title: opts.title,
      body: opts.body,
      scheduledFor: Date.now() + opts.delayMinutes * 60 * 1000,
      contact: opts.contact,
      presetLabel: opts.presetLabel,
    };
    const updated = [entry, ...all.filter((r) => r.id !== id)];
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export async function removeReminderFromHistory(id: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const all: PendingReminder[] = raw ? JSON.parse(raw) : [];
    const updated = all.filter((r) => r.id !== id);
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export const REMINDER_PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "Tomorrow", minutes: 24 * 60 },
  { label: "3 days", minutes: 3 * 24 * 60 },
] as const;
