import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { API_CONTRACT_VERSION } from "@workspace/field-kit-catalog";

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

function clientPlatformHeaders(): Record<string, string> {
  const version =
    Constants.expoConfig?.version || Constants.nativeAppVersion || "1.0.0";
  return {
    "X-Client-Platform": "ios",
    "X-Client-Version": version,
    "X-Client-Api-Contract": String(API_CONTRACT_VERSION),
  };
}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...clientPlatformHeaders(),
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

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await readApiError(res);
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

export async function transcribeAudio(uri: string): Promise<string> {
  const token = await getSessionToken();
  const form = new FormData();
  form.append("audio", {
    uri,
    name: `spartan-rehearsal-${Date.now()}.m4a`,
    type: "audio/m4a",
  } as unknown as Blob);
  const headers: Record<string, string> = clientPlatformHeaders();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${getBase()}/api/transcribe`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!response.ok) throw await readApiError(response);
  const value = (await response.json()) as { transcript?: string };
  if (!value.transcript?.trim()) {
    throw new ApiError("The recording did not contain clear speech.", 422, "EMPTY_TRANSCRIPT");
  }
  return value.transcript.trim();
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
  billingProvider?: string | null;
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
  appleBillingConfigured?: boolean;
  individualWeeklyPriceConfigured: boolean;
  individualWeeklyElitePriceConfigured?: boolean;
  canCheckoutIndividual: boolean;
  canOpenPortal: boolean;
  organization: {
    id: number;
    type: string;
    status: string;
    billingPlan: string | null;
    billingProvider?: string | null;
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

export type AppleBillingConfig = {
  configured: boolean;
  appAccountToken?: string;
  products: Array<{ id: string; tier: "standard" | "elite" }>;
};

export type AppleVerificationResult = {
  applied: boolean;
  verified?: boolean;
  active?: boolean;
  tier?: "standard" | "elite";
  productId?: string;
  expiresAt?: string;
};

export async function fetchAppleBillingCatalog(): Promise<AppleBillingConfig> {
  return apiGet<AppleBillingConfig>("/api/billing/apple/catalog");
}

export async function fetchAppleBillingConfig(): Promise<AppleBillingConfig> {
  return apiGet<AppleBillingConfig>("/api/billing/apple/config");
}

export async function verifyAppleTransaction(signedTransaction: string): Promise<AppleVerificationResult> {
  return apiPost<AppleVerificationResult>("/api/billing/apple/verify", { signedTransaction });
}

export async function verifyGuestAppleTransaction(
  signedTransaction: string,
  appAccountToken?: string,
): Promise<AppleVerificationResult> {
  return apiPost<AppleVerificationResult>("/api/billing/apple/guest-verify", {
    signedTransaction,
    ...(appAccountToken ? { appAccountToken } : {}),
  });
}

export async function claimAppleTransaction(
  signedTransaction: string,
  appAccountToken?: string,
): Promise<AppleVerificationResult> {
  return apiPost<AppleVerificationResult>("/api/billing/apple/claim", {
    signedTransaction,
    ...(appAccountToken ? { appAccountToken } : {}),
  });
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  try {
    return await apiGet<BillingStatus>("/api/billing/status");
  } catch {
    return null;
  }
}

/** Start individual weekly Checkout ($14.99/wk). Returns Stripe-hosted URL. */
export async function startIndividualCheckout(
  plan: "standard_weekly" | "elite_weekly" = "standard_weekly",
): Promise<{ url: string }> {
  const site = getWebSiteUrl();
  // Bridge page opens app deep link after Stripe (see CheckoutReturn.tsx).
  return apiPost<{ url: string }>("/api/billing/checkout", {
    plan,
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
    headers: {
      "Content-Type": "application/json",
      ...clientPlatformHeaders(),
    },
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

export async function registerMobile(input: {
  name: string;
  email: string;
  password: string;
}): Promise<MobileAuthUser & { token: string }> {
  const res = await fetch(`${getBase()}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...clientPlatformHeaders(),
    },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      acceptTerms: true,
      noPhi: true,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string | { message?: string; code?: string };
    code?: string;
    token?: string;
    member?: MobileMember;
    organization?: MobileOrganization | null;
    fieldKit?: MobileAuthUser["fieldKit"];
  };
  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "Account creation failed";
    const code = typeof data.error === "object" ? data.error?.code : data.code;
    throw new ApiError(message, res.status, code);
  }
  if (!data.token || !data.member) {
    throw new ApiError("Account creation did not return a valid session", 502);
  }
  await setSessionToken(data.token);
  return data as MobileAuthUser & { token: string };
}

export async function requestPasswordResetMobile(email: string): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${getBase()}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientPlatformHeaders() },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const data = await response.json().catch(() => ({})) as { ok?: boolean; message?: string; error?: string };
  if (!response.ok) throw new ApiError(data.error || "Password reset could not be requested", response.status);
  return { ok: true, message: data.message || "If an account exists for that email, a reset link has been sent." };
}

export async function resetPasswordMobile(input: { token: string; password: string }): Promise<{ ok: boolean }> {
  const response = await fetch(`${getBase()}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientPlatformHeaders() },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
  if (!response.ok) throw new ApiError(data.error || "Password could not be reset", response.status);
  return { ok: true };
}

export async function logoutMobile(): Promise<void> {
  try {
    await apiPost("/api/auth/logout", {});
  } catch {
    // ignore
  }
  await setSessionToken(null);
}

/**
 * Permanently close the membership account (App Store Guideline 5.1.1(v)).
 * Requires confirm: "DELETE". Clears local session on success.
 */
export async function deleteAccountMobile(): Promise<{ ok: boolean; message?: string }> {
  const result = await apiPost<{ ok: boolean; message?: string }>("/api/me/delete-account", {
    confirm: "DELETE",
  });
  await setSessionToken(null);
  return result;
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

export type MobileActivationView = {
  activated: boolean;
  skipped: boolean;
  role: string;
  nextStep: {
    id: string;
    title: string;
    why: string;
    mobileHref: string;
    webHref?: string;
  } | null;
  completedRequired: number;
  totalRequired: number;
};

export async function fetchOnboardingMobile(): Promise<{
  member: MobileMember;
  activation?: MobileActivationView;
}> {
  return apiGet("/api/me/onboarding");
}

export type ValueReceipt = {
  days: number;
  since: string;
  checklistDone: number;
  totalEvents: number;
  events: Array<{ eventType: string; eventName: string; count: number }>;
  highlights: string[];
};

export type AdminMetrics = {
  requests: { total: number; pending: number; approved: number; rejected: number };
  organizations: { total: number; trial: number; active: number; expired: number; suspended: number };
  members: { total: number; active: number; loggedIn7d: number };
  toolUsesLast7Days: number;
};

export type AdminOrganizationSummary = {
  id: number;
  name: string;
  status: string;
  type: string;
  memberCount?: number;
  activatedCount?: number;
};

export type AccessRequestSummary = {
  id: number;
  name: string;
  email: string;
  type: string;
  companyName?: string | null;
  status: string;
  createdAt?: string;
};

export type OrgMemberSummary = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
};

export async function fetchPlatformAdminOverview() {
  const [metrics, organizations, requests] = await Promise.all([
    apiGet<AdminMetrics>("/api/admin/access-metrics"),
    apiGet<{ organizations: AdminOrganizationSummary[] }>("/api/admin/organizations"),
    apiGet<{ requests: AccessRequestSummary[] }>("/api/admin/access-requests"),
  ]);
  return {
    metrics,
    organizations: organizations.organizations,
    requests: requests.requests,
  };
}

export async function fetchOrganizationAdminOverview() {
  const [members, usage] = await Promise.all([
    apiGet<{ members: OrgMemberSummary[]; invites: Array<{ id: number; email: string; role: string; status: string }>; seatLimit: number }>("/api/org/members"),
    apiGet<{ total: number; days: number; byTool: Array<{ toolName: string; count: number }>; byMember: Array<{ email: string; count: number }> }>("/api/org/usage"),
  ]);
  return { ...members, usage };
}

export async function inviteOrganizationMember(input: { name: string; email: string; role?: "member" | "org_admin" }) {
  return apiPost<{ ok: boolean; member: OrgMemberSummary }>("/api/org/invites", {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role || "member",
  });
}

export async function setOrganizationMemberEnabled(memberId: number, enabled: boolean) {
  return apiPost<{ ok: boolean }>(`/api/org/members/${memberId}/${enabled ? "enable" : "disable"}`, {});
}

/** Craft Phase 4 — weekly value receipt (subscription theater). */
export async function fetchValueReceipt(): Promise<ValueReceipt | null> {
  try {
    return await apiGet<ValueReceipt>("/api/me/value-receipt");
  } catch {
    return null;
  }
}

export async function updateOnboardingMobile(body: {
  jobRole?: string | null;
  territoryNote?: string | null;
  topObjections?: string | null;
  checklistItem?: { id: string; done: boolean };
  activationStep?: { id: string; done: boolean };
  skipActivation?: boolean;
}): Promise<{ member: MobileMember; activation?: MobileActivationView }> {
  return apiPatch("/api/me/onboarding", body);
}
