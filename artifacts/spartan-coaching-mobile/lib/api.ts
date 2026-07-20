import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "spartan_session_token";

const getBase = () =>
  process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

export async function getSessionToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type MobileAuthUser = {
  member: {
    id: number;
    email: string;
    name: string;
    role: string;
    organizationId: number;
    status: string;
  };
  organization: {
    id: number;
    name: string;
    type: string;
    seatLimit: number;
    status: string;
    trialEndsAt?: string | null;
  } | null;
  fieldKit: {
    allowed: boolean;
    reason?: string | null;
    trialEndsAt?: string | null;
    hoursRemaining?: number | null;
  };
};

export async function loginMobile(email: string, password: string): Promise<MobileAuthUser & { token: string }> {
  const res = await fetch(`${getBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed");
  if (data.token) await setSessionToken(data.token);
  return data;
}

export async function logoutMobile(): Promise<void> {
  try {
    await apiPost("/api/auth/logout", {});
  } catch {
    // ignore
  }
  await setSessionToken(null);
}

export async function fetchMeMobile(): Promise<MobileAuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    return await apiGet<MobileAuthUser>("/api/auth/me");
  } catch {
    await setSessionToken(null);
    return null;
  }
}
