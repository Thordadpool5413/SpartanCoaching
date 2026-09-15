/**
 * Paths both web and iOS use for the same business facts.
 * Used by contract tests and smoke-parity alignment.
 * Not a full OpenAPI — Express+Zod remains route SoT.
 */

export type SharedApiPath = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  /** Requires session (cookie or Bearer) */
  auth: "none" | "session" | "field_kit" | "org_admin" | "platform_admin";
  /** Both clients depend on this contract */
  clients: readonly ("web" | "ios")[];
  notes?: string;
};

export const MEDICARE_API_ROOT = "/api/v1/medicare";
export type MedicareRuntimeOperationKey =
  | "dashboard"
  | "provider"
  | "county"
  | "hospital"
  | "physicians"
  | "physician"
  | "physician-warehouse-status"
  | "provider-search"
  | "intelligence"
  | "ssvi"
  | "hcris"
  | "hcris-routing"
  | "service-geography"
  | "white-space"
  | "expansion-screening"
  | "territory-deployment"
  | "territory-map"
  | "territory-deployment-private"
  | "capabilities"
  | "provider-history"
  | "source-health"
  | "competition-coverage-status"
  | "system-diagnostics"
  | "decision-actions"
  | "watchlist"
  | "alerts"
  | "winloss";

export type MedicareRuntimePathInput = {
  ccn?: string;
  fips?: string;
  npi?: string;
  state?: string;
  q?: string;
  force?: boolean;
  detail?: boolean;
  deep?: boolean;
};

function withQuery(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.trim()) params.set(key, value);
  }
  return params.size ? `${path}?${params.toString()}` : path;
}

export function buildMedicareRuntimePath(
  operation: MedicareRuntimeOperationKey,
  input: MedicareRuntimePathInput = {},
) {
  switch (operation) {
    case "dashboard":
      return withQuery(`${MEDICARE_API_ROOT}/dashboard`, { state: input.state, ccn: input.ccn });
    case "provider":
      return `${MEDICARE_API_ROOT}/provider/${encodeURIComponent(String(input.ccn || ""))}`;
    case "county":
      return `${MEDICARE_API_ROOT}/county/${encodeURIComponent(String(input.fips || ""))}`;
    case "hospital":
      return `${MEDICARE_API_ROOT}/hospital/${encodeURIComponent(String(input.ccn || ""))}`;
    case "physicians":
      return `${MEDICARE_API_ROOT}/physicians/${encodeURIComponent(String(input.state || ""))}`;
    case "physician":
      return `${MEDICARE_API_ROOT}/physician/${encodeURIComponent(String(input.npi || ""))}`;
    case "physician-warehouse-status":
      return `${MEDICARE_API_ROOT}/physician-warehouse-status`;
    case "provider-search":
      return withQuery(`${MEDICARE_API_ROOT}/provider-search`, { q: input.q, state: input.state });
    case "intelligence":
      return withQuery(`${MEDICARE_API_ROOT}/intelligence`, { ccn: input.ccn, state: input.state, force: input.force ? "1" : undefined });
    case "ssvi":
      return withQuery(`${MEDICARE_API_ROOT}/ssvi/${encodeURIComponent(String(input.ccn || ""))}`, { force: input.force ? "1" : undefined });
    case "hcris":
      return withQuery(`${MEDICARE_API_ROOT}/hcris/${encodeURIComponent(String(input.ccn || ""))}`, { detail: input.detail ? "1" : undefined, force: input.force ? "1" : undefined });
    case "hcris-routing":
      return `${MEDICARE_API_ROOT}/hcris-routing/${encodeURIComponent(String(input.ccn || ""))}`;
    case "service-geography":
      return withQuery(`${MEDICARE_API_ROOT}/service-geography/${encodeURIComponent(String(input.ccn || ""))}`, { force: input.force ? "1" : undefined });
    case "white-space":
      return withQuery(`${MEDICARE_API_ROOT}/white-space/${encodeURIComponent(String(input.ccn || ""))}`, { state: input.state, force: input.force ? "1" : undefined });
    case "expansion-screening":
      return withQuery(`${MEDICARE_API_ROOT}/expansion-screening/${encodeURIComponent(String(input.ccn || ""))}`, { state: input.state });
    case "territory-deployment":
      return withQuery(`${MEDICARE_API_ROOT}/territory-deployment/${encodeURIComponent(String(input.ccn || ""))}`, { state: input.state });
    case "territory-map":
      return withQuery(`${MEDICARE_API_ROOT}/territory-map/${encodeURIComponent(String(input.state || ""))}`, { force: input.force ? "1" : undefined });
    case "territory-deployment-private":
      return withQuery(`${MEDICARE_API_ROOT}/territory-deployment-private/${encodeURIComponent(String(input.ccn || ""))}`, { state: input.state });
    case "capabilities":
      return withQuery(`${MEDICARE_API_ROOT}/capabilities/${encodeURIComponent(String(input.ccn || ""))}`, { deep: input.deep ? "1" : undefined });
    case "provider-history":
      return `${MEDICARE_API_ROOT}/provider-history/${encodeURIComponent(String(input.ccn || ""))}`;
    case "source-health":
      return withQuery(`${MEDICARE_API_ROOT}/source-health`, { force: input.force ? "1" : undefined });
    case "competition-coverage-status":
      return `${MEDICARE_API_ROOT}/competition-coverage-status`;
    case "system-diagnostics":
      return withQuery(`${MEDICARE_API_ROOT}/system-diagnostics`, { state: input.state, ccn: input.ccn });
    case "decision-actions":
      return withQuery(`${MEDICARE_API_ROOT}/decision-actions`, { ccn: input.ccn });
    case "watchlist":
      return withQuery(`${MEDICARE_API_ROOT}/watchlist`, { ccn: input.ccn });
    case "alerts":
      return `${MEDICARE_API_ROOT}/alerts`;
    case "winloss":
      return withQuery(`${MEDICARE_API_ROOT}/winloss`, { ccn: input.ccn });
  }
}

export const MEDICARE_SHARED_API_PATHS: readonly SharedApiPath[] = [
  { method: "GET", path: `${MEDICARE_API_ROOT}/dashboard`, auth: "field_kit", clients: ["web", "ios"], notes: "Shared Medicare market context" },
  { method: "GET", path: `${MEDICARE_API_ROOT}/provider/:ccn`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/intelligence`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/hcris/:ccn`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/service-geography/:ccn`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/territory-deployment/:ccn`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/territory-deployment-private/:ccn`, auth: "field_kit", clients: ["web", "ios"], notes: "Requires signed-in private operating context" },
  { method: "GET", path: `${MEDICARE_API_ROOT}/watchlist`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/decision-actions`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/system-diagnostics`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/competition-coverage-status`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/provider-history/:ccn`, auth: "field_kit", clients: ["web", "ios"] },
  { method: "GET", path: `${MEDICARE_API_ROOT}/alerts`, auth: "field_kit", clients: ["web", "ios"] },
] as const;

export const MEMBER_WORK_ERROR_CODES = [
  "UNAUTHORIZED",
  "INVALID_ID",
  "INVALID_INPUT",
  "INVALID_IDEMPOTENCY_KEY",
  "POTENTIAL_PHI_DETECTED",
  "NOT_FOUND",
  "LIST_FAILED",
  "GET_FAILED",
  "SAVE_FAILED",
  "UPDATE_FAILED",
] as const;

export type MemberWorkErrorCode = (typeof MEMBER_WORK_ERROR_CODES)[number];

export type MemberWorkError = {
  code: MemberWorkErrorCode;
  message: string;
};

export type MemberWorkErrorResponse = {
  error: MemberWorkError;
};

export function memberWorkError(
  code: MemberWorkErrorCode,
  message: string,
): MemberWorkErrorResponse {
  return { error: { code, message } };
}

export const SHARED_API_PATHS: readonly SharedApiPath[] = [
  {
    method: "GET",
    path: "/api/healthz",
    auth: "none",
    clients: ["web", "ios"],
  },
  {
    method: "POST",
    path: "/api/auth/login",
    auth: "none",
    clients: ["web", "ios"],
    notes: "Returns token for iOS Bearer; cookie for web",
  },
  {
    method: "GET",
    path: "/api/auth/me",
    auth: "session",
    clients: ["web", "ios"],
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    auth: "session",
    clients: ["web", "ios"],
  },
  {
    method: "GET",
    path: "/api/me/onboarding",
    auth: "session",
    clients: ["web", "ios"],
  },
  {
    method: "PATCH",
    path: "/api/me/onboarding",
    auth: "session",
    clients: ["web", "ios"],
  },
  {
    method: "GET",
    path: "/api/billing/status",
    auth: "session",
    clients: ["web", "ios"],
  },
  {
    method: "GET",
    path: "/api/ai-tools",
    auth: "field_kit",
    clients: ["web", "ios"],
  },
  {
    method: "GET",
    path: "/api/v1/sales-workflow/today",
    auth: "field_kit",
    clients: ["web", "ios"],
  },
  {
    method: "POST",
    path: "/api/v1/sales-workflow/debrief/draft",
    auth: "field_kit",
    clients: ["web", "ios"],
  },
  {
    method: "POST",
    path: "/api/v1/sales-workflow/calls/:id/complete",
    auth: "field_kit",
    clients: ["web", "ios"],
  },
  {
    method: "POST",
    path: "/api/v1/sales-workflow/coaching/:id/approve",
    auth: "field_kit",
    clients: ["web", "ios"],
  },
  {
    method: "POST",
    path: "/api/objections",
    auth: "field_kit",
    clients: ["web", "ios"],
  },
  {
    method: "GET",
    path: "/api/v1/workspace/next-move",
    auth: "field_kit",
    clients: ["web", "ios"],
    notes: "Server-owned next action; may carry a saved-work resume ID.",
  },
  {
    method: "GET",
    path: "/api/v1/member-work",
    auth: "field_kit",
    clients: ["web", "ios"],
    notes: "Tenant/member-scoped, PHI-filtered saved work.",
  },
  {
    method: "POST",
    path: "/api/v1/member-work",
    auth: "field_kit",
    clients: ["web", "ios"],
    notes: "Retry with Idempotency-Key; response includes synced/completed/failed state.",
  },
  {
    method: "PATCH",
    path: "/api/v1/member-work/:id",
    auth: "field_kit",
    clients: ["web", "ios"],
    notes: "Tenant/member-scoped progress and completion update.",
  },
  {
    method: "GET",
    path: "/api/org/members",
    auth: "org_admin",
    clients: ["web"],
    notes: "Org admin seat list; smoke-parity unauth probe",
  },
  {
    method: "GET",
    path: "/api/org/usage",
    auth: "org_admin",
    clients: ["web"],
    notes: "Org usage; smoke-parity unauth probe",
  },
  {
    method: "POST",
    path: "/api/org/invites",
    auth: "org_admin",
    clients: ["web"],
    notes: "Invite create; smoke-parity unauth probe",
  },
  {
    method: "GET",
    path: "/api/org/profile",
    auth: "org_admin",
    clients: ["web"],
    notes: "Org profile + contacts; soft-WARN 404 until deployed",
  },
  {
    method: "GET",
    path: "/api/org/audit",
    auth: "org_admin",
    clients: ["web"],
  },
  {
    method: "GET",
    path: "/api/org/structure",
    auth: "org_admin",
    clients: ["web"],
  },
  {
    method: "GET",
    path: "/api/articles",
    auth: "none",
    clients: ["web", "ios"],
    notes: "Public Learn feed",
  },
  {
    method: "GET",
    path: "/api/podcasts",
    auth: "none",
    clients: ["web", "ios"],
  },
  {
    method: "GET",
    path: "/api/resources",
    auth: "none",
    clients: ["web", "ios"],
  },
  ...MEDICARE_SHARED_API_PATHS,
] as const;

/** Paths smoke-parity expects to return 401/403 without auth. */
export function fieldKitOrSessionGatedPaths(): SharedApiPath[] {
  return SHARED_API_PATHS.filter(
    (p) =>
      p.auth === "session" ||
      p.auth === "field_kit" ||
      p.auth === "org_admin" ||
      p.auth === "platform_admin",
  );
}
