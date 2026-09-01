/**
 * Parse scheme / notification payloads into expo-router targets.
 * Scheme: spartan-coaching-mobile://tool/objection | //explore | //learn | //my-work | //account
 */
import type { Href } from "expo-router";
import { isToolTab } from "@/lib/toolDeepLinks";
import type { ToolTab } from "@/lib/toolTabs";

export type DeepTarget = {
  pathname: string;
  params?: Record<string, string>;
};

const LOGIN_RETURN_TARGETS = new Set([
  "/sales-workflow",
  "/tool/[tab]",
  "/(tabs)/tools",
  "/(tabs)/learn",
  "/(tabs)/my-work",
  "/(tabs)/account",
  "/(tabs)/coach",
  "/(tabs)",
]);

const SCHEME = "spartan-coaching-mobile";
export const UNIVERSAL_LINK_HOSTS = new Set([
  "spartanhospicecoaching.com",
  "www.spartanhospicecoaching.com",
]);

/** Reminder storageKey → tool tab */
export const REMINDER_KEY_TO_TAB: Record<string, ToolTab> = {
  objection: "objection",
  playbook: "playbook",
  email: "email",
  weekly: "weekly",
  cold: "cold",
  research: "research",
  roleplay: "roleplay",
};

export function parseDeepLink(url: string | null | undefined): DeepTarget | null {
  if (!url) return null;
  try {
    // scheme://host/path or scheme:///path
    const normalized = url.replace(`${SCHEME}://`, "https://app/").replace(`${SCHEME}:`, "https://app");
    const u = new URL(normalized);
    const host = (u.hostname || "").toLowerCase();
    const parts = u.pathname.replace(/^\//, "").split("/").filter(Boolean);
    const isUniversalLink = UNIVERSAL_LINK_HOSTS.has(host);
    if (u.protocol === "https:" && host !== "app" && !isUniversalLink) return null;
    const hostIsRoute = host && host !== "app" && !isUniversalLink;
    const first = (hostIsRoute ? host : parts[0] || "").toLowerCase();
    const second = hostIsRoute ? parts[0] : parts[1];

    if (first === "app") {
      const target = (u.searchParams.get("open") || "home").toLowerCase();
      return mapSecureDeepLinkKey(target === "my-work" ? "my_work" : target) ?? { pathname: "/(tabs)" };
    }
    if (first === "tool" || first === "tools" || first === "explore") {
      const tab = (second || u.searchParams.get("tab") || "").toLowerCase();
      if (isToolTab(tab)) {
        return { pathname: "/tool/[tab]", params: { tab } };
      }
      return { pathname: "/(tabs)/tools" };
    }
    if (first === "command" || first === "workflow") {
      if (second === "full" || first === "workflow") {
        return { pathname: "/sales-workflow" };
      }
      return { pathname: "/sales-workflow" };
    }
    if (first === "learn" || first === "library") return { pathname: "/(tabs)/learn" };
    if (first === "my-work" || first === "work") return { pathname: "/(tabs)/my-work" };
    if (first === "account") return { pathname: "/(tabs)/account" };
    if (first === "coach") return { pathname: "/(tabs)/coach" };
    if (first === "home" || first === "portal") return { pathname: "/(tabs)" };
    if (first === "login") return { pathname: "/login" };
    if (first === "reset-password") {
      const token = u.searchParams.get("token");
      return token ? { pathname: "/reset-password", params: { token } } : null;
    }
    if (isToolTab(first)) {
      return { pathname: "/tool/[tab]", params: { tab: first } };
    }
  } catch {
    // fall through
  }
  return null;
}

export function deepLinkFromNotificationData(
  data: Record<string, unknown> | undefined | null,
): DeepTarget | null {
  if (!data) return null;
  // Secure deep-link keys from backend (HSP-38) — no raw account/PHI paths
  if (data.deepLink && typeof data.deepLink === "object") {
    const key = String((data.deepLink as { key?: string }).key || "");
    const mapped = mapSecureDeepLinkKey(key);
    if (mapped) return mapped;
  }
  if (typeof data.deepLinkKey === "string") {
    const mapped = mapSecureDeepLinkKey(data.deepLinkKey);
    if (mapped) return mapped;
  }
  if (typeof data.url === "string") return parseDeepLink(data.url);
  if (typeof data.deepLink === "string") return parseDeepLink(data.deepLink);
  if (typeof data.route === "string") return parseDeepLink(`${SCHEME}://${data.route.replace(/^\//, "")}`);
  if (typeof data.tab === "string" && isToolTab(data.tab)) {
    return { pathname: "/tool/[tab]", params: { tab: data.tab } };
  }
  if (typeof data.toolTab === "string" && isToolTab(data.toolTab)) {
    return { pathname: "/tool/[tab]", params: { tab: data.toolTab } };
  }
  return null;
}

/** Backend NotificationDeepLink.key → mobile route (auth still required by app). */
export function mapSecureDeepLinkKey(key: string): DeepTarget | null {
  switch (key) {
    case "command":
      return { pathname: "/sales-workflow" };
    case "coach":
      return { pathname: "/(tabs)/coach" };
    case "weekly_plan":
      return { pathname: "/tool/[tab]", params: { tab: "weekly" } };
    case "portal":
    case "home":
      return { pathname: "/(tabs)" };
    case "account":
      return { pathname: "/(tabs)/account" };
    case "resources":
      return { pathname: "/(tabs)/learn" };
    case "my_work":
      return { pathname: "/(tabs)/my-work" };
    case "tools":
      return { pathname: "/(tabs)/tools" };
    case "login":
      return { pathname: "/login" };
    default:
      return null;
  }
}

export function requiresFieldKitTarget(target: DeepTarget): boolean {
  return (
    target.pathname.includes("sales-workflow") ||
    target.pathname.startsWith("/tool/") ||
    target.pathname.includes("command")
  );
}

export function requiresAuthenticationForTarget(target: DeepTarget): boolean {
  return !(
    target.pathname === "/login" ||
    target.pathname === "/reset-password" ||
    target.pathname === "/membership" ||
    target.pathname === "/(tabs)"
  );
}

/**
 * Keeps only known, internal targets across the native sign-in boundary.
 * The serialized value is never treated as a URL and is validated again
 * before Expo Router receives it.
 */
export function serializeLoginReturnTarget(target: DeepTarget): string {
  return JSON.stringify(target);
}

export function parseLoginReturnTarget(raw: string | string[] | undefined): DeepTarget | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as DeepTarget;
    if (!parsed || typeof parsed.pathname !== "string" || !LOGIN_RETURN_TARGETS.has(parsed.pathname)) {
      return null;
    }
    if (parsed.params !== undefined) {
      if (!parsed.params || Object.values(parsed.params).some((value) => typeof value !== "string")) {
        return null;
      }
      if (parsed.pathname === "/tool/[tab]" && !isToolTab(parsed.params.tab || "")) return null;
      if (
        parsed.pathname === "/(tabs)/tools" &&
        parsed.params.view !== undefined &&
        parsed.params.view !== "library"
      ) {
        return null;
      }
    }
    return { pathname: parsed.pathname, ...(parsed.params ? { params: parsed.params } : {}) };
  } catch {
    return null;
  }
}

export function buildToolDeepLink(tab: ToolTab): string {
  return `${SCHEME}://tool/${tab}`;
}

export function buildCommandDeepLink(): string {
  return `${SCHEME}://command`;
}

/** For typed router.push */
export function targetToHref(target: DeepTarget): Href {
  if (target.params) {
    return { pathname: target.pathname as any, params: target.params } as Href;
  }
  return target.pathname as Href;
}
