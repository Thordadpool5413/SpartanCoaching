import { validateState } from "./stateValidation";
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
import { sortedSet, canonicalDigest, canonicalBytes } from "./canonical";
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
export const issuanceSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("DELEGATED"),
      parentGrantId: id,
      parentGrantRevision: revision,
      requestId: id,
    })
    .strict(),
  z.object({ kind: z.literal("SYNTHETIC_SEED"), reference: id }).strict(),
  z.object({ kind: z.literal("OWNER_BOOTSTRAP"), reference: id }).strict(),
]);
export const grantSchema = z
  .object({
    id,
    subjectMemberId: integer,
    scopeId: id,
    createdAt: stamp,
    issuance: issuanceSchema,
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
      g.createdAt <= g.verifiedAt &&
      g.verifiedAt <= g.effectiveFrom &&
      g.effectiveFrom < g.expiresAt,
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
/** Identity of one immutable terms revision, not of its mutable overlay. */
export const rightsRevisionIdentity = (
  scopeId: string,
  logicalRightsId: string,
  termsRevision: number,
) =>
  `krr:${canonicalDigest({
    schemaVersion: "knowledge-rights-revision-identity-v1",
    scopeId,
    logicalRightsId,
    termsRevision,
  })}`;
export const rightsOverlaySchema = z
  .object({
    rightsId: id,
    rightsRevision: integer,
    rightsRevisionId: id,
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
    healthGrantId: id,
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
      v.rightsOverlay.rightsRevision !== v.rights.revision ||
      v.rightsOverlay.rightsRevisionId !==
        rightsRevisionIdentity(v.scopeId, v.rights.id, v.rights.revision)
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
    contractVersion: z.literal("knowledge-foundation-v3"),
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
export const witnessTypes = [
  "ACTOR_CAPABILITY",
  "REVIEW_ATTESTATION",
  "RIGHTS_ATTESTATION",
  "LKG_HEALTH_ATTESTATION",
  "LKG_REVIEW_ATTESTATION",
] as const;
export const authorizationWitnessSchema = z
  .object({
    witnessType: z.enum(witnessTypes),
    actorMemberId: integer,
    scopeId: id,
    domain: z.enum(domains),
    capability: z.enum(capabilities),
    grantId: id,
    grantRevision: revision,
    qualificationId: id.nullable(),
    qualificationRevision: revision.nullable(),
    attestationId: id.nullable(),
    attestedAt: stamp.nullable(),
  })
  .strict()
  .superRefine((w, c) => {
    if (
      (w.qualificationId === null) !== (w.qualificationRevision === null) ||
      (w.witnessType === "ACTOR_CAPABILITY"
        ? w.attestationId !== null || w.attestedAt !== null
        : w.attestationId === null || w.attestedAt === null) ||
      ([
        "REVIEW_ATTESTATION",
        "RIGHTS_ATTESTATION",
        "LKG_REVIEW_ATTESTATION",
      ].includes(w.witnessType) &&
        w.qualificationId === null) ||
      (w.witnessType === "LKG_HEALTH_ATTESTATION" && w.qualificationId !== null)
    )
      c.addIssue({ code: "custom", message: "INVALID_WITNESS" });
    const capability = {
      REVIEW_ATTESTATION: "knowledge.review",
      RIGHTS_ATTESTATION: "knowledge.license",
      LKG_HEALTH_ATTESTATION: "knowledge.health",
      LKG_REVIEW_ATTESTATION: "knowledge.review",
    };
    if (
      w.witnessType !== "ACTOR_CAPABILITY" &&
      w.capability !== capability[w.witnessType]
    )
      c.addIssue({ code: "custom", message: "INVALID_WITNESS" });
  });
export type AuthorizationWitness = z.infer<typeof authorizationWitnessSchema>;
export function compareWitnesses(
  a: AuthorizationWitness,
  b: AuthorizationWitness,
): number {
  const fields = [
    "witnessType",
    "scopeId",
    "actorMemberId",
    "domain",
    "capability",
    "grantId",
    "grantRevision",
    "qualificationId",
    "qualificationRevision",
    "attestationId",
    "attestedAt",
  ] as const;
  for (const key of fields) {
    const av = a[key],
      bv = b[key];
    if (av === bv) continue;
    if (av === null) return -1;
    if (bv === null) return 1;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av) < String(bv) ? -1 : 1;
  }
  return 0;
}
export const authorizationWitnessesSchema = z
  .array(authorizationWitnessSchema)
  .max(256)
  .refine((ws) =>
    ws.every((w, i) => i === 0 || compareWitnesses(ws[i - 1], w) < 0),
  );
export const expiryConditionKinds = [
  "RIGHTS_END",
  "GRANT_END",
  "QUALIFICATION_END",
  "QUALIFICATION_REVIEW_DUE",
  "APPROVAL_REVIEW_DUE",
  "HEALTH_WARNING",
  "HEALTH_HARD_END",
  "LKG_END",
] as const;
export const expiryConditionSchema = z
  .object({
    kind: z.enum(expiryConditionKinds),
    referenceId: id,
    deadline: stamp,
  })
  .strict();
export const aggregateKinds = [
  "VERSION",
  "RIGHTS_REVISION",
  "GRANT",
  "QUALIFICATION",
  "PUBLICATION",
] as const;
const eventShape = {
  id,
  schemaVersion: z.literal("knowledge-event-v3"),
  scopeId: id,
  aggregateKind: z.enum(aggregateKinds),
  aggregateId: id,
  sourceId: id.nullable(),
  versionId: id.nullable(),
  assignmentId: id.nullable(),
  previousAssignmentId: id.nullable(),
  approvalId: id.nullable(),
  previousApprovalId: id.nullable(),
  operation: z.enum(operations),
  authorizationWitnesses: authorizationWitnessesSchema,
  logicalRightsId: id.nullable(),
  rightsTermsRevision: integer.nullable(),
  expiryCondition: expiryConditionSchema.nullable(),
  previousRevision: revision,
  newRevision: revision,
  occurredAt: stamp,
  requestId: id,
  receiptRef: hash.nullable(),
  reviewManifestDigest: hash.nullable(),
  reasonCode: z.enum(reasonCodes),
  invalidation: z.enum(["NONE", "PUBLICATION", "ELIGIBILITY"]),
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
    if (Buffer.byteLength(canonicalBytes(e), "utf8") > 524288) invalid();
    if (
      e.aggregateKind === "VERSION" &&
      (e.versionId !== e.aggregateId || !e.sourceId)
    )
      invalid();
    if (e.aggregateKind === "PUBLICATION" && e.aggregateId !== e.scopeId)
      invalid();
    if (
      ["GRANT", "QUALIFICATION", "RIGHTS_REVISION"].includes(e.aggregateKind) &&
      (e.sourceId !== null || e.versionId !== null)
    )
      invalid();
    if (e.aggregateKind === "RIGHTS_REVISION") {
      if (
        !e.logicalRightsId ||
        !e.rightsTermsRevision ||
        e.aggregateId !==
          rightsRevisionIdentity(
            e.scopeId,
            e.logicalRightsId,
            e.rightsTermsRevision,
          )
      )
        invalid();
    } else if (e.logicalRightsId !== null || e.rightsTermsRevision !== null)
      invalid();
    if (e.actorKind === "HUMAN") {
      if (!e.authorizationWitnesses.length || e.expiryCondition !== null)
        invalid();
      const actorWitnesses = e.authorizationWitnesses.filter(
        (w) => w.witnessType === "ACTOR_CAPABILITY",
      );
      if (
        !actorWitnesses.length ||
        actorWitnesses.some((w) => w.actorMemberId !== e.actorMemberId)
      )
        invalid();
      const required: Record<string, readonly string[]> = {
        REGISTER: ["knowledge.register"],
        SUBMIT: ["knowledge.submit"],
        APPROVE: ["knowledge.review"],
        REAPPROVE: ["knowledge.review"],
        REJECT_REVIEW: ["knowledge.review"],
        ACTIVATE: ["knowledge.activate"],
        SUPERSEDE: ["knowledge.activate"],
        REFRESH_APPROVAL: ["knowledge.activate"],
        ROLLBACK: ["knowledge.rollback"],
        REVOKE: ["knowledge.revoke"],
        RECORD_HEALTH: ["knowledge.health"],
        APPROVE_LKG: ["knowledge.health", "knowledge.review"],
        REVOKE_RIGHTS: ["knowledge.license"],
        REVOKE_GRANT: ["knowledge.grants"],
        REVOKE_QUALIFICATION: ["knowledge.grants"],
      };
      const supporting = e.authorizationWitnesses.filter(
        (w) => w.witnessType !== "ACTOR_CAPABILITY",
      );
      const needsAttestations = [
        "ACTIVATE",
        "SUPERSEDE",
        "ROLLBACK",
        "REFRESH_APPROVAL",
        "APPROVE_LKG",
      ].includes(e.operation);
      if (
        supporting.length > 4 ||
        supporting.some(
          (w) =>
            !needsAttestations ||
            !["REVIEW_ATTESTATION", "RIGHTS_ATTESTATION"].includes(
              w.witnessType,
            ),
        )
      )
        invalid();
      if (
        actorWitnesses.some(
          (w) =>
            (e.operation !== "REVOKE_GRANT" &&
              !(required[e.operation] ?? []).includes(w.capability)) ||
            (w.qualificationId !== null &&
              !(
                w.capability === "knowledge.review" &&
                [
                  "APPROVE",
                  "REAPPROVE",
                  "REJECT_REVIEW",
                  "APPROVE_LKG",
                ].includes(e.operation)
              )),
        )
      )
        invalid();
      if (
        !(required[e.operation] ?? []).every((cap) =>
          actorWitnesses.some((w) => w.capability === cap),
        )
      )
        invalid();
      if (
        ["APPROVE", "REAPPROVE", "REJECT_REVIEW", "APPROVE_LKG"].includes(
          e.operation,
        ) &&
        !actorWitnesses.some(
          (w) =>
            w.capability === "knowledge.review" && w.qualificationId !== null,
        )
      )
        invalid();
      if (
        [
          "ACTIVATE",
          "SUPERSEDE",
          "ROLLBACK",
          "REFRESH_APPROVAL",
          "APPROVE_LKG",
        ].includes(e.operation) &&
        !["REVIEW_ATTESTATION", "RIGHTS_ATTESTATION"].every((t) =>
          e.authorizationWitnesses.some((w) => w.witnessType === t),
        )
      )
        invalid();
    } else if (e.authorizationWitnesses.length) invalid();
    if (
      e.authorizationWitnesses.some(
        (w) =>
          w.scopeId !== e.scopeId ||
          (w.attestedAt && w.attestedAt > e.occurredAt),
      )
    )
      invalid();
    if (e.actorKind === "SYSTEM") {
      const condition = e.expiryCondition;
      if (!condition || e.occurredAt !== condition.deadline) invalid();
      if (condition) {
        const expectedKind =
          condition.kind === "RIGHTS_END"
            ? "RIGHTS_REVISION"
            : condition.kind === "GRANT_END"
              ? "GRANT"
              : condition.kind.startsWith("QUALIFICATION_")
                ? "QUALIFICATION"
                : "VERSION";
        if (e.aggregateKind !== expectedKind) invalid();
        const expectedReason =
          condition.kind === "RIGHTS_END"
            ? "RIGHTS_EXPIRED"
            : condition.kind === "GRANT_END"
              ? "GRANT_EXPIRED"
              : condition.kind.startsWith("QUALIFICATION_")
                ? "QUALIFICATION_EXPIRED"
                : condition.kind === "APPROVAL_REVIEW_DUE"
                  ? "APPROVAL_EXPIRED"
                  : "HEALTH_EXPIRED";
        if (
          e.reasonCode !== expectedReason ||
          e.receiptRef !== null ||
          e.assignmentId !== null ||
          e.previousAssignmentId !== null ||
          e.previousApprovalId !== null ||
          (condition.kind !== "APPROVAL_REVIEW_DUE" && e.approvalId !== null)
        )
          invalid();
        if (
          condition.kind === "APPROVAL_REVIEW_DUE"
            ? condition.referenceId !== e.approvalId
            : condition.kind !== "LKG_END" &&
              condition.referenceId !== e.aggregateId
        )
          invalid();
        const digest = canonicalDigest({
          schemaVersion: "knowledge-expiry-intent-v3",
          scopeId: e.scopeId,
          aggregateKind: e.aggregateKind,
          aggregateId: e.aggregateId,
          aggregateRevision: e.newRevision,
          conditionKind: condition.kind,
          conditionReferenceId: condition.referenceId,
          deadline: condition.deadline,
        });
        if (e.id !== `expiry:${digest}` || e.requestId !== e.id) invalid();
      }
    } else if (e.expiryCondition !== null) invalid();
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
    if (e.actorKind !== "SYSTEM") {
      const expectedAggregate = [
        "ACTIVATE",
        "SUPERSEDE",
        "ROLLBACK",
        "REFRESH_APPROVAL",
      ].includes(e.operation)
        ? "PUBLICATION"
        : e.operation === "REVOKE_RIGHTS"
          ? "RIGHTS_REVISION"
          : e.operation === "REVOKE_GRANT"
            ? "GRANT"
            : e.operation === "REVOKE_QUALIFICATION"
              ? "QUALIFICATION"
              : "VERSION";
      if (e.aggregateKind !== expectedAggregate) invalid();
      if (expectedAggregate === "PUBLICATION") {
        if (!e.sourceId || !e.versionId || !e.assignmentId || !e.approvalId)
          invalid();
        if (
          e.operation === "ACTIVATE"
            ? e.previousAssignmentId !== null || e.previousApprovalId !== null
            : e.previousAssignmentId === null ||
              e.previousApprovalId === null ||
              e.previousAssignmentId === e.assignmentId
        )
          invalid();
      }
    }
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

/** Final public result contracts. No partially validated object is returned. */
export const transitionResultSchema = z
  .object({
    state: partitionSchema,
    eventIntents: z.array(eventSchema).max(1),
    existingVersionId: id.nullable(),
  })
  .strict()
  .superRefine((r, c) => {
    const invalid = () =>
      c.addIssue({ code: "custom", message: "INVALID_RESULT" });
    if (r.existingVersionId !== null) {
      try {
        validateState(r.state);
      } catch {
        invalid();
      }
      if (
        r.eventIntents.length ||
        !r.state.versions.some((v) => v.id === r.existingVersionId)
      )
        invalid();
      return;
    }
    if (r.eventIntents.length !== 1) {
      invalid();
      return;
    }
    const e = r.eventIntents[0],
      p = r.state;
    if (e.scopeId !== p.scope.id || e.actorKind === "SYSTEM") invalid();
    const v = p.versions.find((v) => v.id === e.versionId);
    if (e.versionId !== null && (!v || v.sourceId !== e.sourceId)) invalid();
    const aggregateRevision =
      e.aggregateKind === "PUBLICATION"
        ? p.revision
        : e.aggregateKind === "VERSION"
          ? v?.revision
          : e.aggregateKind === "GRANT"
            ? p.grants.find((g) => g.id === e.aggregateId)?.revision
            : e.aggregateKind === "QUALIFICATION"
              ? p.qualifications.find((q) => q.id === e.aggregateId)?.revision
              : p.versions.find(
                  (v) => v.rightsOverlay.rightsRevisionId === e.aggregateId,
                )?.rightsOverlay.revision;
    if (aggregateRevision !== e.newRevision) invalid();
    const actorWitnesses = e.authorizationWitnesses.filter(
      (w) => w.witnessType === "ACTOR_CAPABILITY",
    );
    const domainOf = (v: KnowledgeVersion) =>
      p.sources.find(
        (s) =>
          s.id === v.sourceId &&
          s.metadataRevision === v.sourceMetadataRevision,
      )?.domain;
    const requiredPredicates = new Set<string>();
    if (e.aggregateKind === "RIGHTS_REVISION") {
      for (const v of p.versions.filter(
        (v) => v.rightsOverlay.rightsRevisionId === e.aggregateId,
      ))
        requiredPredicates.add(`${domainOf(v)}/knowledge.license`);
    } else if (
      e.aggregateKind === "GRANT" ||
      e.aggregateKind === "QUALIFICATION"
    ) {
      const target =
        e.aggregateKind === "GRANT"
          ? p.grants.find((g) => g.id === e.aggregateId)
          : p.qualifications.find((q) => q.id === e.aggregateId);
      if (target)
        for (const domain of target.domains)
          for (const capability of new Set([
            "knowledge.grants",
            ...("capabilities" in target ? target.capabilities : []),
          ]))
            requiredPredicates.add(`${domain}/${capability}`);
    } else if (v) {
      const caps: Partial<
        Record<KnowledgeEvent["operation"], readonly string[]>
      > = {
        REGISTER: ["knowledge.register"],
        SUBMIT: ["knowledge.submit"],
        APPROVE: ["knowledge.review"],
        REAPPROVE: ["knowledge.review"],
        REJECT_REVIEW: ["knowledge.review"],
        ACTIVATE: ["knowledge.activate"],
        SUPERSEDE: ["knowledge.activate"],
        REFRESH_APPROVAL: ["knowledge.activate"],
        ROLLBACK: ["knowledge.rollback"],
        REVOKE: ["knowledge.revoke"],
        RECORD_HEALTH: ["knowledge.health"],
        APPROVE_LKG: ["knowledge.health", "knowledge.review"],
      };
      for (const cap of caps[e.operation] ?? [])
        requiredPredicates.add(`${domainOf(v)}/${cap}`);
    }
    if (e.operation === "REVOKE_GRANT") {
      const target = p.grants.find((g) => g.id === e.aggregateId);
      if (target)
        for (const capability of target.capabilities) {
          const witnesses = actorWitnesses.filter(
            (w) => w.capability === capability,
          );
          const grantIds = new Set(witnesses.map((w) => w.grantId));
          const grant = p.grants.find((g) => g.id === witnesses[0]?.grantId);
          if (
            grantIds.size !== 1 ||
            !grant ||
            !target.domains.every((domain) => grant.domains.includes(domain))
          )
            invalid();
        }
    }
    const actualPredicates = new Set(
      actorWitnesses.map((w) => `${w.domain}/${w.capability}`),
    );
    if (
      requiredPredicates.size !== actualPredicates.size ||
      [...requiredPredicates].some(
        (predicate) => !actualPredicates.has(predicate),
      )
    )
      invalid();
    for (const w of e.authorizationWitnesses) {
      const g = p.grants.find(
        (g) =>
          g.id === w.grantId &&
          g.subjectMemberId === w.actorMemberId &&
          g.scopeId === w.scopeId,
      );
      const q =
        w.qualificationId === null
          ? null
          : p.qualifications.find(
              (q) =>
                q.id === w.qualificationId &&
                q.subjectMemberId === w.actorMemberId &&
                q.scopeId === w.scopeId,
            );
      // A credential being revoked is represented by its pre-mutation revision.
      if (
        !g ||
        !g.domains.includes(w.domain) ||
        !g.capabilities.includes(w.capability) ||
        g.revision !==
          w.grantRevision +
            (e.aggregateKind === "GRANT" && e.aggregateId === g.id ? 1 : 0) ||
        (w.qualificationId !== null &&
          (!q ||
            q.revision !==
              w.qualificationRevision! +
                (e.aggregateKind === "QUALIFICATION" && e.aggregateId === q.id
                  ? 1
                  : 0)))
      )
        invalid();
      if (
        w.witnessType === "REVIEW_ATTESTATION" &&
        !v?.approvals.some(
          (a) =>
            a.id === w.attestationId &&
            a.reviewerMemberId === w.actorMemberId &&
            a.reviewGrantId === w.grantId &&
            a.qualificationId === w.qualificationId &&
            a.reviewedAt === w.attestedAt,
        )
      )
        invalid();
      if (
        w.witnessType === "RIGHTS_ATTESTATION" &&
        (!v ||
          w.attestationId !== v.rightsOverlay.rightsRevisionId ||
          w.actorMemberId !== v.rights.verifiedByMemberId ||
          w.grantId !== v.rights.verificationGrantId ||
          w.qualificationId !== v.rights.verificationQualificationId ||
          w.attestedAt !== v.rights.verifiedAt)
      )
        invalid();
    }

    if (e.aggregateKind === "PUBLICATION") {
      const created = p.assignments.find((a) => a.id === e.assignmentId);
      const previous = p.assignments.find(
        (a) => a.id === e.previousAssignmentId,
      );
      if (
        !created ||
        v?.state !== "ACTIVE" ||
        created.scopeId !== p.scope.id ||
        created.sourceId !== e.sourceId ||
        created.documentId !== v?.documentId ||
        created.predecessorAssignmentId !== e.previousAssignmentId ||
        created.eventId !== e.id ||
        created.createdAt !== e.occurredAt ||
        created.retiredAt !== null
      )
        invalid();
      if (
        e.operation !== "ACTIVATE" &&
        (!previous ||
          previous.scopeId !== p.scope.id ||
          previous.sourceId !== created?.sourceId ||
          previous.documentId !== created?.documentId ||
          previous.serviceTo !== created?.serviceTo ||
          previous.retiredAt !== e.occurredAt ||
          previous.retirementEventId !== e.id)
      )
        invalid();
      const priorTargetPublication = p.assignments.some(
        (a) =>
          a.versionId === e.versionId &&
          a.sourceId === e.sourceId &&
          a.documentId === created?.documentId &&
          a.scopeId === e.scopeId &&
          a.eventId !== e.id &&
          a.createdAt <= e.occurredAt,
      );
      if (e.operation === "REFRESH_APPROVAL") {
        if (
          !created ||
          !previous ||
          created.versionId !== previous.versionId ||
          created.approvalId === previous.approvalId ||
          created.serviceFrom !== previous.serviceFrom ||
          canonicalBytes(created.applicability) !==
            canonicalBytes(previous.applicability) ||
          canonicalBytes(created.enabledUses) !==
            canonicalBytes(previous.enabledUses)
        )
          invalid();
      } else if (e.operation === "ACTIVATE" || e.operation === "SUPERSEDE") {
        if (
          priorTargetPublication ||
          (previous && previous.versionId === e.versionId)
        )
          invalid();
      } else if (
        e.operation === "ROLLBACK" &&
        (!priorTargetPublication || previous?.versionId === e.versionId)
      )
        invalid();
    }
    if (
      e.assignmentId !== null &&
      !p.assignments.some(
        (a) =>
          a.id === e.assignmentId &&
          a.versionId === e.versionId &&
          a.approvalId === e.approvalId,
      )
    )
      invalid();
    if (
      e.previousAssignmentId !== null &&
      !p.assignments.some(
        (a) =>
          a.id === e.previousAssignmentId &&
          a.approvalId === e.previousApprovalId,
      )
    )
      invalid();
    if (
      e.approvalId !== null &&
      !v?.approvals.some((a) => a.id === e.approvalId)
    )
      invalid();
  });
export const expiryIntentsSchema = z
  .array(eventSchema)
  .max(16000)
  .refine(
    (es) =>
      es.every((e) => e.actorKind === "SYSTEM") &&
      new Set(es.map((e) => e.id)).size === es.length,
  );
export const runtimeEntrySchema = z
  .object({
    scope: scopeSchema,
    sourceId: id,
    documentId: id,
    assignmentId: id,
    assignmentRevision: integer,
    serviceFrom: day,
    serviceTo: day.nullable(),
    applicability: applicabilitySchema,
    enabledUses: useSet,
    versionId: id,
    reviewManifestDigest: hash,
    state: z.enum(applicabilityStates),
    reasonCodes: set(z.enum(applicabilityStates), true),
    warningCodes: set(z.literal("STALE_ALLOWED_WITH_WARNING"), true),
  })
  .strict()
  // Scope authorization happens before projection; denial is top-level only.
  .refine(
    (entry) =>
      entry.state !== "SCOPE_DENIED" &&
      entry.reasonCodes.length === 1 &&
      entry.reasonCodes[0] === entry.state,
  );
const normalizedContextSchema = z
  .object({
    claimType: z.enum(claimTypes),
    payer: z.enum(payers).nullable(),
    jurisdiction: id.nullable(),
    serviceDate: day.nullable(),
    purpose: z.enum(purposes),
    mac: id.nullable(),
    providerType: id.nullable(),
    setting: id.nullable(),
    benefitPeriod: id.nullable(),
    codeEdition: id.nullable(),
    product: id.nullable(),
    population: id.nullable(),
  })
  .strict();
const runtimeConfigurationSchema = z
  .object({ scopeId: id, ...configurationSchema.shape })
  .strict();
export const runtimeManifestSchema = z
  .object({
    schemaVersion: z.literal("knowledge-runtime-manifest-v2"),
    canonicalizationVersion: z.literal("k1a-c14n-v1"),
    authorizedScopeIds: z.array(id).max(2),
    context: normalizedContextSchema,
    configuration: z.array(runtimeConfigurationSchema).max(2),
    publishedEntries: z.array(runtimeEntrySchema).max(8000),
  })
  .strict();
/** Existing resolver precedence shared with the final serialized result contract. */
export const blockingPrecedence = [
  "SOURCE_REVOKED",
  "LICENSE_NOT_PERMITTED",
  "SOURCE_EXPIRED",
  "NOT_APPROVED",
  "SOURCE_UNAVAILABLE",
  "CONFLICT_REQUIRES_REVIEW",
  "INSUFFICIENT_CONTEXT",
  "NOT_ACTIVE",
] as const;
export function deriveResolverState(
  context: KnowledgeContext | z.infer<typeof normalizedContextSchema>,
  configuration: readonly z.infer<typeof runtimeConfigurationSchema>[],
  entries: readonly Pick<z.infer<typeof runtimeEntrySchema>, "state">[],
):
  | ApplicabilityState
  | "PAYER_KNOWLEDGE_NOT_CONFIGURED"
  | "JURISDICTION_NOT_SUPPORTED" {
  const { serviceDate, payer, jurisdiction } = context;
  if (!configuration.length) return "SCOPE_DENIED";
  if (!serviceDate || !jurisdiction || !payer || payer === "UNKNOWN")
    return "INSUFFICIENT_CONTEXT";
  if (!configuration.some((c) => c.supportedPayers.includes(payer)))
    return "PAYER_KNOWLEDGE_NOT_CONFIGURED";
  if (
    !configuration.some((c) => c.supportedJurisdictions.includes(jurisdiction))
  )
    return "JURISDICTION_NOT_SUPPORTED";
  return (
    blockingPrecedence.find((s) => entries.some((e) => e.state === s)) ??
    (entries.some((e) => e.state === "APPLICABLE")
      ? "APPLICABLE"
      : entries.length
        ? "NOT_APPLICABLE"
        : "SOURCE_UNAVAILABLE")
  );
}
export const resolverResultSchema = z
  .object({
    state: z.enum([
      ...applicabilityStates,
      "PAYER_KNOWLEDGE_NOT_CONFIGURED",
      "JURISDICTION_NOT_SUPPORTED",
    ]),
    bundleHash: hash,
    bundleId: z.string().regex(/^kb2:[a-f0-9]{64}$/),
    humanReviewRequired: z.literal(true),
    configuration: z.array(runtimeConfigurationSchema).max(2),
    decisions: z.array(runtimeEntrySchema).max(8000),
    selected: z.array(runtimeEntrySchema).max(8000),
    warnings: set(z.literal("STALE_ALLOWED_WITH_WARNING"), true),
    manifest: runtimeManifestSchema,
  })
  .strict()
  .superRefine((r, c) => {
    const invalid = () =>
      c.addIssue({ code: "custom", message: "INVALID_RESULT" });
    if (
      r.state !==
        deriveResolverState(
          r.manifest.context,
          r.manifest.configuration,
          r.manifest.publishedEntries,
        ) ||
      r.bundleHash !== canonicalDigest(r.manifest) ||
      r.bundleId !== `kb2:${r.bundleHash}` ||
      canonicalBytes(r.decisions) !==
        canonicalBytes(r.manifest.publishedEntries) ||
      canonicalBytes(r.configuration) !==
        canonicalBytes(r.manifest.configuration) ||
      canonicalBytes(r.selected) !==
        canonicalBytes(
          r.state === "APPLICABLE"
            ? r.decisions.filter((e) => e.state === "APPLICABLE")
            : [],
        )
    )
      invalid();
    const scopes = r.manifest.authorizedScopeIds;
    if (
      new Set(r.configuration.map((c) => c.scopeId)).size !==
        r.configuration.length ||
      canonicalBytes(scopes) !==
        canonicalBytes(sortedSet(r.configuration.map((c) => c.scopeId))) ||
      r.decisions.some((e) => !scopes.includes(e.scope.id))
    )
      invalid();
  });
