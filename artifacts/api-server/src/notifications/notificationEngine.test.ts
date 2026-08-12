import { describe, it, expect } from "vitest";
import {
  NOTIFICATIONS_VERSION,
  NOTIFICATION_TYPES,
  normalizePreferences,
  safeCopyForType,
  assertLockScreenSafe,
  isTypeEnabled,
  resolveNotificationDeepLink,
  buildDedupeKey,
  materializeEvaluationNotification,
} from "./notificationEngine";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@workspace/db";

describe("notification engine (HSP-38)", () => {
  it("is versioned and covers workflow notification types", () => {
    expect(NOTIFICATIONS_VERSION).toMatch(/^notifications-v\d+/);
    expect(NOTIFICATION_TYPES).toContain("follow_up_due");
    expect(NOTIFICATION_TYPES).toContain("evaluation_expiration");
    expect(NOTIFICATION_TYPES.length).toBe(8);
  });

  it("safe copy never includes facility or patient placeholders", () => {
    for (const t of NOTIFICATION_TYPES) {
      const c = safeCopyForType(t);
      expect(assertLockScreenSafe(c.titleSafe)).toBe(true);
      expect(assertLockScreenSafe(c.bodySafe)).toBe(true);
      expect(c.bodySafe.toLowerCase()).not.toMatch(/patient |mrn|ssn/);
    }
  });

  it("detects unsafe lock-screen text", () => {
    expect(assertLockScreenSafe("Call patient John about MRN:12345")).toBe(false);
    expect(assertLockScreenSafe("Follow-up due")).toBe(true);
  });

  it("respects preference kill switches and org controls", () => {
    const off = normalizePreferences({ enabled: false });
    expect(isTypeEnabled(off, "follow_up_due")).toBe(false);

    const suppress = normalizePreferences({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      orgControls: { suppressOrgContentPush: true },
    });
    expect(isTypeEnabled(suppress, "org_content_published")).toBe(false);
    expect(isTypeEnabled(suppress, "follow_up_due")).toBe(true);
  });

  it("deep link requires authentication", () => {
    const r = resolveNotificationDeepLink(
      { key: "command" },
      { authenticated: false, canUseFieldKit: false },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("UNAUTHENTICATED");
      expect(r.fallbackWebPath).toMatch(/login/);
    }
  });

  it("deep link blocks wrong organization", () => {
    const r = resolveNotificationDeepLink(
      { key: "resources" },
      {
        authenticated: true,
        canUseFieldKit: true,
        organizationId: 1,
        notificationOrganizationId: 99,
      },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("WRONG_ORGANIZATION");
  });

  it("deep link blocks deleted targets and field kit denial", () => {
    const deleted = resolveNotificationDeepLink(
      { key: "command" },
      {
        authenticated: true,
        canUseFieldKit: true,
        organizationId: 1,
        notificationOrganizationId: 1,
        targetExists: false,
      },
    );
    expect(deleted.ok).toBe(false);
    if (!deleted.ok) expect(deleted.code).toBe("TARGET_DELETED");

    const denied = resolveNotificationDeepLink(
      { key: "command" },
      {
        authenticated: true,
        canUseFieldKit: false,
        organizationId: 1,
        notificationOrganizationId: 1,
      },
    );
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.code).toBe("FIELD_KIT_DENIED");
  });

  it("deep link allows entitled destinations", () => {
    const r = resolveNotificationDeepLink(
      { key: "account" },
      {
        authenticated: true,
        canUseFieldKit: false,
        organizationId: 1,
        notificationOrganizationId: 1,
      },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.webPath).toBe("/account");
  });

  it("dedupe keys are stable per day", () => {
    const a = buildDedupeKey("follow_up_due", "ref-1", "2026-08-11");
    const b = buildDedupeKey("follow_up_due", "ref-1", "2026-08-11");
    expect(a).toBe(b);
  });

  it("materializes evaluation expiration within 7 days only", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const soon = new Date("2026-08-14T12:00:00.000Z");
    const far = new Date("2026-09-20T12:00:00.000Z");
    expect(
      materializeEvaluationNotification({
        organizationId: 3,
        trialEndsAt: soon,
        now,
      })?.type,
    ).toBe("evaluation_expiration");
    expect(
      materializeEvaluationNotification({
        organizationId: 3,
        trialEndsAt: far,
        now,
      }),
    ).toBeNull();
  });
});
