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
  "MODEL_INFERENCE",
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
  CLINICAL_INFERENCE: ["MODEL_INFERENCE"],
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
import { sortedSet } from "./canonical";
export const capabilities = [
  "knowledge.read",
  "knowledge.register",
  "knowledge.submit",
  "knowledge.review",
  "knowledge.activate",
  "knowledge.revoke",
  "knowledge.rollback",
  "knowledge.license",
  "knowledge.health",
  "knowledge.grants",
] as const;
export const qualificationClasses = [
  "HOSPICE_PHYSICIAN",
  "CLINICAL_LEADER",
  "PHARMACIST",
  "CODER",
  "COMPLIANCE_REVIEWER",
  "WORKFLOW_REVIEWER",
] as const;
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
  "DERIVED_OUTPUT",
  "REDISTRIBUTION",
] as const;
export const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);
export const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const integer = z.number().int().safe().positive();
export const revision = z.number().int().safe().nonnegative();
export const stamp = z
  .string()
  .datetime({ offset: true })
  .refine((v) => {
    const day = v.slice(0, 10);
    return (
      Number.isFinite(Date.parse(v)) &&
      new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day
    );
  })
  .transform((v) => new Date(v).toISOString());
export const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      Number.isFinite(Date.parse(`${v}T00:00:00Z`)) &&
      new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
  );
const set = <T extends z.ZodTypeAny>(item: T, empty = false) =>
  z
    .array(item)
    .min(empty ? 0 : 1)
    .max(100)
    .transform((values) => sortedSet(values) as z.output<T>[]);
export const strings = set(id);
export const domainSet = set(z.enum(domains));
const claimSet = set(z.enum(claimTypes));
export const useSet = set(z.enum(purposes));
const payerSet = set(z.enum(payers).exclude(["UNKNOWN"]));
export const url = z
  .string()
  .url()
  .max(2000)
  .refine((v) => {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  });
export const scopeSchema = z
  .object({
    id,
    kind: z.enum(["GLOBAL", "TENANT"]),
    organizationId: integer.nullable(),
  })
  .strict()
  .refine((s) =>
    s.kind === "GLOBAL"
      ? s.id === "global" && s.organizationId === null
      : s.id === `tenant:${s.organizationId}` && s.organizationId !== null,
  );
export const actorSchema = z
  .object({
    kind: z.literal("HUMAN"),
    memberId: integer,
    organizationId: integer,
    membershipActive: z.boolean(),
    organizationActive: z.boolean(),
    sessionVerified: z.boolean(),
    synthetic: z.boolean(),
  })
  .strict();
export const memberSchema = z
  .object({
    memberId: integer,
    organizationId: integer,
    membershipActive: z.boolean(),
    organizationActive: z.boolean(),
  })
  .strict();
export const grantSchema = z
  .object({
    id,
    subjectMemberId: integer,
    scopeId: id,
    domains: domainSet,
    capabilities: set(z.enum(capabilities)),
    effectiveFrom: stamp,
    expiresAt: stamp,
    grantedByMemberId: integer,
    verifiedByMemberId: integer,
    verificationRef: id,
    verifiedAt: stamp,
    revision,
    revokedAt: stamp.nullable(),
  })
  .strict()
  .refine(
    (g) =>
      g.subjectMemberId !== g.grantedByMemberId &&
      g.subjectMemberId !== g.verifiedByMemberId &&
      g.effectiveFrom < g.expiresAt &&
      g.verifiedAt < g.expiresAt,
  );
export const qualificationSchema = z
  .object({
    id,
    subjectMemberId: integer,
    scopeId: id,
    class: z.enum(qualificationClasses),
    domains: domainSet,
    jurisdictions: strings,
    verifiedByMemberId: integer,
    verificationMethod: z.enum([
      "OWNER_ATTESTATION",
      "CREDENTIAL_CHECK",
      "SYNTHETIC_TEST",
    ]),
    verificationRef: id,
    verifiedAt: stamp,
    effectiveFrom: stamp,
    expiresAt: stamp,
    reviewDueAt: stamp,
    revision,
    revokedAt: stamp.nullable(),
  })
  .strict()
  .refine(
    (q) =>
      q.subjectMemberId !== q.verifiedByMemberId &&
      q.effectiveFrom < q.expiresAt &&
      q.verifiedAt < q.expiresAt &&
      q.reviewDueAt > q.effectiveFrom &&
      q.reviewDueAt <= q.expiresAt,
  );
export const sourceSchema = z
  .object({
    id,
    metadataRevision: integer,
    publisher: z.string().min(1).max(200),
    title: z.string().min(1).max(300),
    domain: z.enum(domains),
    claimTypes: claimSet,
    officialUrl: url,
    scope: scopeSchema,
    educationalOnly: z.boolean(),
  })
  .strict()
  .refine(
    (s) =>
      ![
        "PATIENT_EVIDENCE",
        "DETERMINISTIC_DERIVATION",
        "MODEL_INFERENCE",
      ].includes(s.domain) &&
      s.claimTypes.every((c) => authorityMatrix[c].includes(s.domain)),
  );
export const applicabilitySchema = z
  .object({
    payers: payerSet,
    jurisdictions: strings,
    macs: strings.nullable(),
    providerTypes: strings.nullable(),
    settings: strings.nullable(),
    benefitPeriods: strings.nullable(),
    codeEditions: strings.nullable(),
    products: strings.nullable(),
    populations: strings.nullable(),
  })
  .strict();
const rightsShape = {
  id,
  revision: integer,
  owner: id,
  reference: id,
  status: z.enum(["PENDING", "DENIED", "APPROVED"]),
  effectiveFrom: stamp.nullable(),
  expiresAt: stamp.nullable(),
  commercialUse: z.boolean(),
  permittedUses: set(z.enum(purposes), true),
  verifiedByMemberId: integer.nullable(),
  verificationGrantId: id.nullable(),
  verificationQualificationId: id.nullable(),
  verificationRef: id.nullable(),
  verifiedAt: stamp.nullable(),
};
export const rightsSchema = z
  .object(rightsShape)
  .strict()
  .refine((r) =>
    r.status === "APPROVED"
      ? r.effectiveFrom !== null &&
        r.verifiedByMemberId !== null &&
        r.verificationGrantId !== null &&
        r.verificationQualificationId !== null &&
        r.verificationRef !== null &&
        r.verifiedAt !== null &&
        (!r.expiresAt || r.effectiveFrom < r.expiresAt)
      : r.permittedUses.length === 0,
  );
export const rightsOverlaySchema = z
  .object({
    rightsId: id,
    rightsRevision: integer,
    revision,
    revokedAt: stamp.nullable(),
  })
  .strict();
export const approvalSchema = z
  .object({
    id,
    versionId: id,
    scopeId: id,
    reviewManifestDigest: hash,
    reviewerMemberId: integer,
    reviewGrantId: id,
    qualificationId: id,
    reviewedAt: stamp,
    reviewDueAt: stamp,
  })
  .strict()
  .refine((a) => a.reviewedAt < a.reviewDueAt);
export const lkgSchema = z
  .object({
    id,
    reviewManifestDigest: hash,
    reviewerMemberId: integer,
    reviewGrantId: id,
    qualificationId: id,
    approvedAt: stamp,
    until: stamp,
  })
  .strict()
  .refine((a) => a.approvedAt < a.until);
export const healthStates = [
  "NOT_CHECKED",
  "CURRENT",
  "STALE_ALLOWED_WITH_WARNING",
  "STALE_BLOCKED",
  "UPSTREAM_UNAVAILABLE",
  "REVOKED",
] as const;
export const healthSchema = z
  .object({
    state: z.enum(healthStates),
    checkedAt: stamp.nullable(),
    lastValidatedAt: stamp.nullable(),
    warningAt: stamp.nullable(),
    hardExpiresAt: stamp.nullable(),
    lkg: lkgSchema.nullable(),
  })
  .strict()
  .superRefine((h, c) => {
    const invalid = () =>
      c.addIssue({ code: "custom", message: "INVALID_HEALTH" });
    if (h.state === "NOT_CHECKED") {
      if (
        [
          h.checkedAt,
          h.lastValidatedAt,
          h.warningAt,
          h.hardExpiresAt,
          h.lkg,
        ].some((v) => v !== null)
      )
        invalid();
      return;
    }
    if (h.state === "REVOKED") return;
    if (!h.checkedAt) invalid();
    if (
      h.state === "CURRENT" &&
      (!h.lastValidatedAt || !h.warningAt || !h.hardExpiresAt)
    )
      invalid();
    if (h.lastValidatedAt && (!h.checkedAt || h.lastValidatedAt > h.checkedAt))
      invalid();
    if (
      (h.warningAt === null) !== (h.hardExpiresAt === null) ||
      (h.warningAt && h.hardExpiresAt && h.warningAt >= h.hardExpiresAt)
    )
      invalid();
    if (h.lastValidatedAt && h.warningAt && h.lastValidatedAt >= h.warningAt)
      invalid();
    if (
      h.lkg &&
      (!h.lastValidatedAt || !h.hardExpiresAt || h.lkg.until > h.hardExpiresAt)
    )
      invalid();
  });
const artifactShape = {
  id,
  sourceId: id,
  sourceMetadataRevision: integer,
  scopeId: id,
  documentId: id,
  upstreamEdition: id,
  artifactRevision: integer,
  rawHash: hash,
  normalizedHash: hash,
  parserId: id,
  parserVersion: id,
  sourceUrl: url,
  publishedAt: stamp,
  retrievedAt: stamp,
  effectiveFrom: day,
  effectiveTo: day.nullable(),
  applicability: applicabilitySchema,
  rights: rightsSchema,
  legacyCoverageSnapshotId: z.string().uuid().nullable(),
  registeredByMemberId: integer,
  submittedByMemberId: integer.nullable(),
};
export const versionSchema = z
  .object({
    ...artifactShape,
    state: z.enum(lifecycleStates),
    revision,
    approvals: z.array(approvalSchema).max(100),
    activatedAt: stamp.nullable(),
    revokedAt: stamp.nullable(),
    revocationReason: z.literal("SECURITY_REVOCATION").nullable(),
    health: healthSchema,
    rightsOverlay: rightsOverlaySchema,
    conflictsWith: set(id, true),
  })
  .strict()
  .superRefine((v, c) => {
    const invalid = () =>
      c.addIssue({ code: "custom", message: "INVALID_VERSION" });
    if (
      (v.effectiveTo && v.effectiveTo <= v.effectiveFrom) ||
      v.publishedAt > v.retrievedAt
    )
      invalid();
    if (v.state === "ACTIVE" && !v.activatedAt) invalid();
    if (v.health.state === "REVOKED" && v.state !== "REVOKED") invalid();
    if (
      v.state === "REVOKED"
        ? !v.revokedAt || !v.revocationReason
        : v.revokedAt !== null || v.revocationReason !== null
    )
      invalid();
    if (
      v.rightsOverlay.rightsId !== v.rights.id ||
      v.rightsOverlay.rightsRevision !== v.rights.revision
    )
      invalid();
    if (
      new Set(v.approvals.map((a) => a.id)).size !== v.approvals.length ||
      v.approvals.some((a) => a.versionId !== v.id || a.scopeId !== v.scopeId)
    )
      invalid();
  });
export const assignmentSchema = z
  .object({
    id,
    scopeId: id,
    sourceId: id,
    documentId: id,
    versionId: id,
    reviewManifestDigest: hash,
    approvalId: id,
    serviceFrom: day,
    serviceTo: day.nullable(),
    applicability: applicabilitySchema,
    enabledUses: useSet,
    createdAt: stamp,
    createdByMemberId: integer,
    eventId: id,
    predecessorAssignmentId: id.nullable(),
    revision: integer,
    retiredAt: stamp.nullable(),
    retirementEventId: id.nullable(),
  })
  .strict()
  .refine(
    (a) =>
      (!a.serviceTo || a.serviceTo > a.serviceFrom) &&
      (a.retiredAt === null) === (a.retirementEventId === null) &&
      (!a.retiredAt || a.retiredAt >= a.createdAt) &&
      a.enabledUses.includes("INTERNAL_STORAGE"),
  );
export const configurationSchema = z
  .object({ supportedPayers: payerSet, supportedJurisdictions: strings })
  .strict();
export const partitionSchema = z
  .object({
    scope: scopeSchema,
    revision,
    sources: z.array(sourceSchema).max(500),
    versions: z.array(versionSchema).max(2000),
    assignments: z.array(assignmentSchema).max(4000),
    grants: z.array(grantSchema).max(2000),
    qualifications: z.array(qualificationSchema).max(2000),
    members: z.array(memberSchema).max(2000),
    configuration: configurationSchema,
  })
  .strict();
export const registrySchema = z
  .object({
    contractVersion: z.literal("knowledge-foundation-v2"),
    partitions: z.array(partitionSchema),
  })
  .strict();
export const contextSchema = z
  .object({
    claimType: z.enum(claimTypes),
    payer: z.enum(payers).optional(),
    jurisdiction: id.optional(),
    serviceDate: day.optional(),
    purpose: z.enum(purposes),
    mac: id.optional(),
    providerType: id.optional(),
    setting: id.optional(),
    benefitPeriod: id.optional(),
    codeEdition: id.optional(),
    product: id.optional(),
    population: id.optional(),
  })
  .strict();
export const reviewManifestSchema = z
  .object({
    schemaVersion: z.literal("knowledge-review-manifest-v2"),
    canonicalizationVersion: z.literal("k1a-c14n-v1"),
    scope: scopeSchema,
    source: z
      .object({
        id,
        metadataRevision: integer,
        publisher: z.string().min(1).max(200),
        title: z.string().min(1).max(300),
        officialUrl: url,
        domain: z.enum(domains),
        claimTypes: claimSet,
        educationalOnly: z.boolean(),
      })
      .strict(),
    artifact: z
      .object({
        id,
        documentId: id,
        upstreamEdition: id,
        artifactRevision: integer,
        rawHash: hash,
        normalizedHash: hash,
        parserId: id,
        parserVersion: id,
        sourceUrl: url,
        publishedAt: stamp,
        retrievedAt: stamp,
        effectiveFrom: day,
        effectiveTo: day.nullable(),
        legacyCoverageSnapshotId: z.string().uuid().nullable(),
        registeredByMemberId: integer,
        submittedByMemberId: integer.nullable(),
      })
      .strict(),
    applicability: applicabilitySchema,
    rights: rightsSchema,
  })
  .strict();
export type Scope = z.infer<typeof scopeSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type Grant = z.infer<typeof grantSchema>;
export type Qualification = z.infer<typeof qualificationSchema>;
export type KnowledgeSource = z.infer<typeof sourceSchema>;
export type KnowledgeVersion = z.infer<typeof versionSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type Partition = z.infer<typeof partitionSchema>;
export type KnowledgeRegistry = z.infer<typeof registrySchema>;
export type KnowledgeContext = z.infer<typeof contextSchema>;
export type Approval = z.infer<typeof approvalSchema>;
export type Applicability = z.infer<typeof applicabilitySchema>;
export type Purpose = (typeof purposes)[number];
export type Capability = (typeof capabilities)[number];
export function requiredReviewer(
  domain: AuthorityDomain,
): (typeof qualificationClasses)[number] {
  if (["DRUG_TERMINOLOGY", "DRUG_LABEL", "PHARMACOLOGY"].includes(domain))
    return "PHARMACIST";
  if (domain === "OFFICIAL_CODING") return "CODER";
  if (["CLINICAL_EVIDENCE", "CLINICAL_PROTOCOL"].includes(domain))
    return "HOSPICE_PHYSICIAN";
  if (domain === "SPARTAN_WORKFLOW") return "WORKFLOW_REVIEWER";
  return "COMPLIANCE_REVIEWER";
}
export const operations = [
  "REGISTER",
  "RECORD_STAGE",
  "SUBMIT",
  "APPROVE",
  "REAPPROVE",
  "REJECT_REVIEW",
  "ACTIVATE",
  "SUPERSEDE",
  "ROLLBACK",
  "REFRESH_APPROVAL",
  "REVOKE",
  "RECORD_HEALTH",
  "APPROVE_LKG",
  "REVOKE_RIGHTS",
  "REVOKE_GRANT",
  "REVOKE_QUALIFICATION",
  "EVALUATE_EXPIRY",
] as const;
export const reasonCodes = [
  "REGISTERED",
  "VALIDATION_RECORDED",
  "SUBMITTED",
  "REVIEW_APPROVED",
  "REVIEW_REJECTED",
  "PUBLISHED",
  "SUPERSEDED",
  "ROLLBACK_APPROVED",
  "SECURITY_REVOCATION",
  "RIGHTS_REVOKED",
  "RIGHTS_EXPIRED",
  "HEALTH_BLOCKED",
  "HEALTH_EXPIRED",
  "GRANT_REVOKED",
  "QUALIFICATION_REVOKED",
  "GRANT_EXPIRED",
  "QUALIFICATION_EXPIRED",
  "APPROVAL_EXPIRED",
] as const;
const eventShape = {
  id,
  schemaVersion: z.literal("knowledge-event-v2"),
  scopeId: id,
  aggregateKind: z.enum([
    "VERSION",
    "RIGHTS",
    "GRANT",
    "QUALIFICATION",
    "PUBLICATION",
  ]),
  aggregateId: id,
  sourceId: id.nullable(),
  versionId: id.nullable(),
  assignmentId: id.nullable(),
  previousAssignmentId: id.nullable(),
  approvalId: id.nullable(),
  previousApprovalId: id.nullable(),
  operation: z.enum(operations),
  grantId: id.nullable(),
  qualificationId: id.nullable(),
  previousRevision: revision,
  newRevision: revision,
  occurredAt: stamp,
  requestId: id,
  receiptRef: hash.nullable(),
  reviewManifestDigest: hash.nullable(),
  reasonCode: z.enum(reasonCodes),
  invalidation: z.enum(["NONE", "PUBLICATION", "ELIGIBILITY"]),
  affectedAssignmentIds: set(id, true),
  contentRemoval: z.boolean(),
};
export const eventSchema = z
  .discriminatedUnion("actorKind", [
    z
      .object({
        ...eventShape,
        actorKind: z.literal("HUMAN"),
        actorMemberId: integer,
        systemActorId: z.null(),
        evidenceRef: z.null(),
      })
      .strict(),
    z
      .object({
        ...eventShape,
        actorKind: z.literal("SYSTEM"),
        actorMemberId: z.null(),
        systemActorId: z.literal("expiry-evaluator"),
        evidenceRef: z.null(),
      })
      .strict(),
    z
      .object({
        ...eventShape,
        actorKind: z.literal("PIPELINE"),
        actorMemberId: z.null(),
        systemActorId: z.literal("synthetic-pipeline"),
        evidenceRef: id,
      })
      .strict(),
  ])
  .superRefine((e, c) => {
    const invalid = () =>
      c.addIssue({ code: "custom", message: "INVALID_EVENT" });
    const reasons: Record<string, readonly string[]> = {
      REGISTER: ["REGISTERED"],
      RECORD_STAGE: ["VALIDATION_RECORDED"],
      SUBMIT: ["SUBMITTED"],
      APPROVE: ["REVIEW_APPROVED"],
      REAPPROVE: ["REVIEW_APPROVED"],
      REJECT_REVIEW: ["REVIEW_REJECTED"],
      ACTIVATE: ["PUBLISHED"],
      SUPERSEDE: ["SUPERSEDED"],
      ROLLBACK: ["ROLLBACK_APPROVED"],
      REFRESH_APPROVAL: ["PUBLISHED"],
      REVOKE: ["SECURITY_REVOCATION"],
      RECORD_HEALTH: ["VALIDATION_RECORDED", "HEALTH_BLOCKED"],
      APPROVE_LKG: ["REVIEW_APPROVED"],
      REVOKE_RIGHTS: ["RIGHTS_REVOKED"],
      REVOKE_GRANT: ["GRANT_REVOKED"],
      REVOKE_QUALIFICATION: ["QUALIFICATION_REVOKED"],
      EVALUATE_EXPIRY: [
        "RIGHTS_EXPIRED",
        "HEALTH_EXPIRED",
        "GRANT_EXPIRED",
        "QUALIFICATION_EXPIRED",
        "APPROVAL_EXPIRED",
      ],
    };
    if (!reasons[e.operation].includes(e.reasonCode)) invalid();
    if (
      e.actorKind === "SYSTEM"
        ? e.operation !== "EVALUATE_EXPIRY" ||
          e.newRevision !== e.previousRevision
        : e.newRevision !== e.previousRevision + 1 ||
          e.operation === "EVALUATE_EXPIRY"
    )
      invalid();
    if ((e.operation === "RECORD_STAGE") !== (e.actorKind === "PIPELINE"))
      invalid();
    const publication = [
      "ACTIVATE",
      "SUPERSEDE",
      "ROLLBACK",
      "REFRESH_APPROVAL",
      "REVOKE",
    ].includes(e.operation);
    const eligibility =
      [
        "REVOKE_RIGHTS",
        "REVOKE_GRANT",
        "REVOKE_QUALIFICATION",
        "EVALUATE_EXPIRY",
      ].includes(e.operation) || e.reasonCode === "HEALTH_BLOCKED";
    if (
      e.invalidation !==
      (publication ? "PUBLICATION" : eligibility ? "ELIGIBILITY" : "NONE")
    )
      invalid();
    if (
      e.contentRemoval !==
      ["RIGHTS_REVOKED", "RIGHTS_EXPIRED"].includes(e.reasonCode)
    )
      invalid();
  });
export type KnowledgeEvent = z.infer<typeof eventSchema>;
