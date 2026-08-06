/**
 * Offline generate queue — failed tool API posts retry when the app is online.
 * Enqueue only transport / 5xx failures (not 401/403/4xx).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, apiPost } from "@/lib/api";
import { saveToolLastResult } from "@/lib/toolDraftCache";

const QUEUE_KEY = "hsp_offline_generate_queue_v1";
const MAX_ATTEMPTS = 5;

export type QueuedGenerate = {
  id: string;
  toolId: string;
  path: string;
  body: Record<string, unknown>;
  createdAt: number;
  /** Human label for UI */
  label: string;
  attempts?: number;
  /** Stable body fingerprint for de-dupe */
  bodyKey?: string;
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

function bodyKey(body: Record<string, unknown>): string {
  try {
    return JSON.stringify(body);
  } catch {
    return String(Date.now());
  }
}

/** True when the failure is worth offline retry (not auth / client validation). */
export function shouldEnqueueOnError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true; // network / parse
  if (error.status === 0 || error.status >= 500) return true;
  return false;
}

export async function enqueueGenerate(
  item: Omit<QueuedGenerate, "id" | "createdAt" | "bodyKey">,
): Promise<QueuedGenerate> {
  const key = bodyKey(item.body);
  const entry: QueuedGenerate = {
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    attempts: 0,
    bodyKey: key,
  };
  const list = await listQueuedGenerates();
  // Replace same toolId + same body only (keep distinct objections)
  const next = [
    entry,
    ...list.filter((q) => !(q.toolId === item.toolId && (q.bodyKey || bodyKey(q.body)) === key)),
  ];
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

let flushInFlight: Promise<FlushResult> | null = null;

/**
 * Attempt all queued generates. Successful ones are removed and last result saved.
 * Concurrent callers share one in-flight flush (mutex).
 */
export async function flushGenerateQueue(): Promise<FlushResult> {
  if (flushInFlight) return flushInFlight;
  flushInFlight = doFlush().finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
}

async function doFlush(): Promise<FlushResult> {
  const list = await listQueuedGenerates();
  if (list.length === 0) return { ok: 0, failed: 0, results: [] };

  let ok = 0;
  let failed = 0;
  const results: FlushResult["results"] = [];
  const remaining: QueuedGenerate[] = [];

  for (const item of list) {
    try {
      const data = await apiPost<Record<string, unknown>>(item.path, item.body, {
        idempotencyKey: item.id,
      });
      const text =
        (data.response as string) ||
        (data.playbook as string) ||
        (data.template as string) ||
        (data.plan as string) ||
        (data.script as string) ||
        (data.text as string) ||
        (data.result as string) ||
        "";
      if (!text) {
        // Unexpected shape — keep for retry (do not drop silently)
        const attempts = (item.attempts || 0) + 1;
        if (attempts < MAX_ATTEMPTS) {
          remaining.push({ ...item, attempts });
        }
        failed += 1;
        results.push({ toolId: item.toolId, error: "empty_result" });
        continue;
      }
      await saveToolLastResult(item.toolId, String(text));
      ok += 1;
      results.push({ toolId: item.toolId, text: String(text) });
    } catch (e: unknown) {
      failed += 1;
      // Drop permanent client errors; keep transport/5xx
      if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 0) {
        results.push({
          toolId: item.toolId,
          error: e.message || "client_error",
        });
        continue;
      }
      const attempts = (item.attempts || 0) + 1;
      if (attempts < MAX_ATTEMPTS) {
        remaining.push({ ...item, attempts });
      }
      results.push({
        toolId: item.toolId,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }

  await writeQueue(remaining);
  return { ok, failed, results };
}

/** Extract user-facing message from API/network errors. */
export function userFacingApiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Hospice Sales Pro access required. Sign in from Account.";
    }
    if (error.message) return error.message.slice(0, 160);
  }
  if (error instanceof Error && error.message) {
    const msg = error.message;
    if (/network|fetch|Failed to fetch|offline/i.test(msg)) {
      return "Network error — check connection and try again.";
    }
  }
  return fallback;
}
