/**
 * Routes notification taps + scheme URLs into the app.
 */
import React, { useEffect, useRef } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  deepLinkFromNotificationData,
  parseDeepLink,
  targetToHref,
} from "@/lib/deepLinks";
import { flushGenerateQueue } from "@/lib/offlineQueue";
import { removeReminderFromHistory } from "@/lib/notifications";

function navigateTarget(
  target: ReturnType<typeof parseDeepLink>,
  usedRef: React.MutableRefObject<boolean>,
) {
  if (!target) return;
  // Allow multiple navigations after cold start settle
  try {
    router.push(targetToHref(target) as any);
    usedRef.current = true;
  } catch {
    // router may not be ready
  }
}

export function DeepLinkRouter() {
  const handledInitial = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const handleUrl = (url: string | null) => {
      navigateTarget(parseDeepLink(url), handledInitial);
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
        setTimeout(() => navigateTarget(target, handledInitial), 300);
      }
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || handledInitial.current) return;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const target = deepLinkFromNotificationData(data);
      if (target) setTimeout(() => navigateTarget(target, handledInitial), 500);
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
