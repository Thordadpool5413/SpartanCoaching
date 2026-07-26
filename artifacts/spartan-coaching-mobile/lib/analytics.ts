import { getBaseUrl, getSessionToken } from "@/lib/api";

/**
 * Track a mobile event against the API.
 *
 * The server derives the member identity from the Bearer session token — never
 * send memberId in the body (the server strips and ignores it to prevent spoofing).
 * Fire-and-forget — never throws.
 */
export async function trackMobileEvent(
  eventType: string,
  eventName: string,
  opts?: { metadata?: string },
): Promise<void> {
  try {
    const base = getBaseUrl();
    if (!base) return;
    const token = await getSessionToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch(`${base}/api/analytics/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType,
        eventName,
        metadata: opts?.metadata ?? null,
      }),
    });
  } catch {
    // fire-and-forget — never propagate
  }
}
