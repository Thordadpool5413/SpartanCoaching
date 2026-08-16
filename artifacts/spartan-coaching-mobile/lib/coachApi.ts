import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

export type CoachConversation = {
  id: string;
  title: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};
export type CoachMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  clientRequestId: string;
};
export type CoachPreference = {
  memoryEnabled: boolean;
  responseStyle: "concise" | "balanced" | "detailed";
};
export type CoachMemoryItem = {
  id: string;
  category: "goal" | "preference" | "commitment" | "context";
  content: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export const listCoachConversations = async () =>
  (await apiGet<{ conversations: CoachConversation[] }>("/api/v1/coach/conversations")).conversations;

export const createCoachConversation = async (title?: string) =>
  (await apiPost<{ conversation: CoachConversation }>("/api/v1/coach/conversations", title ? { title } : {})).conversation;

export const loadCoachConversation = (id: string) =>
  apiGet<{ conversation: CoachConversation; messages: CoachMessage[] }>(`/api/v1/coach/conversations/${id}`);

export const sendCoachMessage = async (id: string, message: string, requestId: string) =>
  (await apiPost<{ message: CoachMessage }>(`/api/v1/coach/conversations/${id}/messages`, { message, requestId }, { idempotencyKey: requestId })).message;

export const deleteCoachConversation = (id: string) =>
  apiDelete<{ ok: true }>(`/api/v1/coach/conversations/${id}`);

export const getCoachPreferences = async () =>
  (await apiGet<{ preference: CoachPreference }>("/api/v1/coach/preferences")).preference;

export const saveCoachPreferences = async (preference: CoachPreference) =>
  (await apiPut<{ preference: CoachPreference }>("/api/v1/coach/preferences", preference)).preference;

export const listCoachMemory = async () =>
  (await apiGet<{ items: CoachMemoryItem[] }>("/api/v1/coach/memory")).items;

export const saveCoachMemory = async (
  category: CoachMemoryItem["category"],
  content: string,
) =>
  (await apiPost<{ item: CoachMemoryItem }>("/api/v1/coach/memory", { category, content })).item;
