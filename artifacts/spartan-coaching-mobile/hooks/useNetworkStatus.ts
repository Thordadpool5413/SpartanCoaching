import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { getBaseUrl } from "@/lib/api";

const CONNECTIVITY_TIMEOUT_MS = 5000;

type NetworkStatus = {
  isOnline: boolean;
  isChecking: boolean;
  refresh: () => Promise<boolean>;
};

function browserReportsOffline(): boolean {
  if (Platform.OS !== "web") return false;
  const browser = globalThis as typeof globalThis & {
    navigator?: { onLine?: boolean };
  };
  return browser.navigator?.onLine === false;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (browserReportsOffline()) {
      if (mounted.current) {
        setIsOnline(false);
        setIsChecking(false);
      }
      return false;
    }

    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      if (mounted.current) {
        setIsOnline(false);
        setIsChecking(false);
      }
      return false;
    }

    if (mounted.current) setIsChecking(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/api/client-config`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const reachable = response.ok;
      if (mounted.current) setIsOnline(reachable);
      return reachable;
    } catch {
      if (mounted.current) setIsOnline(false);
      return false;
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  return { isOnline, isChecking, refresh };
}
