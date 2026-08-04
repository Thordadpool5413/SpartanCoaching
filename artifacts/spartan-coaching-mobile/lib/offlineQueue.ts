/**
 * Offline generate queue — failed tool API posts retry when the app is online.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "@/lib/api";
import { saveToolLastResult } from "@/lib/toolDraftCache";

const QUEUE_KEY = "hsp_offline_generate_queue_v1";

export type QueuedGenerate = {
  id: string;
  toolId: string;
  path: string;
  body: Record<string, unknown>;
  createdAt: number;
  /** Human label for UI */
  label: string;
};

export async function listQueuedGenerates(): Promise<QueuedGenerate[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as QueuedGenerate[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeQueue(list: QueuedGenerate[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(0, 20)));
}

export async function enqueueGenerate(
  item: Omit<QueuedGenerate, "id" | "createdAt">,
): Promise<QueuedGenerate> {
  const entry: QueuedGenerate = {
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const list = await listQueuedGenerates();
  // Replace same toolId pending to avoid duplicates
  const next = [entry, ...list.filter((q) => q.toolId !== item.toolId)];
  await writeQueue(next);
  return entry;
}

export async function removeQueuedGenerate(id: string): Promise<void> {
  const list = await listQueuedGenerates();
  await writeQueue(list.filter((q) => q.id !== id));
}

export type FlushResult = {
  ok: number;
  failed: number;
  results: Array<{ toolId: string; text?: string; error?: string }>;
};

/**
 * Attempt all queued generates. Successful ones are removed and last result saved.
 */
export async function flushGenerateQueue(): Promise<FlushResult> {
  const list = await listQueuedGenerates();
  if (list.length === 0) return { ok: 0, failed: 0, results: [] };

  let ok = 0;
  let failed = 0;
  const results: FlushResult["results"] = [];
  const remaining: QueuedGenerate[] = [];

  for (const item of list) {
    try {
      const data = await apiPost<Record<string, unknown>>(item.path, item.body);
      const text =
        (data.response as string) ||
        (data.playbook as string) ||
        (data.template as string) ||
        (data.plan as string) ||
        (data.script as string) ||
        (data.text as string) ||
        (data.result as string) ||
        "";
      if (text) await saveToolLastResult(item.toolId, String(text));
      ok += 1;
      results.push({ toolId: item.toolId, text: String(text) });
    } catch (e: unknown) {
      failed += 1;
      remaining.push(item);
      results.push({
        toolId: item.toolId,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }

  await writeQueue(remaining);
  return { ok, failed, results };
}
