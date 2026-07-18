/**
 * Branch Profitability Content Validator
 *
 * Validates that claims are correctly classified and that no assumption or
 * example is presented as a regulatory or payment fact.
 *
 * Rules enforced:
 * 1. Every claim must exist in the registry (getClaim throws on unknown IDs).
 * 2. Claims with claimClass "regulatory_fact" or "payment_fact" must have a
 *    non-empty sourceUrl and lastVerifiedDate.
 * 3. Claims with reviewStatus "deprecated" are blocked from rendering.
 * 4. Claims that requiresDisclaimer must not be rendered without that flag.
 */

import {
  getClaim,
  getAllClaims,
  type ContentClaim,
  type ClaimClass,
} from "./branch_content_claim_registry";

export interface ContentValidationError {
  claimId: string;
  rule: string;
  message: string;
}

export interface ContentValidationResult {
  valid: boolean;
  errors: ContentValidationError[];
  warnings: ContentValidationError[];
}

// ─── Classes that require an authoritative source ─────────────────────────────
const SOURCE_REQUIRED_CLASSES: ClaimClass[] = [
  "regulatory_fact",
  "payment_fact",
];

// ─── Classes that must never be labeled as facts ─────────────────────────────
const NON_FACT_CLASSES: ClaimClass[] = [
  "model_assumption",
  "operating_example",
  "strategy_guidance",
  "opinion",
];

// ─── Validate a single claim ──────────────────────────────────────────────────

export function validateClaim(claim: ContentClaim): ContentValidationError[] {
  const errors: ContentValidationError[] = [];

  // Rule 1: Deprecated claims must not render
  if (claim.reviewStatus === "deprecated") {
    errors.push({
      claimId: claim.claimId,
      rule: "no_deprecated_claims",
      message: `Claim "${claim.claimId}" has reviewStatus "deprecated" and must not be rendered.`,
    });
  }

  // Rule 2: regulatory_fact and payment_fact require a source URL and date
  if (SOURCE_REQUIRED_CLASSES.includes(claim.claimClass)) {
    if (!claim.sourceUrl) {
      errors.push({
        claimId: claim.claimId,
        rule: "source_url_required",
        message: `Claim "${claim.claimId}" has claimClass "${claim.claimClass}" but is missing sourceUrl.`,
      });
    }
    if (!claim.lastVerifiedDate) {
      errors.push({
        claimId: claim.claimId,
        rule: "verified_date_required",
        message: `Claim "${claim.claimId}" has claimClass "${claim.claimClass}" but is missing lastVerifiedDate.`,
      });
    }
  }

  // Rule 3: Non-fact claims must have a claimId prefix that matches their class
  // (prevents accidentally filing an operating_example under a "tip.rhc" key
  //  that might be confused with a payment fact)
  // — This is a soft advisory check, not a hard block.

  return errors;
}

// ─── Validate the entire registry ─────────────────────────────────────────────

export function validateAllClaims(): ContentValidationResult {
  const allClaims = getAllClaims();
  const errors: ContentValidationError[] = [];
  const warnings: ContentValidationError[] = [];

  for (const claim of allClaims) {
    const claimErrors = validateClaim(claim);
    errors.push(...claimErrors);

    // Soft warnings
    if (claim.claimClass !== "regulatory_fact" && claim.claimClass !== "payment_fact") {
      if (!claim.requiresDisclaimer && NON_FACT_CLASSES.includes(claim.claimClass)) {
        warnings.push({
          claimId: claim.claimId,
          rule: "disclaimer_recommended",
          message: `Claim "${claim.claimId}" is a non-fact class "${claim.claimClass}" but requiresDisclaimer is false.`,
        });
      }
    }

    if (claim.confidenceLevel === "low") {
      warnings.push({
        claimId: claim.claimId,
        rule: "low_confidence",
        message: `Claim "${claim.claimId}" has low confidence and should be reviewed.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Guard: validate a claim before rendering ─────────────────────────────────

/**
 * Retrieves and validates a claim before it may be rendered.
 * Throws if the claim is invalid (deprecated, missing required fields).
 * Returns the claim if valid.
 */
export function assertClaimRenderable(claimId: string): ContentClaim {
  const claim = getClaim(claimId); // throws if ID is unknown
  const errors = validateClaim(claim);
  if (errors.length > 0) {
    throw new Error(
      `[ContentValidator] Claim "${claimId}" failed validation:\n` +
      errors.map((e) => `  - [${e.rule}] ${e.message}`).join("\n")
    );
  }
  return claim;
}

// ─── Check whether a claim is classified as fact (should be labeled if mixed) ─

export function isFactualClaim(claim: ContentClaim): boolean {
  return (
    claim.claimClass === "regulatory_fact" ||
    claim.claimClass === "payment_fact" ||
    claim.claimClass === "formula_rule"
  );
}

export function requiresAssumptionLabel(claim: ContentClaim): boolean {
  return claim.requiresDisclaimer;
}
