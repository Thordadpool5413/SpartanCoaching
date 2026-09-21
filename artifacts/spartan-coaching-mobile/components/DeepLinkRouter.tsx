/**
 * Routes notification taps + scheme URLs into the app.
 * HSP-38: unauthenticated deep links land on login; Field Kit destinations
 * fall back to account when access is denied.
 */
import React, { useEffect, useRef } from "react";
import { Linking, Platform } from "react-native";
import { router } from "expo-router";
import {
  deepLinkFromNotificationData,
  parseDeepLink,
  requiresAuthenticationForTarget,
  requiresFieldKitTarget,
  serializeLoginReturnTarget,
  targetToHref,
  type DeepTarget,
} from "@/lib/deepLinks";
import { clearGenerateQueue } from "@/lib/offlineQueue";
import { clearLegacyGeneratedToolStorage } from "@/lib/generatedToolPrivacy";
import { useAuth } from "@/lib/AuthContext";

function navigateTarget(
  target: DeepTarget | null,
  usedRef: React.MutableRefObject<boolean>,
  opts?: { authenticated?: boolean; canUseFieldKit?: boolean },
) {
  if (!target) return;
  let next: DeepTarget = target;
  // Expired / logged-out session → login (never open protected tools cold)
  if (!opts?.authenticated && requiresAuthenticationForTarget(target)) {
    next = {
      pathname: "/login",
      params: { next: serializeLoginReturnTarget(target) },
    };
  } else if (
    opts?.authenticated &&
    !opts.canUseFieldKit &&
    requiresFieldKitTarget(target)
  ) {
    next = { pathname: "/(tabs)/account" };
  }
  try {
    router.push(targetToHref(next) as any);
    usedRef.current = true;
  } catch {
    // router may not be ready
  }
}

export function DeepLinkRouter() {
  const handledInitial = useRef(false);
  const { isAuthenticated, canUseFieldKit, user } = useAuth();
  const authRef = useRef({ isAuthenticated, canUseFieldKit });
  authRef.current = { isAuthenticated, canUseFieldKit };

  useEffect(() => {
    if (Platform.OS === "web") return;

    const authOpts = () => ({
      authenticated: authRef.current.isAuthenticated,
      canUseFieldKit: authRef.current.canUseFieldKit,
    });

    const handleUrl = (url: string | null) => {
      navigateTarget(parseDeepLink(url), handledInitial, authOpts());
    };

    void Linking.getInitialURL().then((url) => {
      if (url && !handledInitial.current) handleUrl(url);
    }).catch(() => undefined);

    const linkSub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    let cancelled = false;
    let responseSub: { remove: () => void } | undefined;

    // Notifications are useful, but they are not allowed to sit on the native
    // startup path. A missing or mismatched optional module must never prevent
    // the first frame from rendering in a TestFlight build.
    void Promise.all([
      import("expo-notifications"),
      import("@/lib/notifications"),
    ]).then(([Notifications, { removeReminderFromHistory }]) => {
      if (cancelled) return;

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const id = response.notification.request.identifier;
        void removeReminderFromHistory(id);
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        const target = deepLinkFromNotificationData(data);
        if (target) {
          // Defer slightly so tabs mount.
          setTimeout(() => navigateTarget(target, handledInitial, authOpts()), 300);
        }
      });

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response || handledInitial.current) return;
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        const target = deepLinkFromNotificationData(data);
        if (target) setTimeout(() => navigateTarget(target, handledInitial, authOpts()), 500);
      }).catch(() => undefined);
    }).catch(() => undefined);

    // Retire raw request bodies that may have been queued by an earlier
    // version before any retry can send them from this device.
    void clearGenerateQueue();
    void clearLegacyGeneratedToolStorage();

    return () => {
      linkSub.remove();
      cancelled = true;
      responseSub?.remove();
    };
  }, [user?.member.id]);

  return null;
}
