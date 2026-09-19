import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  AUTOMATED_SUITES,
  LIVE_SMOKE_STACK,
  RELEASE_JOURNEYS,
  RELEASE_PERSONAS,
  evaluateProductionReadyClaim,
  requiredDomainsCovered,
} from "./release-gate";

const executableRunner = readFileSync(
  new URL("../../../scripts/release-gate.mjs", import.meta.url),
  "utf8",
);

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

  it("requires catalog-wide real web and iPhone behavioral suites", () => {
    const webSuite = AUTOMATED_SUITES.find((item) => item.id === "web_catalog_behavior");
    expect(webSuite?.critical).toBe(true);
    expect(webSuite?.cwd).toBe("artifacts/spartan-coaching");
    expect(webSuite?.args).toEqual([
      "exec",
      "vitest",
      "run",
      "src/lib/field-kit-catalog.behavioral.test.tsx",
    ]);
    const iphoneSuite = AUTOMATED_SUITES.find((item) => item.id === "iphone_catalog_behavior");
    expect(iphoneSuite?.critical).toBe(true);
    expect(iphoneSuite?.cwd).toBe("artifacts/spartan-coaching-mobile");
    expect(iphoneSuite?.args).toEqual([
      "exec",
      "jest",
      "--runInBand",
      "__tests__/field-kit-catalog.behavioral.test.tsx",
    ]);
    expect(RELEASE_JOURNEYS.find((item) => item.id === "field_kit_catalog_web_behavior")?.evidence)
      .toMatch(/behavioral\.test/);
    expect(RELEASE_JOURNEYS.find((item) => item.id === "field_kit_catalog_iphone_behavior")?.evidence)
      .toMatch(/behavioral\.test/);
  });

  it("executes the catalog behavioral suites from the plain Node runner", () => {
    // Keep this contract pointed at the executable runner: checking only
    // AUTOMATED_SUITES above would allow the release command to silently omit
    // a suite while its TypeScript metadata continued to look correct.
    expect(executableRunner).toMatch(/for \(const suite of AUTOMATED_SUITES\)/);

    const webSuite = executableRunner.match(
      /id: "web_catalog_behavior"[\s\S]*?\n  },/,
    )?.[0];
    expect(webSuite).toBeDefined();
    expect(webSuite).toContain('cwd: "artifacts/spartan-coaching"');
    expect(webSuite).toContain(
      'args: ["exec", "vitest", "run", "src/lib/field-kit-catalog.behavioral.test.tsx"]',
    );

    const iphoneSuite = executableRunner.match(
      /id: "iphone_catalog_behavior"[\s\S]*?\n  },/,
    )?.[0];
    expect(iphoneSuite).toBeDefined();
    expect(iphoneSuite).toContain('cwd: "artifacts/spartan-coaching-mobile"');
    expect(iphoneSuite).toContain(
      'args: ["exec", "jest", "--runInBand", "__tests__/field-kit-catalog.behavioral.test.tsx"]',
    );
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
