import { describe, expect, it } from "vitest";
import {
  AUTOMATED_SUITES,
  LIVE_SMOKE_STACK,
  RELEASE_JOURNEYS,
  RELEASE_PERSONAS,
  evaluateProductionReadyClaim,
  requiredDomainsCovered,
} from "./release-gate";

describe("release gate matrix (HSP-48)", () => {
  it("includes all seven personas", () => {
    const ids = RELEASE_PERSONAS.map((p) => p.id);
    for (const id of [
      "individual_subscriber",
      "evaluation_user",
      "provider_rep",
      "provider_leader",
      "provider_admin",
      "expired_user",
      "unauthorized_user",
    ]) {
      expect(ids).toContain(id);
      expect(RELEASE_JOURNEYS.some((j) => j.persona === id)).toBe(true);
    }
  });

  it("covers required product domains", () => {
    const domains = requiredDomainsCovered();
    for (const d of [
      "authentication",
      "entitlement",
      "organization_isolation",
      "command_center",
      "billing",
      "search",
      "personalization",
      "notifications",
      "backups",
      "observability",
      "app_store",
      "accessibility",
    ]) {
      expect(domains).toContain(d);
    }
  });

  it("has critical automated suites for auth and tenancy", () => {
    expect(AUTOMATED_SUITES.some((s) => s.id === "api_security_entitlement" && s.critical)).toBe(
      true,
    );
    expect(AUTOMATED_SUITES.some((s) => s.id === "db_ops" && s.critical)).toBe(true);
  });

  it("includes shipped org-admin and command-center automated evidence (pass 11)", () => {
    expect(RELEASE_JOURNEYS.some((j) => j.id === "provider_admin_policy" && j.mode === "automated")).toBe(
      true,
    );
    expect(
      RELEASE_JOURNEYS.some((j) => j.id === "command_center_mobile_parity" && j.mode === "automated"),
    ).toBe(true);
    expect(RELEASE_JOURNEYS.some((j) => j.id === "dual_schema" && j.critical)).toBe(true);

    const apiSuite = AUTOMATED_SUITES.find((s) => s.id === "api_security_entitlement");
    expect(apiSuite?.args.join(" ")).toMatch(
      /orgAdminPolicy|orgStructurePolicy|orgOffboardPolicy/,
    );

    const webSuite = AUTOMATED_SUITES.find((s) => s.id === "web_contracts");
    expect(webSuite?.args.join(" ")).toMatch(/dualSourceOfTruth|OrgAdmin\.panels/);

    const mobileSuite = AUTOMATED_SUITES.find((s) => s.id === "mobile_contracts");
    expect(mobileSuite?.args.join(" ")).toMatch(/command-center-next-actions|command-center-accounts/);

    const dbSuite = AUTOMATED_SUITES.find((s) => s.id === "db_ops");
    expect(dbSuite?.args.join(" ")).toMatch(/migrate-manifest/);
  });

  it("never allows production-ready claim from catalog alone", () => {
    const v = evaluateProductionReadyClaim();
    expect(v.productionReadyClaimAllowed).toBe(false);
    expect(v.criticalJourneyCount).toBeGreaterThan(5);
    expect(v.liveEnvJourneyCount).toBeGreaterThan(0);
    expect(v.reason).toMatch(/live_env|TestFlight|not sufficient/i);
  });

  it("unique journey ids", () => {
    const ids = RELEASE_JOURNEYS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes live org-admin unauth gate journey", () => {
    const j = RELEASE_JOURNEYS.find((x) => x.id === "unauth_org_admin_gates");
    expect(j).toBeDefined();
    expect(j?.critical).toBe(true);
    expect(j?.mode).toBe("live_env");
    expect(j?.evidence).toMatch(/smoke-parity/);
  });

  it("documents live smoke stack (health + parity + optional auth)", () => {
    expect(LIVE_SMOKE_STACK.map((s) => s.id)).toEqual([
      "live_health",
      "live_parity",
      "live_auth",
    ]);
    expect(LIVE_SMOKE_STACK.every((s) => s.required)).toBe(true);
    expect(LIVE_SMOKE_STACK.find((s) => s.id === "live_auth")?.credentials).toBe(true);
  });
});
