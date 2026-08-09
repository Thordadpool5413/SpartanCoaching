/**
 * Backward-compatibility policy for released iOS (and web) clients.
 *
 * Backend may add fields anytime. Breaking changes require:
 * 1. New route or additive optional field first
 * 2. Deprecation window (below)
 * 3. Smoke/parity still green for supported clients
 */

/** Calendar months minimum to keep a deprecated contract callable. */
export const API_DEPRECATION_WINDOW_MONTHS = 6;

/**
 * Oldest iOS app build number still expected to work against current API.
 * Update when dropping support after the deprecation window.
 * null = all currently released TestFlight/App Store builds supported.
 */
export const MIN_SUPPORTED_IOS_BUILD: number | null = null;

/**
 * API surface version for documentation and future Accept headers.
 * Not required on every request today (backward compatible).
 */
export const API_CONTRACT_VERSION = "1";

/** Header clients may send later; ignored if absent (no break). */
export const API_VERSION_HEADER = "X-Spartan-Api-Version";

/** Header for deprecation notices on responses (optional). */
export const API_DEPRECATION_HEADER = "Deprecation";

export type DeprecationNotice = {
  /** Route or code being retired */
  target: string;
  /** ISO date when removal is earliest allowed */
  removeAfter: string;
  /** Replacement path or guidance */
  successor: string;
};

/**
 * Compute earliest removal date from an announced deprecation day.
 * Pure helper for ops notes and future middleware.
 */
export function earliestRemovalDate(announcedOn: Date): Date {
  const d = new Date(announcedOn.getTime());
  d.setUTCMonth(d.getUTCMonth() + API_DEPRECATION_WINDOW_MONTHS);
  return d;
}

export function isPastRemovalDate(
  removeAfterIso: string,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= new Date(removeAfterIso).getTime();
}

/**
 * Rules for non-breaking vs breaking changes (contract tests document these).
 */
export const COMPATIBILITY_RULES = {
  additiveResponseFields: "allowed_without_version_bump",
  removeResponseField: "requires_deprecation_window",
  renameErrorCode: "requires_deprecation_window",
  changeAuthGateFrom401to403: "allowed_if_both_already_handled",
  newRequiredRequestField: "breaking_unless_defaulted",
  removeEndpoint: "requires_deprecation_window",
} as const;
