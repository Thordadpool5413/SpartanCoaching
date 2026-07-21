/**
 * Admin API helper — session cookie only (platform_admin).
 * Never embeds a default shared password in the client bundle.
 */

const ADMIN_FLAG_KEY = "spartan-admin-auth";

export function markAdminSession() {
  try {
    sessionStorage.setItem(ADMIN_FLAG_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearAdminSessionFlag() {
  try {
    sessionStorage.removeItem(ADMIN_FLAG_KEY);
    localStorage.removeItem(ADMIN_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

export function hasAdminSessionFlag(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_FLAG_KEY) === "1" || localStorage.getItem(ADMIN_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

export async function adminFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      /* plain text */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as T;
}

export async function adminGet<T = any>(url: string): Promise<T> {
  return adminFetch<T>(url);
}
