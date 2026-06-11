import "expo-sqlite/localStorage/install";

import { useSyncExternalStore } from "react";

import { safeJsonParse } from "@/lib/format";

export type ActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  kind: string;
  createdAt: string;
};

export type FavoriteItem = {
  id: string;
  type: "article" | "resource" | "content" | "tool" | "calculator";
  title: string;
  subtitle?: string;
  href?: string;
};

export type StreakState = {
  current: number;
  best: number;
  lastSeen: string;
  totalSessions: number;
};

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export const STORAGE_KEYS = {
  chatDraft: "spartan:chat-draft",
  chatHistory: "spartan:chat-history",
  activity: "spartan:recent-activity",
  favorites: "spartan:favorites",
  streak: "spartan:streak",
  toolDrafts: "spartan:tool-drafts",
  calculatorDrafts: "spartan:calculator-drafts",
  contactDraft: "spartan:contact-draft",
  roleplay: "spartan:roleplay",
  assessmentDrafts: "spartan:assessment-drafts",
  adminDrafts: "spartan:admin-drafts",
} as const;

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function readStoredJson<T>(key: string, fallback: T): T {
  return safeJsonParse<T>(localStorage.getItem(key), fallback);
}

export function writeStoredJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  notify(key);
}

export function updateStoredJson<T>(
  key: string,
  updater: (current: T) => T,
  fallback: T
) {
  const next = updater(readStoredJson(key, fallback));
  writeStoredJson(key, next);
  return next;
}

function subscribe(key: string, listener: Listener) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(listener);
  return () => {
    listeners.get(key)?.delete(listener);
  };
}

export function useStoredValue<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => readStoredJson(key, fallback),
    () => fallback
  );

  return [value, (next: T) => writeStoredJson(key, next)];
}

export function useStoredJson<T>(key: string, fallback: T) {
  return useStoredValue<T>(key, fallback);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function touchStreak() {
  const today = todayKey();
  const state = readStoredJson<StreakState>(STORAGE_KEYS.streak, {
    current: 0,
    best: 0,
    lastSeen: "",
    totalSessions: 0,
  });

  const previousSeen = state.lastSeen;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  let current = state.current;
  if (previousSeen === today) {
    current = state.current;
  } else if (previousSeen === yesterdayKey) {
    current = state.current + 1;
  } else if (!previousSeen) {
    current = 1;
  } else {
    current = 1;
  }

  const next: StreakState = {
    current,
    best: Math.max(state.best, current),
    lastSeen: today,
    totalSessions: state.totalSessions + (previousSeen === today ? 0 : 1),
  };

  writeStoredJson(STORAGE_KEYS.streak, next);
  return next;
}

export function recordActivity(item: Omit<ActivityItem, "id" | "createdAt">) {
  const next: ActivityItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  updateStoredJson<ActivityItem[]>(
    STORAGE_KEYS.activity,
    (current) => [next, ...current].slice(0, 24),
    []
  );

  return next;
}

export function toggleFavorite(item: FavoriteItem) {
  return updateStoredJson<FavoriteItem[]>(
    STORAGE_KEYS.favorites,
    (current) => {
      const exists = current.some((favorite) => favorite.id === item.id);
      if (exists) {
        return current.filter((favorite) => favorite.id !== item.id);
      }
      return [item, ...current];
    },
    []
  );
}

export function isFavorite(id: string) {
  return readStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []).some(
    (favorite) => favorite.id === id
  );
}
