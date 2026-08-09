/**
 * Stable API error contract for web + iOS.
 *
 * Envelope shape (existing clients already depend on this):
 *   { error: string, code: string, reason?: string, details?: unknown }
 *
 * Do not rename codes without a deprecation period (see compatibility.ts).
 * New endpoints should use buildApiErrorBody / ApiErrorCode only.
 */

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FIELD_KIT_DENIED"
  | "ORG_ADMIN_REQUIRED"
  | "ADMIN_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PROVIDER_NOT_CONFIGURED"
  | "DEBRIEF_FAILED"
  | "INTERNAL";

/** HTTP status each stable code must map to (contract tests lock this). */
export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FIELD_KIT_DENIED: 403,
  ORG_ADMIN_REQUIRED: 403,
  ADMIN_REQUIRED: 403, // 401 when no session — see adminRequiredStatus()
  FORBIDDEN: 403,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PROVIDER_NOT_CONFIGURED: 503,
  DEBRIEF_FAILED: 502,
  INTERNAL: 500,
};

/** Human messages currently returned by middleware (keep stable for clients). */
export const API_ERROR_MESSAGE: Partial<Record<ApiErrorCode, string>> = {
  UNAUTHENTICATED: "Authentication required",
  FIELD_KIT_DENIED: "Membership access is not active",
  ORG_ADMIN_REQUIRED: "Organization admin required",
  ADMIN_REQUIRED: "Platform administrator session required",
};

export type ApiErrorBody = {
  error: string;
  code: ApiErrorCode | string;
  reason?: string;
  details?: unknown;
};

export function buildApiErrorBody(input: {
  code: ApiErrorCode | string;
  error?: string;
  reason?: string;
  details?: unknown;
}): ApiErrorBody {
  const code = input.code;
  const defaultMessage =
    typeof code === "string" && code in API_ERROR_MESSAGE
      ? API_ERROR_MESSAGE[code as ApiErrorCode]
      : undefined;
  const body: ApiErrorBody = {
    error: input.error ?? defaultMessage ?? "Request failed",
    code,
  };
  if (input.reason !== undefined) body.reason = input.reason;
  if (input.details !== undefined) body.details = input.details;
  return body;
}

/** Admin gate: 401 if no session, 403 if session but not platform_admin. */
export function adminRequiredStatus(hasSession: boolean): number {
  return hasSession ? 403 : 401;
}

export function statusForApiErrorCode(
  code: ApiErrorCode,
  opts?: { hasSession?: boolean },
): number {
  if (code === "ADMIN_REQUIRED") {
    return adminRequiredStatus(Boolean(opts?.hasSession));
  }
  return API_ERROR_STATUS[code];
}

/** Codes that both web and iOS must continue to understand. */
export const CLIENT_CRITICAL_ERROR_CODES: readonly ApiErrorCode[] = [
  "UNAUTHENTICATED",
  "FIELD_KIT_DENIED",
  "ORG_ADMIN_REQUIRED",
  "ADMIN_REQUIRED",
  "FORBIDDEN",
  "INVALID_INPUT",
  "RATE_LIMITED",
] as const;
