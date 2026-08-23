/**
 * Persist tool drafts + last successful results for field / flaky network use.
 * Top tools: objection, playbook, weekly (and others welcome).
 *
 * Clinical / vault tool ids are never written to device storage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackProductOutcome } from "@/lib/analytics";
import { OFFLINE_STORAGE_BLOCKED_TOOL_IDS } from "@/lib/offlineArchitecture";
import {
  getActiveSyncMemberId,
  isSafeForMemberContinuity,
  queueMemberSync,
} from "@/lib/memberSync";
import { markContinuityChanged } from "@/lib/continuityEvents";

const draftKey = (toolId: string) => {
  const memberId = getActiveSyncMemberId();
  return memberId ? `hsp_tool_draft_v1_${memberId}_${toolId}` : `hsp_tool_draft_v1_${toolId}`;
};
const draftKeyForMember = (toolId: string, memberId: number | null) =>
  memberId ? `hsp_tool_draft_v1_${memberId}_${toolId}` : `hsp_tool_draft_v1_${toolId}`;
const resultKey = (toolId: string) => {
  const memberId = getActiveSyncMemberId();
  return memberId ? `hsp_tool_result_v1_${memberId}_${toolId}` : `hsp_tool_result_v1_${toolId}`;
};
const resultKeyForMember = (toolId: string, memberId: number | null) =>
  memberId ? `hsp_tool_result_v1_${memberId}_${toolId}` : `hsp_tool_result_v1_${toolId}`;

const BLOCKED = new Set<string>(OFFLINE_STORAGE_BLOCKED_TOOL_IDS);
export const CONTINUITY_TOOL_IDS = ["objection", "playbook", "weekly", "cold", "email", "research"] as const;
export type ContinuityToolSnapshot = {
  drafts: Record<string, { value: Record<string, string>; updatedAt: string }>;
  results: Record<string, { value: string; updatedAt: string }>;
};

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
    const draft = JSON.parse(raw) as T;
    if (!isSafeForMemberContinuity({ draft })) {
      await AsyncStorage.removeItem(draftKey(toolId));
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export async function saveToolDraft(
  toolId: string,
  draft: Record<string, unknown>,
): Promise<void> {
  if (!isDeviceStorageAllowed(toolId)) return;
  if (!isSafeForMemberContinuity({ draft })) {
    void queueMemberSync("tool_draft", toolId, { draft });
    return;
  }
  try {
    const memberId = getActiveSyncMemberId();
    await AsyncStorage.setItem(draftKeyForMember(toolId, memberId), JSON.stringify(draft));
    if (memberId) await queueMemberSync("tool_draft", toolId, { draft }, { memberId });
    markContinuityChanged();
  } catch {
    // ignore quota
  }
}

export async function loadToolLastResult(toolId: string): Promise<string | null> {
  if (!isDeviceStorageAllowed(toolId)) return null;
  try {
    const result = await AsyncStorage.getItem(resultKey(toolId));
    if (result && !isSafeForMemberContinuity({ result })) {
      await AsyncStorage.removeItem(resultKey(toolId));
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

export async function saveToolLastResult(toolId: string, result: string): Promise<void> {
  if (!isDeviceStorageAllowed(toolId)) return;
  try {
    if (!result.trim()) return;
    if (!isSafeForMemberContinuity({ result })) {
      await queueMemberSync("tool_result", toolId, { result });
      return;
    }
    const memberId = getActiveSyncMemberId();
    await AsyncStorage.setItem(resultKeyForMember(toolId, memberId), result);
    if (memberId) await queueMemberSync("tool_result", toolId, { result }, { memberId });
    markContinuityChanged();
    void trackProductOutcome("tool_completion", { toolId, platform: "ios" });
  } catch {
    // ignore
  }
}

export async function getToolContinuitySnapshot(): Promise<ContinuityToolSnapshot> {
  const drafts: ContinuityToolSnapshot["drafts"] = {};
  const results: ContinuityToolSnapshot["results"] = {};
  for (const toolId of CONTINUITY_TOOL_IDS) {
    const [draft, result] = await Promise.all([loadToolDraft<Record<string, unknown>>(toolId), loadToolLastResult(toolId)]);
    if (draft) drafts[toolId] = { value: Object.fromEntries(Object.entries(draft).filter(([, value]) => typeof value === "string")) as Record<string, string>, updatedAt: new Date().toISOString() };
    if (result) results[toolId] = { value: result, updatedAt: new Date().toISOString() };
  }
  return { drafts, results };
}

export async function applyToolContinuitySnapshot(snapshot: ContinuityToolSnapshot) {
  for (const [toolId, item] of Object.entries(snapshot.drafts)) {
    if (
      isDeviceStorageAllowed(toolId) &&
      isSafeForMemberContinuity({ draft: item.value })
    ) {
      await AsyncStorage.setItem(draftKey(toolId), JSON.stringify(item.value));
    }
  }
  for (const [toolId, item] of Object.entries(snapshot.results)) {
    if (
      isDeviceStorageAllowed(toolId) &&
      isSafeForMemberContinuity({ result: item.value })
    ) {
      await AsyncStorage.setItem(resultKey(toolId), item.value);
    }
  }
}

export async function clearToolContinuitySnapshot() {
  await AsyncStorage.multiRemove(CONTINUITY_TOOL_IDS.flatMap((toolId) => [draftKey(toolId), resultKey(toolId)]));
}
