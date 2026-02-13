export function trackEvent(eventType: string, eventName: string, metadata?: string) {
  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, eventName, metadata }),
  }).catch(() => {});
}
