/**
 * Client / API delivery contract (HSP-44).
 * Shared web + iOS numbers so a backend deploy can declare min client versions
 * without scattering magic strings.
 */

/** Bump when removing or breaking a public API the mobile app relies on. */
export const API_CONTRACT_VERSION = 1 as const;

/**
 * Minimum Expo `version` (CFBundleShortVersionString) the current API supports.
 * Raise only when the backend can no longer serve older App Store builds safely.
 */
export const MIN_IOS_APP_VERSION = "1.0.0" as const;

/** Marketing web shell — informational for release notes / force-upgrade messaging. */
export const MIN_WEB_APP_VERSION = "1.0.0" as const;

export type DeployEnvironment =
  | "development"
  | "preview"
  | "staging"
  | "production"
  | "testflight"
  | "appstore"
  | "test"
  | "unknown";

/**
 * Parse semver-ish "1.2.3" (extra suffixes ignored after first three numeric parts).
 * Returns null if unparseable.
 */
export function parseSemver(version: string): [number, number, number] | null {
  const m = String(version || "")
    .trim()
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** True when clientVersion >= minVersion (semver major.minor.patch). */
export function isVersionAtLeast(clientVersion: string, minVersion: string): boolean {
  const c = parseSemver(clientVersion);
  const m = parseSemver(minVersion);
  if (!c || !m) return false;
  for (let i = 0; i < 3; i++) {
    if (c[i]! > m[i]!) return true;
    if (c[i]! < m[i]!) return false;
  }
  return true;
}

export type CompatibilityCheck = {
  ok: boolean;
  reason?: "below_min_ios" | "below_min_web" | "api_contract_too_old" | "invalid_version";
  minIosAppVersion: string;
  minWebAppVersion: string;
  apiContractVersion: number;
};

export function checkIosCompatibility(
  appVersion: string,
  opts?: { minIosAppVersion?: string; apiContractVersion?: number; clientApiContract?: number },
): CompatibilityCheck {
  const minIos = opts?.minIosAppVersion ?? MIN_IOS_APP_VERSION;
  const apiContractVersion = opts?.apiContractVersion ?? API_CONTRACT_VERSION;
  const base: CompatibilityCheck = {
    ok: true,
    minIosAppVersion: minIos,
    minWebAppVersion: MIN_WEB_APP_VERSION,
    apiContractVersion,
  };
  if (!parseSemver(appVersion)) {
    return { ...base, ok: false, reason: "invalid_version" };
  }
  if (!isVersionAtLeast(appVersion, minIos)) {
    return { ...base, ok: false, reason: "below_min_ios" };
  }
  if (
    typeof opts?.clientApiContract === "number" &&
    opts.clientApiContract < apiContractVersion
  ) {
    // Client claims older contract than server — only fail if server bumped contract
    // and client is explicitly older. Equal or higher client contract is fine.
    return { ...base, ok: false, reason: "api_contract_too_old" };
  }
  return base;
}

/** High-risk product flag keys (server resolves values; clients only read). */
export const PRODUCT_FEATURE_FLAG_KEYS = [
  "advanced_ai_tools",
  "clinical_phi_workspace",
  "provider_resource_library",
  "universal_search",
  "activation_loop",
  "product_outcome_analytics",
] as const;

export type ProductFeatureFlagKey = (typeof PRODUCT_FEATURE_FLAG_KEYS)[number];
