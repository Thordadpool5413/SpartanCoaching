import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
}

export async function scheduleFollowUpReminder(
  opts: ScheduleReminderOptions
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: opts.delayMinutes * 60,
    },
  });

  return id;
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export const REMINDER_PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "Tomorrow", minutes: 24 * 60 },
  { label: "3 days", minutes: 3 * 24 * 60 },
] as const;
