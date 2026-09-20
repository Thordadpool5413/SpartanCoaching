import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import { REMINDER_STORAGE_KEY } from "@/hooks/useReminderHistory";
import type { PendingReminder } from "@/hooks/useReminderHistory";

const RESCHEDULE_TASK = "SPARTAN_RESCHEDULE_NOTIFICATIONS";

// TaskManager requires global-scope definition because a background launch
// does not mount React views or run RootLayout effects.
TaskManager.defineTask(RESCHEDULE_TASK, async () => {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const all: PendingReminder[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduled.map((notification) => notification.identifier));

    const live = all.filter(
      (reminder) =>
        reminder.scheduledFor > now || scheduledIds.has(reminder.id),
    );
    if (live.length !== all.length) {
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(live));
    }

    const stillPending = live.filter((reminder) => reminder.scheduledFor > now);
    if (stillPending.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    for (const reminder of stillPending) {
      if (scheduledIds.has(reminder.id)) continue;

      const secondsUntil = Math.floor((reminder.scheduledFor - now) / 1000);
      if (secondsUntil <= 0) continue;

      const newId = await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: reminder.title || "Follow-up reminder",
          body: reminder.body || "Open Hospice Sales Pro for your next action.",
          sound: true,
          data: {
            deepLink: "spartan-coaching-mobile://command",
            deepLinkKey: "command",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(reminder.scheduledFor),
        },
      });

      if (newId !== reminder.id) {
        const updated = live.map((entry) =>
          entry.id === reminder.id ? { ...entry, id: newId } : entry,
        );
        await AsyncStorage.setItem(
          REMINDER_STORAGE_KEY,
          JSON.stringify(updated),
        );
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerNotificationRescheduleTask(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(RESCHEDULE_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(RESCHEDULE_TASK, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Reminder rescheduling is best-effort and must never block app startup.
  }
}