import { describe, expect, it } from "vitest";
import {
  API_ERROR_STATUS,
  CLIENT_CRITICAL_ERROR_CODES,
  buildApiErrorBody,
  adminRequiredStatus,
  statusForApiErrorCode,
} from "./errors";
import {
  API_CONTRACT_VERSION,
  API_DEPRECATION_WINDOW_MONTHS,
  COMPATIBILITY_RULES,
  earliestRemovalDate,
  isPastRemovalDate,
} from "./compatibility";
import {
  SHARED_API_PATHS,
  fieldKitOrSessionGatedPaths,
} from "./shared-paths";

describe("stable error envelope", () => {
  it("builds { error, code } matching existing middleware shape", () => {
    expect(buildApiErrorBody({ code: "UNAUTHENTICATED" })).toEqual({
      error: "Authentication required",
      code: "UNAUTHENTICATED",
    });
    expect(
      buildApiErrorBody({
        code: "FIELD_KIT_DENIED",
        reason: "expired",
      }),
    ).toEqual({
      error: "Membership access is not active",
      code: "FIELD_KIT_DENIED",
      reason: "expired",
    });
    expect(buildApiErrorBody({ code: "ORG_ADMIN_REQUIRED" }).code).toBe(
      "ORG_ADMIN_REQUIRED",
    );
    expect(buildApiErrorBody({ code: "ADMIN_REQUIRED" }).error).toMatch(
      /Platform administrator/,
    );
  });

  it("locks HTTP status for critical codes", () => {
    expect(API_ERROR_STATUS.UNAUTHENTICATED).toBe(401);
    expect(API_ERROR_STATUS.FIELD_KIT_DENIED).toBe(403);
    expect(API_ERROR_STATUS.ORG_ADMIN_REQUIRED).toBe(403);
    expect(API_ERROR_STATUS.FORBIDDEN).toBe(403);
    expect(adminRequiredStatus(false)).toBe(401);
    expect(adminRequiredStatus(true)).toBe(403);
    expect(statusForApiErrorCode("ADMIN_REQUIRED", { hasSession: false })).toBe(
      401,
    );
    expect(statusForApiErrorCode("ADMIN_REQUIRED", { hasSession: true })).toBe(
      403,
    );
  });

  it("exports client-critical codes both platforms must parse", () => {
    for (const code of CLIENT_CRITICAL_ERROR_CODES) {
      expect(code.length).toBeGreaterThan(3);
      expect(API_ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
    }
  });
});

describe("compatibility policy", () => {
  it("defines a non-zero deprecation window", () => {
    expect(API_DEPRECATION_WINDOW_MONTHS).toBeGreaterThanOrEqual(3);
    expect(API_CONTRACT_VERSION).toMatch(/^\d+/);
  });

  it("earliest removal is after deprecation window", () => {
    const announced = new Date("2026-01-01T00:00:00.000Z");
    const remove = earliestRemovalDate(announced);
    expect(remove.getUTCFullYear()).toBe(2026);
    expect(remove.getUTCMonth()).toBe(0 + API_DEPRECATION_WINDOW_MONTHS);
    expect(isPastRemovalDate("2099-01-01T00:00:00.000Z")).toBe(false);
    expect(isPastRemovalDate("2000-01-01T00:00:00.000Z")).toBe(true);
  });

  it("documents additive fields as non-breaking", () => {
    expect(COMPATIBILITY_RULES.additiveResponseFields).toBe(
      "allowed_without_version_bump",
    );
    expect(COMPATIBILITY_RULES.renameErrorCode).toBe(
      "requires_deprecation_window",
    );
  });
});

describe("shared web+iOS paths", () => {
  it("includes seat and Command Center contracts", () => {
    const paths = SHARED_API_PATHS.map((p) => p.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/auth/me",
        "/api/billing/status",
        "/api/me/onboarding",
        "/api/v1/sales-workflow/today",
        "/api/v1/sales-workflow/debrief/draft",
        "/api/objections",
      ]),
    );
  });

  it("every shared path lists both clients or documents public learn", () => {
    for (const p of SHARED_API_PATHS) {
      expect(p.clients.length).toBeGreaterThan(0);
      expect(["none", "session", "field_kit", "org_admin", "platform_admin"]).toContain(
        p.auth,
      );
    }
  });

  it("gated paths are the ones smoke-parity should probe", () => {
    const gated = fieldKitOrSessionGatedPaths();
    expect(gated.some((p) => p.path === "/api/auth/me")).toBe(true);
    expect(gated.every((p) => p.auth !== "none")).toBe(true);
  });
});
