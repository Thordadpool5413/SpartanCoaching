import { createHash } from "node:crypto";
import { z } from "zod";
import {
  authorityMatrix,
  contextSchema,
  registrySchema,
  requiredReviewer,
  sourceSchema,
  versionSchema,
  type ApplicabilityState,
  type KnowledgeContext,
  type KnowledgeSource,
  type KnowledgeVersion,
} from "./contracts";

// Public error codes only: never return validator dumps containing caller content.
export function parseContract<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  return result.data;
}
export function hasCurrentApproval(
  s: KnowledgeSource,
  v: KnowledgeVersion,
  now: string,
) {
  return v.approvals.some(
    (a) =>
      a.reviewerRole === requiredReviewer(s.domain) &&
      a.versionId === v.id &&
      a.normalizedHash === v.normalizedHash &&
      a.reviewedAt <= now &&
      a.reviewDueAt > now,
  );
}
export function licenseAllows(
  v: KnowledgeVersion,
  now: string,
  purpose: KnowledgeContext["purpose"],
) {
  return (
    v.license.status === "APPROVED" &&
    Boolean(v.license.approvedBy) &&
    v.license.commercialUse &&
    v.license.permittedUses.includes(purpose) &&
    (!v.license.expiresAt || v.license.expiresAt > now)
  );
}
function visible(s: KnowledgeSource, c: KnowledgeContext) {
  return (
    s.scope.kind === "PUBLIC" || s.scope.organizationId === c.organizationId
  );
}
type Decision = {
  state: ApplicabilityState;
  reasons: string[];
  warnings: string[];
};
function decision(state: ApplicabilityState, ...reasons: string[]): Decision {
  return { state, reasons, warnings: [] };
}
export function evaluateApplicability(
  sourceInput: unknown,
  versionInput: unknown,
  contextInput: unknown,
): Decision {
  const s = parseContract(sourceSchema, sourceInput);
  const v = parseContract(versionSchema, versionInput);
  const c = parseContract(contextSchema, contextInput);
  if (s.id !== v.sourceId)
    return decision("NOT_APPLICABLE", "SOURCE_ID_MISMATCH");
  if (!visible(s, c)) return decision("SCOPE_DENIED", "TENANT_SCOPE");
  if (
    s.educationalOnly ||
    !s.claimTypes.includes(c.claimType) ||
    !authorityMatrix[c.claimType].includes(s.domain)
  )
    return decision("NOT_APPLICABLE", "CLAIM_DOMAIN_OR_EDUCATIONAL_SOURCE");
  if (!c.serviceDate || !c.jurisdiction || c.payer === "UNKNOWN")
    return decision(
      "INSUFFICIENT_CONTEXT",
      "SERVICE_DATE_JURISDICTION_PAYER_REQUIRED",
    );
  if (
    !v.scope.payers.includes(c.payer) ||
    !v.scope.jurisdictions.includes(c.jurisdiction)
  )
    return decision("NOT_APPLICABLE", "PAYER_OR_JURISDICTION_MISMATCH");
  if (
    c.serviceDate < v.effectiveFrom ||
    (v.effectiveTo && c.serviceDate >= v.effectiveTo)
  )
    return decision("NOT_APPLICABLE", "OUTSIDE_EFFECTIVE_WINDOW");
  const dimensions = [
    ["macs", "mac"],
    ["providerTypes", "providerType"],
    ["settings", "setting"],
    ["benefitPeriods", "benefitPeriod"],
    ["codeEditions", "codeEdition"],
    ["products", "product"],
    ["populations", "population"],
  ] as const;
  const missing: string[] = [];
  for (const [scopeKey, contextKey] of dimensions) {
    const allowed = v.scope[scopeKey];
    if (allowed === null) continue; // Explicitly reviewed dimension-independent source.
    const value = c[contextKey];
    if (!value) missing.push(contextKey);
    else if (!allowed.includes(value))
      return decision("NOT_APPLICABLE", `MISMATCH_${contextKey}`);
  }
  if (missing.length)
    return decision(
      "INSUFFICIENT_CONTEXT",
      ...missing.map((k) => `MISSING_${k}`),
    );
  if (v.state === "REVOKED" || v.revokedAt || v.health.state === "REVOKED")
    return decision("SOURCE_REVOKED", "REVOKED");
  if (s.domain === "MAC_COVERAGE" && v.scope.macs === null)
    return decision("INSUFFICIENT_CONTEXT", "MAC_SCOPE_NOT_CONFIGURED");
  if (!licenseAllows(v, c.now, c.purpose))
    return decision("LICENSE_NOT_PERMITTED", "LICENSE_PERMISSION_OR_EXPIRY");
  if (!hasCurrentApproval(s, v, c.now))
    return decision("NOT_APPROVED", "APPROVAL_MISSING_MISMATCHED_OR_EXPIRED");
  // Superseded versions can still govern a historical service date. Revocation cannot.
  if (
    !["ACTIVE", "SUPERSEDED"].includes(v.state) ||
    !v.activatedAt ||
    v.activatedAt > c.now
  )
    return decision("NOT_ACTIVE", "NOT_ACTIVATED");
  if (
    v.publishedAt > c.now ||
    v.retrievedAt > c.now ||
    v.health.checkedAt > c.now
  )
    return decision("SOURCE_UNAVAILABLE", "FUTURE_PROVENANCE");
  if (v.health.hardExpiresAt <= c.now || v.health.state === "STALE_BLOCKED")
    return decision("SOURCE_EXPIRED", "HEALTH_HARD_LIMIT");
  const stale = v.health.warningAt <= c.now || v.health.state !== "CURRENT";
  if (stale && !v.health.lastKnownGoodAllowed)
    return decision("SOURCE_UNAVAILABLE", "LAST_KNOWN_GOOD_NOT_ALLOWED");
  return {
    state: "APPLICABLE",
    reasons: ["CLAIM_DOMAIN_SCOPE_VERSION_AND_RIGHTS_MATCH"],
    warnings: stale ? ["STALE_ALLOWED_WITH_WARNING"] : [],
  };
}

function freeze(value: unknown): void {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}
export function createKnowledgeRegistry(input: unknown) {
  const registry = parseContract(registrySchema, input);
  // Registry is metadata for public/protocol knowledge, never a patient repository.
  if (
    registry.sources.some((s) =>
      [
        "PATIENT_EVIDENCE",
        "DETERMINISTIC_DERIVATION",
        "HUMAN_CLINICAL_REVIEW",
      ].includes(s.domain),
    )
  )
    throw new Error("PATIENT_AUTHORITY_REQUIRES_PATIENT_CONTEXT_SERVICE");
  const bundleHash = createHash("sha256")
    .update(JSON.stringify(registry))
    .digest("hex");
  freeze(registry);
  return Object.freeze({
    bundleId: registry.bundleId,
    bundleHash,
    resolve(contextInput: unknown) {
      const c = parseContract(contextSchema, contextInput);
      const base = {
        contractVersion: registry.contractVersion,
        bundleId: registry.bundleId,
        bundleHash,
        humanReviewRequired: true as const,
      };
      const empty = (state: string) => ({
        ...base,
        state,
        selected: [],
        decisions: [],
      });
      if (!c.serviceDate || !c.jurisdiction || c.payer === "UNKNOWN")
        return empty("INSUFFICIENT_CONTEXT");
      if (!registry.supportedPayers.includes(c.payer))
        return empty("PAYER_KNOWLEDGE_NOT_CONFIGURED");
      if (!registry.supportedJurisdictions.includes(c.jurisdiction))
        return empty("JURISDICTION_NOT_SUPPORTED");
      const sources = registry.sources.filter(
        (s) =>
          visible(s, c) &&
          s.claimTypes.includes(c.claimType) &&
          authorityMatrix[c.claimType].includes(s.domain),
      );
      // Never expose another tenant's IDs or rejection details.
      const decisions = registry.versions.flatMap((v) => {
        const s = sources.find((s) => s.id === v.sourceId);
        return s
          ? [
              {
                sourceId: s.id,
                versionId: v.id,
                ...evaluateApplicability(s, v, c),
              },
            ]
          : [];
      });
      const eligible = registry.versions.filter((v) =>
        decisions.some((d) => d.versionId === v.id && d.state === "APPLICABLE"),
      );
      const ambiguous = eligible.some((v) =>
        eligible.some(
          (other) =>
            other.id !== v.id &&
            (v.conflictsWith.includes(other.id) ||
              (v.sourceId === other.sourceId &&
                v.documentId === other.documentId)),
        ),
      );
      if (ambiguous)
        return {
          ...base,
          state: "CONFLICT_REQUIRES_REVIEW",
          selected: [],
          decisions,
        };
      // Relevant indeterminate/blocked versions cannot be silently replaced by a
      // convenient source. Definitely inapplicable sources do not block a match.
      const blocked = decisions.find(
        (d) => !["APPLICABLE", "NOT_APPLICABLE"].includes(d.state),
      );
      if (blocked)
        return { ...base, state: blocked.state, selected: [], decisions };
      return {
        ...base,
        state: eligible.length
          ? "APPLICABLE"
          : decisions.length
            ? "NOT_APPLICABLE"
            : "SOURCE_UNAVAILABLE",
        decisions,
        selected: eligible.map((v) => ({
          sourceId: v.sourceId,
          versionId: v.id,
          documentId: v.documentId,
          edition: v.edition,
          rawHash: v.rawHash,
          normalizedHash: v.normalizedHash,
          effectiveFrom: v.effectiveFrom,
          effectiveTo: v.effectiveTo,
        })),
      };
    },
  });
}
