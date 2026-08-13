import { describe, expect, it } from "vitest";
import {
  evaluateOffboardTarget,
  isOptionalContactEmail,
  normalizeContactEmail,
  OFFBOARD_CHECKLIST,
  validateContactsPatch,
} from "./orgOffboardPolicy";

describe("org offboard policy", () => {
  it("exposes automated checklist steps", () => {
    expect(OFFBOARD_CHECKLIST.some((s) => s.id === "disable_member")).toBe(true);
    expect(OFFBOARD_CHECKLIST.filter((s) => s.automated).length).toBeGreaterThanOrEqual(3);
  });

  it("blocks self and platform admin offboard", () => {
    expect(
      evaluateOffboardTarget({
        targetId: 1,
        actorId: 1,
        targetRole: "member",
        targetStatus: "active",
      }).ok,
    ).toBe(false);
    expect(
      evaluateOffboardTarget({
        targetId: 2,
        actorId: 1,
        targetRole: "platform_admin",
        targetStatus: "active",
      }).ok,
    ).toBe(false);
  });

  it("allows peer member offboard", () => {
    expect(
      evaluateOffboardTarget({
        targetId: 2,
        actorId: 1,
        targetRole: "member",
        targetStatus: "active",
      }),
    ).toEqual({ ok: true });
  });

  it("validates optional contact emails", () => {
    expect(isOptionalContactEmail("")).toBe(true);
    expect(isOptionalContactEmail("a@b.co")).toBe(true);
    expect(isOptionalContactEmail("not-an-email")).toBe(false);
    expect(normalizeContactEmail("  A@B.CO ")).toBe("a@b.co");
    expect(
      validateContactsPatch({ billingContactEmail: "bad" }),
    ).toMatch(/billing/i);
    expect(validateContactsPatch({ billingContactEmail: "ok@co.example" })).toBeNull();
  });
});
