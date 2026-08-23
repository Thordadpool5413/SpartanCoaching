const MAX_ANALYTICS_LABEL_LENGTH = 96;
const MAX_ANALYTICS_PAGE_PATH_LENGTH = 512;
const analyticsLabelPattern = /^[a-z0-9][a-z0-9_.:-]*$/i;

export function isSafeAnalyticsLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ANALYTICS_LABEL_LENGTH &&
    analyticsLabelPattern.test(value)
  );
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