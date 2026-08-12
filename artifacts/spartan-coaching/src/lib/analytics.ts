import { gaEvent } from "./ga";
import {
  PRODUCT_EVENT_DEDUPE_MS,
  PRODUCT_EVENT_TYPE,
  isIdempotentOutcome,
  productEventDedupeKey,
  productEventPayload,
  sanitizeAnalyticsMetadata,
  type ProductOutcome,
  type SafeProductMetadata,
} from "@workspace/field-kit-catalog";

const QUEUE_KEY = "hsp_analytics_queue_v1";
const DEDUPE_KEY = "hsp_analytics_dedupe_v1";
const MAX_QUEUE = 40;

type QueuedEvent = {
  eventType: string;
  eventName: string;
  metadata: string | null;
  queuedAt: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

function shouldDedupe(eventType: string, eventName: string, metadata: string | null): boolean {
  if (eventType === PRODUCT_EVENT_TYPE && isIdempotentOutcome(eventName)) {
    const map = readJson<Record<string, number>>(DEDUPE_KEY, {});
    const key = productEventDedupeKey(eventType, eventName, metadata);
    const last = map[key] ?? 0;
    const now = Date.now();
    if (now - last < PRODUCT_EVENT_DEDUPE_MS) return true;
    map[key] = now;
    // prune old
    for (const [k, ts] of Object.entries(map)) {
      if (now - ts > PRODUCT_EVENT_DEDUPE_MS * 4) delete map[k];
    }
    writeJson(DEDUPE_KEY, map);
  }
  return false;
}

function enqueue(evt: QueuedEvent): void {
  const q = readJson<QueuedEvent[]>(QUEUE_KEY, []);
  q.push(evt);
  while (q.length > MAX_QUEUE) q.shift();
  writeJson(QUEUE_KEY, q);
}

async function postEvent(evt: QueuedEvent): Promise<boolean> {
  try {
    const res = await fetch("/api/analytics/events", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: evt.eventType,
        eventName: evt.eventName,
        metadata: evt.metadata,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Flush offline queue (best-effort). */
export async function flushAnalyticsQueue(): Promise<void> {
  const q = readJson<QueuedEvent[]>(QUEUE_KEY, []);
  if (!q.length) return;
  const remaining: QueuedEvent[] = [];
  for (const evt of q) {
    const ok = await postEvent(evt);
    if (!ok) remaining.push(evt);
  }
  writeJson(QUEUE_KEY, remaining);
}

/**
 * Track an analytics event. Metadata is sanitized (no free text).
 * Identity is derived server-side from the session cookie.
 */
export function trackEvent(eventType: string, eventName: string, metadata?: string | SafeProductMetadata | null) {
  const safeMeta = sanitizeAnalyticsMetadata(metadata ?? null);
  if (shouldDedupe(eventType, eventName, safeMeta)) return;

  const evt: QueuedEvent = {
    eventType,
    eventName,
    metadata: safeMeta,
    queuedAt: Date.now(),
  };

  void (async () => {
    const ok = await postEvent(evt);
    if (!ok) enqueue(evt);
    else void flushAnalyticsQueue();
  })();

  // GA only gets non-prose labels
  const gaLabel = safeMeta ? (() => {
    try {
      const o = JSON.parse(safeMeta) as Record<string, string>;
      return o.toolId || o.source || o.surface || undefined;
    } catch {
      return undefined;
    }
  })() : undefined;
  gaEvent(eventName, eventType, gaLabel);
}

/** Standardized product outcome event (web). */
export function trackProductOutcome(outcome: ProductOutcome, metadata?: SafeProductMetadata | null) {
  const p = productEventPayload(outcome, metadata ?? null);
  trackEvent(p.eventType, p.eventName, p.metadata);
}

// Best-effort flush when the tab becomes visible again
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushAnalyticsQueue();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushAnalyticsQueue();
  });
}
