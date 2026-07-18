import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface PendingReminder {
  id: string;
  title: string;
  body: string;
  scheduledFor: number;
  contact?: string;
  presetLabel: string;
}

export const REMINDER_STORAGE_KEY = "spartan_pending_reminders";

export function useReminderHistory() {
  const [reminders, setReminders] = useState<PendingReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
      const all: PendingReminder[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const active = all.filter((r) => r.scheduledFor > now);
      if (active.length !== all.length) {
        await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(active));
      }
      setReminders(active);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeReminder = useCallback(async (id: string) => {
    try {
      const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
      const all: PendingReminder[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const updated = all.filter((r) => r.id !== id && r.scheduledFor > now);
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));
      setReminders(updated);
    } catch {}
  }, []);

  return { reminders, loading, load, removeReminder };
}
