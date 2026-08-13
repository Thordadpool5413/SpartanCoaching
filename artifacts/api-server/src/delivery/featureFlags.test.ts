import { describe, expect, it } from "vitest";
import {
  FEATURE_FLAG_DEFS,
  isFeatureEnabled,
  resolveFeatureFlags,
} from "./featureFlags";
import { resolveDeployEnvironment } from "./environments";
import { buildClientConfig } from "./clientConfig";

describe("feature flags", () => {
  it("resolves defaults and env overrides", () => {
    const base = resolveFeatureFlags({ NODE_ENV: "test" });
    expect(base.activation_loop).toBe(true);
    expect(base.clinical_phi_workspace).toBe(false);

    const on = resolveFeatureFlags({
      NODE_ENV: "test",
      FF_CLINICAL_PHI_WORKSPACE: "true",
    });
    expect(on.clinical_phi_workspace).toBe(true);

    const off = resolveFeatureFlags({
      NODE_ENV: "production",
      FF_UNIVERSAL_SEARCH: "false",
    });
    expect(off.universal_search).toBe(false);
  });

  it("isFeatureEnabled matches map", () => {
    expect(
      isFeatureEnabled("product_outcome_analytics", {
        FF_PRODUCT_OUTCOME_ANALYTICS: "false",
      }),
    ).toBe(false);
  });

  it("registry covers high-risk flags", () => {
    const high = FEATURE_FLAG_DEFS.filter((d) => d.risk === "high");
    expect(high.some((d) => d.key === "advanced_ai_tools")).toBe(true);
    expect(high.some((d) => d.key === "clinical_phi_workspace")).toBe(true);
  });
});

describe("environments", () => {
  it("maps DEPLOY_ENV and NODE_ENV", () => {
    expect(resolveDeployEnvironment({ DEPLOY_ENV: "staging" })).toBe("staging");
    expect(resolveDeployEnvironment({ NODE_ENV: "production" })).toBe("production");
    expect(resolveDeployEnvironment({ NODE_ENV: "test" })).toBe("test");
  });
});

describe("client config", () => {
  it("builds payload with contract, flags, rollback", () => {
    const cfg = buildClientConfig({ NODE_ENV: "test" }, { iosAppVersion: "1.0.0" });
    expect(cfg.apiContractVersion).toBeGreaterThanOrEqual(1);
    expect(cfg.minIosAppVersion).toBeTruthy();
    expect(cfg.flags).toHaveProperty("universal_search");
    expect(cfg.rollback.api).toMatch(/smoke-health/i);
    expect(cfg.compatibility.ios?.ok).toBe(true);
  });

  it("marks outdated iOS build", () => {
    const cfg = buildClientConfig(
      { NODE_ENV: "test", MIN_IOS_APP_VERSION: "2.0.0" },
      { iosAppVersion: "1.0.0" },
    );
    expect(cfg.compatibility.ios?.ok).toBe(false);
    expect(cfg.compatibility.ios?.reason).toBe("below_min_ios");
  });
});
