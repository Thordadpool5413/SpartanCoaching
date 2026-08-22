export const APP_STORE_URL = "https://apps.apple.com/app/id6795266551";
export const APP_HANDOFF_ORIGIN = "https://spartanhospicecoaching.com";
export const APP_CUSTOM_SCHEME = "spartan-coaching-mobile";

export const APP_HANDOFF_DESTINATIONS = [
  "home",
  "command",
  "tools",
  "coach",
  "account",
  "my-work",
] as const;

export type AppHandoffDestination = (typeof APP_HANDOFF_DESTINATIONS)[number];

const WEB_APP_FALLBACKS: Record<AppHandoffDestination, string> = {
  home: "/portal",
  command: "/tools/sales-workflow",
  tools: "/tools",
  coach: "/portal/coach",
  account: "/account",
  "my-work": "/portal",
};

export function normalizeAppHandoffDestination(
  value: string | null | undefined,
): AppHandoffDestination {
  return APP_HANDOFF_DESTINATIONS.includes(value as AppHandoffDestination)
    ? (value as AppHandoffDestination)
    : "home";
}

/**
 * An absolute production URL is intentional: it activates iOS Universal Links
 * when Hospice Sales Pro is installed, while still providing a useful web
 * fallback for every other device.
 */
export function buildAppHandoffUrl(
  destination: AppHandoffDestination = "home",
): string {
  const url = new URL("/app", APP_HANDOFF_ORIGIN);
  url.searchParams.set("open", destination);
  return url.toString();
}

/**
 * The direct iPhone launch used on the public handoff page itself. Safari
 * intentionally keeps same-domain Universal Links in the browser, so this
 * scheme is the reliable installed-app action from spartanhospicecoaching.com.
 * The canonical HTTPS handoff URL above remains the shareable Universal Link.
 */
export function buildNativeAppOpenUrl(
  destination: AppHandoffDestination = "home",
): string {
  return `${APP_CUSTOM_SCHEME}://app?open=${encodeURIComponent(destination)}`;
}

export function getWebAppFallbackPath(
  destination: AppHandoffDestination,
): string {
  return WEB_APP_FALLBACKS[destination];
}