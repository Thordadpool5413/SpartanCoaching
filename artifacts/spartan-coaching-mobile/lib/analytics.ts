import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBaseUrl, getSessionToken } from "@/lib/api";
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

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

async function shouldDedupe(
  eventType: string,
  eventName: string,
  metadata: string | null,
): Promise<boolean> {
  if (!(eventType === PRODUCT_EVENT_TYPE && isIdempotentOutcome(eventName))) return false;
  const map = await readJson<Record<string, number>>(DEDUPE_KEY, {});
  const key = productEventDedupeKey(eventType, eventName, metadata);
  const last = map[key] ?? 0;
  const now = Date.now();
  if (now - last < PRODUCT_EVENT_DEDUPE_MS) return true;
  map[key] = now;
  for (const [k, ts] of Object.entries(map)) {
    if (now - ts > PRODUCT_EVENT_DEDUPE_MS * 4) delete map[k];
  }
  await writeJson(DEDUPE_KEY, map);
  return false;
}

/**
 * Track a mobile event against the API.
 *
 * The server derives the member identity from the Bearer session token — never
 * send memberId in the body (the server strips and ignores it to prevent spoofing).
 * Metadata is sanitized (no free text). Offline events queue for later delivery.
 * Fire-and-forget — never throws.
 */
export async function trackMobileEvent(
  eventType: string,
  eventName: string,
  opts?: { metadata?: string | SafeProductMetadata | null },
): Promise<void> {
  try {
    const safeMeta = sanitizeAnalyticsMetadata(opts?.metadata ?? null);
    if (await shouldDedupe(eventType, eventName, safeMeta)) return;

    const evt: QueuedEvent = {
      eventType,
      eventName,
      metadata: safeMeta,
      queuedAt: Date.now(),
    };

    const ok = await postEvent(evt);
    if (!ok) {
      const q = await readJson<QueuedEvent[]>(QUEUE_KEY, []);
      q.push(evt);
      while (q.length > MAX_QUEUE) q.shift();
      await writeJson(QUEUE_KEY, q);
    } else {
      await flushMobileAnalyticsQueue();
    }
  } catch {
    // fire-and-forget
  }
}

async function postEvent(evt: QueuedEvent): Promise<boolean> {
  try {
    const base = getBaseUrl();
    if (!base) return false;
    const token = await getSessionToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}/api/analytics/events`, {
      method: "POST",
      headers,
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

export async function flushMobileAnalyticsQueue(): Promise<void> {
  const q = await readJson<QueuedEvent[]>(QUEUE_KEY, []);
  if (!q.length) return;
  const remaining: QueuedEvent[] = [];
  for (const evt of q) {
    const ok = await postEvent(evt);
    if (!ok) remaining.push(evt);
  }
  await writeJson(QUEUE_KEY, remaining);
}

/** Standardized product outcome event (iOS). */
export async function trackProductOutcome(
  outcome: ProductOutcome,
  metadata?: SafeProductMetadata | null,
): Promise<void> {
  const p = productEventPayload(outcome, metadata ?? null);
  await trackMobileEvent(p.eventType, p.eventName, { metadata: p.metadata });
}
