import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const route = fs.readFileSync(
  path.resolve(import.meta.dirname, "companySeatTransitionRoutes.ts"),
  "utf8",
);
const app = fs.readFileSync(path.resolve(import.meta.dirname, "../app.ts"), "utf8");

describe("company seat transition contract", () => {
  it("intercepts existing accounts before the ordinary new member invitation route", () => {
    expect(route).toContain('"/api/org/invites"');
    expect(app.indexOf("registerCompanySeatTransitionRoutes(app)")).toBeLessThan(
      app.indexOf("registerAuthRoutes(app)"),
    );
  });

  it("requires an active contracted Standard or Elite company membership", () => {
    expect(route).toContain("COMPANY_STANDARD_PLAN");
    expect(route).toContain("COMPANY_ELITE_PLAN");
    expect(route).toContain('company.status !== "active"');
    expect(route).toContain("COMPANY_CONTRACT_NOT_ACTIVE");
  });

  it("preserves the same member identity and private nonclinical workspace", () => {
    expect(route).toContain("eq(clientMembers.id, memberId)");
    expect(route).toContain("tx.update(coachConversations)");
    expect(route).toContain("tx.update(coachMessages)");
    expect(route).toContain("tx.update(coachPreferences)");
    expect(route).toContain("tx.update(coachMemoryItems)");
    expect(route).toContain("tx.update(aiToolRuns)");
    expect(route).toContain("eq(aiToolRuns.containsPhi, false)");
    expect(route).toContain("tx.update(resourceWork)");
    expect(route).toContain("tx.update(memberPersonalization)");
    expect(route).toContain("tx.update(memberNotificationPrefs)");
  });

  it("does not silently transfer an account between two companies", () => {
    expect(route).toContain('sourceOrganization.type !== "personal"');
    expect(route).toContain("ACCOUNT_ALREADY_COMPANY_ASSIGNED");
  });

  it("activates company access without exposing personal billing to the organization admin", () => {
    expect(route).toContain('status: "active"');
    expect(route).toContain("INDIVIDUAL_BILLING_NOT_DISCLOSED_TO_ORGANIZATION");
    expect(route).toContain("previous individual Apple subscription remains private to the member");
    expect(route).not.toContain("previousPersonalMembership:");
    expect(route).not.toContain("appleSubscriptionNeedsCancellation");
    expect(route).not.toContain("subscriptionManagementAction:");
  });
});
