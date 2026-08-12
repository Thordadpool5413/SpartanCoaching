/**
 * Client for HSP-38 notifications + preferences API.
 */

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  deepLink: { key: string; ref?: string };
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  schemaVersion: 1;
  enabled: boolean;
  lockScreenMinimal: boolean;
  channels: { inApp: boolean; push: boolean; email: boolean };
  types: Record<string, boolean>;
  orgControls?: {
    suppressOrgContentPush?: boolean;
    suppressCoachingPush?: boolean;
  };
};

export type NotificationsResponse = {
  version: string;
  preferences: NotificationPreferences;
  types: string[];
  unreadCount: number;
  items: NotificationItem[];
};

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/v1/notifications", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

export async function updateNotificationPreferences(
  body: Partial<NotificationPreferences> & {
    channels?: Partial<NotificationPreferences["channels"]>;
    types?: Record<string, boolean>;
    orgControls?: NotificationPreferences["orgControls"];
  },
): Promise<{ preferences: NotificationPreferences }> {
  const res = await fetch("/api/v1/notifications/preferences", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to save notification preferences");
  return res.json();
}

export async function notificationAction(body: {
  action: "mark_read" | "mark_all_read" | "resolve_deep_link" | "seed_demo";
  id?: number;
  deepLink?: { key: string; ref?: string };
  type?: string;
}): Promise<{
  ok?: boolean;
  resolved?: {
    ok: boolean;
    webPath?: string;
    mobilePath?: string;
    fallbackWebPath?: string;
    code?: string;
    message?: string;
  };
}> {
  const res = await fetch("/api/v1/notifications/actions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Notification action failed");
  return res.json();
}
