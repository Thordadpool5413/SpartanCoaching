/**
 * Routes notification taps + scheme URLs into the app.
 * HSP-38: unauthenticated deep links land on login; Field Kit destinations
 * fall back to account when access is denied.
 */
import React, { useEffect, useRef } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  deepLinkFromNotificationData,
  parseDeepLink,
  targetToHref,
  type DeepTarget,
} from "@/lib/deepLinks";
import { flushGenerateQueue } from "@/lib/offlineQueue";
import { removeReminderFromHistory } from "@/lib/notifications";
import { useAuth } from "@/lib/AuthContext";

function navigateTarget(
  target: DeepTarget | null,
  usedRef: React.MutableRefObject<boolean>,
  opts?: { authenticated?: boolean; canUseFieldKit?: boolean },
) {
  if (!target) return;
  let next: DeepTarget = target;
  // Expired / logged-out session → login (never open protected tools cold)
  const publicTarget = target.pathname === "/login" || target.pathname === "/reset-password" || target.pathname === "/membership" || target.pathname.startsWith("/(tabs)");
  if (!opts?.authenticated && !publicTarget) {
    next = { pathname: "/login" };
  } else if (
    opts?.authenticated &&
    !opts.canUseFieldKit &&
    (target.pathname.includes("sales-workflow") ||
      target.pathname.startsWith("/tool/") ||
      target.pathname.includes("command"))
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
  const { isAuthenticated, canUseFieldKit } = useAuth();
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
    });

    const linkSub = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.identifier;
      void removeReminderFromHistory(id);
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const target = deepLinkFromNotificationData(data);
      if (target) {
        // Defer slightly so tabs mount
        setTimeout(() => navigateTarget(target, handledInitial, authOpts()), 300);
      }
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || handledInitial.current) return;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const target = deepLinkFromNotificationData(data);
      if (target) setTimeout(() => navigateTarget(target, handledInitial, authOpts()), 500);
    });

    // Flush offline generate queue when app becomes active
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void flushGenerateQueue();
      }
    });
    void flushGenerateQueue();

    return () => {
      linkSub.remove();
      responseSub.remove();
      appSub.remove();
    };
  }, []);

  return null;
}
