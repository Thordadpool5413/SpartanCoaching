/**
 * Notification safety, preferences, and deep-link authorization (HSP-38).
 * Pure functions — no PHI on lock screens; deep links require auth/entitlement checks.
 */

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationDeepLink,
  type NotificationPreferences,
  type NotificationType,
} from "@workspace/db";

export const NOTIFICATIONS_VERSION = "notifications-v1";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "follow_up_due",
  "upcoming_meeting",
  "weekly_plan_incomplete",
  "assigned_coaching",
  "org_content_published",
  "important_next_action",
  "subscription_issue",
  "evaluation_expiration",
];

/** Generic lock-screen copy — never interpolates account/patient names. */
const SAFE_COPY: Record<
  NotificationType,
  { title: string; body: string; deepLink: NotificationDeepLink }
> = {
  follow_up_due: {
    title: "Follow-up due",
    body: "A planned follow-up is due. Open Command Center to review your queue.",
    deepLink: { key: "command" },
  },
  upcoming_meeting: {
    title: "Upcoming visit",
    body: "You have an upcoming planned visit. Prepare in Command Center.",
    deepLink: { key: "command" },
  },
  weekly_plan_incomplete: {
    title: "Weekly plan incomplete",
    body: "Your weekly plan still needs attention before the week is underway.",
    deepLink: { key: "weekly_plan" },
  },
  assigned_coaching: {
    title: "Coaching assigned",
    body: "You have coaching to review. Open your portal for next steps.",
    deepLink: { key: "portal" },
  },
  org_content_published: {
    title: "Organization content available",
    body: "New provider library content was published for your organization.",
    deepLink: { key: "resources" },
  },
  important_next_action: {
    title: "Important next action",
    body: "A next action is waiting on your portal checklist.",
    deepLink: { key: "portal" },
  },
  subscription_issue: {
    title: "Subscription needs attention",
    body: "There is a billing or access issue on your account. Review Account settings.",
    deepLink: { key: "account" },
  },
  evaluation_expiration: {
    title: "Evaluation ending soon",
    body: "Your evaluation period is ending soon. Review Account for options.",
    deepLink: { key: "account" },
  },
};

const SENSITIVE_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\bMRN[:\s#]*[A-Z0-9-]+\b/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:patient|resident)\s+[A-Z][a-z]+\b/i,
];

export function normalizePreferences(raw: unknown): NotificationPreferences {
  const base = structuredClone(DEFAULT_NOTIFICATION_PREFERENCES);
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<NotificationPreferences>;
  const types = { ...base.types };
  if (p.types && typeof p.types === "object") {
    for (const t of NOTIFICATION_TYPES) {
      if (typeof (p.types as Record<string, unknown>)[t] === "boolean") {
        types[t] = Boolean((p.types as Record<string, boolean>)[t]);
      }
    }
  }
  return {
    schemaVersion: 1,
    enabled: p.enabled !== false,
    lockScreenMinimal: p.lockScreenMinimal !== false,
    channels: {
      inApp: p.channels?.inApp !== false,
      push: p.channels?.push !== false,
      email: p.channels?.email === true,
    },
    types,
    orgControls: {
      suppressOrgContentPush: Boolean(p.orgControls?.suppressOrgContentPush),
      suppressCoachingPush: Boolean(p.orgControls?.suppressCoachingPush),
    },
  };
}

export function safeCopyForType(type: NotificationType): {
  titleSafe: string;
  bodySafe: string;
  deepLink: NotificationDeepLink;
} {
  const c = SAFE_COPY[type];
  return {
    titleSafe: c.title,
    bodySafe: c.body,
    deepLink: { ...c.deepLink },
  };
}

/** Rejects copy that looks like it contains sensitive detail. */
export function assertLockScreenSafe(text: string): boolean {
  const s = String(text || "");
  for (const re of SENSITIVE_PATTERNS) {
    if (re.test(s)) return false;
  }
  return true;
}

export function isTypeEnabled(
  prefs: NotificationPreferences,
  type: NotificationType,
): boolean {
  if (!prefs.enabled) return false;
  if (!prefs.channels.inApp) return false;
  if (prefs.types[type] === false) return false;
  if (type === "org_content_published" && prefs.orgControls?.suppressOrgContentPush) {
    return false;
  }
  if (type === "assigned_coaching" && prefs.orgControls?.suppressCoachingPush) {
    return false;
  }
  return true;
}

export type DeepLinkAuthContext = {
  authenticated: boolean;
  canUseFieldKit: boolean;
  /** Session org */
  organizationId?: number;
  /** Optional org claimed by the notification payload */
  notificationOrganizationId?: number;
  /** Target still exists */
  targetExists?: boolean;
};

export type DeepLinkResolveResult =
  | { ok: true; webPath: string; mobilePath: string; requiresFieldKit: boolean }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "FIELD_KIT_DENIED"
        | "WRONG_ORGANIZATION"
        | "TARGET_DELETED"
        | "UNKNOWN_LINK";
      message: string;
      fallbackWebPath: string;
      fallbackMobilePath: string;
    };

const DEEP_LINK_MAP: Record<
  NotificationDeepLink["key"],
  { web: string; mobile: string; requiresFieldKit: boolean }
> = {
  command: {
    web: "/tools/sales-workflow",
    mobile: "/(tabs)/command",
    requiresFieldKit: true,
  },
  weekly_plan: {
    web: "/tools/weekly-plan-builder",
    mobile: "/tool/weekly",
    requiresFieldKit: true,
  },
  portal: { web: "/portal", mobile: "/(tabs)", requiresFieldKit: false },
  account: { web: "/account", mobile: "/(tabs)/account", requiresFieldKit: false },
  resources: {
    web: "/resources",
    mobile: "/(tabs)/learn",
    requiresFieldKit: false,
  },
  tools: { web: "/tools", mobile: "/(tabs)/tools", requiresFieldKit: false },
  login: { web: "/login", mobile: "/login", requiresFieldKit: false },
};

/**
 * Secure deep-link resolution: auth, entitlement, tenant match, deleted targets.
 */
export function resolveNotificationDeepLink(
  deepLink: NotificationDeepLink | null | undefined,
  ctx: DeepLinkAuthContext,
): DeepLinkResolveResult {
  if (!deepLink?.key || !DEEP_LINK_MAP[deepLink.key]) {
    return {
      ok: false,
      code: "UNKNOWN_LINK",
      message: "Unknown notification destination.",
      fallbackWebPath: "/portal",
      fallbackMobilePath: "/(tabs)",
    };
  }

  const dest = DEEP_LINK_MAP[deepLink.key];

  if (!ctx.authenticated) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Sign in to open this notification.",
      fallbackWebPath: `/login?next=${encodeURIComponent(dest.web)}`,
      fallbackMobilePath: "/login",
    };
  }

  if (
    ctx.notificationOrganizationId != null &&
    ctx.organizationId != null &&
    ctx.notificationOrganizationId !== ctx.organizationId
  ) {
    return {
      ok: false,
      code: "WRONG_ORGANIZATION",
      message: "This notification belongs to a different organization.",
      fallbackWebPath: "/portal",
      fallbackMobilePath: "/(tabs)",
    };
  }

  if (ctx.targetExists === false) {
    return {
      ok: false,
      code: "TARGET_DELETED",
      message: "That item is no longer available.",
      fallbackWebPath: "/portal",
      fallbackMobilePath: "/(tabs)",
    };
  }

  if (dest.requiresFieldKit && !ctx.canUseFieldKit) {
    return {
      ok: false,
      code: "FIELD_KIT_DENIED",
      message: "Hospice Sales Pro access is required for this destination.",
      fallbackWebPath: "/account",
      fallbackMobilePath: "/(tabs)/account",
    };
  }

  return {
    ok: true,
    webPath: dest.web,
    mobilePath: dest.mobile,
    requiresFieldKit: dest.requiresFieldKit,
  };
}

export function buildDedupeKey(
  type: NotificationType,
  ref: string,
  dayKey?: string,
): string {
  const day = dayKey || new Date().toISOString().slice(0, 10);
  return `${type}:${ref}:${day}`.slice(0, 200);
}

export function materializeEvaluationNotification(input: {
  organizationId: number;
  trialEndsAt: Date | string | null | undefined;
  now?: Date;
}): {
  type: NotificationType;
  titleSafe: string;
  bodySafe: string;
  deepLink: NotificationDeepLink;
  dedupeKey: string;
  expiresAt: Date;
} | null {
  if (!input.trialEndsAt) return null;
  const ends = new Date(input.trialEndsAt);
  const now = input.now || new Date();
  const ms = ends.getTime() - now.getTime();
  if (ms <= 0 || ms > 7 * 24 * 60 * 60 * 1000) return null;
  const copy = safeCopyForType("evaluation_expiration");
  return {
    type: "evaluation_expiration",
    ...copy,
    dedupeKey: buildDedupeKey(
      "evaluation_expiration",
      `org-${input.organizationId}`,
      ends.toISOString().slice(0, 10),
    ),
    expiresAt: ends,
  };
}
