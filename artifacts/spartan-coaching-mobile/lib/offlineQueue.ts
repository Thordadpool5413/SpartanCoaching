/**
 * Compatibility API for an offline generate queue retired for privacy.
 * Generated field-tool input is session-only and cannot be persisted or retried.
 */
import { ApiError } from "@/lib/api";
import { OFFLINE_STORAGE_BLOCKED_TOOL_IDS } from "@/lib/offlineArchitecture";
import { clearLegacyGeneratedToolStorage } from "@/lib/generatedToolPrivacy";

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
  await clearLegacyGeneratedToolStorage();
  return [];
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
 * Kept as a no-op for compatibility with older callers. Generated input must
 * never be written to device storage for a retry.
 */
export async function enqueueGenerate(
  item: Omit<QueuedGenerate, "id" | "createdAt" | "bodyKey" | "idempotencyKey">,
): Promise<QueuedGenerate | null> {
  void item;
  await clearLegacyGeneratedToolStorage();
  return null;
}

export async function removeQueuedGenerate(id: string): Promise<void> {
  void id;
  await clearLegacyGeneratedToolStorage();
}

export async function getQueueSnapshot(): Promise<QueueSnapshot> {
  await clearLegacyGeneratedToolStorage();
  return { count: 0, labels: [], oldestCreatedAt: null };
}

/** Drop all legacy queues, including queues created for another prior member. */
export async function clearGenerateQueue(): Promise<void> {
  await clearLegacyGeneratedToolStorage();
}

export type FlushResult = {
  ok: number;
  failed: number;
  /** True when flush stopped because session is unauthorized */
  authExpired: boolean;
  results: Array<{ toolId: string; text?: string; error?: string }>;
};

/** Retired: erase any legacy queue without transmitting a stored request body. */
export async function flushGenerateQueue(): Promise<FlushResult> {
  await clearLegacyGeneratedToolStorage();
  return { ok: 0, failed: 0, authExpired: false, results: [] };
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
