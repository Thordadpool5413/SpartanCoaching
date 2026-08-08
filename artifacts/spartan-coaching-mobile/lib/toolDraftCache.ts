/**
 * Persist tool drafts + last successful results for field / flaky network use.
 * Top tools: objection, playbook, weekly (and others welcome).
 *
 * Clinical / vault tool ids are never written to device storage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OFFLINE_QUEUE_BLOCKED_TOOL_IDS } from "@/lib/offlineQueue";

const draftKey = (toolId: string) => `hsp_tool_draft_v1_${toolId}`;
const resultKey = (toolId: string) => `hsp_tool_result_v1_${toolId}`;

const BLOCKED = new Set<string>(OFFLINE_QUEUE_BLOCKED_TOOL_IDS);

function isDeviceStorageAllowed(toolId: string): boolean {
  if (!toolId || BLOCKED.has(toolId)) return false;
  if (/clinical|lcd|admission|eligibility|medical-record/i.test(toolId)) {
    return false;
  }
  return true;
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
  } catch {
    // ignore
  }
}
