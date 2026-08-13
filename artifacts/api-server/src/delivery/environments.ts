/**
 * Deploy environment separation (HSP-44).
 * Detected from process env only — never invents secrets or hostnames.
 */

import type { DeployEnvironment } from "@workspace/field-kit-catalog";

/**
 * Resolve deploy environment for config and flags.
 * Order: explicit DEPLOY_ENV / APP_ENV → NODE_ENV mapping → unknown.
 */
export function resolveDeployEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): DeployEnvironment {
  const explicit = (env.DEPLOY_ENV || env.APP_ENV || "").toLowerCase().trim();
  const allowed: DeployEnvironment[] = [
    "development",
    "preview",
    "staging",
    "production",
    "testflight",
    "appstore",
    "test",
  ];
  if (allowed.includes(explicit as DeployEnvironment)) {
    return explicit as DeployEnvironment;
  }
  if (env.VITEST === "true" || env.NODE_ENV === "test") return "test";
  if (env.NODE_ENV === "development") return "development";
  if (env.NODE_ENV === "production") return "production";
  return "unknown";
}

/**
 * Configuration matrix notes (no secret values).
 * Used by /api/client-config for ops clarity.
 */
export const ENVIRONMENT_MATRIX: Record<
  DeployEnvironment,
  { label: string; purpose: string; clients: string }
> = {
  development: {
    label: "Development",
    purpose: "Local or Replit dev; hot reload; non-production data preferred.",
    clients: "Web dev server · Expo dev client",
  },
  preview: {
    label: "Preview",
    purpose: "PR / ephemeral deploys; smoke only; no production PHI.",
    clients: "Preview web URL · optional Expo update channel",
  },
  staging: {
    label: "Staging",
    purpose: "Pre-production integration; migrations dry-run; QA.",
    clients: "Staging web · TestFlight (internal)",
  },
  production: {
    label: "Production",
    purpose: "Live members and billing; change only via controlled rollout.",
    clients: "Production web · App Store / production API host",
  },
  testflight: {
    label: "TestFlight",
    purpose: "iOS beta builds against staging or production API (explicit base URL).",
    clients: "TestFlight binary",
  },
  appstore: {
    label: "App Store",
    purpose: "Released iOS binary; must tolerate API min-version contract.",
    clients: "App Store binary",
  },
  test: {
    label: "Automated test",
    purpose: "CI / vitest / jest; placeholders only.",
    clients: "None (headless)",
  },
  unknown: {
    label: "Unknown",
    purpose: "Environment not classified — set DEPLOY_ENV.",
    clients: "Unknown",
  },
};
