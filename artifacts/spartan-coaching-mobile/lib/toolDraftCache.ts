/**
 * Persist tool drafts + last successful results for field / flaky network use.
 * Top tools: objection, playbook, weekly (and others welcome).
 *
 * Clinical / vault tool ids are never written to device storage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackProductOutcome } from "@/lib/analytics";
import { OFFLINE_STORAGE_BLOCKED_TOOL_IDS } from "@/lib/offlineArchitecture";
import { markContinuityChanged } from "@/lib/continuityEvents";

const draftKey = (toolId: string) => `hsp_tool_draft_v1_${toolId}`;
const resultKey = (toolId: string) => `hsp_tool_result_v1_${toolId}`;
const INDEX_KEY = "hsp_tool_continuity_index_v1";
export const CONTINUITY_TOOL_IDS = ["objection", "playbook", "weekly", "cold", "email", "research"] as const;
type CacheIndex = { drafts: Record<string, string>; results: Record<string, string> };

const BLOCKED = new Set<string>(OFFLINE_STORAGE_BLOCKED_TOOL_IDS);

function isDeviceStorageAllowed(toolId: string): boolean {
  if (!toolId || BLOCKED.has(toolId)) return false;
  if (/clinical|lcd|admission|eligibility|medical-record/i.test(toolId)) {
    return false;
  }
  return true;
}

async function readIndex(): Promise<CacheIndex> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    const value = raw ? JSON.parse(raw) : {};
    return { drafts: value.drafts || {}, results: value.results || {} };
  } catch {
    return { drafts: {}, results: {} };
  }
}

async function markSaved(kind: "drafts" | "results", toolId: string, updatedAt: string) {
  const index = await readIndex();
  index[kind][toolId] = updatedAt;
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export type ContinuityToolSnapshot = {
  drafts: Record<string, { value: Record<string, string>; updatedAt: string }>;
  results: Record<string, { value: string; updatedAt: string }>;
};

function stringRecord(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string")) as Record<string, string>;
}

export async function getToolContinuitySnapshot(): Promise<ContinuityToolSnapshot> {
  const index = await readIndex();
  const drafts: ContinuityToolSnapshot["drafts"] = {};
  const results: ContinuityToolSnapshot["results"] = {};
  for (const toolId of CONTINUITY_TOOL_IDS) {
    const [draft, result] = await Promise.all([loadToolDraft<Record<string, unknown>>(toolId), loadToolLastResult(toolId)]);
    if (draft) drafts[toolId] = { value: stringRecord(draft), updatedAt: index.drafts[toolId] || "1970-01-01T00:00:00.000Z" };
    if (result) results[toolId] = { value: result, updatedAt: index.results[toolId] || "1970-01-01T00:00:00.000Z" };
  }
  return { drafts, results };
}

export async function applyToolContinuitySnapshot(snapshot: ContinuityToolSnapshot): Promise<void> {
  const index = await readIndex();
  for (const [toolId, item] of Object.entries(snapshot.drafts)) {
    if (!isDeviceStorageAllowed(toolId)) continue;
    const localUpdatedAt = index.drafts[toolId];
    if (!localUpdatedAt || Date.parse(item.updatedAt) > Date.parse(localUpdatedAt)) {
      await AsyncStorage.setItem(draftKey(toolId), JSON.stringify(item.value));
      index.drafts[toolId] = item.updatedAt;
    }
  }
  for (const [toolId, item] of Object.entries(snapshot.results)) {
    if (!isDeviceStorageAllowed(toolId)) continue;
    const localUpdatedAt = index.results[toolId];
    if (!localUpdatedAt || Date.parse(item.updatedAt) > Date.parse(localUpdatedAt)) {
      await AsyncStorage.setItem(resultKey(toolId), item.value);
      index.results[toolId] = item.updatedAt;
    }
  }
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export async function clearToolContinuitySnapshot(): Promise<void> {
  await AsyncStorage.multiRemove([
    INDEX_KEY,
    ...CONTINUITY_TOOL_IDS.flatMap((toolId) => [draftKey(toolId), resultKey(toolId)]),
  ]);
}

export async function loadToolDraft<T extends Record<string, unknown>>(
  toolId: string,
): Promise<T | null> {
  if (!isDeviceStorageAllowed(toolId)) return null;
  try {
    const raw = await AsyncStorage.getItem(draftKey(toolId));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveToolDraft(
  toolId: string,
  draft: Record<string, unknown>,
): Promise<void> {
  if (!isDeviceStorageAllowed(toolId)) return;
  try {
    await AsyncStorage.setItem(draftKey(toolId), JSON.stringify(draft));
    await markSaved("drafts", toolId, new Date().toISOString());
    markContinuityChanged();
  } catch {
    // ignore quota
  }
}

export async function loadToolLastResult(toolId: string): Promise<string | null> {
  if (!isDeviceStorageAllowed(toolId)) return null;
  try {
    return await AsyncStorage.getItem(resultKey(toolId));
  } catch {
    return null;
  }
}

export async function saveToolLastResult(toolId: string, result: string): Promise<void> {
  if (!isDeviceStorageAllowed(toolId)) return;
  try {
    if (!result.trim()) return;
    await AsyncStorage.setItem(resultKey(toolId), result);
    await markSaved("results", toolId, new Date().toISOString());
    markContinuityChanged();
    void trackProductOutcome("tool_completion", { toolId, platform: "ios" });
  } catch {
    // ignore
  }
}
