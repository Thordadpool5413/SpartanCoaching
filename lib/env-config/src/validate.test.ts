import { describe, expect, it } from "vitest";
import {
  CLIENT_PUBLIC_ENV_NAMES,
  ENV_CATALOG,
  SECRET_NAME_HINTS,
  secretCatalogEntries,
} from "./catalog";
import { ENV_ARCHITECTURE_SUMMARY, homesForEnvironment } from "./architecture";
import {
  assertCrossEnvDatabaseSafety,
  findClientBundleSecretLeaks,
  resolveAppEnv,
  runProductionPreflight,
  validateServerStartupConfig,
} from "./validate";

describe("environment architecture", () => {
  it("defines all six target environments with config homes", () => {
    const keys = Object.keys(ENV_ARCHITECTURE_SUMMARY);
    expect(keys.sort()).toEqual(
      [
        "app_store",
        "local",
        "preview",
        "production_web",
        "staging",
        "testflight",
      ].sort(),
    );
    expect(homesForEnvironment("production_web")).toContain("replit_secrets");
    expect(homesForEnvironment("testflight")).toContain("eas_env");
    expect(homesForEnvironment("app_store")).toContain("apple_connect");
  });
});

describe("catalog policy", () => {
  it("marks server secrets as forbidClientBundle", () => {
    for (const entry of secretCatalogEntries()) {
      expect(entry.forbidClientBundle, entry.name).toBe(true);
      expect(entry.surfaces.every((s) => s !== "web_vite" || entry.sensitivity !== "secret")).toBe(
        true,
      );
      // secrets must not list web_vite/mobile as consumers except if we misconfigured
      expect(
        entry.surfaces.includes("api_server") ||
          entry.surfaces.includes("scripts") ||
          entry.surfaces.includes("eas_build"),
        entry.name,
      ).toBe(true);
    }
  });

  it("keeps client public allowlist free of secret name hints", () => {
    for (const name of CLIENT_PUBLIC_ENV_NAMES) {
      for (const hint of SECRET_NAME_HINTS) {
        expect(name.includes(hint), `${name} contains ${hint}`).toBe(false);
      }
    }
  });

  it("catalogues core stripe, database, openai, resend, apple, analytics keys", () => {
    const names = new Set(ENV_CATALOG.map((e) => e.name));
    for (const required of [
      "DATABASE_URL",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "OPENAI_API_KEY",
      "RESEND_API_KEY",
      "EXPO_PUBLIC_DOMAIN",
      "EAS_PROJECT_ID",
      "VITE_GA_MEASUREMENT_ID",
      "APP_ENV",
      "PRODUCTION_DATABASE_HOST",
    ]) {
      expect(names.has(required)).toBe(true);
    }
  });
});

describe("resolveAppEnv", () => {
  it("maps aliases and deployment signals", () => {
    expect(resolveAppEnv({ APP_ENV: "staging" })).toBe("staging");
    expect(resolveAppEnv({ APP_ENV: "prod" })).toBe("production_web");
    expect(resolveAppEnv({ NODE_ENV: "production" })).toBe("production_web");
    expect(resolveAppEnv({ REPLIT_DEV_DOMAIN: "x.replit.dev" })).toBe("preview");
    expect(resolveAppEnv({ EAS_BUILD_PROFILE: "testflight" })).toBe("testflight");
    expect(resolveAppEnv({})).toBe("local");
  });
});

describe("cross-env database and stripe safety", () => {
  it("blocks staging DATABASE_URL that matches PRODUCTION_DATABASE_HOST", () => {
    const issues = assertCrossEnvDatabaseSafety({
      APP_ENV: "staging",
      PRODUCTION_DATABASE_HOST: "prod-db.example.com",
      DATABASE_URL: "postgresql://u:p@prod-db.example.com:5432/app",
    });
    expect(issues.some((i) => i.code === "STAGING_POINTS_AT_PRODUCTION_DB")).toBe(
      true,
    );
    expect(issues[0]?.severity).toBe("fatal");
  });

  it("allows staging against a different host", () => {
    const issues = assertCrossEnvDatabaseSafety({
      APP_ENV: "staging",
      PRODUCTION_DATABASE_HOST: "prod-db.example.com",
      DATABASE_URL: "postgresql://u:p@staging-db.example.com:5432/app",
    });
    expect(issues).toEqual([]);
  });

  it("blocks live Stripe key on non-production", () => {
    const issues = assertCrossEnvDatabaseSafety({
      APP_ENV: "local",
      STRIPE_SECRET_KEY: "sk_live_not_a_real_key_for_tests",
    });
    expect(issues.some((i) => i.code === "LIVE_STRIPE_ON_NON_PROD")).toBe(true);
  });
});

describe("client bundle secret leak detection", () => {
  it("flags EXPO_PUBLIC_STRIPE_SECRET_KEY style keys", () => {
    const issues = findClientBundleSecretLeaks({
      EXPO_PUBLIC_STRIPE_SECRET_KEY: "should-not-exist",
    });
    expect(issues.some((i) => i.severity === "fatal")).toBe(true);
  });

  it("flags secret-shaped values on public keys", () => {
    const issues = findClientBundleSecretLeaks({
      EXPO_PUBLIC_DOMAIN: "sk_live_abc123xyz",
    });
    expect(
      issues.some((i) => i.code === "SECRET_VALUE_SHAPE_IN_CLIENT_ENV"),
    ).toBe(true);
  });

  it("allows legitimate public domain", () => {
    const issues = findClientBundleSecretLeaks({
      EXPO_PUBLIC_DOMAIN: "spartanhospicecoaching.com",
      VITE_GA_MEASUREMENT_ID: "G-TEST123",
    });
    expect(issues).toEqual([]);
  });
});

describe("server startup and production preflight", () => {
  it("fails fatally without DATABASE_URL in strict production", () => {
    const result = validateServerStartupConfig(
      { APP_ENV: "production_web", NODE_ENV: "production" },
      { strictProduction: true },
    );
    expect(result.fatal).toBe(true);
    expect(result.issues.some((i) => i.subject === "DATABASE_URL")).toBe(true);
  });

  it("is ok for local with no secrets (warnings only for optional requiredFor)", () => {
    const result = validateServerStartupConfig({ APP_ENV: "local" });
    expect(result.fatal).toBe(false);
  });

  it("production preflight reports missing stripe without printing values", () => {
    const result = runProductionPreflight({
      APP_ENV: "production_web",
      DATABASE_URL: "postgresql://u:p@prod-db.example.com:5432/app",
      PRODUCTION_DATABASE_HOST: "prod-db.example.com",
    });
    expect(result.ok).toBe(false);
    const subjects = result.issues.map((i) => i.subject);
    expect(subjects).toContain("STRIPE_SECRET_KEY");
    expect(JSON.stringify(result)).not.toMatch(/postgresql:\/\/u:p/);
  });
});
