import { z } from "zod";

export const claimTypes = [
  "LEGAL_REQUIREMENT",
  "MEDICARE_COVERAGE_REQUIREMENT",
  "MEDICARE_PAYMENT_RULE",
  "MEDICARE_CLAIMS_RULE",
  "CODING_RULE",
  "CODE_DEFINITION",
  "DRUG_IDENTITY",
  "DRUG_LABEL_FACT",
  "DRUG_INTERACTION_FACT",
  "CLINICAL_RESEARCH_EVIDENCE",
  "CLINICAL_PROTOCOL_GUIDANCE",
  "PATIENT_SOURCE_FACT",
  "DERIVED_PATIENT_FACT",
  "CLINICAL_INFERENCE",
  "WORKFLOW_GUIDANCE",
  "QUALITY_REPORTING_RULE",
  "COMPLIANCE_GUIDANCE",
] as const;
export const domains = [
  "STATUTE",
  "REGULATION",
  "STATE_LAW",
  "MEDICARE_NATIONAL",
  "MAC_COVERAGE",
  "CMS_MANUAL",
  "CMS_PAYMENT",
  "OFFICIAL_CODING",
  "DRUG_TERMINOLOGY",
  "DRUG_LABEL",
  "PHARMACOLOGY",
  "CLINICAL_EVIDENCE",
  "CLINICAL_PROTOCOL",
  "PATIENT_EVIDENCE",
  "DETERMINISTIC_DERIVATION",
  "HUMAN_CLINICAL_REVIEW",
  "SPARTAN_WORKFLOW",
  "QUALITY_REPORTING",
  "COMPLIANCE",
] as const;
export type ClaimType = (typeof claimTypes)[number];
export type AuthorityDomain = (typeof domains)[number];
// Eligible domain sets, never a universal priority ladder or clinical sufficiency rule.
export const authorityMatrix: Readonly<
  Record<ClaimType, readonly AuthorityDomain[]>
> = Object.freeze({
  LEGAL_REQUIREMENT: ["STATUTE", "REGULATION", "STATE_LAW"],
  MEDICARE_COVERAGE_REQUIREMENT: [
    "REGULATION",
    "MEDICARE_NATIONAL",
    "MAC_COVERAGE",
    "CMS_MANUAL",
  ],
  MEDICARE_PAYMENT_RULE: ["REGULATION", "CMS_PAYMENT", "CMS_MANUAL"],
  MEDICARE_CLAIMS_RULE: ["REGULATION", "CMS_MANUAL", "OFFICIAL_CODING"],
  CODING_RULE: ["OFFICIAL_CODING"],
  CODE_DEFINITION: ["OFFICIAL_CODING"],
  DRUG_IDENTITY: ["DRUG_TERMINOLOGY"],
  DRUG_LABEL_FACT: ["DRUG_LABEL"],
  DRUG_INTERACTION_FACT: ["PHARMACOLOGY"],
  CLINICAL_RESEARCH_EVIDENCE: ["CLINICAL_EVIDENCE"],
  CLINICAL_PROTOCOL_GUIDANCE: ["CLINICAL_PROTOCOL"],
  PATIENT_SOURCE_FACT: ["PATIENT_EVIDENCE"],
  DERIVED_PATIENT_FACT: ["DETERMINISTIC_DERIVATION"],
  CLINICAL_INFERENCE: ["HUMAN_CLINICAL_REVIEW"],
  WORKFLOW_GUIDANCE: ["SPARTAN_WORKFLOW"],
  QUALITY_REPORTING_RULE: ["QUALITY_REPORTING", "REGULATION"],
  COMPLIANCE_GUIDANCE: ["COMPLIANCE", "REGULATION"],
});
Object.values(authorityMatrix).forEach(Object.freeze);
export const unknownStates = [
  "UNKNOWN",
  "NOT_CHECKED",
  "SOURCE_UNAVAILABLE",
  "NOT_APPLICABLE",
  "INSUFFICIENT_EVIDENCE",
  "INSUFFICIENT_PATIENT_CONTEXT",
  "POLICY_NOT_CONFIGURED",
  "PAYER_KNOWLEDGE_NOT_CONFIGURED",
  "JURISDICTION_NOT_SUPPORTED",
  "CONFLICTING_SOURCES",
  "HUMAN_REVIEW_REQUIRED",
  "CHECKED_NO_KNOWN_ISSUE",
  "ISSUE_FOUND",
] as const;
export const unknownStateSchema = z.enum(unknownStates);
export const applicabilityStates = [
  "APPLICABLE",
  "NOT_APPLICABLE",
  "INSUFFICIENT_CONTEXT",
  "SOURCE_UNAVAILABLE",
  "SOURCE_EXPIRED",
  "SOURCE_REVOKED",
  "CONFLICT_REQUIRES_REVIEW",
  "LICENSE_NOT_PERMITTED",
  "NOT_APPROVED",
  "NOT_ACTIVE",
  "SCOPE_DENIED",
] as const;
export type ApplicabilityState = (typeof applicabilityStates)[number];
export const roles = [
  "PHYSICIAN",
  "CLINICAL_LEADER",
  "PHARMACIST",
  "CODER",
  "COMPLIANCE_REVIEWER",
  "WORKFLOW_REVIEWER",
] as const;
export type ReviewerRole = (typeof roles)[number];
export const payers = [
  "TRADITIONAL_MEDICARE",
  "MEDICAID",
  "COMMERCIAL",
  "OTHER",
  "UNKNOWN",
] as const;
export const lifecycleStates = [
  "DETECTED",
  "FETCHED",
  "QUARANTINED",
  "PARSED",
  "DIFFED",
  "VALIDATED",
  "REVIEW_PENDING",
  "APPROVED",
  "ACTIVE",
  "SUPERSEDED",
  "REVOKED",
] as const;
export const purposes = [
  "INTERNAL_STORAGE",
  "MODEL_INPUT",
  "PROMPT_USE",
  "CUSTOMER_DISPLAY",
  "REDISTRIBUTION",
] as const;
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const stamp = z
  .string()
  .datetime()
  .transform((value) => new Date(value).toISOString());
const day = z.string().date();
const strings = z.array(id).min(1).max(100);
const url = z
  .string()
  .url()
  .refine((value) => {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  }, "HTTPS_SOURCE_REQUIRED");
export const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("PUBLIC") }).strict(),
  z.object({ kind: z.literal("TENANT"), organizationId: id }).strict(),
]);
export const sourceSchema = z
  .object({
    id,
    publisher: z.string().min(1).max(200),
    title: z.string().min(1).max(300),
    domain: z.enum(domains),
    claimTypes: z.array(z.enum(claimTypes)).min(1).max(claimTypes.length),
    officialUrl: url,
    scope: scopeSchema,
    educationalOnly: z.boolean(),
  })
  .strict()
  .refine(
    (s) => s.claimTypes.every((c) => authorityMatrix[c].includes(s.domain)),
    "DOMAIN_CLAIM_MISMATCH",
  );
export const approvalSchema = z
  .object({
    reviewerId: id,
    reviewerRole: z.enum(roles),
    versionId: id,
    normalizedHash: hash,
    reviewedAt: stamp,
    reviewDueAt: stamp,
  })
  .strict()
  .refine((a) => a.reviewedAt < a.reviewDueAt, "INVALID_REVIEW_WINDOW");
export const versionSchema = z
  .object({
    id,
    sourceId: id,
    documentId: id,
    edition: id,
    sourceUrl: url,
    rawHash: hash,
    normalizedHash: hash,
    parserVersion: id,
    publishedAt: stamp,
    retrievedAt: stamp,
    effectiveFrom: day,
    effectiveTo: day.nullable(),
    scope: z
      .object({
        payers: z.array(z.enum(payers).exclude(["UNKNOWN"])).min(1),
        jurisdictions: strings,
        macs: strings.nullable(),
        providerTypes: strings.nullable(),
        settings: strings.nullable(),
        benefitPeriods: strings.nullable(),
        codeEditions: strings.nullable(),
        products: strings.nullable(),
        populations: strings.nullable(),
      })
      .strict(),
    license: z
      .object({
        id,
        owner: id,
        edition: id,
        status: z.enum(["APPROVED", "PENDING", "DENIED"]),
        approvedBy: id.nullable(),
        expiresAt: stamp.nullable(),
        commercialUse: z.boolean(),
        permittedUses: z.array(z.enum(purposes)).max(purposes.length),
      })
      .strict(),
    state: z.enum(lifecycleStates),
    revision: z.number().int().nonnegative(),
    approvals: z.array(approvalSchema).max(20),
    activatedAt: stamp.nullable(),
    supersededBy: id.nullable(),
    revokedAt: stamp.nullable(),
    revocationReason: id.nullable(),
    health: z
      .object({
        state: z.enum([
          "CURRENT",
          "STALE_ALLOWED_WITH_WARNING",
          "STALE_BLOCKED",
          "UPSTREAM_UNAVAILABLE",
          "REVOKED",
        ]),
        checkedAt: stamp,
        lastValidatedAt: stamp,
        warningAt: stamp,
        hardExpiresAt: stamp,
        lastKnownGoodAllowed: z.boolean(),
      })
      .strict(),
    conflictsWith: z.array(id).max(100),
    legacyCoverageSnapshotId: z.string().uuid().nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (v.effectiveTo && v.effectiveTo <= v.effectiveFrom)
      fail("INVALID_EFFECTIVE_WINDOW");
    if (
      v.health.warningAt >= v.health.hardExpiresAt ||
      v.health.lastValidatedAt > v.health.checkedAt ||
      v.retrievedAt < v.publishedAt
    )
      fail("INVALID_PROVENANCE_WINDOW");
    if (
      v.approvals.some(
        (a) => a.versionId !== v.id || a.normalizedHash !== v.normalizedHash,
      )
    )
      fail("APPROVAL_ARTIFACT_MISMATCH");
    if (v.state === "ACTIVE" && !v.activatedAt) fail("ACTIVATION_MISSING");
    if (v.state === "REVOKED" && (!v.revokedAt || !v.revocationReason))
      fail("REVOCATION_MISSING");
  });
export type KnowledgeSource = z.infer<typeof sourceSchema>;
export type KnowledgeVersion = z.infer<typeof versionSchema>;
export const contextSchema = z
  .object({
    claimType: z.enum(claimTypes),
    payer: z.enum(payers),
    jurisdiction: id.optional(),
    serviceDate: day.optional(),
    organizationId: id.optional(),
    purpose: z.enum(purposes),
    now: stamp,
    mac: id.optional(),
    providerType: id.optional(),
    setting: id.optional(),
    benefitPeriod: id.optional(),
    codeEdition: id.optional(),
    product: id.optional(),
    population: id.optional(),
  })
  .strict();
export type KnowledgeContext = z.infer<typeof contextSchema>;
export const registrySchema = z
  .object({
    contractVersion: z.literal("knowledge-foundation-v1"),
    bundleId: id,
    supportedPayers: z.array(z.enum(payers).exclude(["UNKNOWN"])).min(1),
    supportedJurisdictions: strings,
    sources: z.array(sourceSchema).max(500),
    versions: z.array(versionSchema).max(2000),
  })
  .strict()
  .superRefine((r, ctx) => {
    const sources = new Set(r.sources.map((s) => s.id));
    const versions = new Set(r.versions.map((v) => v.id));
    if (
      sources.size !== r.sources.length ||
      versions.size !== r.versions.length ||
      r.versions.some(
        (v) =>
          !sources.has(v.sourceId) ||
          v.conflictsWith.some((id) => !versions.has(id)) ||
          (v.supersededBy && !versions.has(v.supersededBy)),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "REGISTRY_REFERENTIAL_INTEGRITY",
      });
    const identities = r.versions.map(
      (v) => `${v.sourceId}/${v.documentId}/${v.edition}`,
    );
    if (new Set(identities).size !== identities.length)
      ctx.addIssue({ code: "custom", message: "DUPLICATE_SOURCE_EDITION" });
  });
export type KnowledgeRegistry = z.infer<typeof registrySchema>;
export function requiredReviewer(domain: AuthorityDomain): ReviewerRole {
  if (["DRUG_TERMINOLOGY", "DRUG_LABEL", "PHARMACOLOGY"].includes(domain))
    return "PHARMACIST";
  if (domain === "OFFICIAL_CODING") return "CODER";
  if (
    [
      "CLINICAL_EVIDENCE",
      "CLINICAL_PROTOCOL",
      "HUMAN_CLINICAL_REVIEW",
    ].includes(domain)
  )
    return "PHYSICIAN";
  if (domain === "SPARTAN_WORKFLOW") return "WORKFLOW_REVIEWER";
  if (["PATIENT_EVIDENCE", "DETERMINISTIC_DERIVATION"].includes(domain))
    return "CLINICAL_LEADER";
  return "COMPLIANCE_REVIEWER";
}
