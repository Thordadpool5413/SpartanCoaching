import { useCallback, useEffect, useState } from "react";
import { LS } from "@/lib/utils";

export interface PendingReminder {
  id: string;
  title: string;
  body: string;
  scheduledFor: number;
  contact?: string;
  presetLabel: string;
}

export const REMINDER_STORAGE_KEY = "spartan_pending_reminders";

export const REMINDER_PRESETS: { label: string; minutes: number }[] = [
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
  { label: "Tomorrow", minutes: 60 * 24 },
];

function loadAll(): PendingReminder[] {
  try {
    return LS.get<PendingReminder[]>(REMINDER_STORAGE_KEY, []);
  } catch {
    return [];
  }
}

function saveAll(reminders: PendingReminder[]) {
  LS.set(REMINDER_STORAGE_KEY, reminders);
}

export function useReminderHistory() {
  const [reminders, setReminders] = useState<PendingReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const all = loadAll();
    const now = Date.now();
    const active = all.filter((r) => r.scheduledFor > now);
    if (active.length !== all.length) {
      saveAll(active);
    }
    setReminders(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addReminder = useCallback((reminder: PendingReminder) => {
    const all = loadAll();
    const updated = [...all.filter((r) => r.id !== reminder.id), reminder];
    saveAll(updated);
    setReminders(updated.filter((r) => r.scheduledFor > Date.now()));
  }, []);

  const removeReminder = useCallback((id: string) => {
    const all = loadAll();
    const updated = all.filter((r) => r.id !== id);
    saveAll(updated);
    setReminders(updated.filter((r) => r.scheduledFor > Date.now()));
  }, []);

  return { reminders, loading, load, addReminder, removeReminder };
}
