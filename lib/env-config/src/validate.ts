import {
  type AppEnvironment,
  CLIENT_PUBLIC_ENV_NAMES,
  ENV_CATALOG,
  FORBIDDEN_CLIENT_VALUE_PATTERNS,
  SECRET_NAME_HINTS,
  catalogByName,
} from "./catalog";

export type ConfigIssueSeverity = "fatal" | "error" | "warn";

export interface ConfigIssue {
  code: string;
  severity: ConfigIssueSeverity;
  /** Variable name or scope — never a secret value. */
  subject: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  /** True when process should exit before serving traffic. */
  fatal: boolean;
  appEnv: AppEnvironment;
  issues: ConfigIssue[];
}

const APP_ENV_ALIASES: Record<string, AppEnvironment> = {
  local: "local",
  development: "local",
  dev: "local",
  preview: "preview",
  staging: "staging",
  stage: "staging",
  production: "production_web",
  production_web: "production_web",
  prod: "production_web",
  testflight: "testflight",
  app_store: "app_store",
  appstore: "app_store",
  store: "app_store",
};

/** Resolve APP_ENV with safe fallbacks (never throws). */
export function resolveAppEnv(
  env: NodeJS.ProcessEnv = process.env,
): AppEnvironment {
  const raw = env.APP_ENV?.trim().toLowerCase();
  if (raw && APP_ENV_ALIASES[raw]) return APP_ENV_ALIASES[raw];

  // EAS / Expo production builds
  if (env.EAS_BUILD_PROFILE === "production" || env.EAS_BUILD_PROFILE === "testflight") {
    return env.EAS_BUILD_PROFILE === "testflight" ? "testflight" : "app_store";
  }

  if (env.NODE_ENV === "production" || env.REPLIT_DEPLOYMENT === "1" || env.REPLIT_DEPLOYMENT === "true") {
    return "production_web";
  }

  if (env.REPLIT_DEV_DOMAIN || env.REPLIT_INTERNAL_APP_DOMAIN) {
    return "preview";
  }

  return "local";
}

export function isPresent(env: NodeJS.ProcessEnv, name: string): boolean {
  return Boolean(env[name]?.trim());
}

function databaseHost(databaseUrl: string): string | null {
  try {
    const normalized = databaseUrl.replace(/^postgresql:/i, "http:");
    const u = new URL(normalized);
    return u.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Prevent non-production clients/servers from targeting the production database.
 * Set PRODUCTION_DATABASE_HOST to the production Postgres hostname (or a unique
 * substring). When APP_ENV is local|preview|staging, DATABASE_URL must not contain it.
 */
export function assertCrossEnvDatabaseSafety(
  env: NodeJS.ProcessEnv = process.env,
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const appEnv = resolveAppEnv(env);
  const dbUrl = env.DATABASE_URL?.trim();
  const prodHost = env.PRODUCTION_DATABASE_HOST?.trim()?.toLowerCase();
  const nonProd: AppEnvironment[] = ["local", "preview", "staging"];

  if (dbUrl && prodHost && nonProd.includes(appEnv)) {
    const host = databaseHost(dbUrl);
    if (dbUrl.toLowerCase().includes(prodHost) || host?.includes(prodHost)) {
      issues.push({
        code: "STAGING_POINTS_AT_PRODUCTION_DB",
        severity: "fatal",
        subject: "DATABASE_URL",
        message:
          `APP_ENV=${appEnv} must not use PRODUCTION_DATABASE_HOST (${prodHost}). Point DATABASE_URL at a non-production database.`,
      });
    }
  }

  // Stripe live key on non-production is an accidental write risk (charges).
  const stripe = env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (nonProd.includes(appEnv) && stripe.startsWith("sk_live_")) {
    issues.push({
      code: "LIVE_STRIPE_ON_NON_PROD",
      severity: "fatal",
      subject: "STRIPE_SECRET_KEY",
      message:
        `APP_ENV=${appEnv} must not use a live Stripe secret key. Use sk_test_… for non-production.`,
    });
  }

  return issues;
}

/**
 * Detect secret-like names incorrectly exposed under client public prefixes.
 * Inspects process env keys only — does not print values.
 */
export function findClientBundleSecretLeaks(
  env: NodeJS.ProcessEnv = process.env,
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const clientKeys = Object.keys(env).filter(
    (k) => k.startsWith("EXPO_PUBLIC_") || k.startsWith("VITE_"),
  );

  for (const key of clientKeys) {
    const bare = key.replace(/^EXPO_PUBLIC_/, "").replace(/^VITE_/, "");
    const catalog = catalogByName(key) ?? catalogByName(bare);
    if (catalog?.forbidClientBundle || catalog?.sensitivity === "secret") {
      issues.push({
        code: "SECRET_IN_CLIENT_PREFIX",
        severity: "fatal",
        subject: key,
        message: `${key} is catalogued as server/secret and must not use a client public prefix.`,
      });
      continue;
    }

    for (const hint of SECRET_NAME_HINTS) {
      if (bare.includes(hint) || key.includes(hint)) {
        // Allow known public allowlist exact names only
        if ((CLIENT_PUBLIC_ENV_NAMES as readonly string[]).includes(key)) {
          break;
        }
        issues.push({
          code: "SECRET_HINT_IN_CLIENT_PREFIX",
          severity: "fatal",
          subject: key,
          message: `${key} looks secret (matched ${hint}) and must not be bundled to clients.`,
        });
        break;
      }
    }

    const value = env[key]?.trim() ?? "";
    for (const pattern of FORBIDDEN_CLIENT_VALUE_PATTERNS) {
      if (value && pattern.test(value)) {
        issues.push({
          code: "SECRET_VALUE_SHAPE_IN_CLIENT_ENV",
          severity: "fatal",
          subject: key,
          message: `${key} value matches a forbidden secret shape; remove from client env.`,
        });
        break;
      }
    }
  }

  return issues;
}

export function validateRequiredForEnv(
  appEnv: AppEnvironment,
  env: NodeJS.ProcessEnv = process.env,
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  for (const entry of ENV_CATALOG) {
    if (!entry.requiredFor.includes(appEnv)) continue;
    if (!isPresent(env, entry.name)) {
      issues.push({
        code: "MISSING_REQUIRED",
        severity: appEnv === "local" ? "warn" : "error",
        subject: entry.name,
        message: `${entry.name} is required for APP_ENV=${appEnv} (${entry.description}). Home: ${entry.homes.join(", ")}.`,
      });
    }
  }
  return issues;
}

/**
 * Server startup validation. Never includes secret values in messages.
 * Fatal issues: cross-env write risk, client secret leaks, missing PORT handled by caller.
 */
export function validateServerStartupConfig(
  env: NodeJS.ProcessEnv = process.env,
  opts: { strictProduction?: boolean } = {},
): ValidationResult {
  const appEnv = resolveAppEnv(env);
  const issues: ConfigIssue[] = [
    ...assertCrossEnvDatabaseSafety(env),
    ...findClientBundleSecretLeaks(env),
    ...validateRequiredForEnv(appEnv, env),
  ];

  const strict =
    opts.strictProduction ??
    (appEnv === "production_web" ||
      appEnv === "app_store" ||
      appEnv === "testflight");

  if (strict && !isPresent(env, "DATABASE_URL")) {
    issues.push({
      code: "MISSING_DATABASE_URL",
      severity: "fatal",
      subject: "DATABASE_URL",
      message: "DATABASE_URL is required for production-class server startup.",
    });
  }

  // Promote required errors to fatal in strict production when core secrets missing
  if (strict) {
    for (const issue of issues) {
      if (issue.code === "MISSING_REQUIRED" && issue.subject === "DATABASE_URL") {
        issue.severity = "fatal";
      }
    }
  }

  const fatal = issues.some((i) => i.severity === "fatal");
  const hasError = issues.some((i) => i.severity === "error" || i.severity === "fatal");
  return {
    ok: !hasError && !fatal,
    fatal,
    appEnv,
    issues,
  };
}

/** Production preflight report (CI / Replit / release gate). */
export function runProductionPreflight(
  env: NodeJS.ProcessEnv = process.env,
): ValidationResult {
  const forced: NodeJS.ProcessEnv = {
    ...env,
    APP_ENV: env.APP_ENV?.trim() || "production_web",
  };
  const result = validateServerStartupConfig(forced, { strictProduction: true });

  // Preflight also requires Stripe for production_web billing path
  const appEnv = resolveAppEnv(forced);
  if (appEnv === "production_web") {
    for (const name of [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_INDIVIDUAL_WEEKLY",
      "SITE_URL",
    ] as const) {
      if (!isPresent(forced, name)) {
        result.issues.push({
          code: "PREFLIGHT_MISSING",
          severity: "error",
          subject: name,
          message: `${name} recommended/required for production_web preflight. Configure in Replit Secrets / server env.`,
        });
      }
    }
  }

  result.fatal = result.issues.some((i) => i.severity === "fatal");
  result.ok = !result.issues.some(
    (i) => i.severity === "error" || i.severity === "fatal",
  );
  return result;
}

/** Safe summary for logs — names and codes only. */
export function formatIssuesForLog(issues: readonly ConfigIssue[]): string {
  if (!issues.length) return "none";
  return issues
    .map((i) => `${i.severity}:${i.code}:${i.subject}`)
    .join("; ");
}
