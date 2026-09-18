/**
 * Fetch server delivery config (HSP-44).
 * Compatibility is decided by the API — app only surfaces the result.
 */
import Constants from "expo-constants";
import { getBaseUrl, getSessionToken } from "@/lib/api";
import {
  API_CONTRACT_VERSION,
  type CompatibilityCheck,
} from "@workspace/field-kit-catalog";

export type ClientConfig = {
  environment: string;
  apiContractVersion: number;
  minIosAppVersion: string;
  enforceMinIosVersion: boolean;
  flags: Record<string, boolean>;
  compatibility?: { ios?: CompatibilityCheck };
  rollback?: { ios?: string };
};

export const CONSULTATION_BOOKING_FLAG = "consultation_booking" as const;
const CLIENT_CONFIG_TIMEOUT_MS = 12_000;

let cached: ClientConfig | null = null;

export function getAppVersion(): string {
  return (
    Constants.expoConfig?.version ||
    Constants.nativeAppVersion ||
    "1.0.0"
  );
}

export function getCachedClientConfig(): ClientConfig | null {
  return cached;
}

export function isFlagEnabled(key: string, fallback = true): boolean {
  if (!cached?.flags) return fallback;
  if (typeof cached.flags[key] === "boolean") return cached.flags[key]!;
  return fallback;
}

/** Headers for API calls so the server can enforce min version when configured. */
export function clientIdentityHeaders(): Record<string, string> {
  return {
    "X-Client-Platform": "ios",
    "X-Client-Version": getAppVersion(),
    "X-Client-Api-Contract": String(API_CONTRACT_VERSION),
  };
}

/**
 * Load client-config from API. Never throws.
 * Returns null when offline / misconfigured base URL.
 */
export async function fetchClientConfig(): Promise<ClientConfig | null> {
  try {
    const base = getBaseUrl();
    if (!base) {
      cached = null;
      return null;
    }
    const token = await getSessionToken();
    const headers: Record<string, string> = {
      ...clientIdentityHeaders(),
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLIENT_CONFIG_TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/api/client-config`, {
        headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        cached = null;
        return null;
      }
      const data = (await res.json()) as ClientConfig;
      cached = data;
      return data;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    cached = null;
    return null;
  }
}
