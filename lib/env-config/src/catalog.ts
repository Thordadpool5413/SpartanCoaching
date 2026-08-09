/**
 * Environment variable catalog for Hospice Sales Pro / SpartanCoaching.
 * Source of truth for *where* a value lives and whether it may ship to clients.
 * Values are never stored here — names and policy only.
 */

/** Logical deploy / build targets. */
export type AppEnvironment =
  | "local"
  | "preview"
  | "staging"
  | "production_web"
  | "testflight"
  | "app_store";

/** Where the operator stores the value. */
export type ConfigHome =
  | "replit_secrets"
  | "replit_env"
  | "server_env"
  | "eas_secrets"
  | "eas_env"
  | "apple_connect"
  | "client_public"
  | "ci_secrets";

export type ConfigSensitivity = "public" | "secret" | "internal";

export interface EnvVarDefinition {
  name: string;
  sensitivity: ConfigSensitivity;
  homes: readonly ConfigHome[];
  /** Surfaces that may read this name. */
  surfaces: readonly (
    | "api_server"
    | "web_vite"
    | "mobile_expo"
    | "eas_build"
    | "scripts"
  )[];
  description: string;
  /** Required when APP_ENV resolves to any of these (empty = never hard-required). */
  requiredFor: readonly AppEnvironment[];
  /** True if presence in EXPO_PUBLIC_* / VITE_* client bundles is forbidden. */
  forbidClientBundle: boolean;
}

/**
 * Public client allowlist — only these (or EXPO_PUBLIC_/VITE_ names listed
 * with sensitivity public) may be embedded in web/mobile bundles.
 */
export const CLIENT_PUBLIC_ENV_NAMES = [
  "EXPO_PUBLIC_DOMAIN",
  "EXPO_PUBLIC_WEB_ORIGIN",
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_REPL_ID",
  "VITE_GA_MEASUREMENT_ID",
  "BASE_PATH",
  "EAS_PROJECT_ID",
] as const;

/** Patterns that must never appear as EXPO_PUBLIC_* or VITE_* values. */
export const FORBIDDEN_CLIENT_VALUE_PATTERNS: readonly RegExp[] = [
  /^sk_live_/i,
  /^sk_test_/i,
  /^whsec_/i,
  /^rk_live_/i,
  /^rk_test_/i,
  /^AKIA[0-9A-Z]{16}$/,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

/** Name prefixes that indicate a secret and must not be client-prefixed. */
export const SECRET_NAME_HINTS: readonly string[] = [
  "SECRET",
  "PASSWORD",
  "PRIVATE_KEY",
  "API_KEY",
  "ACCESS_TOKEN",
  "WEBHOOK_SECRET",
  "ENCRYPTION_KEY",
  "STRIPE_SECRET",
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "CRON_SECRET",
  "ADMIN_BOOTSTRAP",
];

export const ENV_CATALOG: readonly EnvVarDefinition[] = [
  // ── Runtime / deployment identity ─────────────────────────────────
  {
    name: "APP_ENV",
    sensitivity: "internal",
    homes: ["replit_env", "server_env", "eas_env", "ci_secrets"],
    surfaces: ["api_server", "scripts", "eas_build", "mobile_expo", "web_vite"],
    description:
      "Canonical app environment: local | preview | staging | production_web | testflight | app_store",
    requiredFor: ["staging", "production_web", "testflight", "app_store"],
    forbidClientBundle: false,
  },
  {
    name: "NODE_ENV",
    sensitivity: "internal",
    homes: ["server_env", "replit_env"],
    surfaces: ["api_server", "scripts"],
    description: "Node runtime mode (development | production | test)",
    requiredFor: ["production_web"],
    forbidClientBundle: false,
  },
  {
    name: "PORT",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "HTTP listen port for api-server",
    requiredFor: [
      "local",
      "preview",
      "staging",
      "production_web",
    ],
    forbidClientBundle: true,
  },
  {
    name: "SITE_URL",
    sensitivity: "public",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server", "scripts"],
    description: "Canonical public site origin (https://…)",
    requiredFor: ["production_web"],
    forbidClientBundle: false,
  },
  {
    name: "DATABASE_URL",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env", "ci_secrets"],
    surfaces: ["api_server", "scripts"],
    description: "Postgres connection string",
    requiredFor: ["staging", "production_web"],
    forbidClientBundle: true,
  },
  {
    name: "PRODUCTION_DATABASE_HOST",
    sensitivity: "internal",
    homes: ["replit_env", "server_env", "ci_secrets"],
    surfaces: ["api_server", "scripts"],
    description:
      "Hostname substring that identifies the production database (blocks non-prod APP_ENV from writing there)",
    requiredFor: ["staging", "preview"],
    forbidClientBundle: true,
  },

  // ── Stripe ────────────────────────────────────────────────────────
  {
    name: "STRIPE_SECRET_KEY",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server", "scripts"],
    description: "Stripe secret key (sk_test_ / sk_live_)",
    requiredFor: ["production_web"],
    forbidClientBundle: true,
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "Stripe webhook signing secret (whsec_)",
    requiredFor: ["production_web"],
    forbidClientBundle: true,
  },
  {
    name: "STRIPE_PRICE_INDIVIDUAL_WEEKLY",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "Stripe price id for individual weekly plan",
    requiredFor: ["production_web"],
    forbidClientBundle: true,
  },

  // ── AI ────────────────────────────────────────────────────────────
  {
    name: "OPENAI_API_KEY",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "OpenAI API key (server only)",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "OPENAI_MODEL",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "Default OpenAI model id",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "AI_TOOL_ENCRYPTION_KEY",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "Encryption key for clinical AI tool payloads",
    requiredFor: [],
    forbidClientBundle: true,
  },

  // ── Email ─────────────────────────────────────────────────────────
  {
    name: "RESEND_API_KEY",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "Resend API key (or Replit connector)",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "RESEND_FROM_EMAIL",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "From address for transactional email",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "NOTIFICATION_EMAIL",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "Ops notification inbox",
    requiredFor: [],
    forbidClientBundle: true,
  },

  // ── Auth / admin ──────────────────────────────────────────────────
  {
    name: "ADMIN_PASSWORD",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "Admin shell auth header secret",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "ADMIN_BOOTSTRAP_TOKEN",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "One-time admin bootstrap token",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "CRON_SECRET",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "Shared secret for cron endpoints",
    requiredFor: [],
    forbidClientBundle: true,
  },

  // ── Storage / clinical ────────────────────────────────────────────
  {
    name: "CLINICAL_EPHEMERAL_GCS_BUCKET",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "GCS bucket for ephemeral clinical objects",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "CLINICAL_GCS_BUCKET",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "GCS bucket for clinical documents",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "CLINICAL_FILE_SCANNER_URL",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "Malware scan endpoint for clinical uploads",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "CLINICAL_FILE_SCANNER_TOKEN",
    sensitivity: "secret",
    homes: ["replit_secrets", "server_env"],
    surfaces: ["api_server"],
    description: "Auth token for clinical file scanner",
    requiredFor: [],
    forbidClientBundle: true,
  },
  {
    name: "CLINICAL_OPERATION_MODE",
    sensitivity: "internal",
    homes: ["replit_env", "server_env"],
    surfaces: ["api_server"],
    description: "deidentified | phi (see clinical runtime readiness)",
    requiredFor: [],
    forbidClientBundle: true,
  },

  // ── Mobile / EAS / Apple ──────────────────────────────────────────
  {
    name: "EXPO_PUBLIC_DOMAIN",
    sensitivity: "public",
    homes: ["eas_env", "eas_secrets", "client_public", "replit_env"],
    surfaces: ["mobile_expo", "eas_build"],
    description: "API/web host for mobile (public)",
    requiredFor: ["testflight", "app_store"],
    forbidClientBundle: false,
  },
  {
    name: "EXPO_PUBLIC_WEB_ORIGIN",
    sensitivity: "public",
    homes: ["eas_env", "client_public"],
    surfaces: ["mobile_expo", "eas_build"],
    description: "Web origin for expo-router (public)",
    requiredFor: [],
    forbidClientBundle: false,
  },
  {
    name: "EXPO_PUBLIC_API_URL",
    sensitivity: "public",
    homes: ["eas_env", "client_public"],
    surfaces: ["mobile_expo", "eas_build"],
    description: "Optional full API base URL for mobile",
    requiredFor: [],
    forbidClientBundle: false,
  },
  {
    name: "EAS_PROJECT_ID",
    sensitivity: "public",
    homes: ["eas_env", "client_public"],
    surfaces: ["eas_build", "mobile_expo"],
    description: "Expo EAS project id",
    requiredFor: ["testflight", "app_store"],
    forbidClientBundle: false,
  },
  {
    name: "APPLE_TEAM_ID",
    sensitivity: "internal",
    homes: ["apple_connect", "eas_secrets"],
    surfaces: ["eas_build"],
    description: "Apple Developer Team ID (EAS submit / signing)",
    requiredFor: ["app_store"],
    forbidClientBundle: true,
  },
  {
    name: "ASC_APP_ID",
    sensitivity: "internal",
    homes: ["apple_connect", "eas_secrets"],
    surfaces: ["eas_build"],
    description: "App Store Connect app id",
    requiredFor: ["app_store"],
    forbidClientBundle: true,
  },

  // ── Analytics (public measurement ids only) ───────────────────────
  {
    name: "VITE_GA_MEASUREMENT_ID",
    sensitivity: "public",
    homes: ["replit_env", "client_public"],
    surfaces: ["web_vite"],
    description: "Google Analytics measurement id (public)",
    requiredFor: [],
    forbidClientBundle: false,
  },

  // ── Push (future / Expo) ──────────────────────────────────────────
  {
    name: "EXPO_ACCESS_TOKEN",
    sensitivity: "secret",
    homes: ["eas_secrets", "server_env", "replit_secrets"],
    surfaces: ["api_server", "eas_build", "scripts"],
    description: "Expo access token for push / EAS API (server or CI only)",
    requiredFor: [],
    forbidClientBundle: true,
  },
] as const;

export function catalogByName(name: string): EnvVarDefinition | undefined {
  return ENV_CATALOG.find((entry) => entry.name === name);
}

export function secretCatalogEntries(): EnvVarDefinition[] {
  return ENV_CATALOG.filter((e) => e.sensitivity === "secret");
}

export function clientPublicCatalogEntries(): EnvVarDefinition[] {
  return ENV_CATALOG.filter((e) => e.sensitivity === "public");
}
