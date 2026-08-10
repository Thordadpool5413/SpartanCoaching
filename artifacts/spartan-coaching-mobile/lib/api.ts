import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "spartan_session_token";

/**
 * Production builds must set EXPO_PUBLIC_API_URL (full origin) or EXPO_PUBLIC_DOMAIN (host only).
 * Prefer EXPO_PUBLIC_API_URL=https://your-host.example
 * See artifacts/spartan-coaching-mobile/store/README.md for EAS secrets.
 */
export function getBaseUrl(): string {
  const full = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (full) return full.replace(/\/$/, "");
  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (domain) {
    if (domain.startsWith("http://") || domain.startsWith("https://")) {
      return domain.replace(/\/$/, "");
    }
    return `https://${domain}`;
  }
  return "";
}

if (!getBaseUrl()) {
  console.error(
    "[Spartan] EXPO_PUBLIC_API_URL / EXPO_PUBLIC_DOMAIN is not set — API calls will fail. " +
      "Set an EAS secret before TestFlight/production builds.",
  );
}

const getBase = () => getBaseUrl();

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
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

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readApiError(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => res.statusText);
  try {
    const json = JSON.parse(text) as {
      error?: string | { message?: string; code?: string };
      code?: string;
    };
    const message =
      typeof json.error === "string"
        ? json.error
        : json.error?.message || res.statusText;
    const code =
      typeof json.error === "object" ? json.error?.code : json.code;
    return new ApiError(message, res.status, code);
  } catch {
    return new ApiError(text || res.statusText, res.status);
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { idempotencyKey?: string },
): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "POST",
    headers: await authHeaders(
      options?.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : undefined,
    ),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await readApiError(res);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw await readApiError(res);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await readApiError(res);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw await readApiError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function uploadToSignedUrl(
  url: string,
  body: Blob,
  contentType: string,
): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  });
  if (!res.ok) throw new ApiError("Secure upload failed", res.status, "UPLOAD_FAILED");
}

export type MobileMember = {
  id: number;
  email: string;
  name: string;
  role: string;
  organizationId: number;
  status: string;
  jobRole?: string | null;
  territoryNote?: string | null;
  topObjections?: string | null;
  checklistProgress?: Record<string, boolean | string>;
  checklistDone?: number;
  activated?: boolean;
  lastLoginAt?: string | null;
};

export type MobileOrganization = {
  id: number;
  name: string;
  type: string;
  seatLimit: number;
  status: string;
  trialEndsAt?: string | null;
  pipelineStatus?: string | null;
  billingPlan?: string | null;
  billingStatus?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  billableSeats?: number | null;
  contractRef?: string | null;
  hasStripeCustomer?: boolean;
  hasStripeSubscription?: boolean;
};

export type MobileAuthUser = {
  member: MobileMember;
  organization: MobileOrganization | null;
  fieldKit: {
    allowed: boolean;
    reason?: string | null;
    trialEndsAt?: string | null;
    hoursRemaining?: number | null;
  };
};

/** Billing status from GET /api/billing/status */
export type BillingStatus = {
  configured: boolean;
  individualWeeklyPriceConfigured: boolean;
  canCheckoutIndividual: boolean;
  canOpenPortal: boolean;
  organization: {
    id: number;
    type: string;
    status: string;
    billingPlan: string | null;
    billingStatus: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasStripeCustomer: boolean;
    hasStripeSubscription: boolean;
    billableSeats: number | null;
    seatLimit: number;
    contractRef: string | null;
  };
};

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  try {
    return await apiGet<BillingStatus>("/api/billing/status");
  } catch {
    return null;
  }
}

/** Start individual weekly Checkout ($14.99/wk). Returns Stripe-hosted URL. */
export async function startIndividualCheckout(): Promise<{ url: string }> {
  const site = getWebSiteUrl();
  // Bridge page opens app deep link after Stripe (see CheckoutReturn.tsx).
  return apiPost<{ url: string }>("/api/billing/checkout", {
    successUrl: `${site}/checkout-return?from=app&activated=1`,
    cancelUrl: `${site}/account?billing=canceled&from=app`,
  });
}

/** Open Stripe Customer Portal (cancel / update card). */
export async function openBillingPortal(): Promise<{ url: string }> {
  return apiPost<{ url: string }>("/api/billing/portal", {});
}

/** Site origin for membership / account deep links in the browser. */
export function getWebSiteUrl(): string {
  return getBaseUrl() || "https://spartanhospicecoaching.com";
}

export async function loginMobile(email: string, password: string): Promise<MobileAuthUser & { token: string }> {
  const res = await fetch(`${getBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string | { message?: string; code?: string };
    code?: string;
    token?: string;
    member?: MobileMember;
    organization?: MobileOrganization | null;
    fieldKit?: MobileAuthUser["fieldKit"];
    expiresAt?: string;
  };
  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "Login failed";
    const code =
      typeof data.error === "object" ? data.error?.code : data.code;
    throw new ApiError(message, res.status, code);
  }
  if (data.token) await setSessionToken(data.token);
  return data as MobileAuthUser & { token: string };
}

export async function logoutMobile(): Promise<void> {
  try {
    await apiPost("/api/auth/logout", {});
  } catch {
    // ignore
  }
  await setSessionToken(null);
}

/** Membership identity export (no PHI / password hashes). */
export async function exportAccountDataMobile(): Promise<unknown> {
  return apiGet("/api/auth/account/export");
}

/** Soft-delete account (server requires password + confirmation DELETE). */
export async function deleteAccountMobile(
  password: string,
): Promise<{ ok: boolean; deleted?: boolean }> {
  const result = await apiPost<{ ok: boolean; deleted?: boolean }>(
    "/api/auth/account/delete",
    { password, confirmation: "DELETE" },
  );
  await setSessionToken(null);
  return result;
}

/** Rotate session token for longer field sessions (web + iOS shared identity). */
export async function refreshSessionMobile(): Promise<{ token: string; expiresAt: string }> {
  const data = await apiPost<{ token: string; expiresAt: string }>(
    "/api/auth/session/refresh",
    {},
  );
  if (data.token) await setSessionToken(data.token);
  return data;
}

export async function fetchMeMobile(): Promise<MobileAuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    return await apiGet<MobileAuthUser>("/api/auth/me");
  } catch (e: unknown) {
    // Only clear the session on explicit unauthenticated responses.
    // Network blips / 5xx must not log field users out.
    if (e instanceof ApiError && e.status === 401) {
      await setSessionToken(null);
      return null;
    }
    throw e;
  }
}

export async function fetchOnboardingMobile(): Promise<{ member: MobileMember }> {
  return apiGet("/api/me/onboarding");
}

export async function updateOnboardingMobile(body: {
  jobRole?: string | null;
  territoryNote?: string | null;
  topObjections?: string | null;
  checklistItem?: { id: string; done: boolean };
}): Promise<{ member: MobileMember }> {
  return apiPatch("/api/me/onboarding", body);
}
