/**
 * Server-resolved product feature flags (HSP-44).
 * High-risk toggles via env — clients read GET /api/client-config, not scattered ifs.
 * AI tool kill-switches remain on AI_TOOL_* via spartan-ai-tools (not duplicated here).
 */

import {
  PRODUCT_FEATURE_FLAG_KEYS,
  type ProductFeatureFlagKey,
} from "@workspace/field-kit-catalog";
import type { DeployEnvironment } from "@workspace/field-kit-catalog";
import { resolveDeployEnvironment } from "./environments";

export type FeatureFlagDef = {
  key: ProductFeatureFlagKey;
  /** Env var override: "true" | "false" */
  envKey: string;
  /** Default when env unset */
  defaultEnabled: boolean;
  risk: "low" | "medium" | "high";
  description: string;
};

/** Registry — add flags here; do not invent parallel client-only switches for the same risk. */
export const FEATURE_FLAG_DEFS: FeatureFlagDef[] = [
  {
    key: "advanced_ai_tools",
    envKey: "FF_ADVANCED_AI_TOOLS",
    defaultEnabled: true,
    risk: "high",
    description: "Spartan AI tools hub for entitled members (per-tool AI_TOOL_* still apply).",
  },
  {
    // Keep the legacy key and environment variable stable for deployed clients.
    // The enabled workspace accepts deidentified information only.
    key: "clinical_phi_workspace",
    envKey: "FF_CLINICAL_PHI_WORKSPACE",
    defaultEnabled: false,
    risk: "high",
    description: "Elite deidentified clinical guidance routes with mandatory human approval.",
  },
  {
    key: "provider_resource_library",
    envKey: "FF_PROVIDER_RESOURCE_LIBRARY",
    defaultEnabled: true,
    risk: "medium",
    description: "Provider-owned private resource libraries.",
  },
  {
    key: "universal_search",
    envKey: "FF_UNIVERSAL_SEARCH",
    defaultEnabled: true,
    risk: "medium",
    description: "Universal multi-type search API and UI.",
  },
  {
    key: "activation_loop",
    envKey: "FF_ACTIVATION_LOOP",
    defaultEnabled: true,
    risk: "low",
    description: "First-value activation loop panel.",
  },
  {
    key: "product_outcome_analytics",
    envKey: "FF_PRODUCT_OUTCOME_ANALYTICS",
    defaultEnabled: true,
    risk: "low",
    description: "Product outcome analytics events (privacy-sanitized).",
  },
];

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

/**
 * Environment-aware defaults: Elite clinical guidance stays off outside production/staging
 * unless explicitly enabled.
 */
export function defaultForFlag(
  def: FeatureFlagDef,
  environment: DeployEnvironment,
): boolean {
  if (def.key === "clinical_phi_workspace") {
    if (environment === "production" || environment === "staging") {
      return def.defaultEnabled;
    }
    return false;
  }
  return def.defaultEnabled;
}

export function resolveFeatureFlags(
  env: NodeJS.ProcessEnv = process.env,
): Record<ProductFeatureFlagKey, boolean> {
  const environment = resolveDeployEnvironment(env);
  const out = {} as Record<ProductFeatureFlagKey, boolean>;
  for (const def of FEATURE_FLAG_DEFS) {
    const fallback = defaultForFlag(def, environment);
    out[def.key] = parseBool(env[def.envKey], fallback);
  }
  // Ensure registry keys stay complete
  for (const key of PRODUCT_FEATURE_FLAG_KEYS) {
    if (out[key] === undefined) out[key] = false;
  }
  return out;
}

export function isFeatureEnabled(
  key: ProductFeatureFlagKey,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveFeatureFlags(env)[key] === true;
}
