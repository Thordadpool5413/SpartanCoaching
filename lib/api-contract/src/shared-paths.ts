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
