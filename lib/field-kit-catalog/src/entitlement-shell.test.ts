import { describe, expect, it } from "vitest";
import {
  entitlementShellCopy,
  formatHoursRemainingLabel,
  resolveEntitlementShell,
} from "./entitlement-shell";

describe("entitlement shell (craft Phase 4)", () => {
  it("maps logged out", () => {
    expect(resolveEntitlementShell({ isAuthenticated: false })).toBe("logged_out");
  });

  it("maps trial / expired / suspended", () => {
    expect(
      resolveEntitlementShell({
        isAuthenticated: true,
        orgStatus: "trial",
        fieldKitAllowed: true,
      }),
    ).toBe("trial");
    expect(
      resolveEntitlementShell({
        isAuthenticated: true,
        orgStatus: "expired",
        fieldKitAllowed: false,
      }),
    ).toBe("expired");
    expect(
      resolveEntitlementShell({
        isAuthenticated: true,
        fieldKitReason: "suspended",
        fieldKitAllowed: false,
      }),
    ).toBe("suspended");
  });

  it("maps paid active and canceling", () => {
    expect(
      resolveEntitlementShell({
        isAuthenticated: true,
        orgStatus: "active",
        hasPaidSubscription: true,
        fieldKitAllowed: true,
      }),
    ).toBe("active");
    expect(
      resolveEntitlementShell({
        isAuthenticated: true,
        orgStatus: "active",
        hasPaidSubscription: true,
        cancelAtPeriodEnd: true,
        fieldKitAllowed: true,
      }),
    ).toBe("active_canceling");
  });

  it("maps company seat", () => {
    expect(
      resolveEntitlementShell({
        isAuthenticated: true,
        orgStatus: "active",
        orgType: "company",
        fieldKitAllowed: true,
      }),
    ).toBe("company_active");
  });

  it("keeps platform administrators out of paid subscription messaging", () => {
    const id = resolveEntitlementShell({
      isAuthenticated: true,
      orgStatus: "active",
      orgType: "platform",
      billingPlan: "individual_weekly",
      hasPaidSubscription: true,
      cancelAtPeriodEnd: true,
      fieldKitAllowed: true,
    });
    const copy = entitlementShellCopy(id);

    expect(id).toBe("platform_active");
    expect(copy.chip).toBe("Platform administrator · no charge");
    expect(`${copy.title} ${copy.body} ${copy.restoreNote}`).not.toMatch(/\$|subscription active|manage billing|cancel anytime/i);
  });

  it("copy always includes restore note and benefits", () => {
    for (const id of [
      "logged_out",
      "trial",
      "active",
      "platform_active",
      "expired",
      "suspended",
      "locked",
    ] as const) {
      const c = entitlementShellCopy(id);
      expect(c.benefits.length).toBeGreaterThanOrEqual(3);
      expect(c.restoreNote.toLowerCase()).toMatch(/sign in|restore/);
      expect(c.primaryCta.length).toBeGreaterThan(2);
    }
  });

  it("formats hours remaining", () => {
    expect(formatHoursRemainingLabel(0.5)).toMatch(/m left/);
    expect(formatHoursRemainingLabel(12)).toMatch(/h left/);
    expect(formatHoursRemainingLabel(72)).toMatch(/d left/);
  });
});
