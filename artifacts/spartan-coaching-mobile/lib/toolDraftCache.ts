/**
 * Persist tool drafts + last successful results for field / flaky network use.
 * Top tools: objection, playbook, weekly (and others welcome).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const draftKey = (toolId: string) => `hsp_tool_draft_v1_${toolId}`;
const resultKey = (toolId: string) => `hsp_tool_result_v1_${toolId}`;

export async function loadToolDraft<T extends Record<string, unknown>>(
  toolId: string,
): Promise<T | null> {
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
  try {
    await AsyncStorage.setItem(draftKey(toolId), JSON.stringify(draft));
  } catch {
    // ignore quota
  }
}

export async function loadToolLastResult(toolId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(resultKey(toolId));
  } catch {
    return null;
  }
}

export async function saveToolLastResult(toolId: string, result: string): Promise<void> {
  try {
    if (!result.trim()) return;
    await AsyncStorage.setItem(resultKey(toolId), result);
  } catch {
    // ignore
  }
}
