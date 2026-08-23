const MAX_ANALYTICS_LABEL_LENGTH = 96;
const MAX_ANALYTICS_PAGE_PATH_LENGTH = 512;
const analyticsLabelPattern = /^[a-z0-9][a-z0-9_.:-]*$/i;
const PUBLIC_FUNNEL_EVENT_NAMES = new Set([
  "cta_click",
  "contact_start",
  "contact_failure",
  "app_interest",
]);

export function isSafeAnalyticsLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ANALYTICS_LABEL_LENGTH &&
    analyticsLabelPattern.test(value)
  );
}

/** Client analytics may never impersonate the server-owned contact-success event. */
export function isAcceptedClientAnalyticsEvent(eventType: unknown, eventName: unknown): boolean {
  if (!isSafeAnalyticsLabel(eventType) || !isSafeAnalyticsLabel(eventName)) {
    return false;
  }
  if (eventType === "contact_form_submission") {
    return false;
  }
  return eventType !== "public_funnel" || PUBLIC_FUNNEL_EVENT_NAMES.has(eventName);
}

export function isSafeAnalyticsPagePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ANALYTICS_PAGE_PATH_LENGTH &&
    value.startsWith("/") &&
    !value.includes("\0")
  );
}