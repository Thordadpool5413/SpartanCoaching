/**
 * Offline generate queue — failed classic Field tool posts retry when online.
 *
 * Safety:
 * - Enqueue only transport / 5xx failures (not 4xx validation).
 * - 401/403 during flush: keep queue for after re-login (do not drop).
 * - Allowlist of classic Field API paths only — never clinical, advanced AI,
 *   Command Center, or transcribe bodies (may contain sensitive content).
 * - Cap queue size; de-dupe by toolId+body; stable Idempotency-Key per entry.
 * - Concurrent flush is mutexed.
 *
 * AI generation does NOT work offline — queue only retries after network returns.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, apiPost } from "@/lib/api";
import { OFFLINE_STORAGE_BLOCKED_TOOL_IDS } from "@/lib/offlineArchitecture";
import { saveToolLastResult } from "@/lib/toolDraftCache";

const QUEUE_KEY = "hsp_offline_generate_queue_v1";
const MAX_ATTEMPTS = 5;
const MAX_QUEUE = 20;

/**
 * Paths permitted to sit on device for retry. Keep in sync with classic Field
 * tools (Stack A). Do not add /api/ai-tools, /api/v1/sales-workflow, clinical,
 * or transcribe without a privacy review.
 */
export const OFFLINE_QUEUE_ALLOWED_PATHS = [
  "/api/objections",
  "/api/playbooks",
  "/api/research",
  "/api/email-templates",
  "/api/cold-call-script",
  "/api/weekly-plan-builder",
] as const;

const ALLOWED_PATH_SET = new Set<string>(OFFLINE_QUEUE_ALLOWED_PATHS);

/** Tool ids that must never be queued (clinical / vault / sensitive). */
export const OFFLINE_QUEUE_BLOCKED_TOOL_IDS = OFFLINE_STORAGE_BLOCKED_TOOL_IDS;

const BLOCKED_TOOL_SET = new Set<string>(OFFLINE_QUEUE_BLOCKED_TOOL_IDS);

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
  /**
   * Stable key sent as Idempotency-Key on every retry for this entry.
   * Never regenerate on attempt bumps (prevents duplicate server work).
   */
  idempotencyKey?: string;
};

export type QueueSnapshot = {
  count: number;
  labels: string[];
  oldestCreatedAt: number | null;
};

function normalizePath(path: string): string {
  const p = (path || "").trim();
  if (!p) return "";
  // Strip query string
  return p.split("?")[0] || p;
}

/** Whether this path/tool may be stored on-device for offline retry. */
export function isOfflineQueueAllowed(path: string, toolId?: string): boolean {
  if (toolId && BLOCKED_TOOL_SET.has(toolId)) return false;
  const normalized = normalizePath(path);
  if (!ALLOWED_PATH_SET.has(normalized)) return false;
  // Extra path guards
  if (/ai-tools|sales-workflow|clinical|transcribe|roleplay/i.test(normalized)) {
    return false;
  }
  return true;
}

export async function listQueuedGenerates(): Promise<QueuedGenerate[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as QueuedGenerate[];
    if (!Array.isArray(list)) return [];
    const allowed = list.filter((q) => isOfflineQueueAllowed(q.path, q.toolId));
    // Persist purge of disallowed entries (e.g. after app upgrade)
    if (allowed.length !== list.length) {
      await writeQueue(allowed);
    }
    return allowed;
  } catch {
    return [];
  }
}

async function writeQueue(list: QueuedGenerate[]): Promise<void> {
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(list.slice(0, MAX_QUEUE)),
  );
}

function bodyKey(body: Record<string, unknown>): string {
  try {
    return JSON.stringify(body);
  } catch {
    return String(Date.now());
  }
}

/** True when the failure is worth offline retry (not client validation). */
export function shouldEnqueueOnError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true; // network / parse
  if (error.status === 0 || error.status >= 500) return true;
  // Do not enqueue 401/403 — user must re-auth first; existing queue kept on flush.
  if (error.status === 401 || error.status === 403) return false;
  // Other 4xx: permanent client error — do not queue
  if (error.status >= 400 && error.status < 500) return false;
  return false;
}

/**
 * Queue a classic Field generate for retry.
 * Returns null when the path/tool is not allowed (clinical / non-classic).
 * Duplicate toolId+body replaces the prior entry (idempotent user intent).
 */
export async function enqueueGenerate(
  item: Omit<QueuedGenerate, "id" | "createdAt" | "bodyKey" | "idempotencyKey">,
): Promise<QueuedGenerate | null> {
  if (!isOfflineQueueAllowed(item.path, item.toolId)) {
    return null;
  }
  const key = bodyKey(item.body);
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: QueuedGenerate = {
    ...item,
    path: normalizePath(item.path),
    id,
    createdAt: Date.now(),
    attempts: 0,
    bodyKey: key,
    // Stable for the lifetime of this logical job (retries reuse same key)
    idempotencyKey: id,
  };
  const list = await listQueuedGenerates();
  // Replace same toolId + same body only (keep distinct objections)
  const next = [
    entry,
    ...list.filter(
      (q) => !(q.toolId === item.toolId && (q.bodyKey || bodyKey(q.body)) === key),
    ),
  ];
  await writeQueue(next);
  return entry;
}

export async function removeQueuedGenerate(id: string): Promise<void> {
  const list = await listQueuedGenerates();
  await writeQueue(list.filter((q) => q.id !== id));
}

export async function getQueueSnapshot(): Promise<QueueSnapshot> {
  const list = await listQueuedGenerates();
  return {
    count: list.length,
    labels: list.map((q) => q.label || q.toolId),
    oldestCreatedAt:
      list.length === 0
        ? null
        : Math.min(...list.map((q) => q.createdAt || Date.now())),
  };
}

/** Drop entire queue (e.g. user sign-out if product policy requires). */
export async function clearGenerateQueue(): Promise<void> {
  await writeQueue([]);
}

export type FlushResult = {
  ok: number;
  failed: number;
  /** True when flush stopped because session is unauthorized */
  authExpired: boolean;
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
  if (list.length === 0) {
    return { ok: 0, failed: 0, authExpired: false, results: [] };
  }

  let ok = 0;
  let failed = 0;
  let authExpired = false;
  const results: FlushResult["results"] = [];
  const remaining: QueuedGenerate[] = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i]!;
    if (!isOfflineQueueAllowed(item.path, item.toolId)) {
      // Drop without retry
      continue;
    }
    try {
      const data = await apiPost<Record<string, unknown>>(item.path, item.body, {
        idempotencyKey: item.idempotencyKey || item.id,
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
          remaining.push({
            ...item,
            attempts,
            idempotencyKey: item.idempotencyKey || item.id,
          });
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
      // Expired / forbidden session: keep this and all remaining items for after re-login
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        authExpired = true;
        remaining.push({
          ...item,
          idempotencyKey: item.idempotencyKey || item.id,
        });
        for (let j = i + 1; j < list.length; j++) {
          const rest = list[j]!;
          if (isOfflineQueueAllowed(rest.path, rest.toolId)) {
            remaining.push({
              ...rest,
              idempotencyKey: rest.idempotencyKey || rest.id,
            });
          }
        }
        results.push({
          toolId: item.toolId,
          error: "auth_expired",
        });
        break;
      }
      // Other permanent 4xx: drop (bad body / validation)
      if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 0) {
        results.push({
          toolId: item.toolId,
          error: e.message || "client_error",
        });
        continue;
      }
      const attempts = (item.attempts || 0) + 1;
      if (attempts < MAX_ATTEMPTS) {
        remaining.push({
          ...item,
          attempts,
          idempotencyKey: item.idempotencyKey || item.id,
        });
      }
      results.push({
        toolId: item.toolId,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }

  await writeQueue(remaining);
  return { ok, failed, authExpired, results };
}

/** Extract user-facing message from API/network errors. */
export function userFacingApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Hospice Sales Pro access required. Sign in from Account.";
    }
    if (error.message) return error.message.slice(0, 160);
  }
  if (error instanceof Error && error.message) {
    const msg = error.message;
    if (/network|fetch|Failed to fetch|offline/i.test(msg)) {
      return "Network error — check connection and try again. AI generation needs the internet.";
    }
  }
  return fallback;
}

/** True when flush result indicates user must sign in before queue can drain. */
export function flushNeedsReauth(result: FlushResult): boolean {
  return Boolean(result.authExpired);
}
