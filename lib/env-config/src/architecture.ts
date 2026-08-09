import type { AppEnvironment, ConfigHome } from "./catalog";

/**
 * Short machine-readable map of which systems own configuration per target.
 * Human narrative: docs/env-architecture.md
 */
export const ENV_ARCHITECTURE_SUMMARY = {
  local: {
    description: "Developer machine / Replit workspace shell",
    configHomes: ["server_env", "replit_env", "replit_secrets"] as ConfigHome[],
    clients: "Web vite dev + Expo Metro; public EXPO_PUBLIC_* / VITE_* only",
    dataWrites: "Local or dedicated dev DATABASE_URL only",
  },
  preview: {
    description: "Replit preview / ephemeral deploy",
    configHomes: ["replit_secrets", "replit_env"] as ConfigHome[],
    clients: "Preview web origin; optional internal mobile",
    dataWrites: "Non-production database; set PRODUCTION_DATABASE_HOST to block prod",
  },
  staging: {
    description: "Staging API + web (pre-prod)",
    configHomes: ["server_env", "replit_secrets", "ci_secrets"] as ConfigHome[],
    clients: "Staging web/mobile pointing at staging API only",
    dataWrites: "Staging DATABASE_URL + sk_test_ Stripe only",
  },
  production_web: {
    description: "Canonical web + API (Replit Publish / spartanhospicecoaching.com)",
    configHomes: ["replit_secrets", "replit_env", "server_env"] as ConfigHome[],
    clients: "Production web bundle; VITE_GA only as public analytics",
    dataWrites: "Production DATABASE_URL; live Stripe allowed only here",
  },
  testflight: {
    description: "iOS TestFlight (EAS profile testflight)",
    configHomes: ["eas_secrets", "eas_env", "apple_connect"] as ConfigHome[],
    clients: "EXPO_PUBLIC_DOMAIN / API URL → production or staging API as intentional",
    dataWrites:
      "Mobile must not embed secrets; API keys stay on server. Prefer staging API until store cert.",
  },
  app_store: {
    description: "iOS App Store production (EAS profile production)",
    configHomes: ["eas_secrets", "eas_env", "apple_connect"] as ConfigHome[],
    clients: "EXPO_PUBLIC_* → production API host only",
    dataWrites: "Server-side only via production API",
  },
} as const satisfies Record<
  AppEnvironment,
  {
    description: string;
    configHomes: readonly ConfigHome[];
    clients: string;
    dataWrites: string;
  }
>;

export function homesForEnvironment(env: AppEnvironment): readonly ConfigHome[] {
  return ENV_ARCHITECTURE_SUMMARY[env].configHomes;
}
