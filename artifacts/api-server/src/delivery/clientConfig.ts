/**
 * Client config payload for web + iOS (HSP-44).
 */

import type { RequestHandler } from "express";
import {
  API_CONTRACT_VERSION,
  MIN_IOS_APP_VERSION,
  MIN_WEB_APP_VERSION,
  checkIosCompatibility,
} from "@workspace/field-kit-catalog";
import { ENVIRONMENT_MATRIX, resolveDeployEnvironment } from "./environments";
import { FEATURE_FLAG_DEFS, resolveFeatureFlags } from "./featureFlags";

export type ClientConfigResponse = {
  environment: string;
  environmentMeta: { label: string; purpose: string; clients: string };
  apiContractVersion: number;
  minIosAppVersion: string;
  minWebAppVersion: string;
  /** When true, API returns 426 for iOS clients below minIosAppVersion (header required). */
  enforceMinIosVersion: boolean;
  flags: Record<string, boolean>;
  flagCatalog: Array<{
    key: string;
    envKey: string;
    risk: string;
    description: string;
    enabled: boolean;
  }>;
  rollback: {
    api: string;
    web: string;
    ios: string;
    database: string;
  };
  compatibility: {
    ios?: ReturnType<typeof checkIosCompatibility>;
  };
};

function enforceMinIos(env: NodeJS.ProcessEnv): boolean {
  return env.ENFORCE_MIN_IOS_VERSION === "true" || env.ENFORCE_MIN_IOS_VERSION === "1";
}

export function buildClientConfig(
  env: NodeJS.ProcessEnv = process.env,
  opts?: { iosAppVersion?: string | null; clientApiContract?: number | null },
): ClientConfigResponse {
  const environment = resolveDeployEnvironment(env);
  const flags = resolveFeatureFlags(env);
  const minIos =
    env.MIN_IOS_APP_VERSION?.trim() || MIN_IOS_APP_VERSION;
  const minWeb =
    env.MIN_WEB_APP_VERSION?.trim() || MIN_WEB_APP_VERSION;

  let iosCompat: ReturnType<typeof checkIosCompatibility> | undefined;
  if (opts?.iosAppVersion) {
    iosCompat = checkIosCompatibility(opts.iosAppVersion, {
      minIosAppVersion: minIos,
      apiContractVersion: API_CONTRACT_VERSION,
      clientApiContract:
        typeof opts.clientApiContract === "number" ? opts.clientApiContract : undefined,
    });
  }

  return {
    environment,
    environmentMeta: ENVIRONMENT_MATRIX[environment],
    apiContractVersion: API_CONTRACT_VERSION,
    minIosAppVersion: minIos,
    minWebAppVersion: minWeb,
    enforceMinIosVersion: enforceMinIos(env),
    flags,
    flagCatalog: FEATURE_FLAG_DEFS.map((d) => ({
      key: d.key,
      envKey: d.envKey,
      risk: d.risk,
      description: d.description,
      enabled: flags[d.key],
    })),
    rollback: {
      api: "Redeploy the previous known-good API release; run node scripts/smoke-health.mjs <SITE_URL>; keep DATABASE_URL pointing at the same DB unless a forward migration is verified.",
      web: "Redeploy the previous web artifact on Replit/host; hard-refresh or clear CDN if used. Feature flags can disable high-risk UI without a full rollback.",
      ios: "Pause phased release in App Store Connect; keep serving minIosAppVersion-compatible API. Ship prior TestFlight/App Store binary if a client bug ships. Raise MIN_IOS_APP_VERSION only when older builds cannot be supported.",
      database: "Do not reverse migrations in production without a backup and plan. Prefer forward-fix migrations. If a deploy is bad, roll back application code first while DB stays forward-compatible.",
    },
    compatibility: {
      ios: iosCompat,
    },
  };
}

/** Shared existing API compatibility gate, including early reserved control routes. */
export const requireCompatibleApiClient: RequestHandler = (req, res, next) => {
  if (
    process.env.ENFORCE_MIN_IOS_VERSION !== "true" &&
    process.env.ENFORCE_MIN_IOS_VERSION !== "1"
  ) {
    return next();
  }
  const pathOnly = (req.originalUrl || req.url || "").split("?")[0] || "";
  if (
    pathOnly.startsWith("/api/health") ||
    pathOnly.startsWith("/api/healthz") ||
    pathOnly === "/api/client-config" ||
    pathOnly.startsWith("/api/billing/webhook")
  ) {
    return next();
  }
  const platform = String(req.get("x-client-platform") || "").toLowerCase();
  if (platform !== "ios") return next();
  const version = req.get("x-client-version") || "";
  const minIos = process.env.MIN_IOS_APP_VERSION?.trim() || MIN_IOS_APP_VERSION;
  const contractRaw = req.get("x-client-api-contract");
  const clientApiContract = contractRaw ? Number(contractRaw) : undefined;
  const check = checkIosCompatibility(version, {
    minIosAppVersion: minIos,
    apiContractVersion: API_CONTRACT_VERSION,
    clientApiContract:
      clientApiContract != null && !Number.isNaN(clientApiContract)
        ? clientApiContract
        : undefined,
  });
  if (check.ok) return next();
  return res.status(426).json({
    error: "Client upgrade required",
    code: "CLIENT_UPGRADE_REQUIRED",
    reason: check.reason,
    minIosAppVersion: check.minIosAppVersion,
    apiContractVersion: check.apiContractVersion,
  });
};
