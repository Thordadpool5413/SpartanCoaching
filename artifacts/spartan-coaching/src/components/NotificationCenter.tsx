/**
 * In-app notification center + preference toggles (HSP-38).
 * Lock-screen-safe titles/bodies only; deep links resolved with auth checks.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, CheckCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  fetchNotifications,
  notificationAction,
  updateNotificationPreferences,
  type NotificationItem,
  type NotificationPreferences,
  type NotificationsResponse,
} from "@/lib/notificationsClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { isAuthenticated, member } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      return;
    }
    try {
      setError(null);
      const res = await fetchNotifications();
      setData(res);
    } catch {
      setError("Could not load notifications.");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  if (!isAuthenticated) return null;

  const unread = data?.unreadCount ?? 0;

  const openItem = async (item: NotificationItem) => {
    try {
      const res = await notificationAction({
        action: "resolve_deep_link",
        id: item.id,
      });
      const resolved = res.resolved;
      if (resolved?.ok && resolved.webPath) {
        setOpen(false);
        setLocation(resolved.webPath);
      } else if (resolved && !resolved.ok) {
        setError(resolved.message || "Could not open notification.");
        if (resolved.fallbackWebPath) {
          setOpen(false);
          setLocation(resolved.fallbackWebPath);
        }
      }
      void reload();
    } catch {
      setError("Could not open notification.");
    }
  };

  const savePrefs = async (patch: Partial<NotificationPreferences>) => {
    try {
      const res = await updateNotificationPreferences(patch);
      setData((prev) =>
        prev ? { ...prev, preferences: res.preferences } : prev,
      );
    } catch {
      setError("Could not save preferences.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unread > 0
              ? `Notifications, ${unread} unread`
              : "Notifications"
          }
          data-testid="workspace-notifications"
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 ? (
            <span
              className="absolute top-1 right-1 min-w-[1rem] h-4 px-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center"
              aria-hidden
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0" data-testid="notification-center">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Notifications
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Notification preferences"
              onClick={() => setPrefsOpen((v) => !v)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={() =>
                void notificationAction({ action: "mark_all_read" }).then(reload)
              }
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" aria-hidden />
              Mark all read
            </Button>
          </div>
        </div>

        {prefsOpen && data?.preferences ? (
          <div className="px-3 py-3 border-b border-border space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground">Preference center</p>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="notif-enabled" className="text-xs">
                Enable notifications
              </Label>
              <Switch
                id="notif-enabled"
                checked={data.preferences.enabled}
                onCheckedChange={(v) => void savePrefs({ enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="notif-lock" className="text-xs">
                Lock-screen minimal (no sensitive detail)
              </Label>
              <Switch
                id="notif-lock"
                checked={data.preferences.lockScreenMinimal}
                onCheckedChange={(v) => void savePrefs({ lockScreenMinimal: v })}
              />
            </div>
            {(member?.role === "org_admin" || member?.role === "platform_admin") && (
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="notif-org-content" className="text-xs">
                  Suppress org content pushes
                </Label>
                <Switch
                  id="notif-org-content"
                  checked={!!data.preferences.orgControls?.suppressOrgContentPush}
                  onCheckedChange={(v) =>
                    void savePrefs({
                      orgControls: {
                        ...data.preferences.orgControls,
                        suppressOrgContentPush: v,
                      },
                    })
                  }
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug">
              Copy never includes patient or facility names. Deep links re-check sign-in and access.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="max-h-[min(50dvh,22rem)] overflow-y-auto">
          {!data?.items?.length ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              No notifications yet. Workflow alerts appear here when follow-ups, plans, or access
              need attention.
            </p>
          ) : (
            <ul>
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                      !item.readAt && "bg-primary/[0.04]",
                    )}
                    onClick={() => void openItem(item)}
                  >
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {item.body}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-3 py-2 border-t border-border">
          <Link
            href="/account"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            Account & access settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
