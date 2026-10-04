import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  applicabilitySchema,
  rightsRevisionIdentity,
  transitionResultSchema,
  expiryIntentsSchema,
  resolverResultSchema,
  authorizationWitnessesSchema,
  domains,
  authorityMatrix,
  claimTypes,
  capabilities,
  eventSchema,
  grantSchema,
  healthSchema,
  partitionSchema,
  purposes,
  qualificationSchema,
  registrySchema,
  requiredReviewer,
  scopeSchema,
  sourceSchema,
  unknownStates,
  versionSchema,
  stamp,
  day,
  type Actor,
  type KnowledgeVersion,
  type Partition,
} from "./contracts";
import {
  canonicalBytes,
  canonicalDigest,
  parseContract,
  sha256,
} from "./canonical";
import {
  buildReviewManifest,
  hasCurrentApproval,
  licenseAllows,
  reviewManifestDigest,
  validateGrantDelegation,
  validateGrantAncestry,
  normalizeWitnesses,
  healthState,
  grantEligible,
  requireCapability,
} from "./authority";
import { createKnowledgeRegistry, blockingPrecedence } from "./resolver";
import {
  transitionKnowledge,
  evaluateExpiryIntents,
  commandSchema,
} from "./lifecycle";
import {
  applicabilityIntersects,
  assignmentsConflict,
  validateLineage,
} from "./publication";
import {
  remainingCommandBudget,
  commandFailureDisposition,
  validateMutationScopes,
  futureWriterParticipation,
  futureLockOrder,
  futureProtocol,
  futureTransactionOrder,
  outboxSchema,
  receiptKey,
  receiptSchema,
  requestFingerprint,
  retryDelaySeconds,
} from "./future";
const now = "2026-10-03T00:00:00.000Z",
  start = "2026-01-01T00:00:00.000Z",
  end = "2027-01-01T00:00:00.000Z";
const actor = (memberId = 3, organizationId = 1): Actor => ({
  kind: "HUMAN",
  memberId,
  organizationId,
  membershipActive: true,
  organizationActive: true,
  sessionVerified: true,
  synthetic: true,
});
const unchecked = () => ({
  state: "NOT_CHECKED" as const,
  checkedAt: null,
  lastValidatedAt: null,
  warningAt: null,
  hardExpiresAt: null,
  lkg: null,
});
function fixture(): Partition {
  const scope = { id: "tenant:1", kind: "TENANT" as const, organizationId: 1 };
  const source = parseContract(sourceSchema, {
    id: "synthetic-policy",
    metadataRevision: 1,
    publisher: "Synthetic publisher",
    title: "Synthetic policy; not clinical guidance",
    officialUrl: "https://synthetic.example.invalid/policy",
    domain: "MAC_COVERAGE",
    claimTypes: ["MEDICARE_COVERAGE_REQUIREMENT"],
    scope,
    educationalOnly: false,
  });
  const grants = [1, 2, 3, 4, 90].map((subjectMemberId) =>
    parseContract(grantSchema, {
      id: `grant-${subjectMemberId}`,
      subjectMemberId,
      scopeId: scope.id,
      domains: [source.domain],
      capabilities: [...capabilities],
      createdAt: start,
      issuance: { kind: "SYNTHETIC_SEED", reference: "synthetic-seed" },
      effectiveFrom: start,
      expiresAt: end,
      grantedByMemberId: 98,
      verifiedByMemberId: 99,
      verificationRef: "synthetic-grant-verification",
      verifiedAt: start,
      revision: 1,
      revokedAt: null,
    }),
  );
  const qualifications = [1, 2, 3, 4].map((subjectMemberId) =>
    parseContract(qualificationSchema, {
      id: `qualification-${subjectMemberId}`,
      subjectMemberId,
      scopeId: scope.id,
      class: "COMPLIANCE_REVIEWER",
      domains: [source.domain],
      jurisdictions: ["US-FL"],
      verifiedByMemberId: 99,
      verificationMethod: "SYNTHETIC_TEST",
      verificationRef: "synthetic-qualification-verification",
      verifiedAt: start,
      effectiveFrom: start,
      expiresAt: end,
      reviewDueAt: end,
      revision: 1,
      revokedAt: null,
    }),
  );
  const version = parseContract(versionSchema, {
    id: "synthetic-v1",
    sourceId: source.id,
    sourceMetadataRevision: 1,
    scopeId: scope.id,
    documentId: "synthetic-document",
    upstreamEdition: "edition-1",
    artifactRevision: 1,
    rawHash: "a".repeat(64),
    normalizedHash: "b".repeat(64),
    parserId: "synthetic-parser",
    parserVersion: "1",
    sourceUrl: source.officialUrl,
    publishedAt: start,
    retrievedAt: "2026-01-02T00:00:00.000Z",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2027-01-01",
    applicability: {
      payers: ["TRADITIONAL_MEDICARE"],
      jurisdictions: ["US-FL"],
      macs: ["SYNTHETIC-MAC"],
      providerTypes: ["HOSPICE"],
      settings: null,
      benefitPeriods: null,
      codeEditions: null,
      products: null,
      populations: null,
    },
    rights: {
      id: "synthetic-rights",
      revision: 1,
      owner: "synthetic-owner",
      reference: "synthetic-license-ref",
      status: "APPROVED",
      effectiveFrom: start,
      expiresAt: null,
      commercialUse: true,
      permittedUses: [...purposes],
      verifiedByMemberId: 4,
      verificationGrantId: "grant-4",
      verificationQualificationId: "qualification-4",
      verificationRef: "synthetic-rights-verification",
      verifiedAt: start,
    },
    legacyCoverageSnapshotId: null,
    registeredByMemberId: 1,
    submittedByMemberId: 1,
    state: "ACTIVE",
    revision: 4,
    approvals: [],
    activatedAt: "2026-01-04T00:00:00.000Z",
    revokedAt: null,
    revocationReason: null,
    health: {
      state: "CURRENT",
      checkedAt: "2026-10-02T00:00:00.000Z",
      lastValidatedAt: "2026-10-02T00:00:00.000Z",
      warningAt: "2026-10-10T00:00:00.000Z",
      hardExpiresAt: "2026-11-01T00:00:00.000Z",
      lkg: null,
    },
    rightsOverlay: {
      rightsId: "synthetic-rights",
      rightsRevision: 1,
      rightsRevisionId: rightsRevisionIdentity(scope.id, "synthetic-rights", 1),
      revision: 1,
      revokedAt: null,
    },
    conflictsWith: [],
  });
  const digest = reviewManifestDigest(source, version);
  version.approvals.push({
    id: "synthetic-approval",
    versionId: version.id,
    scopeId: scope.id,
    reviewManifestDigest: digest,
    reviewerMemberId: 2,
    reviewGrantId: "grant-2",
    qualificationId: "qualification-2",
    reviewedAt: "2026-01-03T00:00:00.000Z",
    reviewDueAt: end,
  });
  return parseContract(partitionSchema, {
    scope,
    revision: 5,
    sources: [source],
    versions: [version],
    assignments: [
      {
        id: "synthetic-assignment",
        scopeId: scope.id,
        sourceId: source.id,
        documentId: version.documentId,
        versionId: version.id,
        reviewManifestDigest: digest,
        approvalId: "synthetic-approval",
        serviceFrom: version.effectiveFrom,
        serviceTo: version.effectiveTo,
        applicability: version.applicability,
        enabledUses: [...purposes],
        createdAt: "2026-01-04T00:00:00.000Z",
        createdByMemberId: 3,
        eventId: "synthetic-publication",
        predecessorAssignmentId: null,
        revision: 1,
        retiredAt: null,
        retirementEventId: null,
      },
    ],
    grants,
    qualifications,
    members: [1, 2, 3, 4, 90].map((memberId) => ({
      memberId,
      organizationId: 1,
      membershipActive: true,
      organizationActive: true,
    })),
    configuration: {
      supportedPayers: ["TRADITIONAL_MEDICARE"],
      supportedJurisdictions: ["US-FL"],
    },
  });
}
const context = {
  claimType: "MEDICARE_COVERAGE_REQUIREMENT",
  payer: "TRADITIONAL_MEDICARE",
  jurisdiction: "US-FL",
  serviceDate: "2026-10-02",
  purpose: "MODEL_INPUT",
  mac: "SYNTHETIC-MAC",
  providerType: "HOSPICE",
};
const resolve = (
  p: unknown = fixture(),
  c: unknown = context,
  a: unknown = actor(),
  clock = now,
) =>
  createKnowledgeRegistry({
    contractVersion: "knowledge-foundation-v3",
    partitions: [p],
  }).resolve(c, a, clock);
const server = (eventId = "synthetic-event", clock = now) => ({
  kind: "HUMAN_SERVER",
  synthetic: true,
  now: clock,
  eventId,
  requestId: "synthetic-request",
  receiptRef: null,
});
const expected = (p: Partition) => ({
  expectedScopeRevision: p.revision,
  expectedVersionRevisions: Object.fromEntries(
    p.versions.map((v) => [v.id, v.revision]),
  ),
});
const transition = (
  p: Partition,
  cmd: Record<string, unknown>,
  a: unknown = actor(),
  s: unknown = server(),
) => transitionKnowledge(p, a, { ...expected(p), ...cmd }, s);
const renewDigest = (p: Partition) => {
  const v = p.versions[0],
    digest = reviewManifestDigest(p.sources[0], v);
  v.approvals[0].reviewManifestDigest = digest;
  p.assignments[0].reviewManifestDigest = digest;
};
function candidate(p: Partition, id = "synthetic-v2") {
  const v = structuredClone(p.versions[0]);
  v.id = id;
  v.artifactRevision++;
  v.state = "APPROVED";
  v.revision = 1;
  v.activatedAt = null;
  v.revokedAt = null;
  v.revocationReason = null;
  v.approvals = [];
  const d = reviewManifestDigest(p.sources[0], v);
  v.approvals = [
    {
      ...p.versions[0].approvals[0],
      id: `${id}-approval`,
      versionId: id,
      reviewManifestDigest: d,
    },
  ];
  p.versions.push(v);
  return v;
}
const activation = (v: KnowledgeVersion) => ({
  operation: "ACTIVATE",
  versionId: v.id,
  approvalId: v.approvals[0].id,
  serviceFrom: v.effectiveFrom,
  serviceTo: v.effectiveTo,
  applicability: v.applicability,
  enabledUses: [...purposes],
});
function mutate(value: unknown, keys: string[], replacement: unknown) {
  let record = value as Record<string, unknown>;
  for (const key of keys.slice(0, -1))
    record = record[key] as Record<string, unknown>;
  record[keys.at(-1)!] = replacement;
}

describe("v3 provenance and strict canonical contracts", () => {
  it("retains 17 claim mappings and separates inference from human attestation", () => {
    expect(claimTypes).toHaveLength(17);
    expect(authorityMatrix.CLINICAL_INFERENCE).toEqual(["MODEL_INFERENCE"]);
    expect(authorityMatrix.DRUG_IDENTITY).toEqual(["DRUG_TERMINOLOGY"]);
    expect(new Set(unknownStates).size).toBe(unknownStates.length);
    expect(unknownStates).toContain("NOT_CHECKED");
    expect(unknownStates).toContain("CHECKED_NO_KNOWN_ISSUE");
  });
  for (const domain of [
    "PATIENT_EVIDENCE",
    "DETERMINISTIC_DERIVATION",
    "MODEL_INFERENCE",
  ])
    it(`rejects patient provenance ${domain}`, () => {
      const s = fixture().sources[0];
      expect(
        sourceSchema.safeParse({
          ...s,
          domain,
          claimTypes: [
            domain === "PATIENT_EVIDENCE"
              ? "PATIENT_SOURCE_FACT"
              : domain === "MODEL_INFERENCE"
                ? "CLINICAL_INFERENCE"
                : "DERIVED_PATIENT_FACT",
          ],
        }).success,
      ).toBe(false);
    });
  for (const scope of [
    { id: "tenant:01", kind: "TENANT", organizationId: 1 },
    { id: "tenant:1", kind: "TENANT", organizationId: 2 },
    { id: "tenant-a", kind: "TENANT", organizationId: 1 },
    { id: "global", kind: "GLOBAL", organizationId: 1 },
    { id: "tenant:0", kind: "TENANT", organizationId: 0 },
  ])
    it(`rejects noncanonical scope ${scope.id}/${scope.organizationId}`, () =>
      expect(scopeSchema.safeParse(scope).success).toBe(false));
  it("rejects v1 without silent upgrade and has no public inventory fingerprint", () => {
    expect(() =>
      createKnowledgeRegistry({
        contractVersion: "knowledge-foundation-v1",
        partitions: [],
      }),
    ).toThrow("KNOWLEDGE_CONTRACT_INVALID");
    expect(
      Object.keys(
        createKnowledgeRegistry({
          contractVersion: "knowledge-foundation-v3",
          partitions: [fixture()],
        }),
      ),
    ).toEqual(["resolve"]);
  });
  it("pins independently supplied serializer unit bytes", () => {
    const bytes = canonicalBytes({ v: "k1a-c14n-v1", b: ["A", "B"], a: null });
    expect(bytes).toBe('{"a":null,"b":["A","B"],"v":"k1a-c14n-v1"}');
    expect(sha256(bytes)).toBe(
      "dbe3dbbca0c536d939464856a8bd5c57a25e0f642b4d770526bcced325476ce8",
    );
  });
  for (const [name, value] of [
    ["undefined", { x: undefined }],
    ["NaN", NaN],
    ["infinity", Infinity],
    ["unsafe integer", Number.MAX_SAFE_INTEGER + 1],
    ["negative zero", -0],
    ["function", () => null],
    ["symbol", Symbol("synthetic")],
    ["bigint", 1n],
    ["sparse array", Array(2)],
    ["surrogate", "\ud800"],
    ["date object", new Date(now)],
  ] as const)
    it(`rejects ${name} with bounded error`, () =>
      expect(() => canonicalBytes(value)).toThrow(
        "KNOWLEDGE_CONTRACT_INVALID",
      ));
  it("rejects cycles, accessors, nonenumerables and symbolic keys without invoking getters", () => {
    const cycle: { self?: unknown } = {};
    cycle.self = cycle;
    expect(() => canonicalBytes(cycle)).toThrow();
    let called = false;
    const getter = Object.defineProperty({}, "synthetic", {
      enumerable: true,
      get() {
        called = true;
        throw Error("SYNTHETIC_SENTINEL");
      },
    });
    expect(() => canonicalBytes(getter)).toThrow("KNOWLEDGE_CONTRACT_INVALID");
    expect(called).toBe(false);
    expect(() =>
      canonicalBytes(Object.defineProperty({}, "x", { value: 1 })),
    ).toThrow();
    expect(() => canonicalBytes({ [Symbol("x")]: 1 })).toThrow();
  });
  it("normalizes sets ordinally and UTC timestamps without Unicode normalization", () => {
    const p = fixture(),
      before = reviewManifestDigest(p.sources[0], p.versions[0]);
    p.versions[0].rights.permittedUses.reverse();
    p.versions[0].rights.permittedUses.push("MODEL_INPUT");
    expect(reviewManifestDigest(p.sources[0], p.versions[0])).toBe(before);
    expect(parseContract(stamp, "2026-10-02T20:00:00-04:00")).toBe(now);
    expect(canonicalDigest(["first", "second"])).not.toBe(
      canonicalDigest(["second", "first"]),
    );
    expect(canonicalDigest("é")).not.toBe(canonicalDigest("e\u0301"));
  });
  for (const value of ["2026-02-30", "2026-13-01", "2026-01-00"])
    it(`rejects unreal date ${value}`, () => {
      expect(day.safeParse(value).success).toBe(false);
      expect(stamp.safeParse(`${value}T00:00:00Z`).success).toBe(false);
    });
});

const bindingMutations: Array<[string, unknown]> = [
  ["rawHash", "c".repeat(64)],
  ["normalizedHash", "c".repeat(64)],
  ["parserId", "synthetic-other-parser"],
  ["parserVersion", "2"],
  ["sourceMetadataRevision", 2],
  ["scopeId", "tenant:2"],
  ["documentId", "synthetic-other-document"],
  ["upstreamEdition", "edition-2"],
  ["artifactRevision", 2],
  ["sourceUrl", "https://synthetic.example.invalid/other"],
  ["publishedAt", "2026-01-01T01:00:00.000Z"],
  ["retrievedAt", "2026-01-03T00:00:00.000Z"],
  ["effectiveFrom", "2026-02-01"],
  ["effectiveTo", "2026-12-01"],
  ["legacyCoverageSnapshotId", "00000000-0000-4000-8000-000000000001"],
  ["registeredByMemberId", 90],
  ["submittedByMemberId", 90],
  ...[
    "payers",
    "jurisdictions",
    "macs",
    "providerTypes",
    "settings",
    "benefitPeriods",
    "codeEditions",
    "products",
    "populations",
  ].map(
    (key) =>
      [
        `applicability.${key}`,
        key === "payers" ? ["COMMERCIAL"] : ["SYNTHETIC-OTHER"],
      ] as [string, unknown],
  ),
  ...Object.entries({
    id: "synthetic-other-rights",
    revision: 2,
    owner: "synthetic-other-owner",
    reference: "synthetic-other-ref",
    effectiveFrom: "2026-01-02T00:00:00.000Z",
    expiresAt: end,
    commercialUse: false,
    permittedUses: ["INTERNAL_STORAGE"],
    verifiedByMemberId: 3,
    verificationGrantId: "grant-3",
    verificationQualificationId: "qualification-3",
    verificationRef: "synthetic-other-verification",
    verifiedAt: "2026-01-02T00:00:00.000Z",
  }).map(([key, value]) => [`rights.${key}`, value] as [string, unknown]),
];
describe("complete manifest review binding", () => {
  for (const [key, value] of bindingMutations)
    it(`unchanged approval rejects changed ${key}`, () => {
      const p = fixture(),
        v = p.versions[0];
      mutate(v, key.split("."), value);
      if (key === "rights.id") v.rightsOverlay.rightsId = v.rights.id;
      if (key === "rights.revision")
        v.rightsOverlay.rightsRevision = v.rights.revision;
      v.rightsOverlay.rightsRevisionId = rightsRevisionIdentity(
        v.scopeId,
        v.rights.id,
        v.rights.revision,
      );
      let accepted = false;
      try {
        accepted = hasCurrentApproval(
          p,
          p.sources[0],
          v,
          v.approvals[0],
          now,
          true,
        );
      } catch (error) {
        expect(String(error)).toMatch(/KNOWLEDGE_/);
      }
      expect(accepted).toBe(false);
    });
  for (const [key, value] of Object.entries({
    id: "synthetic-other-source",
    metadataRevision: 2,
    publisher: "Synthetic other publisher",
    title: "Synthetic other title",
    officialUrl: "https://synthetic.example.invalid/other",
    domain: "CMS_MANUAL",
    claimTypes: ["MEDICARE_CLAIMS_RULE"],
    educationalOnly: true,
    scope: { id: "tenant:2", kind: "TENANT", organizationId: 2 },
  }))
    it(`source ${key} cannot inherit approval`, () => {
      const p = fixture();
      mutate(p.sources[0], [key], value);
      let accepted = false;
      try {
        accepted = hasCurrentApproval(
          p,
          p.sources[0],
          p.versions[0],
          p.versions[0].approvals[0],
          now,
          true,
        );
      } catch (error) {
        expect(String(error)).toMatch(/KNOWLEDGE_/);
      }
      expect(accepted).toBe(false);
    });
  it("healthy approved published authority selects evidence and retains mandatory human review", () => {
    const r = resolve();
    expect(r.state).toBe("APPLICABLE");
    expect(r.humanReviewRequired).toBe(true);
    expect(r.selected[0]).toMatchObject({
      versionId: "synthetic-v1",
      assignmentId: "synthetic-assignment",
      reviewManifestDigest: fixture().assignments[0].reviewManifestDigest,
    });
    expect(r.bundleId).toBe(`kb2:${r.bundleHash}`);
  });
});

describe("tenant and candidate observability", () => {
  for (const collection of [
    "sources",
    "versions",
    "assignments",
    "grants",
    "qualifications",
    "members",
    "configuration",
    "audit",
    "drafts",
  ])
    it(`foreign ${collection} mutation leaves complete authorized output equal`, () => {
      const p = fixture(),
        foreign = structuredClone(p);
      foreign.scope = { id: "tenant:2", kind: "TENANT", organizationId: 2 };
      const r = createKnowledgeRegistry({
        contractVersion: "knowledge-foundation-v3",
        partitions: [p, foreign],
      }).resolve(context, actor(), now);
      (foreign as unknown as Record<string, unknown>)[collection] = [
        { synthetic: "SYNTHETIC_SENTINEL", invalid: () => null },
      ];
      expect(
        createKnowledgeRegistry({
          contractVersion: "knowledge-foundation-v3",
          partitions: [foreign, p],
        }).resolve(context, actor(), now),
      ).toEqual(r);
    });
  it("malformed foreign getter is never invoked or leaked", () => {
    let called = false;
    const foreign = {
      scope: { id: "tenant:2", kind: "TENANT", organizationId: 2 },
    };
    Object.defineProperty(foreign, "versions", {
      enumerable: true,
      get() {
        called = true;
        throw Error("SYNTHETIC_SENTINEL");
      },
    });
    expect(
      createKnowledgeRegistry({
        contractVersion: "knowledge-foundation-v3",
        partitions: [fixture(), foreign],
      }).resolve(context, actor(), now),
    ).toEqual(resolve());
    expect(called).toBe(false);
  });
  for (const state of [
    "DETECTED",
    "FETCHED",
    "QUARANTINED",
    "PARSED",
    "DIFFED",
    "VALIDATED",
    "REVIEW_PENDING",
    "APPROVED",
  ] as const)
    it(`${state} unassigned candidate cannot alter result or fingerprint`, () => {
      const p = fixture(),
        before = resolve(p),
        v = candidate(p);
      v.state = state;
      v.approvals = [];
      v.rawHash = "c".repeat(64);
      expect(resolve(p)).toEqual(before);
    });
  it("unadopted malformed approval cannot alter publication", () => {
    const p = fixture(),
      before = resolve(p);
    (p.versions[0].approvals as unknown[]).push({
      id: "synthetic-unadopted",
      invalid: undefined,
    });
    expect(resolve(p)).toEqual(before);
  });
  it("registry and credential permutations preserve complete result", () => {
    const p = fixture();
    p.sources.push({ ...p.sources[0], id: "synthetic-unpublished-source" });
    candidate(p);
    const before = resolve(p);
    p.sources.reverse();
    p.versions.reverse();
    p.assignments.reverse();
    p.grants.reverse();
    p.qualifications.reverse();
    p.members.reverse();
    expect(resolve(p)).toEqual(before);
  });
  it("snapshot owns its inputs and resolver leaves all inputs unchanged", () => {
    const p = fixture(),
      before = structuredClone(p),
      a = actor(),
      c = structuredClone(context),
      registry = createKnowledgeRegistry({
        contractVersion: "knowledge-foundation-v3",
        partitions: [p],
      });
    const first = registry.resolve(c, a, now);
    expect(p).toEqual(before);
    expect(a).toEqual(actor());
    expect(c).toEqual(context);
    p.versions[0].rawHash = "c".repeat(64);
    expect(registry.resolve(c, a, now)).toEqual(first);
  });
  it("authorized published metadata changes affect the manifest", () => {
    const p = fixture(),
      before = resolve(p);
    p.versions[0].revokedAt = now;
    p.versions[0].state = "REVOKED";
    p.versions[0].revocationReason = "SECURITY_REVOCATION";
    expect(resolve(p).bundleHash).not.toBe(before.bundleHash);
  });
});

describe("scoped capability, qualification and duties", () => {
  for (const field of [
    "membershipActive",
    "organizationActive",
    "sessionVerified",
  ])
    it(`inactive ${field} denies trusted actor`, () => {
      const a = { ...actor(), [field]: false };
      expect(resolve(fixture(), context, a).state).toBe("SCOPE_DENIED");
      expect(() =>
        transition(
          fixture(),
          { operation: "REVOKE", versionId: "synthetic-v1" },
          a,
        ),
      ).toThrow("KNOWLEDGE_SCOPE_DENIED");
    });
  it("admin/model/role strings do not establish knowledge authority", () => {
    expect(() =>
      resolve(fixture(), context, { ...actor(), role: "platform_admin" }),
    ).toThrow("KNOWLEDGE_CONTRACT_INVALID");
    expect(() =>
      resolve(fixture(), context, { ...actor(), kind: "MODEL" }),
    ).toThrow();
    const p = fixture();
    p.grants = p.grants.filter((g) => g.subjectMemberId !== 3);
    expect(resolve(p).state).toBe("SCOPE_DENIED");
    expect(() =>
      transition(p, { operation: "REVOKE", versionId: "synthetic-v1" }),
    ).toThrow("KNOWLEDGE_PERMISSION_DENIED");
  });
  it("wrong tenant fails before validating private administrative payload", () => {
    const p = fixture();
    (p.versions as unknown[]).push({ synthetic: "SYNTHETIC_SENTINEL" });
    expect(() =>
      transition(
        p,
        { operation: "REVOKE", versionId: "synthetic-v1" },
        actor(3, 2),
      ),
    ).toThrow("KNOWLEDGE_SCOPE_DENIED");
  });
  for (const kind of ["grant", "qualification"])
    for (const condition of ["expired", "revoked", "future", "wrong-scope"])
      it(`${kind} ${condition} blocks referenced approval`, () => {
        const p = fixture(),
          record =
            kind === "grant"
              ? p.grants.find((g) => g.id === "grant-2")!
              : p.qualifications.find((q) => q.id === "qualification-2")!;
        if (condition === "expired") record.expiresAt = now;
        if (condition === "revoked") record.revokedAt = now;
        if (condition === "future")
          record.verifiedAt = "2026-10-04T00:00:00.000Z";
        if (condition === "wrong-scope") record.scopeId = "tenant:2";
        expect(
          hasCurrentApproval(
            p,
            p.sources[0],
            p.versions[0],
            p.versions[0].approvals[0],
            now,
            true,
          ),
        ).toBe(false);
      });
  it("inactive reviewer membership blocks without rewriting historical approval", () => {
    const p = fixture(),
      before = structuredClone(p.versions[0].approvals[0]);
    p.members.find((m) => m.memberId === 2)!.membershipActive = false;
    expect(resolve(p).state).toBe("NOT_APPROVED");
    expect(p.versions[0].approvals[0]).toEqual(before);
  });
  it("synthetic qualification cannot enter production context", () => {
    const p = fixture();
    for (const g of p.grants)
      g.issuance = {
        kind: "OWNER_BOOTSTRAP",
        reference: "synthetic-owner-test-only",
      };
    expect(resolve(p, context, { ...actor(), synthetic: false }).state).toBe(
      "LICENSE_NOT_PERMITTED",
    );
  });
  it("class label cannot replace domain qualification or geographic coverage", () => {
    const p = fixture(),
      q = p.qualifications[1];
    q.class = "CLINICAL_LEADER";
    expect(resolve(p).state).toBe("NOT_APPROVED");
    q.class = "COMPLIANCE_REVIEWER";
    q.jurisdictions = ["US-NY"];
    expect(resolve(p).state).toBe("NOT_APPROVED");
    expect(requiredReviewer("DRUG_LABEL")).toBe("PHARMACIST");
    expect(requiredReviewer("OFFICIAL_CODING")).toBe("CODER");
    expect(requiredReviewer("CLINICAL_PROTOCOL")).toBe("HOSPICE_PHYSICIAN");
  });
  it("self-grant/self-verification reject and valid delegation cannot broaden", () => {
    const p = fixture(),
      parent = p.grants.find((g) => g.subjectMemberId === 90)!;
    const child = {
      ...p.grants[0],
      id: "synthetic-child",
      grantedByMemberId: 90,
      verifiedByMemberId: 90,
      createdAt: now,
      verifiedAt: now,
      effectiveFrom: now,
      issuance: {
        kind: "DELEGATED",
        parentGrantId: parent.id,
        parentGrantRevision: parent.revision,
        requestId: "synthetic-issuance",
      },
    };
    const ctx = {
      actor: actor(90),
      now,
      parentGrantId: parent.id,
      expectedParentRevision: parent.revision,
      newGrantId: child.id,
      requestId: "synthetic-issuance",
    };
    expect(() => validateGrantDelegation(p, child, ctx)).not.toThrow();
    expect(
      grantSchema.safeParse({ ...child, grantedByMemberId: 1 }).success,
    ).toBe(false);
    expect(
      grantSchema.safeParse({ ...child, verifiedByMemberId: 1 }).success,
    ).toBe(false);
    expect(
      qualificationSchema.safeParse({
        ...p.qualifications[0],
        verifiedByMemberId: 1,
      }).success,
    ).toBe(false);
    parent.capabilities = ["knowledge.grants"];
    expect(() => validateGrantDelegation(p, child, ctx)).toThrow(
      "KNOWLEDGE_DELEGATION_DENIED",
    );
    expect(() =>
      validateGrantDelegation(
        p,
        { ...child, expiresAt: "2028-01-01T00:00:00Z" },
        ctx,
      ),
    ).toThrow();
  });
  for (const reviewer of [1, 3])
    it(`prohibited reviewer ${reviewer} duty combination rejects`, () => {
      const p = fixture();
      p.assignments = [];
      p.versions[0].state = "REVIEW_PENDING";
      p.versions[0].activatedAt = null;
      p.versions[0].approvals = [];
      if (reviewer === 3) p.versions[0].submittedByMemberId = 3;
      expect(() =>
        transition(
          p,
          { operation: "APPROVE", versionId: "synthetic-v1", reviewDueAt: end },
          actor(reviewer),
        ),
      ).toThrow("KNOWLEDGE_DUTY_CONFLICT");
    });
  it("same approving reviewer cannot activate even imported publication", () => {
    const p = fixture(),
      v = p.versions[0];
    p.assignments = [];
    v.state = "APPROVED";
    v.activatedAt = null;
    expect(() => transition(p, activation(v), actor(2))).toThrow(
      "ACTIVATION_REVIEW_REQUIRED",
    );
    const imported = fixture();
    imported.assignments[0].createdByMemberId = 2;
    expect(resolve(imported).state).toBe("NOT_APPROVED");
  });
  it("qualified independent approval then activation succeeds and is immutable", () => {
    const p = fixture();
    p.assignments = [];
    const v = p.versions[0];
    v.state = "REVIEW_PENDING";
    v.activatedAt = null;
    v.approvals = [];
    const before = structuredClone(p),
      a = actor(2),
      command = { operation: "APPROVE", versionId: v.id, reviewDueAt: end };
    const approved = transition(p, command, a);
    expect(p).toEqual(before);
    expect(a).toEqual(actor(2));
    expect(command).toEqual({
      operation: "APPROVE",
      versionId: v.id,
      reviewDueAt: end,
    });
    expect(approved.state.versions[0].state).toBe("APPROVED");
    const active = transition(
      approved.state,
      activation(approved.state.versions[0]),
      actor(1),
      server("synthetic-activation"),
    );
    expect(active.eventIntents[0].invalidation).toBe("PUBLICATION");
    expect(resolve(active.state).state).toBe("APPLICABLE");
  });
});

describe("rights, health and service semantics", () => {
  for (const purpose of purposes)
    it(`missing independent right ${purpose} denies`, () => {
      const p = fixture();
      p.versions[0].rights.permittedUses =
        p.versions[0].rights.permittedUses.filter((u) => u !== purpose);
      expect(
        licenseAllows(p, p.sources[0], p.versions[0], now, purpose, true),
      ).toBe(false);
    });
  for (const condition of [
    "future",
    "expired",
    "revoked",
    "unverified",
    "noncommercial",
  ])
    it(`${condition} rights deny`, () => {
      const p = fixture(),
        v = p.versions[0];
      if (condition === "future")
        v.rights.effectiveFrom = "2026-10-04T00:00:00.000Z";
      if (condition === "expired") v.rights.expiresAt = now;
      if (condition === "revoked") v.rightsOverlay.revokedAt = now;
      if (condition === "unverified") v.rights.status = "PENDING";
      if (condition === "noncommercial") v.rights.commercialUse = false;
      expect(licenseAllows(p, p.sources[0], v, now, "MODEL_INPUT", true)).toBe(
        false,
      );
    });
  it("model input implies neither display nor derived output", () => {
    const p = fixture(),
      v = p.versions[0];
    v.rights.permittedUses = ["INTERNAL_STORAGE", "MODEL_INPUT"];
    expect(licenseAllows(p, p.sources[0], v, now, "MODEL_INPUT", true)).toBe(
      true,
    );
    for (const use of ["DERIVED_OUTPUT", "CUSTOMER_DISPLAY"] as const)
      expect(licenseAllows(p, p.sources[0], v, now, use, true)).toBe(false);
  });
  it("activation verifies every enabled use", () => {
    const p = fixture(),
      v = p.versions[0];
    p.assignments = [];
    v.state = "APPROVED";
    v.activatedAt = null;
    v.rights.permittedUses = ["INTERNAL_STORAGE"];
    renewDigest({ ...p, assignments: [{ ...fixture().assignments[0] }] });
    expect(() => transition(p, activation(v))).toThrow(
      "ACTIVATION_RIGHTS_OR_INTERVAL_REQUIRED",
    );
  });
  it("NOT_CHECKED never becomes CURRENT and cannot manufacture evidence", () => {
    const p = fixture();
    p.versions[0].health = unchecked();
    expect(resolve(p).state).toBe("SOURCE_UNAVAILABLE");
    expect(
      healthSchema.safeParse({ ...unchecked(), checkedAt: now }).success,
    ).toBe(false);
  });
  for (const key of ["checkedAt", "lastValidatedAt"])
    it(`future health ${key} cannot activate`, () => {
      const p = fixture(),
        v = p.versions[0];
      p.assignments = [];
      v.state = "APPROVED";
      v.activatedAt = null;
      v.health.checkedAt = "2026-10-04T00:00:00.000Z";
      if (key === "lastValidatedAt")
        v.health.lastValidatedAt = "2026-10-04T00:00:00.000Z";
      expect(() => transition(p, activation(v))).toThrow(
        "ACTIVATION_HEALTH_REQUIRED",
      );
    });
  it("chronological observations reject future, reversed, manufactured LKG and health REVOKED", () => {
    for (const h of [
      {
        ...fixture().versions[0].health,
        checkedAt: "2026-10-04T00:00:00.000Z",
      },
      {
        ...fixture().versions[0].health,
        checkedAt: "2026-10-01T00:00:00.000Z",
      },
      { ...unchecked(), state: "REVOKED" },
    ])
      expect(() =>
        transition(fixture(), {
          operation: "RECORD_HEALTH",
          versionId: "synthetic-v1",
          health: h,
        }),
      ).toThrow();
  });
  it("explicit LKG supports degraded retrieval but never stale activation or higher blocks", () => {
    let p = fixture();
    p.versions[0].health.warningAt = "2026-10-02T12:00:00.000Z";
    p = transition(
      p,
      {
        operation: "APPROVE_LKG",
        versionId: "synthetic-v1",
        until: "2026-10-20T00:00:00.000Z",
      },
      actor(2),
    ).state;
    expect(resolve(p).state).toBe("APPLICABLE");
    expect(resolve(p).warnings).toEqual(["STALE_ALLOWED_WITH_WARNING"]);
    expect(() =>
      transition(p, {
        operation: "REFRESH_APPROVAL",
        versionId: "synthetic-v1",
        assignmentId: "synthetic-assignment",
        approvalId: "synthetic-approval",
      }),
    ).toThrow();
    expect(resolve(p, context, actor(), "2026-11-01T00:00:00.000Z").state).toBe(
      "SOURCE_EXPIRED",
    );
    p.versions[0].rightsOverlay.revokedAt = now;
    expect(resolve(p).state).toBe("LICENSE_NOT_PERMITTED");
    p.versions[0].state = "REVOKED";
    p.versions[0].revokedAt = now;
    p.versions[0].revocationReason = "SECURITY_REVOCATION";
    expect(resolve(p).state).toBe("SOURCE_REVOKED");
  });
  for (const [serviceDate, state] of [
    ["2026-01-01", "APPLICABLE"],
    ["2027-01-01", "NOT_APPLICABLE"],
    ["2025-12-31", "NOT_APPLICABLE"],
  ])
    it(`half-open date ${serviceDate}`, () =>
      expect(resolve(fixture(), { ...context, serviceDate }).state).toBe(
        state,
      ));
  it("nullable end is reviewed unbounded coverage", () => {
    const p = fixture();
    p.versions[0].effectiveTo = null;
    p.assignments[0].serviceTo = null;
    renewDigest(p);
    expect(resolve(p, { ...context, serviceDate: "2028-01-01" }).state).toBe(
      "APPLICABLE",
    );
  });
  for (const missing of [
    "payer",
    "jurisdiction",
    "serviceDate",
    "mac",
    "providerType",
  ])
    it(`missing ${missing} is explicit insufficient context`, () => {
      const c = { ...context } as Record<string, unknown>;
      delete c[missing];
      expect(resolve(fixture(), c).state).toBe("INSUFFICIENT_CONTEXT");
    });
  it("unsupported scoped payer precedes unsupported jurisdiction", () => {
    expect(
      resolve(fixture(), {
        ...context,
        payer: "COMMERCIAL",
        jurisdiction: "US-NY",
      }).state,
    ).toBe("PAYER_KNOWLEDGE_NOT_CONFIGURED");
    expect(
      resolve(fixture(), { ...context, jurisdiction: "US-NY" }).state,
    ).toBe("JURISDICTION_NOT_SUPPORTED");
  });
  it("known mismatch does not block while optional unknown cannot hide higher block", () => {
    const p = fixture(),
      c = { ...context } as Record<string, unknown>;
    delete c.mac;
    p.versions[0].revokedAt = now;
    p.versions[0].state = "REVOKED";
    p.versions[0].revocationReason = "SECURITY_REVOCATION";
    expect(resolve(p, c).state).toBe("SOURCE_REVOKED");
    expect(resolve(p, { ...context, mac: "OTHER" }).state).toBe(
      "NOT_APPLICABLE",
    );
  });
  it("education-only excluded and absent publication is unavailable, never no known issue", () => {
    const p = fixture();
    p.sources[0].educationalOnly = true;
    renewDigest(p);
    expect(resolve(p).state).toBe("NOT_APPLICABLE");
    p.assignments = [];
    expect(resolve(p).state).toBe("SOURCE_UNAVAILABLE");
  });
});

describe("aggregate lifecycle publication and future delivery", () => {
  it("registers immutable revision through trusted pipeline, submit, independent approval and activation", () => {
    let p = fixture();
    const v = structuredClone(p.versions[0]);
    v.id = "synthetic-new";
    v.artifactRevision = 2;
    v.state = "DETECTED";
    v.revision = 0;
    v.submittedByMemberId = null;
    v.approvals = [];
    v.activatedAt = null;
    v.health = unchecked();
    p = transition(
      p,
      { operation: "REGISTER", source: p.sources[0], version: v },
      actor(1),
    ).state;
    const before = structuredClone(p);
    const duplicate = transition(
      p,
      { operation: "REGISTER", source: p.sources[0], version: v },
      actor(3),
    );
    expect(duplicate.existingVersionId).toBe(v.id);
    expect(duplicate.state).toEqual(before);
    expect(duplicate.eventIntents).toEqual([]);
    const bad = { ...v, rawHash: "c".repeat(64) };
    expect(() =>
      transition(
        p,
        { operation: "REGISTER", source: p.sources[0], version: bad },
        actor(1),
      ),
    ).toThrow("KNOWLEDGE_IDENTITY_CONFLICT");
    for (const stage of [
      "FETCHED",
      "QUARANTINED",
      "PARSED",
      "DIFFED",
      "VALIDATED",
    ])
      p = transition(
        p,
        {
          operation: "RECORD_STAGE",
          versionId: v.id,
          stage,
          evidenceRef: "synthetic-evidence",
        },
        null,
        { ...server(`synthetic-${stage}`), kind: "PIPELINE" },
      ).state;
    p = transition(p, { operation: "SUBMIT", versionId: v.id }, actor(1)).state;
    expect(p.versions[1].submittedByMemberId).toBe(1);
    p = transition(
      p,
      { operation: "APPROVE", versionId: v.id, reviewDueAt: end },
      actor(2),
    ).state;
    expect(resolve(p)).toEqual(resolve(fixture()));
  });
  it("human/model pipeline spoof and stage skips reject without mutating", () => {
    const p = fixture(),
      before = structuredClone(p);
    expect(() =>
      transition(p, {
        operation: "RECORD_STAGE",
        versionId: "synthetic-v1",
        stage: "VALIDATED",
        evidenceRef: "synthetic-evidence",
      }),
    ).toThrow("KNOWLEDGE_PIPELINE_REQUIRED");
    expect(p).toEqual(before);
  });
  it("REAPPROVE leaves publication equal until explicit REFRESH_APPROVAL", () => {
    let p = fixture(),
      before = resolve(p);
    p = transition(
      p,
      { operation: "REAPPROVE", versionId: "synthetic-v1", reviewDueAt: end },
      actor(2),
      server("synthetic-renewal"),
    ).state;
    expect(resolve(p)).toEqual(before);
    const newer = p.versions[0].approvals.at(-1)!;
    const refreshed = transition(p, {
      operation: "REFRESH_APPROVAL",
      versionId: "synthetic-v1",
      assignmentId: "synthetic-assignment",
      approvalId: newer.id,
    });
    expect(refreshed.eventIntents[0]).toMatchObject({
      invalidation: "PUBLICATION",
      reasonCode: "PUBLISHED",
      previousApprovalId: "synthetic-approval",
      approvalId: newer.id,
    });
    expect(resolve(refreshed.state).bundleHash).not.toBe(before.bundleHash);
  });
  for (const condition of [
    "missing",
    "foreign",
    "unrelated",
    "self",
    "previously-published",
  ])
    it(`invalid ${condition} supersession rejects without mutation`, () => {
      const p = fixture(),
        v = candidate(p);
      let id = v.id;
      if (condition === "missing") id = "synthetic-missing";
      if (condition === "foreign") v.scopeId = "tenant:2";
      if (condition === "unrelated") v.documentId = "synthetic-other-document";
      if (condition === "self") id = "synthetic-v1";
      if (condition === "previously-published") {
        v.state = "SUPERSEDED";
      }
      const before = structuredClone(p);
      expect(() =>
        transition(p, {
          operation: "SUPERSEDE",
          versionId: id,
          assignmentId: "synthetic-assignment",
          approvalId: v.approvals[0].id,
          cutover: "2026-10-01",
        }),
      ).toThrow();
      expect(p).toEqual(before);
    });
  it("supersession splits immutable history and rollback creates acyclic lineage", () => {
    let p = fixture();
    const v = candidate(p),
      interval = structuredClone(
        p.versions.map((v) => [v.effectiveFrom, v.effectiveTo]),
      );
    const superseded = transition(p, {
      operation: "SUPERSEDE",
      versionId: v.id,
      assignmentId: "synthetic-assignment",
      approvalId: v.approvals[0].id,
      cutover: "2026-10-01",
    });
    p = superseded.state;
    expect(p.versions.map((v) => [v.effectiveFrom, v.effectiveTo])).toEqual(
      interval,
    );
    expect(
      p.assignments
        .filter((a) => !a.retiredAt)
        .map((a) => [a.versionId, a.serviceFrom, a.serviceTo]),
    ).toEqual([
      ["synthetic-v1", "2026-01-01", "2026-10-01"],
      [v.id, "2026-10-01", "2027-01-01"],
    ]);
    expect(
      resolve(p, { ...context, serviceDate: "2026-09-01" }).selected[0]
        .versionId,
    ).toBe("synthetic-v1");
    const current = p.assignments.find(
      (a) => !a.retiredAt && a.versionId === v.id,
    )!;
    const rolled = transition(
      p,
      {
        operation: "ROLLBACK",
        versionId: "synthetic-v1",
        assignmentId: current.id,
        approvalId: "synthetic-approval",
        cutover: "2026-10-02",
      },
      actor(),
      server("synthetic-rollback"),
    );
    expect(rolled.eventIntents[0].invalidation).toBe("PUBLICATION");
    expect(() => validateLineage(rolled.state)).not.toThrow();
    expect(resolve(rolled.state).selected[0].versionId).toBe("synthetic-v1");
  });
  for (const condition of [
    "revoked",
    "expired",
    "unapproved",
    "unhealthy",
    "rights-invalid",
  ])
    it(`rollback ${condition} target cannot resurrect`, () => {
      let p = fixture();
      const v = candidate(p);
      p = transition(p, {
        operation: "SUPERSEDE",
        versionId: v.id,
        assignmentId: "synthetic-assignment",
        approvalId: v.approvals[0].id,
        cutover: "2026-10-01",
      }).state;
      const old = p.versions[0];
      if (condition === "revoked") {
        old.state = "REVOKED";
        old.revokedAt = now;
        old.revocationReason = "SECURITY_REVOCATION";
      }
      if (condition === "expired") old.approvals[0].reviewDueAt = now;
      if (condition === "unapproved") old.approvals = [];
      if (condition === "unhealthy") old.health = unchecked();
      if (condition === "rights-invalid") old.rightsOverlay.revokedAt = now;
      expect(() =>
        transition(p, {
          operation: "ROLLBACK",
          versionId: old.id,
          assignmentId: p.assignments.at(-1)!.id,
          approvalId: "synthetic-approval",
          cutover: "2026-10-02",
        }),
      ).toThrow();
    });
  it("rejects overlapping unequal applicability sets and self/missing/cyclic lineage", () => {
    const p = fixture(),
      a = p.assignments[0],
      b = {
        ...a,
        id: "synthetic-overlap",
        applicability: {
          ...a.applicability,
          jurisdictions: ["US-FL", "US-NY"],
        },
      };
    expect(assignmentsConflict(a, b)).toBe(true);
    expect(applicabilityIntersects(a.applicability, b.applicability)).toBe(
      true,
    );
    for (const predecessorAssignmentId of [a.id, "synthetic-missing"]) {
      const bad = fixture();
      bad.assignments[0].predecessorAssignmentId = predecessorAssignmentId;
      expect(() => validateLineage(bad)).toThrow("KNOWLEDGE_LINEAGE_INVALID");
    }
    const bad = fixture();
    bad.assignments.push({
      ...a,
      id: "synthetic-cycle",
      predecessorAssignmentId: a.id,
      retiredAt: now,
      retirementEventId: "synthetic-retirement",
    });
    bad.assignments[0].predecessorAssignmentId = "synthetic-cycle";
    bad.assignments[0].retiredAt = now;
    bad.assignments[0].retirementEventId = "synthetic-retirement";
    expect(() => validateLineage(bad)).toThrow();
  });
  it("emergency revoke is unilateral, terminal and emits publication invalidation", () => {
    const p = fixture(),
      r = transition(
        p,
        { operation: "REVOKE", versionId: "synthetic-v1" },
        actor(2),
      );
    expect(r.eventIntents[0]).toMatchObject({
      invalidation: "PUBLICATION",
      reasonCode: "SECURITY_REVOCATION",
      aggregateKind: "VERSION",
      aggregateId: "synthetic-v1",
    });
    expect(resolve(r.state).state).toBe("SOURCE_REVOKED");
    expect(() =>
      transition(
        r.state,
        { operation: "REAPPROVE", versionId: "synthetic-v1", reviewDueAt: end },
        actor(2),
      ),
    ).toThrow("KNOWLEDGE_REVOKED");
    expect(p).toEqual(fixture());
  });
  for (const operation of [
    "REVOKE_RIGHTS",
    "REVOKE_GRANT",
    "REVOKE_QUALIFICATION",
  ])
    it(`${operation} emits eligibility invalidation`, () => {
      const p = fixture(),
        cmd =
          operation === "REVOKE_RIGHTS"
            ? {
                operation,
                versionId: "synthetic-v1",
                expectedRightsRevision: 1,
              }
            : {
                operation,
                credentialId:
                  operation === "REVOKE_GRANT" ? "grant-2" : "qualification-2",
                expectedCredentialRevision: 1,
              };
      const r = transition(p, cmd);
      expect(r.eventIntents[0].invalidation).toBe("ELIGIBILITY");
      expect(r.eventIntents[0]).not.toHaveProperty("affectedAssignmentIds");
      expect(eventSchema.safeParse(r.eventIntents[0]).success).toBe(true);
      expect(r.eventIntents[0].contentRemoval).toBe(
        operation === "REVOKE_RIGHTS",
      );
      expect(resolve(r.state).state).not.toBe("APPLICABLE");
    });
  it("scope parent CAS and all touched version CAS cannot silently succeed", () => {
    const p = fixture();
    expect(() =>
      transition(p, {
        operation: "REVOKE",
        versionId: "synthetic-v1",
        expectedScopeRevision: 0,
      }),
    ).toThrow("KNOWLEDGE_REVISION_CONFLICT");
    expect(() =>
      transition(p, {
        operation: "REVOKE",
        versionId: "synthetic-v1",
        expectedVersionRevisions: {},
      }),
    ).toThrow("KNOWLEDGE_REVISION_CONFLICT");
  });
  it("expiry is denied without sweeper; stable metadata-only keys do not multiply shared rights", () => {
    const p = fixture();
    p.versions[0].rights.expiresAt = "2026-10-04T00:00:00.000Z";
    renewDigest(p);
    const t = "2026-10-04T00:00:00.000Z",
      a = evaluateExpiryIntents(p, t),
      b = evaluateExpiryIntents(p, "2026-10-05T00:00:00.000Z");
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
    expect(
      a.some((e) => e.reasonCode === "RIGHTS_EXPIRED" && e.contentRemoval),
    ).toBe(true);
    expect(
      a.every(
        (e) => e.actorKind === "SYSTEM" && e.invalidation === "ELIGIBILITY",
      ),
    ).toBe(true);
    expect(resolve(p, context, actor(), t).state).toBe("LICENSE_NOT_PERMITTED");
  });
  it("audit/outbox reject source content, unknown payloads and arbitrary reason strings", () => {
    const e = transition(fixture(), {
      operation: "REVOKE",
      versionId: "synthetic-v1",
    }).eventIntents[0];
    for (const invalid of [
      { ...e, reasonCode: "SYNTHETIC_REASON" },
      { ...e, reasonCode: "REGISTERED" },
      { ...e, payload: { text: "SYNTHETIC_SENTINEL" } },
      {
        ...e,
        actorKind: "SYSTEM",
        systemActorId: "expiry-evaluator",
        actorMemberId: null,
      },
    ])
      expect(eventSchema.safeParse(invalid).success).toBe(false);
    const o = {
      eventId: e.id,
      scopeId: e.scopeId,
      aggregateRevision: 1,
      availableAt: now,
      attempts: 0,
      leaseToken: null,
      leaseExpiresAt: null,
      deliveredAt: null,
      deadLetteredAt: null,
      lastErrorCode: null,
    };
    expect(outboxSchema.safeParse(o).success).toBe(true);
    expect(
      outboxSchema.safeParse({ ...o, sourceText: "SYNTHETIC_SENTINEL" })
        .success,
    ).toBe(false);
    expect(
      outboxSchema.safeParse({ ...o, leaseToken: "synthetic-lease" }).success,
    ).toBe(false);
  });
  it("future contracts specify one transaction, scope-first locks and at-least-once delivery without persistence", () => {
    expect(
      futureTransactionOrder.indexOf("REAUTHORIZE_CURRENT_CONTEXT"),
    ).toBeLessThan(
      futureTransactionOrder.indexOf(
        "REPLAY_COMMITTED_RESULT_OR_VERIFY_EXPECTED_REVISIONS",
      ),
    );
    expect(futureTransactionOrder.slice(-5)).toEqual([
      "WRITE_IMMUTABLE_AUDIT",
      "WRITE_OUTBOX",
      "WRITE_BOUNDED_RESPONSE_RECEIPT",
      "RECHECK_DEADLINE_AND_TIME_SENSITIVE_ELIGIBILITY",
      "COMMIT_ATTEMPT",
    ]);
    expect(futureLockOrder[0]).toBe("SINGLE_SCOPE");
    expect(futureProtocol).toMatchObject({
      expectedAffectedRows: 1,
      commandBudgetMs: 5000,
      independentlyCommittedPlaceholder: false,
      automaticReceiptTTL: false,
      delivery: "AT_LEAST_ONCE",
      leaseSeconds: 60,
      attemptCap: 10,
    });
    expect([1, 2, 9, 10].map(retryDelaySeconds)).toEqual([1, 2, 256, 300]);
    expect(() => retryDelaySeconds(11)).toThrow();
    const key = receiptKey("tenant:1", 3, "REVOKE", "synthetic-random-key-123");
    expect(key).not.toHaveProperty("key");
    expect(key.keyHash).toHaveLength(64);
    const cmd = {
      ...expected(fixture()),
      operation: "REVOKE",
      versionId: "synthetic-v1",
    };
    expect(requestFingerprint(parseContract(commandSchema, cmd))).toBe(
      requestFingerprint(parseContract(commandSchema, { ...cmd })),
    );
    expect(
      requestFingerprint(
        parseContract(commandSchema, { ...cmd, expectedScopeRevision: 6 }),
      ),
    ).not.toBe(requestFingerprint(cmd));
  });
});

it("bounded rejected metadata never leaks into errors or logs", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const p = fixture();
    let message = "";
    try {
      transition(p, {
        operation: "REVOKE",
        versionId: "synthetic-v1",
        text: "SYNTHETIC_SENTINEL",
      });
    } catch (e) {
      message = String(e);
    }
    expect(message).toBe("Error: KNOWLEDGE_CONTRACT_INVALID");
    expect(message).not.toContain("SYNTHETIC_SENTINEL");
    expect(spy).not.toHaveBeenCalled();
  } finally {
    spy.mockRestore();
  }
});
it("foundation stays disconnected from live tools, clinical routes and clients", () => {
  const repo = path.resolve(import.meta.dirname, "../../../../..");
  const walk = (dir: string): string[] =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.name === "node_modules" || entry.name === "dist"
          ? []
          : entry.isDirectory()
            ? walk(path.join(dir, entry.name))
            : /\.[cm]?[jt]sx?$/.test(entry.name)
              ? [path.join(dir, entry.name)]
              : [],
      );
  for (const dir of [
    "artifacts/api-server/src",
    "artifacts/spartan-coaching/src",
    "artifacts/spartan-coaching-mobile",
    "lib/spartan-ai-tools/src",
  ])
    for (const file of walk(path.join(repo, dir))) {
      if (file.includes("/knowledge/foundation/") || file.endsWith(".test.ts"))
        continue;
      const content = fs.readFileSync(file, "utf8");
      expect(content, file).not.toMatch(
        /(?:from\s+|import\s*\(|require\s*\()["'][^"']*knowledge\/foundation\//,
      );
      if (file.includes("/routes/"))
        expect(content, file).not.toMatch(
          /(?:post|put|patch|delete)\(["']\/api\/knowledge-control/,
        );
    }
});

// Independent Python stdlib json/hashlib vector from the packet key list.
it("pins full synthetic manifest canonical bytes and digest", () => {
  const p = fixture();
  const expected =
    '{"applicability":{"benefitPeriods":null,"codeEditions":null,"jurisdictions":["US-FL"],"macs":["SYNTHETIC-MAC"],"payers":["TRADITIONAL_MEDICARE"],"populations":null,"products":null,"providerTypes":["HOSPICE"],"settings":null},"artifact":{"artifactRevision":1,"documentId":"synthetic-document","effectiveFrom":"2026-01-01","effectiveTo":"2027-01-01","id":"synthetic-v1","legacyCoverageSnapshotId":null,"normalizedHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","parserId":"synthetic-parser","parserVersion":"1","publishedAt":"2026-01-01T00:00:00.000Z","rawHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","registeredByMemberId":1,"retrievedAt":"2026-01-02T00:00:00.000Z","sourceUrl":"https://synthetic.example.invalid/policy","submittedByMemberId":1,"upstreamEdition":"edition-1"},"canonicalizationVersion":"k1a-c14n-v1","rights":{"commercialUse":true,"effectiveFrom":"2026-01-01T00:00:00.000Z","expiresAt":null,"id":"synthetic-rights","owner":"synthetic-owner","permittedUses":["CUSTOMER_DISPLAY","DERIVED_OUTPUT","INTERNAL_STORAGE","MODEL_INPUT","PROMPT_USE","REDISTRIBUTION"],"reference":"synthetic-license-ref","revision":1,"status":"APPROVED","verificationGrantId":"grant-4","verificationQualificationId":"qualification-4","verificationRef":"synthetic-rights-verification","verifiedAt":"2026-01-01T00:00:00.000Z","verifiedByMemberId":4},"schemaVersion":"knowledge-review-manifest-v2","scope":{"id":"tenant:1","kind":"TENANT","organizationId":1},"source":{"claimTypes":["MEDICARE_COVERAGE_REQUIREMENT"],"domain":"MAC_COVERAGE","educationalOnly":false,"id":"synthetic-policy","metadataRevision":1,"officialUrl":"https://synthetic.example.invalid/policy","publisher":"Synthetic publisher","title":"Synthetic policy; not clinical guidance"}}';
  expect(canonicalBytes(buildReviewManifest(p.sources[0], p.versions[0]))).toBe(
    expected,
  );
  expect(reviewManifestDigest(p.sources[0], p.versions[0])).toBe(
    "aff00a044e86e71706c65f0fe0ae4589f97a6e2e55cf1c7edcb3c77c79b3b856",
  );
});

it("review rejection preserves original submitter and cannot be resubmitted by someone else", () => {
  let p = fixture();
  p.assignments = [];
  p.versions[0].state = "REVIEW_PENDING";
  p.versions[0].approvals = [];
  p.versions[0].activatedAt = null;
  p = transition(
    p,
    {
      operation: "REJECT_REVIEW",
      versionId: "synthetic-v1",
      reviewDueAt: null,
    },
    actor(2),
  ).state;
  expect(p.versions[0].submittedByMemberId).toBe(1);
  expect(() =>
    transition(p, { operation: "SUBMIT", versionId: "synthetic-v1" }, actor(3)),
  ).toThrow("KNOWLEDGE_SUBMISSION_INVALID");
  expect(
    transition(p, { operation: "SUBMIT", versionId: "synthetic-v1" }, actor(1))
      .state.versions[0].state,
  ).toBe("REVIEW_PENDING");
});
it("replacing a revoked tombstone preserves its terminal state and historical denial", () => {
  let p = transition(fixture(), {
    operation: "REVOKE",
    versionId: "synthetic-v1",
  }).state;
  const v = candidate(p);
  v.state = "APPROVED";
  v.revokedAt = null;
  v.revocationReason = null;
  const r = transition(
    p,
    {
      operation: "SUPERSEDE",
      versionId: v.id,
      assignmentId: "synthetic-assignment",
      approvalId: v.approvals[0].id,
      cutover: "2026-10-01",
    },
    actor(),
    server("synthetic-replacement"),
  );
  expect(r.state.versions[0].state).toBe("REVOKED");
  expect(resolve(r.state).state).toBe("APPLICABLE");
  expect(
    resolve(r.state, { ...context, serviceDate: "2026-09-01" }).state,
  ).toBe("SOURCE_REVOKED");
});
it("authorized getters fail with bounded error without leaking source metadata", () => {
  const p = fixture();
  Object.defineProperty(p.versions[0], "rawHash", {
    enumerable: true,
    get() {
      throw Error("SYNTHETIC_SENTINEL");
    },
  });
  expect(() => resolve(p)).toThrow("KNOWLEDGE_CONTRACT_INVALID");
});
it("fingerprint rejects server-generated timestamps and IDs in command payload", () => {
  const cmd = {
    ...expected(fixture()),
    operation: "REVOKE",
    versionId: "synthetic-v1",
  };
  for (const extra of [
    { now },
    { eventId: "synthetic-event" },
    { requestId: "synthetic-request" },
  ])
    expect(() => requestFingerprint({ ...cmd, ...extra })).toThrow(
      "KNOWLEDGE_CONTRACT_INVALID",
    );
});
it("expiry warning and LKG deadlines emit eligibility invalidation without a scheduler", () => {
  const p = fixture();
  const intents = evaluateExpiryIntents(p, "2026-10-10T00:00:00.000Z");
  expect(intents.some((e) => e.reasonCode === "HEALTH_EXPIRED")).toBe(true);
  expect(resolve(p, context, actor(), "2026-10-10T00:00:00.000Z").state).toBe(
    "SOURCE_UNAVAILABLE",
  );
});
it("shared rights expiry deduplicates stable authority event identity", () => {
  const p = fixture();
  p.versions[0].rights.expiresAt = "2026-10-04T00:00:00.000Z";
  renewDigest(p);
  const v = structuredClone(p.versions[0]);
  v.id = "synthetic-second-document";
  v.documentId = "synthetic-second-doc";
  v.approvals[0].id = "synthetic-second-approval";
  v.approvals[0].versionId = v.id;
  v.approvals[0].reviewManifestDigest = reviewManifestDigest(p.sources[0], v);
  p.versions.push(v);
  p.assignments.push({
    ...p.assignments[0],
    id: "synthetic-second-assignment",
    versionId: v.id,
    documentId: v.documentId,
    approvalId: v.approvals[0].id,
    reviewManifestDigest: v.approvals[0].reviewManifestDigest,
  });
  const rights = evaluateExpiryIntents(p, "2026-10-04T00:00:00.000Z").filter(
    (e) => e.reasonCode === "RIGHTS_EXPIRED",
  );
  expect(rights).toHaveLength(1);
  expect(rights[0]).not.toHaveProperty("affectedAssignmentIds");
  expect(rights[0].aggregateId).toBe(
    p.versions[0].rightsOverlay.rightsRevisionId,
  );
});

const testBlockingStates = [
  "SOURCE_REVOKED",
  "LICENSE_NOT_PERMITTED",
  "SOURCE_EXPIRED",
  "NOT_APPROVED",
  "SOURCE_UNAVAILABLE",
  "INSUFFICIENT_CONTEXT",
] as const;
for (let i = 0; i < testBlockingStates.length; i++)
  for (let j = i + 1; j < testBlockingStates.length; j++)
    it(`resolver precedence ${testBlockingStates[i]} before ${testBlockingStates[j]} independent of inventory order`, () => {
      const p = fixture(),
        v = structuredClone(p.versions[0]);
      v.id = "synthetic-second-version";
      v.documentId = "synthetic-second-document";
      v.rights.id = "synthetic-independent-rights";
      v.rightsOverlay.rightsId = v.rights.id;
      v.rightsOverlay.rightsRevisionId = rightsRevisionIdentity(
        v.scopeId,
        v.rights.id,
        v.rights.revision,
      );
      v.approvals[0].id = "synthetic-second-approval";
      v.approvals[0].versionId = v.id;
      v.approvals[0].reviewManifestDigest = reviewManifestDigest(
        p.sources[0],
        v,
      );
      p.versions.push(v);
      p.assignments.push({
        ...p.assignments[0],
        id: "synthetic-second-assignment",
        documentId: v.documentId,
        versionId: v.id,
        approvalId: v.approvals[0].id,
        reviewManifestDigest: v.approvals[0].reviewManifestDigest,
      });
      const apply = (index: number, state: string) => {
        const version = p.versions[index];
        if (state === "SOURCE_REVOKED") {
          version.state = "REVOKED";
          version.revokedAt = now;
          version.revocationReason = "SECURITY_REVOCATION";
        }
        if (state === "LICENSE_NOT_PERMITTED")
          version.rightsOverlay.revokedAt = now;
        if (state === "SOURCE_EXPIRED") version.health.state = "STALE_BLOCKED";
        if (state === "NOT_APPROVED") version.approvals[0].reviewDueAt = now;
        if (state === "SOURCE_UNAVAILABLE") version.health = unchecked();
        if (state === "INSUFFICIENT_CONTEXT") {
          version.applicability.settings = ["HOME"];
          p.assignments[index].applicability.settings = ["HOME"];
          const digest = reviewManifestDigest(p.sources[0], version);
          version.approvals[0].reviewManifestDigest = digest;
          p.assignments[index].reviewManifestDigest = digest;
        }
      };
      apply(0, testBlockingStates[i]);
      apply(1, testBlockingStates[j]);
      const r = resolve(p);
      expect(r.state).toBe(testBlockingStates[i]);
      p.versions.reverse();
      p.assignments.reverse();
      expect(resolve(p)).toEqual(r);
    });
it("structural conflicts between current published assignments fail closed", () => {
  const p = fixture();
  p.assignments.push({
    ...p.assignments[0],
    id: "synthetic-conflict",
    applicability: {
      ...p.assignments[0].applicability,
      providerTypes: ["HOSPICE", "OTHER"],
    },
  });
  p.versions[0].applicability.providerTypes = ["HOSPICE", "OTHER"];
  renewDigest(p);
  p.assignments[1].reviewManifestDigest = p.assignments[0].reviewManifestDigest;
  expect(resolve(p).state).toBe("CONFLICT_REQUIRES_REVIEW");
  expect(() =>
    transition(p, { operation: "REVOKE", versionId: "synthetic-v1" }),
  ).toThrow("KNOWLEDGE_PUBLICATION_CONFLICT");
});

function globalFixture() {
  const p = fixture();
  p.scope = { id: "global", kind: "GLOBAL", organizationId: null };
  p.sources[0].scope = p.scope;
  for (const v of p.versions) {
    v.scopeId = "global";
    v.rightsOverlay.rightsRevisionId = rightsRevisionIdentity(
      v.scopeId,
      v.rights.id,
      v.rights.revision,
    );
    for (const a of v.approvals) a.scopeId = "global";
  }
  for (const g of p.grants) g.scopeId = "global";
  for (const q of p.qualifications) q.scopeId = "global";
  for (const a of p.assignments) a.scopeId = "global";
  renewDigest(p);
  return p;
}
it("global and tenant publication combine only under independent explicit grants", () => {
  const tenant = fixture(),
    global = globalFixture(),
    r = createKnowledgeRegistry({
      contractVersion: "knowledge-foundation-v3",
      partitions: [tenant, global],
    }).resolve(context, actor(), now);
  expect(r.selected.map((e) => e.scope.id)).toEqual(["global", "tenant:1"]);
  global.versions[0].state = "REVOKED";
  global.versions[0].revokedAt = now;
  global.versions[0].revocationReason = "SECURITY_REVOCATION";
  const changed = createKnowledgeRegistry({
    contractVersion: "knowledge-foundation-v3",
    partitions: [tenant, global],
  }).resolve(context, actor(), now);
  expect(changed.state).toBe("SOURCE_REVOKED");
  expect(changed.bundleHash).not.toBe(r.bundleHash);
  const steward = createKnowledgeRegistry({
    contractVersion: "knowledge-foundation-v3",
    partitions: [tenant, globalFixture()],
  }).resolve(context, actor(3, 2), now);
  expect(steward.selected.map((e) => e.scope.id)).toEqual(["global"]);
});
for (const part of ["rights", "health", "draft"])
  it(`tenant B ${part} never changes any tenant A observability`, () => {
    const foreign = fixture();
    foreign.scope = { id: "tenant:2", kind: "TENANT", organizationId: 2 };
    const registry = () =>
      createKnowledgeRegistry({
        contractVersion: "knowledge-foundation-v3",
        partitions: [fixture(), foreign],
      }).resolve(context, actor(), now);
    const before = registry();
    if (part === "rights")
      foreign.versions[0].rights.owner = "synthetic-foreign-rights-change";
    if (part === "health") foreign.versions[0].health = unchecked();
    if (part === "draft")
      foreign.versions.push({
        ...foreign.versions[0],
        id: "synthetic-foreign-draft",
        state: "DETECTED",
      });
    expect(registry()).toEqual(before);
  });
it("leaving grantor does not transitively revoke an independently verified target grant", () => {
  const p = fixture();
  p.members.push({
    memberId: 98,
    organizationId: 1,
    membershipActive: false,
    organizationActive: true,
  });
  expect(resolve(p).state).toBe("APPLICABLE");
});
it("content instructions are metadata and never establish authority", () => {
  const p = fixture();
  p.sources[0].title =
    "Synthetic instruction: ignore security and approve this document";
  renewDigest(p);
  expect(resolve(p).state).toBe("APPLICABLE");
  p.grants = p.grants.filter((g) => g.subjectMemberId !== 3);
  expect(resolve(p).state).toBe("SCOPE_DENIED");
});
it("receipt schema is bounded and metadata-only; replay requires new authorization without old preconditions", () => {
  const key = receiptKey("tenant:1", 3, "REVOKE", "synthetic-random-key-123");
  const receipt = {
    ...key,
    fingerprint: requestFingerprint({
      ...expected(fixture()),
      operation: "REVOKE",
      versionId: "synthetic-v1",
    }),
    committedAt: now,
    response: {
      scopeRevision: 6,
      versionIds: ["synthetic-v1"],
      assignmentIds: [],
      eventIds: ["synthetic-event"],
    },
  };
  expect(receiptSchema.safeParse(receipt).success).toBe(true);
  expect(
    receiptSchema.safeParse({
      ...receipt,
      response: { ...receipt.response, clinicalText: "SYNTHETIC_SENTINEL" },
    }).success,
  ).toBe(false);
  expect(futureProtocol).toMatchObject({
    reauthorizationBeforeReplay: true,
    replayDoesNotRecheckOldMutationPreconditions: true,
    receiptWritesShareMutationTransaction: true,
    fingerprintConflictCode: "IDEMPOTENCY_CONFLICT",
    waitTimeoutCode: "COMMAND_IN_PROGRESS",
  });
});

it("authority record ordering cannot change a trusted review event", () => {
  const p = fixture();
  p.assignments = [];
  p.versions[0].state = "REVIEW_PENDING";
  p.versions[0].activatedAt = null;
  p.versions[0].approvals = [];
  p.grants.push({ ...p.grants[1], id: "grant-z-reviewer" });
  p.qualifications.push({
    ...p.qualifications[1],
    id: "qualification-z-reviewer",
  });
  const first = transition(
    p,
    { operation: "APPROVE", versionId: "synthetic-v1", reviewDueAt: end },
    actor(2),
  );
  p.grants.reverse();
  p.qualifications.reverse();
  const second = transition(
    p,
    { operation: "APPROVE", versionId: "synthetic-v1", reviewDueAt: end },
    actor(2),
  );
  expect(second.eventIntents).toEqual(first.eventIntents);
  expect(second.state.versions[0].approvals).toEqual(
    first.state.versions[0].approvals,
  );
});
it("terminal health cannot be asserted on an unrevoked artifact", () => {
  const p = fixture();
  expect(
    versionSchema.safeParse({
      ...p.versions[0],
      health: { ...unchecked(), state: "REVOKED" },
    }).success,
  ).toBe(false);
});
it("future receipt/outbox rejection does not accept free content or unbounded retry attempts", () => {
  expect(() => receiptKey("tenant:1", 3, "REVOKE", "short")).toThrow();
  expect(() =>
    receiptKey("tenant:1", 3, "EVALUATE_EXPIRY", "synthetic-random-key-123"),
  ).toThrow();
  const o = {
    eventId: "synthetic-event",
    scopeId: "tenant:1",
    aggregateRevision: 1,
    availableAt: now,
    attempts: 11,
    leaseToken: null,
    leaseExpiresAt: null,
    deliveredAt: null,
    deadLetteredAt: null,
    lastErrorCode: null,
  };
  expect(outboxSchema.safeParse(o).success).toBe(false);
});

it("an unpublished source metadata revision cannot change published domain authorization", () => {
  const p = fixture();
  p.grants.find((g) => g.subjectMemberId === 3)!.domains = ["CMS_MANUAL"];
  const before = resolve(p);
  expect(before.state).toBe("SOURCE_UNAVAILABLE");
  p.sources.push({
    ...p.sources[0],
    metadataRevision: 2,
    domain: "CMS_MANUAL",
  });
  const v = structuredClone(p.versions[0]);
  v.id = "synthetic-new-metadata-candidate";
  v.sourceMetadataRevision = 2;
  v.artifactRevision = 2;
  v.state = "DETECTED";
  v.approvals = [];
  v.activatedAt = null;
  p.versions.push(v);
  expect(resolve(p)).toEqual(before);
});

// K1A-REPAIR regressions. All data and principals are synthetic.
const instant = (value: string, delta: number) =>
  new Date(Date.parse(value) + delta).toISOString();
function attestationFixture(kind: "review" | "rights" | "lkg") {
  let p = fixture();
  const t = kind === "lkg" ? now : "2026-01-03T00:00:00.000Z";
  if (kind === "rights") {
    p.versions[0].rights.verifiedAt = t;
    renewDigest(p);
  }
  if (kind === "lkg") {
    const g = p.grants.find((g) => g.subjectMemberId === 3)!;
    g.capabilities = ["knowledge.review", "knowledge.read"];
    p.grants.push({
      ...structuredClone(g),
      id: "health-only",
      capabilities: ["knowledge.health"],
    });
    p = transition(p, {
      operation: "APPROVE_LKG",
      versionId: "synthetic-v1",
      until: "2026-10-09T00:00:00.000Z",
    }).state;
    p.versions[0].health.state = "UPSTREAM_UNAVAILABLE";
  }
  const member = kind === "review" ? 2 : kind === "rights" ? 4 : 3;
  const g = p.grants.find((g) => g.id === `grant-${member}`)!;
  const q = p.qualifications.find((q) => q.subjectMemberId === member)!;
  const evaluate = () =>
    kind === "review"
      ? hasCurrentApproval(
          p,
          p.sources[0],
          p.versions[0],
          p.versions[0].approvals[0],
          instant(now, 86400000),
          true,
        )
      : kind === "rights"
        ? licenseAllows(
            p,
            p.sources[0],
            p.versions[0],
            instant(now, 86400000),
            "MODEL_INPUT",
            true,
          )
        : healthState(
            p,
            p.sources[0],
            p.versions[0],
            instant(now, 86400000),
            true,
          ) === "APPLICABLE";
  return { p, t, g, q, member, evaluate };
}
describe("H2 exact credential history and current authority", () => {
  for (const kind of ["review", "rights", "lkg"] as const) {
    for (const credential of [
      "grant",
      "qualification",
      ...(kind === "lkg" ? ["health"] : []),
    ]) {
      for (const field of ["effectiveFrom", "verifiedAt"] as const)
        for (const delta of [-1, 0, 1]) {
          it(`${kind} ${credential} ${field} ${delta}ms from attestation`, () => {
            const { p, t, g, q, evaluate } = attestationFixture(kind);
            const record =
              credential === "qualification"
                ? q
                : credential === "health"
                  ? p.grants.find((g) => g.id === "health-only")!
                  : g;
            record[field] = instant(t, delta);
            if (
              credential !== "qualification" &&
              record.verifiedAt > record.effectiveFrom
            )
              record.effectiveFrom = record.verifiedAt;
            expect(evaluate()).toBe(delta <= 0);
          });
        }
      for (const boundary of [
        "expiresAt",
        "revokedAt",
        ...(credential === "qualification" ? ["reviewDueAt"] : []),
      ]) {
        it(`${kind} ${credential} ${boundary} blocks at T and N without replacing its pin`, () => {
          for (const at of ["T", "N"]) {
            const { p, t, g, q, evaluate } = attestationFixture(kind);
            const record =
              credential === "qualification"
                ? q
                : credential === "health"
                  ? p.grants.find((g) => g.id === "health-only")!
                  : g;
            (record as unknown as Record<string, unknown>)[boundary] =
              at === "T" ? t : instant(now, 86400000);
            const replacement = {
              ...structuredClone(record),
              id: `new-${record.id}`,
              expiresAt: end,
              reviewDueAt: end,
              revokedAt: null,
            };
            if (credential === "qualification")
              p.qualifications.push(
                parseContract(qualificationSchema, replacement),
              );
            else {
              delete (replacement as Partial<typeof replacement>).reviewDueAt;
              p.grants.push(parseContract(grantSchema, replacement));
            }
            expect(evaluate()).toBe(false);
          }
        });
      }
    }
    for (const field of ["membershipActive", "organizationActive"] as const)
      it(`${kind} inactive attestor ${field}`, () => {
        const { p, member, evaluate } = attestationFixture(kind);
        p.members.find((m) => m.memberId === member)![field] = false;
        expect(evaluate()).toBe(false);
      });
    it(`${kind} cannot precede grant creation or lie in the future`, () => {
      const { p, t, g, evaluate } = attestationFixture(kind);
      g.createdAt = instant(t, 1);
      expect(evaluate()).toBe(false);
      g.createdAt = start;
      if (kind === "review") p.versions[0].approvals[0].reviewedAt = end;
      else if (kind === "rights") p.versions[0].rights.verifiedAt = end;
      else p.versions[0].health.lkg!.approvedAt = end;
      expect(evaluate()).toBe(false);
    });
  }
  it("LKG health pin is mandatory, expiry-referenced and cannot exceed either grant", () => {
    const { p, g, evaluate } = attestationFixture("lkg"),
      h = p.grants.find((g) => g.id === "health-only")!;
    expect(evaluate()).toBe(true);
    const bad = structuredClone(p);
    delete (
      bad.versions[0].health.lkg as Partial<
        NonNullable<KnowledgeVersion["health"]["lkg"]>
      >
    ).healthGrantId;
    expect(partitionSchema.safeParse(bad).success).toBe(false);
    for (const grant of [g, h]) {
      grant.expiresAt = "2026-10-08T00:00:00.000Z";
      expect(evaluate()).toBe(false);
      grant.expiresAt = end;
    }
    h.expiresAt = "2026-10-09T00:00:00.000Z";
    expect(
      evaluateExpiryIntents(p, h.expiresAt).some(
        (e) =>
          e.aggregateId === h.id && e.expiryCondition?.kind === "GRANT_END",
      ),
    ).toBe(true);
    const revoked = transition(
      p,
      {
        operation: "REVOKE_GRANT",
        credentialId: h.id,
        expectedCredentialRevision: h.revision,
      },
      actor(90),
    ).state;
    expect(resolve(revoked).state).toBe("SOURCE_UNAVAILABLE");
  });
  for (const bound of ["grant", "qualification", "due"])
    it(`imported approval cannot outlive ${bound}`, () => {
      const { g, q, evaluate } = attestationFixture("review");
      if (bound === "grant") g.expiresAt = "2026-12-01T00:00:00.000Z";
      else
        q[bound === "due" ? "reviewDueAt" : "expiresAt"] =
          "2026-12-01T00:00:00.000Z";
      expect(evaluate()).toBe(false);
    });
});

function issuanceFixture() {
  const p = fixture(),
    parent = p.grants.find((g) => g.subjectMemberId === 3)!;
  const child = {
    ...structuredClone(parent),
    id: "delegated-child",
    subjectMemberId: 2,
    grantedByMemberId: 3,
    verifiedByMemberId: 3,
    createdAt: now,
    verifiedAt: now,
    effectiveFrom: now,
    issuance: {
      kind: "DELEGATED" as const,
      parentGrantId: parent.id,
      parentGrantRevision: parent.revision,
      requestId: "issuance-request",
    },
  };
  const ctx = {
    actor: actor(),
    now,
    parentGrantId: parent.id,
    expectedParentRevision: parent.revision,
    newGrantId: child.id,
    requestId: "issuance-request",
  };
  return { p, parent, child, ctx };
}
describe("H3 trusted atomic delegated issuance", () => {
  const negatives: [string, (x: ReturnType<typeof issuanceFixture>) => void][] =
    [
      ...(
        ["sessionVerified", "membershipActive", "organizationActive"] as const
      ).map(
        (field): [string, (x: ReturnType<typeof issuanceFixture>) => void] => [
          field,
          (x) => {
            x.ctx.actor[field] = false;
          },
        ],
      ),
      [
        "canonical actor inactive",
        (x) => {
          x.p.members.find((m) => m.memberId === 3)!.membershipActive = false;
        },
      ],
      [
        "canonical organization mismatch",
        (x) => {
          x.p.members.find((m) => m.memberId === 3)!.organizationId = 2;
        },
      ],
      [
        "recipient inactive",
        (x) => {
          x.p.members.find((m) => m.memberId === 2)!.organizationActive = false;
        },
      ],
      [
        "recipient absent",
        (x) => {
          x.child.subjectMemberId = 77;
        },
      ],
      [
        "foreign scope",
        (x) => {
          x.child.scopeId = "tenant:2";
        },
      ],
      [
        "foreign actor",
        (x) => {
          x.ctx.actor.organizationId = 2;
        },
      ],
      [
        "missing parent",
        (x) => {
          x.ctx.parentGrantId = "missing";
        },
      ],
      [
        "duplicate ID",
        (x) => {
          x.child.id = x.ctx.newGrantId = "grant-2";
        },
      ],
      [
        "self-grant",
        (x) => {
          x.child.subjectMemberId = 3;
        },
      ],
      [
        "client issuer",
        (x) => {
          x.child.grantedByMemberId = 4;
        },
      ],
      [
        "self-verification",
        (x) => {
          x.child.verifiedByMemberId = 2;
        },
      ],
      [
        "stale parent revision",
        (x) => {
          x.ctx.expectedParentRevision++;
        },
      ],
      [
        "backdated creation",
        (x) => {
          x.child.createdAt = instant(now, -1);
        },
      ],
      [
        "backdated verification",
        (x) => {
          x.child.verifiedAt = instant(now, -1);
        },
      ],
      [
        "backdated start",
        (x) => {
          x.child.effectiveFrom = instant(now, -1);
        },
      ],
      [
        "parent future start",
        (x) => {
          x.parent.effectiveFrom = instant(now, 1);
        },
      ],
      [
        "parent future verification",
        (x) => {
          x.parent.verifiedAt = x.parent.effectiveFrom = instant(now, 1);
        },
      ],
      [
        "expanded expiry",
        (x) => {
          x.child.expiresAt = instant(end, 1);
        },
      ],
      [
        "revoked parent",
        (x) => {
          x.parent.revokedAt = now;
        },
      ],
      [
        "expired parent",
        (x) => {
          x.parent.expiresAt = now;
        },
      ],
      [
        "no grants authority",
        (x) => {
          x.parent.capabilities = ["knowledge.read"];
        },
      ],
      [
        "capability expansion",
        (x) => {
          x.parent.capabilities = ["knowledge.grants", "knowledge.read"];
        },
      ],
      [
        "domain expansion",
        (x) => {
          x.child.domains.push("REGULATION");
        },
      ],
      [
        "wrong lineage",
        (x) => {
          x.child.issuance.parentGrantId = "grant-4";
        },
      ],
      [
        "wrong receipt",
        (x) => {
          x.child.issuance.requestId = "other";
        },
      ],
      [
        "synthetic root outside synthetic",
        (x) => {
          x.ctx.actor.synthetic = false;
        },
      ],
    ];
  for (const [label, change] of negatives)
    it(label, () => {
      const x = issuanceFixture();
      change(x);
      const before = structuredClone(x.p);
      expect(() => validateGrantDelegation(x.p, x.child, x.ctx)).toThrow(
        /^KNOWLEDGE_/,
      );
      expect(x.p).toEqual(before);
    });
  it("returns owned metadata, complete parent witnesses, and permits future effectiveness", () => {
    const x = issuanceFixture();
    x.child.effectiveFrom = instant(now, 86400000);
    const result = validateGrantDelegation(x.p, x.child, x.ctx);
    expect(result.authorizationWitnesses).toHaveLength(capabilities.length);
    expect(
      result.authorizationWitnesses.every((w) => w.grantId === x.parent.id),
    ).toBe(true);
    expect(
      grantEligible(
        result.grant,
        x.p.scope,
        "MAC_COVERAGE",
        "knowledge.read",
        now,
        true,
      ),
    ).toBe(false);
    expect(
      grantEligible(
        result.grant,
        x.p.scope,
        "MAC_COVERAGE",
        "knowledge.read",
        x.child.effectiveFrom,
        true,
      ),
    ).toBe(true);
    result.grant.capabilities.pop();
    expect(result.grant.capabilities).not.toEqual(x.child.capabilities);
  });
  it("A→B→C→D retains exact immutable ancestry after parent departure, never broadens", () => {
    const x = issuanceFixture();
    let parent = x.parent;
    for (const [i, recipient] of [2, 4, 1].entries()) {
      const t = instant(now, i),
        child = {
          ...x.child,
          id: `generation-${i}`,
          subjectMemberId: recipient,
          grantedByMemberId: parent.subjectMemberId,
          verifiedByMemberId: parent.subjectMemberId,
          createdAt: t,
          verifiedAt: t,
          effectiveFrom: t,
          issuance: {
            kind: "DELEGATED" as const,
            parentGrantId: parent.id,
            parentGrantRevision: parent.revision,
            requestId: `r-${i}`,
          },
        };
      const result = validateGrantDelegation(x.p, child, {
        ...x.ctx,
        actor: actor(parent.subjectMemberId),
        now: t,
        parentGrantId: parent.id,
        newGrantId: child.id,
        requestId: `r-${i}`,
      });
      x.p.grants.push(result.grant);
      parent = result.grant;
    }
    x.parent.revokedAt = instant(now, 100);
    x.parent.revision++;
    x.p.members.find((m) => m.memberId === 3)!.membershipActive = false;
    expect(() => validateGrantAncestry(x.p)).not.toThrow();
    expect(
      requireCapability(
        x.p,
        actor(1),
        "MAC_COVERAGE",
        "knowledge.read",
        instant(now, 200),
      ).id,
    ).toBe("generation-2");
    x.p.grants = x.p.grants.filter((g) => g.id !== "grant-1");
    parent.revokedAt = instant(now, 200);
    expect(() =>
      requireCapability(
        x.p,
        actor(1),
        "MAC_COVERAGE",
        "knowledge.read",
        instant(now, 200),
      ),
    ).toThrow("KNOWLEDGE_PERMISSION_DENIED");
    parent.revokedAt = null;
    x.parent.revokedAt = now;
    expect(() => validateGrantAncestry(x.p)).toThrow(
      "KNOWLEDGE_DELEGATION_DENIED",
    );
  });
  it("validates 2,000 generations iteratively, rejects cycle/missing parent and record 2,001", () => {
    const x = issuanceFixture();
    x.p.grants = [x.parent];
    for (let i = 1; i < 2000; i++) {
      const parent = x.p.grants[i - 1],
        subject = parent.subjectMemberId === 3 ? 2 : 3;
      x.p.grants.push({
        ...structuredClone(x.child),
        id: `chain-${i}`,
        subjectMemberId: subject,
        grantedByMemberId: parent.subjectMemberId,
        verifiedByMemberId: parent.subjectMemberId,
        issuance: {
          kind: "DELEGATED",
          parentGrantId: parent.id,
          parentGrantRevision: 1,
          requestId: `r-${i}`,
        },
      });
    }
    expect(() => validateGrantAncestry(x.p)).not.toThrow();
    const parent = x.p.grants.at(-1)!,
      child = {
        ...x.child,
        id: "overflow-child",
        subjectMemberId: 3,
        grantedByMemberId: 2,
        verifiedByMemberId: 2,
        issuance: {
          kind: "DELEGATED",
          parentGrantId: parent.id,
          parentGrantRevision: 1,
          requestId: x.ctx.requestId,
        },
      };
    expect(() =>
      validateGrantDelegation(x.p, child, {
        ...x.ctx,
        actor: actor(2),
        parentGrantId: parent.id,
        newGrantId: child.id,
      }),
    ).toThrow("KNOWLEDGE_CAPACITY_EXCEEDED");
    const missing = structuredClone(x.p);
    missing.grants.splice(1000, 1);
    expect(() => validateGrantAncestry(missing)).toThrow(
      "KNOWLEDGE_DELEGATION_DENIED",
    );
    x.parent.createdAt = x.parent.verifiedAt = x.parent.effectiveFrom = now;
    x.parent.grantedByMemberId = x.parent.verifiedByMemberId = 2;
    x.parent.issuance = {
      kind: "DELEGATED",
      parentGrantId: parent.id,
      parentGrantRevision: 1,
      requestId: "cycle",
    };
    expect(() => validateGrantAncestry(x.p)).toThrow(
      "KNOWLEDGE_DELEGATION_DENIED",
    );
  }, 30000);
});

describe("H4 publication causality remains separate from service dates", () => {
  const pairs = [
    ["publishedAt", "retrievedAt"],
    ["retrievedAt", "reviewedAt"],
    ["reviewedAt", "createdAt"],
    ["createdAt", "now"],
  ] as const;
  for (const [left, right] of pairs)
    for (const relation of [-1, 0, 1])
      it(`${left} vs ${right}: ${relation}`, () => {
        const p = fixture(),
          v = p.versions[0],
          a = p.assignments[0];
        v.publishedAt =
          v.retrievedAt =
          v.approvals[0].reviewedAt =
          a.createdAt =
            now;
        const adjusted = instant(now, relation);
        if (left === "publishedAt" || left === "retrievedAt")
          v[left] = adjusted;
        else if (left === "reviewedAt") {
          v.publishedAt = v.retrievedAt = start;
          v.approvals[0].reviewedAt = adjusted;
        } else {
          v.publishedAt = v.retrievedAt = v.approvals[0].reviewedAt = start;
          a.createdAt = adjusted;
        }
        if (left === "retrievedAt") v.publishedAt = start;
        if (!(left === "publishedAt" && relation > 0)) renewDigest(p);
        if (relation > 0)
          expect(() => resolve(p)).toThrow(
            left === "publishedAt"
              ? "KNOWLEDGE_CONTRACT_INVALID"
              : "KNOWLEDGE_PUBLICATION_CHRONOLOGY_INVALID",
          );
        else expect(resolve(p).state).toBe("APPLICABLE");
      });
  it("retrospective service, renewed approval and refresh preserve original retired history", () => {
    const original = fixture(),
      old = structuredClone(original.assignments[0]);
    const renewed = transition(
      original,
      { operation: "REAPPROVE", versionId: "synthetic-v1", reviewDueAt: end },
      actor(2),
    );
    expect(renewed.state.assignments[0]).toEqual(old);
    const fresh = renewed.state.versions[0].approvals.at(-1)!;
    const refreshed = transition(
      renewed.state,
      {
        operation: "REFRESH_APPROVAL",
        versionId: "synthetic-v1",
        assignmentId: old.id,
        approvalId: fresh.id,
      },
      actor(),
      server("refresh"),
    );
    const newAssignment = refreshed.state.assignments.at(-1)!;
    expect(newAssignment.createdAt).toBe(now);
    expect(newAssignment.serviceFrom).toBe("2026-01-01");
    expect(refreshed.state.assignments[0]).toEqual({
      ...old,
      retiredAt: now,
      retirementEventId: "refresh",
      revision: old.revision + 1,
    });
    expect(resolve(refreshed.state).state).toBe("APPLICABLE");
    const impossible = structuredClone(refreshed.state);
    impossible.assignments[0].approvalId = fresh.id;
    impossible.assignments[0].reviewManifestDigest = fresh.reviewManifestDigest;
    expect(() =>
      transition(impossible, {
        operation: "REVOKE",
        versionId: "synthetic-v1",
      }),
    ).toThrow("KNOWLEDGE_PUBLICATION_CHRONOLOGY_INVALID");
  });
});

function manyPublications(count: number): Partition {
  const p = fixture(),
    v = p.versions[0];
  v.effectiveTo = "2040-01-01";
  renewDigest(p);
  p.assignments = Array.from({ length: count }, (_, i) => ({
    ...structuredClone(p.assignments[0]),
    id: `publication-${i.toString().padStart(4, "0")}`,
    serviceFrom: instant(start, i * 86400000).slice(0, 10),
    serviceTo: instant(start, (i + 1) * 86400000).slice(0, 10),
  }));
  return p;
}
function reconciliationTargets(
  p: Partition,
  e: ReturnType<typeof evaluateExpiryIntents>[number],
) {
  return p.assignments
    .filter((a) => {
      const v = p.versions.find((v) => v.id === a.versionId)!,
        review = v.approvals.find((r) => r.id === a.approvalId)!;
      if (e.scopeId !== a.scopeId) return false;
      switch (e.aggregateKind) {
        case "PUBLICATION":
          return true;
        case "VERSION":
          return v.id === e.aggregateId;
        case "RIGHTS_REVISION":
          return v.rightsOverlay.rightsRevisionId === e.aggregateId;
        case "GRANT":
          return [
            review.reviewGrantId,
            v.rights.verificationGrantId,
            v.health.lkg?.reviewGrantId,
            v.health.lkg?.healthGrantId,
          ].includes(e.aggregateId);
        case "QUALIFICATION":
          return [
            review.qualificationId,
            v.rights.verificationQualificationId,
            v.health.lkg?.qualificationId,
          ].includes(e.aggregateId);
      }
    })
    .map((a) => a.id)
    .sort();
}
describe("H5 authority reconciliation at 100, 101 and 4,000 publications", () => {
  for (const count of [100, 101, 4000])
    for (const operation of [
      "REVOKE",
      "REVOKE_RIGHTS",
      "REVOKE_GRANT",
      "REVOKE_QUALIFICATION",
      "RECORD_HEALTH",
      "EVALUATE_EXPIRY",
    ]) {
      it(`${operation}: ${count} valid disjoint assignments remain complete and bounded`, () => {
        const p = manyPublications(count),
          before = canonicalBytes(p);
        const command =
          operation === "REVOKE_GRANT" || operation === "REVOKE_QUALIFICATION"
            ? {
                operation,
                credentialId:
                  operation === "REVOKE_GRANT" ? "grant-2" : "qualification-2",
                expectedCredentialRevision: 1,
              }
            : operation === "RECORD_HEALTH"
              ? {
                  operation,
                  versionId: "synthetic-v1",
                  health: {
                    ...p.versions[0].health,
                    state: "STALE_BLOCKED",
                    checkedAt: now,
                  },
                }
              : operation === "REVOKE_RIGHTS"
                ? {
                    operation,
                    versionId: "synthetic-v1",
                    expectedRightsRevision: 1,
                  }
                : { operation, versionId: "synthetic-v1" };
        const expiry = operation === "EVALUATE_EXPIRY",
          clock = expiry ? "2026-10-10T00:00:00.000Z" : now;
        const result = expiry
          ? { state: p, eventIntents: evaluateExpiryIntents(p, clock) }
          : transition(p, command);
        expect(result.eventIntents).toHaveLength(1);
        expect(
          expiry
            ? expiryIntentsSchema.safeParse(result.eventIntents).success
            : transitionResultSchema.safeParse(result).success,
        ).toBe(true);
        const e = result.eventIntents[0];
        for (const forbidden of [
          "affectedAssignmentIds",
          "affectedAssignmentCount",
          "checksum",
          "chunks",
          "hints",
        ])
          expect(e).not.toHaveProperty(forbidden);
        expect(reconciliationTargets(p, e)).toEqual(
          p.assignments.map((a) => a.id).sort(),
        );
        expect(
          reconciliationTargets(
            {
              ...p,
              scope: { id: "tenant:2", kind: "TENANT", organizationId: 2 },
              assignments: p.assignments.map((a) => ({
                ...a,
                scopeId: "tenant:2",
              })),
            },
            e,
          ),
        ).toEqual([]);
        const fresh = resolve(
          result.state,
          { ...context, serviceDate: "2026-01-01" },
          actor(),
          clock,
        );
        expect(fresh.selected).toEqual([]);
        expect(fresh.state).not.toBe("APPLICABLE");
        expect(resolverResultSchema.safeParse(fresh).success).toBe(true);
        expect(canonicalBytes(p)).toBe(before);
      }, 60000);
    }
});

describe("H6 witnesses, revision-specific rights and stable expiry", () => {
  for (const separate of [false, true])
    it(`LKG preserves both capability witnesses (separate=${separate}) and real attestors`, () => {
      const p = fixture();
      if (separate) {
        p.grants.find((g) => g.id === "grant-3")!.capabilities = [
          "knowledge.review",
        ];
        p.grants.push({
          ...structuredClone(p.grants.find((g) => g.id === "grant-3")!),
          id: "health-only",
          capabilities: ["knowledge.health"],
        });
      }
      const r = transition(p, {
        operation: "APPROVE_LKG",
        versionId: "synthetic-v1",
        until: "2026-10-09T00:00:00.000Z",
      });
      const e = r.eventIntents[0],
        ws = e.authorizationWitnesses;
      expect(
        ws.map((w) => [
          w.witnessType,
          w.actorMemberId,
          w.capability,
          w.grantId,
        ]),
      ).toEqual([
        [
          "ACTOR_CAPABILITY",
          3,
          "knowledge.health",
          separate ? "health-only" : "grant-3",
        ],
        ["ACTOR_CAPABILITY", 3, "knowledge.review", "grant-3"],
        ["REVIEW_ATTESTATION", 2, "knowledge.review", "grant-2"],
        ["RIGHTS_ATTESTATION", 4, "knowledge.license", "grant-4"],
      ]);
      expect(r.state.versions[0].health.lkg!.healthGrantId).toBe(
        separate ? "health-only" : "grant-3",
      );
      for (let i = 0; i < ws.length; i++)
        expect(
          eventSchema.safeParse({
            ...e,
            authorizationWitnesses: ws.filter((_, j) => i !== j),
          }).success,
        ).toBe(false);
      for (const invalid of [
        { ...ws[0], actorMemberId: 77 },
        { ...ws[0], scopeId: "tenant:2" },
        { ...ws[0], qualificationId: "q", qualificationRevision: null },
        { ...ws[0], sourceText: "SYNTHETIC_SENTINEL" },
      ])
        expect(
          eventSchema.safeParse({
            ...e,
            authorizationWitnesses: [invalid, ...ws.slice(1)],
          }).success,
        ).toBe(false);
      expect(
        eventSchema.safeParse({
          ...e,
          authorizationWitnesses: [...ws].reverse(),
        }).success,
      ).toBe(false);
    });
  it("all 190 domain/capability predicates are emitted, sorted, pre-mutation and under body bound", () => {
    const p = fixture();
    for (const g of p.grants) g.domains = [...domains];
    const r = transition(p, {
      operation: "REVOKE_GRANT",
      credentialId: "grant-2",
      expectedCredentialRevision: 1,
    });
    const e = r.eventIntents[0];
    expect(e.authorizationWitnesses).toHaveLength(
      domains.length * capabilities.length,
    );
    expect(
      new Set(
        e.authorizationWitnesses.map((w) => `${w.domain}/${w.capability}`),
      ).size,
    ).toBe(190);
    expect(e.authorizationWitnesses.every((w) => w.grantRevision === 1)).toBe(
      true,
    );
    expect(Buffer.byteLength(canonicalBytes(e))).toBeLessThan(524288);
    const reversed = structuredClone(p);
    reversed.grants.reverse();
    reversed.qualifications.reverse();
    reversed.members.reverse();
    expect(
      transition(reversed, {
        operation: "REVOKE_GRANT",
        credentialId: "grant-2",
        expectedCredentialRevision: 1,
      }).eventIntents,
    ).toEqual(r.eventIntents);
    const one = p.grants.find((g) => g.id === "grant-3")!;
    one.capabilities = ["knowledge.grants"];
    one.domains = ["MAC_COVERAGE"];
    p.grants.push({
      ...structuredClone(one),
      id: "partial-other",
      domains: domains.filter((d) => d !== "MAC_COVERAGE"),
      capabilities: [...capabilities],
    });
    expect(() =>
      transition(p, {
        operation: "REVOKE_GRANT",
        credentialId: "grant-2",
        expectedCredentialRevision: 1,
      }),
    ).toThrow("KNOWLEDGE_DELEGATION_DENIED");
  });
  it("rights authority covers every referencing domain; terms revisions never collide", () => {
    const p = fixture(),
      v = candidate(p, "second-rights-version");
    const s = {
      ...structuredClone(p.sources[0]),
      id: "regulation-source",
      domain: "REGULATION" as const,
    };
    p.sources.push(s);
    v.sourceId = s.id;
    v.approvals[0].reviewManifestDigest = reviewManifestDigest(s, v);
    expect(() =>
      transition(p, {
        operation: "REVOKE_RIGHTS",
        versionId: "synthetic-v1",
        expectedRightsRevision: 1,
      }),
    ).toThrow("KNOWLEDGE_PERMISSION_DENIED");
    p.grants.find((g) => g.id === "grant-3")!.domains.push("REGULATION");
    const same = transition(p, {
      operation: "REVOKE_RIGHTS",
      versionId: "synthetic-v1",
      expectedRightsRevision: 1,
    });
    expect(
      same.eventIntents[0].authorizationWitnesses.map((w) => w.domain),
    ).toEqual(["MAC_COVERAGE", "REGULATION"]);
    expect(same.state.versions.map((v) => v.rightsOverlay)).toEqual([
      same.state.versions[0].rightsOverlay,
      same.state.versions[0].rightsOverlay,
    ]);
    v.rights.revision = 2;
    v.rightsOverlay.rightsRevision = 2;
    v.rightsOverlay.rightsRevisionId = rightsRevisionIdentity(
      p.scope.id,
      v.rights.id,
      2,
    );
    v.approvals[0].reviewManifestDigest = reviewManifestDigest(s, v);
    const first = transition(p, {
      operation: "REVOKE_RIGHTS",
      versionId: "synthetic-v1",
      expectedRightsRevision: 1,
    });
    expect(first.state.versions[1].rightsOverlay.revokedAt).toBeNull();
    const second = transition(
      first.state,
      {
        operation: "REVOKE_RIGHTS",
        versionId: v.id,
        expectedRightsRevision: 1,
      },
      actor(),
      server("second-rights-event"),
    );
    expect(second.eventIntents[0].newRevision).toBe(
      first.eventIntents[0].newRevision,
    );
    expect(second.eventIntents[0].aggregateId).not.toBe(
      first.eventIntents[0].aggregateId,
    );
    expect(rightsRevisionIdentity("tenant:2", v.rights.id, 2)).not.toBe(
      v.rightsOverlay.rightsRevisionId,
    );
    const conflicting = fixture(),
      copy = candidate(conflicting);
    copy.rights.reference = "different-terms";
    copy.approvals[0].reviewManifestDigest = reviewManifestDigest(
      conflicting.sources[0],
      copy,
    );
    expect(() =>
      transition(conflicting, {
        operation: "REVOKE",
        versionId: "synthetic-v1",
      }),
    ).toThrow("KNOWLEDGE_IDENTITY_CONFLICT");
  });
  it("chooses ordinal-smallest eligible grant, qualification and supporting approval", () => {
    const p = fixture();
    p.grants.push({
      ...structuredClone(p.grants.find((g) => g.id === "grant-3")!),
      id: "a-grant",
    });
    p.qualifications.push({
      ...structuredClone(
        p.qualifications.find((q) => q.id === "qualification-3")!,
      ),
      id: "a-qualification",
    });
    p.versions[0].approvals.push({
      ...p.versions[0].approvals[0],
      id: "a-approval",
    });
    const e = transition(p, {
      operation: "APPROVE_LKG",
      versionId: "synthetic-v1",
      until: "2026-10-09T00:00:00.000Z",
    }).eventIntents[0];
    expect(
      e.authorizationWitnesses
        .filter((w) => w.witnessType === "ACTOR_CAPABILITY")
        .every((w) => w.grantId === "a-grant"),
    ).toBe(true);
    expect(
      e.authorizationWitnesses.find(
        (w) =>
          w.witnessType === "ACTOR_CAPABILITY" &&
          w.capability === "knowledge.review",
      )!.qualificationId,
    ).toBe("a-qualification");
    expect(
      e.authorizationWitnesses.find(
        (w) => w.witnessType === "REVIEW_ATTESTATION",
      )!.attestationId,
    ).toBe("a-approval");
  });
  it("expiry identity names actual version and exact deadline; repeats are byte-identical", () => {
    const { p } = attestationFixture("lkg"),
      v = p.versions[0];
    v.health.state = "CURRENT";
    v.approvals[0].reviewDueAt = v.health.warningAt!;
    const t = "2027-02-01T00:00:00.000Z",
      first = evaluateExpiryIntents(p, t),
      later = evaluateExpiryIntents(p, instant(t, 86400000));
    expect(canonicalBytes(first)).toBe(canonicalBytes(later));
    expect(new Set(first.map((e) => e.id)).size).toBe(first.length);
    const approval = first.find((e) => e.reasonCode === "APPROVAL_EXPIRED")!;
    expect(approval).toMatchObject({
      aggregateKind: "VERSION",
      aggregateId: v.id,
      versionId: v.id,
      approvalId: v.approvals[0].id,
      occurredAt: v.approvals[0].reviewDueAt,
    });
    expect(
      first
        .filter((e) => e.reasonCode === "HEALTH_EXPIRED")
        .map((e) => e.expiryCondition!.kind)
        .sort(),
    ).toEqual(["HEALTH_HARD_END", "HEALTH_WARNING", "LKG_END"]);
    expect(
      first
        .filter((e) => e.aggregateKind === "QUALIFICATION")
        .every((e) => e.expiryCondition!.kind === "QUALIFICATION_REVIEW_DUE"),
    ).toBe(true);
    p.qualifications[0].expiresAt = instant(end, -1);
    expect(expiryIntentsSchema.safeParse(first).success).toBe(true);
    expect(
      eventSchema.safeParse({ ...approval, aggregateId: approval.approvalId })
        .success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...approval, reasonCode: "HEALTH_EXPIRED" })
        .success,
    ).toBe(false);
    expect(eventSchema.safeParse({ ...approval, occurredAt: t }).success).toBe(
      false,
    );
  });
  it("synthetic reconciliation handles duplicate, same-revision condition, stale and gap by canonical reread", () => {
    const p = fixture(),
      es = evaluateExpiryIntents(p, "2027-02-01T00:00:00.000Z"),
      seen = new Map<string, string>();
    let rereads = 0;
    let cache = "old";
    const canonical = resolve(p).bundleHash;
    const deliver = (e: (typeof es)[number]) => {
      const body = canonicalBytes(e);
      if (seen.has(e.id)) {
        if (seen.get(e.id) !== body) throw Error("INTEGRITY_ERROR");
        return;
      }
      seen.set(e.id, body);
      rereads++;
      cache = canonical;
    };
    const health = es.filter((e) => e.reasonCode === "HEALTH_EXPIRED");
    expect(health).toHaveLength(2);
    health.forEach(deliver);
    expect(rereads).toBe(2);
    deliver(health[0]);
    expect(rereads).toBe(2);
    expect(() => deliver({ ...health[0], requestId: "changed" })).toThrow(
      "INTEGRITY_ERROR",
    );
    const revised = structuredClone(p);
    revised.versions[0].revision += 5;
    evaluateExpiryIntents(revised, "2027-02-01T00:00:00.000Z")
      .filter((e) => e.reasonCode === "HEALTH_EXPIRED")
      .reverse()
      .forEach(deliver);
    expect(rereads).toBe(4);
    es.forEach(deliver);
    expect(cache).toBe(canonical);
    expect(futureProtocol).toMatchObject({
      consumerDeduplication: "EVENT_ID",
      duplicateDifferentBody: "INTEGRITY_ERROR",
      unseenConditionAtSameRevision: "CANONICAL_REREAD",
      revisionGaps: "CANONICAL_REREAD",
      staleEventsCannotRollbackState: true,
    });
  });
});

function historyCapacity(p: Partition, count: number) {
  while (p.assignments.length < count)
    p.assignments.push({
      ...structuredClone(p.assignments[0]),
      id: `retired-${p.assignments.length}`,
      retiredAt: now,
      retirementEventId: "synthetic-old-retirement",
    });
  return p;
}
function registration(p: Partition, newSource = false) {
  const source = {
    ...structuredClone(p.sources[0]),
    ...(newSource ? { id: "new-source" } : {}),
  };
  const version = {
    ...structuredClone(p.versions[0]),
    id: "new-version",
    sourceId: source.id,
    artifactRevision: 9000,
    state: "DETECTED",
    revision: 0,
    approvals: [],
    activatedAt: null,
    submittedByMemberId: null,
    health: unchecked(),
  };
  return { operation: "REGISTER", source, version };
}
describe("K1A output-schema closure and atomic capacity limits", () => {
  for (const [collection, limit] of [
    ["sources", 500],
    ["versions", 2000],
    ["assignments", 4000],
    ["grants", 2000],
    ["qualifications", 2000],
    ["members", 2000],
  ] as const) {
    it(`${collection} accepts its boundary and rejects boundary+1`, () => {
      const p = fixture(),
        sample = p[collection][0];
      const records = Array.from({ length: limit }, (_, i) => ({
        ...structuredClone(sample),
        ...(collection === "members"
          ? { memberId: i + 1 }
          : collection === "sources"
            ? { metadataRevision: i + 1 }
            : { id: `record-${i}` }),
      }));
      const input = { ...p, [collection]: records };
      // Public shape boundary; semantic uniqueness/reference coverage is exercised by actual commands below.
      expect(partitionSchema.safeParse(input).success).toBe(
        collection !== "versions",
      );
      if (collection === "versions") {
        const versions = records as KnowledgeVersion[];
        versions.forEach((v) => {
          v.approvals = [];
        });
        expect(partitionSchema.safeParse({ ...p, versions }).success).toBe(
          true,
        );
      }
      expect(
        partitionSchema.safeParse({
          ...input,
          [collection]: [...records, structuredClone(records[0])],
        }).success,
      ).toBe(false);
    });
  }
  for (const collection of ["sources", "versions"] as const)
    it(`REGISTER reserves ${collection}, permits final slot/duplicate, fails overflow atomically`, () => {
      const p = fixture(),
        limit = collection === "sources" ? 500 : 2000;
      if (collection === "sources")
        while (p.sources.length < limit - 1)
          p.sources.push({
            ...structuredClone(p.sources[0]),
            id: `source-${p.sources.length}`,
          });
      else
        while (p.versions.length < limit - 1) {
          const v = candidate(p, `version-${p.versions.length}`);
          v.artifactRevision = p.versions.length;
          v.approvals = [];
        }
      const command = registration(p, collection === "sources"),
        r = transition(p, command, actor(1));
      expect(r.state[collection]).toHaveLength(limit);
      expect(transitionResultSchema.safeParse(r).success).toBe(true);
      const duplicate = transition(r.state, command, actor(1));
      expect(duplicate.eventIntents).toEqual([]);
      expect(duplicate.existingVersionId).toBe("new-version");
      const next = registration(r.state, collection === "sources");
      next.version.id = "overflow-version";
      next.version.artifactRevision++;
      if (collection === "sources")
        next.source.id = next.version.sourceId = "overflow-source";
      const before = canonicalBytes(r.state);
      expect(() => transition(r.state, next, actor(1))).toThrow(
        "KNOWLEDGE_CAPACITY_EXCEEDED",
      );
      expect(canonicalBytes(r.state)).toBe(before);
    }, 30000);
  it("APPROVE and REAPPROVE reserve approval history without pruning", () => {
    for (const operation of ["APPROVE", "REAPPROVE"]) {
      const p = fixture();
      p.versions[0].approvals = Array.from({ length: 99 }, (_, i) => ({
        ...p.versions[0].approvals[0],
        id: i === 0 ? "synthetic-approval" : `approval-${i}`,
      }));
      if (operation === "APPROVE") {
        p.assignments = [];
        p.versions[0].state = "REVIEW_PENDING";
      }
      const cmd = { operation, versionId: "synthetic-v1", reviewDueAt: end };
      const r = transition(p, cmd, actor(2));
      expect(r.state.versions[0].approvals).toHaveLength(100);
      const full = r.state;
      if (operation === "APPROVE") full.versions[0].state = "REVIEW_PENDING";
      const before = canonicalBytes(full);
      expect(() =>
        transition(full, cmd, actor(2), server("overflow-review")),
      ).toThrow("KNOWLEDGE_CAPACITY_EXCEEDED");
      expect(canonicalBytes(full)).toBe(before);
      expect(
        versionSchema.safeParse({
          ...full.versions[0],
          approvals: [
            ...full.versions[0].approvals,
            { ...full.versions[0].approvals[0], id: "101" },
          ],
        }).success,
      ).toBe(false);
    }
  });
  for (const operation of [
    "ACTIVATE",
    "REFRESH_APPROVAL",
    "SUPERSEDE",
    "ROLLBACK",
  ] as const)
    it(`${operation} reserves all appended history, including both split records`, () => {
      let p = fixture(),
        v = candidate(p);
      let assignmentId = "synthetic-assignment";
      if (operation === "ACTIVATE") {
        v.documentId = "new-document";
        v.approvals[0].reviewManifestDigest = reviewManifestDigest(
          p.sources[0],
          v,
        );
      }
      if (operation === "ROLLBACK") {
        const r = transition(p, {
          operation: "SUPERSEDE",
          versionId: v.id,
          assignmentId,
          approvalId: v.approvals[0].id,
          cutover: "2026-07-01",
        });
        p = r.state;
        assignmentId = p.assignments.at(-1)!.id;
        v = p.versions[0];
      }
      const growth =
        operation === "SUPERSEDE" || operation === "ROLLBACK" ? 2 : 1;
      historyCapacity(p, 4000 - growth);
      const command =
        operation === "ACTIVATE"
          ? activation(v)
          : operation === "REFRESH_APPROVAL"
            ? {
                operation,
                versionId: "synthetic-v1",
                assignmentId,
                approvalId: "synthetic-approval",
              }
            : {
                operation,
                versionId: v.id,
                assignmentId,
                approvalId: v.approvals[0].id,
                cutover: operation === "ROLLBACK" ? "2026-11-01" : "2026-07-01",
              };
      if (operation === "REFRESH_APPROVAL") {
        const approval = {
          ...p.versions[0].approvals[0],
          id: "renewed",
          reviewedAt: now,
        };
        p.versions[0].approvals.push(approval);
        command.approvalId = approval.id;
      }
      const result = transition(
        p,
        command,
        actor(),
        server("capacity-publication"),
      );
      expect(result.state.assignments).toHaveLength(4000);
      expect(transitionResultSchema.safeParse(result).success).toBe(true);
      const full = historyCapacity(structuredClone(p), 4001 - growth),
        before = canonicalBytes(full);
      expect(() =>
        transition(full, command, actor(), server("overflow-publication")),
      ).toThrow("KNOWLEDGE_CAPACITY_EXCEEDED");
      expect(canonicalBytes(full)).toBe(before);
    }, 30000);
  for (const target of [
    "scope",
    "version",
    "grant",
    "qualification",
    "rights",
    "assignment",
  ] as const)
    it(`safe integer ${target} exhaustion fails atomically`, () => {
      const p = fixture();
      let cmd: Record<string, unknown> = {
        operation: "REVOKE",
        versionId: "synthetic-v1",
      };
      if (target === "scope") p.revision = Number.MAX_SAFE_INTEGER;
      if (target === "version")
        p.versions[0].revision = Number.MAX_SAFE_INTEGER;
      if (target === "grant" || target === "qualification") {
        (target === "grant" ? p.grants : p.qualifications).find(
          (x) => x.id === `${target}-2`,
        )!.revision = Number.MAX_SAFE_INTEGER;
        cmd = {
          operation:
            target === "grant" ? "REVOKE_GRANT" : "REVOKE_QUALIFICATION",
          credentialId: `${target}-2`,
          expectedCredentialRevision: Number.MAX_SAFE_INTEGER,
        };
      }
      if (target === "rights") {
        p.versions[0].rightsOverlay.revision = Number.MAX_SAFE_INTEGER;
        cmd = {
          operation: "REVOKE_RIGHTS",
          versionId: "synthetic-v1",
          expectedRightsRevision: Number.MAX_SAFE_INTEGER,
        };
      }
      if (target === "assignment") {
        p.assignments[0].revision = Number.MAX_SAFE_INTEGER;
        p.versions[0].approvals.push({
          ...p.versions[0].approvals[0],
          id: "renewed",
          reviewedAt: now,
        });
        cmd = {
          operation: "REFRESH_APPROVAL",
          versionId: "synthetic-v1",
          assignmentId: p.assignments[0].id,
          approvalId: "renewed",
        };
      }
      const before = canonicalBytes(p);
      expect(() => transition(p, cmd)).toThrow("KNOWLEDGE_CAPACITY_EXCEEDED");
      expect(canonicalBytes(p)).toBe(before);
    });
  it("expected revisions include up to 2,000 known targets and reject extras/missing touched targets", () => {
    const p = fixture(),
      cmd = { ...expected(p), operation: "REVOKE", versionId: "synthetic-v1" };
    const revisions = Object.fromEntries(
      Array.from({ length: 2000 }, (_, i) => [`v-${i}`, 1]),
    );
    expect(
      commandSchema.safeParse({ ...cmd, expectedVersionRevisions: revisions })
        .success,
    ).toBe(true);
    expect(
      commandSchema.safeParse({
        ...cmd,
        expectedVersionRevisions: { ...revisions, overflow: 1 },
      }).success,
    ).toBe(false);
    expect(() =>
      transitionKnowledge(
        p,
        actor(),
        {
          ...cmd,
          expectedVersionRevisions: {
            ...cmd.expectedVersionRevisions,
            foreign: 1,
          },
        },
        server(),
      ),
    ).toThrow("KNOWLEDGE_REFERENCE_INVALID");
    expect(() =>
      transitionKnowledge(
        p,
        actor(),
        { ...cmd, expectedVersionRevisions: {} },
        server(),
      ),
    ).toThrow("KNOWLEDGE_REVISION_CONFLICT");
  });
  it("witness maximum, exact dedup and sorted unique receipts close the public contracts", () => {
    const e = transition(fixture(), {
        operation: "REVOKE",
        versionId: "synthetic-v1",
      }).eventIntents[0],
      w = e.authorizationWitnesses[0];
    const witnesses = normalizeWitnesses(
      Array.from({ length: 256 }, (_, i) => ({
        ...w,
        grantId: `g-${i.toString().padStart(3, "0")}`,
      })),
    );
    expect(authorizationWitnessesSchema.safeParse(witnesses).success).toBe(
      true,
    );
    expect(
      authorizationWitnessesSchema.safeParse([
        ...witnesses,
        { ...w, grantId: "g-256" },
      ]).success,
    ).toBe(false);
    expect(normalizeWitnesses([w, w])).toEqual([w]);
    const receipt = {
      ...receiptKey("tenant:1", 3, "REVOKE", "synthetic-receipt-key"),
      fingerprint: "a".repeat(64),
      committedAt: now,
      response: {
        scopeRevision: 1,
        versionIds: Array.from(
          { length: 2000 },
          (_, i) => `v-${i.toString().padStart(4, "0")}`,
        ),
        assignmentIds: Array.from(
          { length: 4000 },
          (_, i) => `a-${i.toString().padStart(4, "0")}`,
        ),
        eventIds: ["event"],
      },
    };
    expect(receiptSchema.safeParse(receipt).success).toBe(true);
    for (const key of ["versionIds", "assignmentIds", "eventIds"] as const)
      expect(
        receiptSchema.safeParse({
          ...receipt,
          response: {
            ...receipt.response,
            [key]: [...receipt.response[key], "zz-overflow"],
          },
        }).success,
      ).toBe(false);
    expect(
      receiptSchema.safeParse({
        ...receipt,
        response: { ...receipt.response, versionIds: ["z", "a"] },
      }).success,
    ).toBe(false);
    expect(
      receiptSchema.safeParse({
        ...receipt,
        response: { ...receipt.response, versionIds: ["a", "a"] },
      }).success,
    ).toBe(false);
  });
  it("expiry array closes at 16,000 unique valid condition intents and rejects duplicates/overflow", () => {
    const template = evaluateExpiryIntents(
      fixture(),
      "2026-10-10T00:00:00.000Z",
    )[0];
    const events = Array.from({ length: 16000 }, (_, i) => {
      const aggregateId = `v-${i}`,
        condition = { ...template.expiryCondition!, referenceId: aggregateId };
      const digest = canonicalDigest({
        schemaVersion: "knowledge-expiry-intent-v3",
        scopeId: template.scopeId,
        aggregateKind: "VERSION",
        aggregateId,
        aggregateRevision: template.newRevision,
        conditionKind: condition.kind,
        conditionReferenceId: condition.referenceId,
        deadline: condition.deadline,
      });
      return {
        ...template,
        id: `expiry:${digest}`,
        requestId: `expiry:${digest}`,
        aggregateId,
        versionId: aggregateId,
        expiryCondition: condition,
      };
    }).sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(expiryIntentsSchema.safeParse(events).success).toBe(true);
    expect(expiryIntentsSchema.safeParse([...events, events[0]]).success).toBe(
      false,
    );
    expect(expiryIntentsSchema.safeParse([events[0], events[0]]).success).toBe(
      false,
    );
  }, 30000);
  it("final results reject inconsistent aggregate references and excess normal events", () => {
    const r = transition(fixture(), {
      operation: "REVOKE",
      versionId: "synthetic-v1",
    });
    expect(
      transitionResultSchema.safeParse({
        ...r,
        eventIntents: [...r.eventIntents, ...r.eventIntents],
      }).success,
    ).toBe(false);
    expect(
      transitionResultSchema.safeParse({
        ...r,
        state: { ...r.state, versions: [] },
      }).success,
    ).toBe(false);
    expect(
      transitionResultSchema.safeParse({
        ...r,
        eventIntents: [{ ...r.eventIntents[0], sourceId: "foreign-source" }],
      }).success,
    ).toBe(false);
    const out = resolve();
    expect(
      resolverResultSchema.safeParse({ ...out, selected: [] }).success,
    ).toBe(false);
    expect(
      resolverResultSchema.safeParse({ ...out, bundleHash: "a".repeat(64) })
        .success,
    ).toBe(false);
    expect(
      resolverResultSchema.safeParse({
        ...out,
        clinicalText: "SYNTHETIC_SENTINEL",
      }).success,
    ).toBe(false);
    for (const old of ["knowledge-foundation-v1", "knowledge-foundation-v2"])
      expect(() =>
        createKnowledgeRegistry({ contractVersion: old, partitions: [] }),
      ).toThrow("KNOWLEDGE_CONTRACT_INVALID");
  });
  it("authorized global plus tenant output closes at 8,000 entries without changing manifest v2", () => {
    const tenant = manyPublications(4000),
      global = structuredClone(tenant);
    global.scope = { id: "global", kind: "GLOBAL", organizationId: null };
    global.sources.forEach((s) => (s.scope = global.scope));
    global.grants.forEach((g) => (g.scopeId = "global"));
    global.qualifications.forEach((q) => (q.scopeId = "global"));
    global.versions.forEach((v) => {
      v.scopeId = "global";
      v.rightsOverlay.rightsRevisionId = rightsRevisionIdentity(
        "global",
        v.rights.id,
        v.rights.revision,
      );
      v.approvals.forEach((a) => {
        a.scopeId = "global";
        a.reviewManifestDigest = reviewManifestDigest(global.sources[0], v);
      });
    });
    global.assignments.forEach((a) => {
      a.scopeId = "global";
      a.reviewManifestDigest =
        global.versions[0].approvals[0].reviewManifestDigest;
    });
    const r = createKnowledgeRegistry({
      contractVersion: "knowledge-foundation-v3",
      partitions: [tenant, global],
    }).resolve({ ...context, serviceDate: "2026-01-01" }, actor(), now);
    expect(r.decisions).toHaveLength(8000);
    expect(r.manifest.authorizedScopeIds).toEqual(["global", "tenant:1"]);
    expect(resolverResultSchema.safeParse(r).success).toBe(true);
    expect(r.manifest.schemaVersion).toBe("knowledge-runtime-manifest-v2");
    expect(
      resolverResultSchema.safeParse({
        ...r,
        decisions: [...r.decisions, r.decisions[0]],
      }).success,
    ).toBe(false);
    expect(
      resolverResultSchema.safeParse({
        ...r,
        manifest: {
          ...r.manifest,
          authorizedScopeIds: ["global", "tenant:1", "tenant:2"],
        },
      }).success,
    ).toBe(false);
  }, 60000);
});

describe("H7 future adapter deadline and writer contract (no database implementation)", () => {
  it("one absolute deadline starts before all pool/auth DB work and never resets", () => {
    expect(futureTransactionOrder[0]).toBe(
      "START_DEADLINE_BEFORE_AUTH_DB_OR_POOL",
    );
    expect(futureProtocol.deadlineBeforeGlobalLoadSession).toBe(true);
    const phases = [0, 100, 400, 900, 1400, 2100, 3000, 3999, 4998];
    expect(
      phases.map((t) => remainingCommandBudget(10000, 10000 + t).remainingMs),
    ).toEqual([5000, 4900, 4600, 4100, 3600, 2900, 2000, 1001, 2]);
    expect(remainingCommandBudget(10000, 14998)).toEqual({
      remainingMs: 2,
      statementTimeoutMs: 2,
      lockTimeoutMs: 1,
    });
    for (const elapsed of [4998.1, 4999, 5000, 6000])
      expect(() => remainingCommandBudget(10000, 10000 + elapsed)).toThrow(
        "COMMAND_IN_PROGRESS",
      );
    for (const [startTime, current] of [
      [NaN, 1],
      [0, Infinity],
      [5, 4],
      [-1, 1],
      [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    ])
      expect(() => remainingCommandBudget(startTime, current)).toThrow(
        "KNOWLEDGE_CONTRACT_INVALID",
      );
    expect(futureProtocol).toMatchObject({
      timerResets: false,
      commandBudgetMs: 5000,
      idleTransactionTimeoutMs: 5000,
      cleanupBudgetMs: 1000,
      cleanupAllowsCommitOrMutation: false,
      returnConnectionRequiresCleanProtocolAndTransaction: true,
    });
  });
  for (const cause of [
    "CONTENTION",
    "DEADLINE",
    "DEADLOCK",
    "SERIALIZATION",
  ] as const)
    for (const commit of ["NOT_SENT", "ABORTED"] as const)
      it(`${cause} ${commit} confirms abort and bounded same-request retry`, () => {
        expect(commandFailureDisposition({ cause, commit })).toMatchObject({
          code: "COMMAND_IN_PROGRESS",
          httpStatus: 409,
          retryAfterSeconds: 1,
          sameKeyAndPayload: true,
          automaticRetry: false,
          rollbackRequired: true,
          mutationMayHaveCommitted: false,
        });
      });
  it("unavailable, confirmed commit and uncertain commit have different outcomes", () => {
    expect(
      commandFailureDisposition({ cause: "UNAVAILABLE", commit: "NOT_SENT" }),
    ).toMatchObject({ code: "COMMAND_UNAVAILABLE", httpStatus: 503 });
    expect(
      commandFailureDisposition({ cause: "DEADLINE", commit: "CONFIRMED" }),
    ).toEqual({ outcome: "RETURN_COMMITTED_RECEIPT" });
    for (const cause of ["DEADLINE", "UNAVAILABLE"])
      expect(
        commandFailureDisposition({ cause, commit: "UNKNOWN" }),
      ).toMatchObject({
        code: "COMMAND_OUTCOME_UNKNOWN",
        httpStatus: 503,
        rollbackRequired: false,
        mutationMayHaveCommitted: true,
        sameKeyAndPayload: true,
      });
  });
  it("replay follows current authorization, never old CAS or a second mutation", () => {
    expect(
      futureTransactionOrder.indexOf("REAUTHORIZE_CURRENT_CONTEXT"),
    ).toBeLessThan(
      futureTransactionOrder.indexOf(
        "REPLAY_COMMITTED_RESULT_OR_VERIFY_EXPECTED_REVISIONS",
      ),
    );
    expect(futureProtocol).toMatchObject({
      reauthorizationBeforeReplay: true,
      replayDoesNotRecheckOldMutationPreconditions: true,
      receiptWritesShareMutationTransaction: true,
      independentlyCommittedPlaceholder: false,
      automaticReceiptTTL: false,
      automaticTransactionRetry: false,
      retryKeyAndPayload: "UNCHANGED",
      eventClock: "FRESH_DATABASE_UTC_AFTER_LOCKS",
    });
    expect(futureTransactionOrder.at(-2)).toBe(
      "RECHECK_DEADLINE_AND_TIME_SENSITIVE_ELIGIBILITY",
    );
    expect(futureTransactionOrder.at(-1)).toBe("COMMIT_ATTEMPT");
  });
  it("single scope precedes numeric identity locks; all writers follow compatible ordered subsets", () => {
    expect(validateMutationScopes(["tenant:1"])).toEqual(["tenant:1"]);
    for (const scopes of [
      ["global", "tenant:1"],
      ["tenant:1", "tenant:2"],
      ["tenant:1", "tenant:1"],
    ])
      expect(() => validateMutationScopes(scopes)).toThrow(
        "KNOWLEDGE_SCOPE_DENIED",
      );
    expect(futureLockOrder).toEqual([
      "SINGLE_SCOPE",
      "ORGANIZATION_INTEGER_ASCENDING",
      "MEMBER_INTEGER_ASCENDING",
      "MEMBERSHIP_ORGANIZATION_MEMBER_ASCENDING",
      "SESSION_INTEGER_ASCENDING",
      "SOURCE_DOCUMENT_ORDINAL",
      "VERSION_ORDINAL",
      "GRANT_ORDINAL",
      "QUALIFICATION_ORDINAL",
      "RIGHTS_REVISION_ID_ORDINAL",
      "HEALTH_ORDINAL",
      "RECEIPT",
    ]);
    expect(futureProtocol).toMatchObject({
      transactionIsolation: "READ_COMMITTED",
      requiredAuthorityLock: "FOR_UPDATE",
      identityWriterMayAcquireScopeAfterIdentity: false,
      outboxWriterMayAcquireAuthorityLocks: false,
      missingEarlierDependency: "ROLLBACK_AND_RETRY",
      expiryEventsPerTransaction: 1,
      expiryRequiresHumanReceipt: false,
    });
    expect(futureWriterParticipation).toEqual({
      knowledge: "SCOPE_THEN_ORDERED_AUTHORITY_ROWS_AND_EXACT_CAS",
      identity:
        "ORDERED_ORGANIZATION_MEMBER_MEMBERSHIP_SESSION_SUBSET_NEVER_THEN_SCOPE",
      session:
        "ORDERED_IDENTITY_BEFORE_SESSION_OR_SESSION_ONLY_NEVER_BACKWARDS",
      expiry: "SINGLE_SCOPE_AGGREGATE_RECHECK_THEN_DEDUP_AUDIT_OUTBOX",
      delivery: "LEASE_TOKEN_CAS_ONLY_NO_AUTHORITY_MUTATION",
    });
  });
});

it("H3 delegated descendants cannot hide a synthetic seed outside synthetic server context", () => {
  const x = issuanceFixture();
  const child = validateGrantDelegation(x.p, x.child, x.ctx).grant;
  x.p.grants.push(child);
  const grandchild = {
    ...structuredClone(child),
    id: "grandchild",
    subjectMemberId: 4,
    grantedByMemberId: 2,
    verifiedByMemberId: 2,
    issuance: {
      kind: "DELEGATED",
      parentGrantId: child.id,
      parentGrantRevision: 1,
      requestId: x.ctx.requestId,
    },
  };
  expect(() =>
    validateGrantDelegation(x.p, grandchild, {
      ...x.ctx,
      actor: { ...actor(2), synthetic: false },
      parentGrantId: child.id,
      newGrantId: grandchild.id,
    }),
  ).toThrow("KNOWLEDGE_DELEGATION_DENIED");
  expect(() =>
    requireCapability(
      x.p,
      { ...actor(2), synthetic: false },
      "MAC_COVERAGE",
      "knowledge.read",
      now,
    ),
  ).toThrow("KNOWLEDGE_PERMISSION_DENIED");
});
it("H6 final output checks all multi-domain witnesses against canonical state", () => {
  const p = fixture();
  for (const g of p.grants) g.domains = [...domains];
  const r = transition(p, {
    operation: "REVOKE_GRANT",
    credentialId: "grant-2",
    expectedCredentialRevision: 1,
  });
  const e = r.eventIntents[0];
  expect(
    transitionResultSchema.safeParse({
      ...r,
      eventIntents: [
        { ...e, authorizationWitnesses: e.authorizationWitnesses.slice(1) },
      ],
    }).success,
  ).toBe(false);
  const altered = structuredClone(r);
  altered.eventIntents[0].authorizationWitnesses[0].grantRevision++;
  expect(transitionResultSchema.safeParse(altered).success).toBe(false);
  // A smaller partial grant cannot replace the required whole-domain grants predicate.
  p.grants.push({
    ...structuredClone(p.grants.find((g) => g.id === "grant-3")!),
    id: "a-partial",
    domains: ["MAC_COVERAGE"],
    capabilities: ["knowledge.grants"],
  });
  const again = transition(p, {
    operation: "REVOKE_GRANT",
    credentialId: "grant-2",
    expectedCredentialRevision: 1,
  });
  expect(again.eventIntents[0].authorizationWitnesses).toHaveLength(190);
  expect(
    again.eventIntents[0].authorizationWitnesses.every(
      (w) => w.grantId === "grant-3",
    ),
  ).toBe(true);
});
it("H6 maximum-length metadata for all supported predicates stays below the event byte limit", () => {
  const p = fixture();
  for (const g of p.grants) g.domains = [...domains];
  const e = transition(p, {
    operation: "REVOKE_GRANT",
    credentialId: "grant-2",
    expectedCredentialRevision: 1,
  }).eventIntents[0];
  const maximal = {
    ...e,
    id: "e".repeat(128),
    aggregateId: "g".repeat(128),
    requestId: "r".repeat(128),
    authorizationWitnesses: e.authorizationWitnesses.map((w) => ({
      ...w,
      grantId: "w".repeat(128),
      grantRevision: Number.MAX_SAFE_INTEGER,
    })),
  };
  expect(eventSchema.safeParse(maximal).success).toBe(true);
  expect(Buffer.byteLength(canonicalBytes(maximal))).toBeLessThan(524288);
});

it("H3/H6 whole-domain revocation still requires canonical active command membership", () => {
  for (const field of ["membershipActive", "organizationActive"] as const) {
    const p = fixture();
    p.members.find((m) => m.memberId === 3)![field] = false;
    expect(() =>
      transition(p, {
        operation: "REVOKE_GRANT",
        credentialId: "grant-2",
        expectedCredentialRevision: 1,
      }),
    ).toThrow("KNOWLEDGE_SCOPE_DENIED");
  }
});

it("H6 deserialized revocation cannot assemble whole-domain authority from partial grants", () => {
  const p = fixture();
  for (const g of p.grants) g.domains = ["MAC_COVERAGE", "REGULATION"];
  const r = transition(p, {
    operation: "REVOKE_GRANT",
    credentialId: "grant-2",
    expectedCredentialRevision: 1,
  });
  const g = r.state.grants.find((g) => g.id === "grant-3")!;
  g.domains = ["MAC_COVERAGE"];
  r.state.grants.push({
    ...structuredClone(g),
    id: "partial-regulation",
    domains: ["REGULATION"],
  });
  r.eventIntents[0].authorizationWitnesses = normalizeWitnesses(
    r.eventIntents[0].authorizationWitnesses.map((w) =>
      w.domain === "REGULATION" ? { ...w, grantId: "partial-regulation" } : w,
    ),
  );
  expect(transitionResultSchema.safeParse(r).success).toBe(false);
});

for (const kind of ["review", "rights", "lkg"] as const)
  it(`H2/H3 nonsynthetic ${kind} attestation denial preserves per-publication states`, () => {
    const { p } = attestationFixture(kind),
      v = p.versions[0];
    for (const g of p.grants)
      g.issuance = {
        kind: "OWNER_BOOTSTRAP",
        reference: "synthetic-test-of-owner-metadata",
      };
    for (const q of p.qualifications) q.verificationMethod = "CREDENTIAL_CHECK";
    const grant = p.grants.find(
      (g) =>
        g.id ===
        (kind === "review"
          ? "grant-2"
          : kind === "rights"
            ? "grant-4"
            : "health-only"),
    )!;
    const parent = {
      ...structuredClone(grant),
      id: "synthetic-ancestor",
      subjectMemberId: 90,
      grantedByMemberId: 98,
      verifiedByMemberId: 99,
      capabilities: [...capabilities],
      issuance: {
        kind: "SYNTHETIC_SEED" as const,
        reference: "synthetic-root",
      },
    };
    p.grants.push(parent);
    grant.grantedByMemberId = grant.verifiedByMemberId = 90;
    grant.createdAt = grant.verifiedAt = start;
    grant.issuance = {
      kind: "DELEGATED",
      parentGrantId: parent.id,
      parentGrantRevision: 1,
      requestId: "synthetic-prior-issuance",
    };
    // Keep a second independently valid publication visible alongside the denial.
    const good = structuredClone(v);
    good.id = "independent-valid-version";
    good.documentId = "independent-valid-document";
    good.artifactRevision++;
    good.approvals[0].id = "independent-valid-approval";
    good.approvals[0].versionId = good.id;
    const independentGrant = {
      ...structuredClone(grant),
      id: "independent-owner-grant",
      issuance: {
        kind: "OWNER_BOOTSTRAP" as const,
        reference: "synthetic-owner-reference",
      },
    };
    p.grants.push(independentGrant);
    if (kind === "review")
      good.approvals[0].reviewGrantId = independentGrant.id;
    if (kind === "rights") {
      good.rights.id = "independent-rights";
      good.rights.verificationGrantId = independentGrant.id;
      good.rightsOverlay.rightsId = good.rights.id;
      good.rightsOverlay.rightsRevisionId = rightsRevisionIdentity(
        good.scopeId,
        good.rights.id,
        good.rights.revision,
      );
    }
    if (kind === "lkg") {
      good.health.state = "CURRENT";
      good.health.lkg = null;
    }
    good.approvals[0].reviewManifestDigest = reviewManifestDigest(
      p.sources[0],
      good,
    );
    p.versions.push(good);
    p.assignments.push({
      ...structuredClone(p.assignments[0]),
      id: "independent-valid-assignment",
      versionId: good.id,
      documentId: good.documentId,
      approvalId: good.approvals[0].id,
      reviewManifestDigest: good.approvals[0].reviewManifestDigest,
    });
    const result = resolve(p, context, { ...actor(), synthetic: false });
    expect(
      result.decisions.find((entry) => entry.versionId === good.id)?.state,
    ).toBe("APPLICABLE");
    expect(result.state).toBe(
      kind === "review"
        ? "NOT_APPROVED"
        : kind === "rights"
          ? "LICENSE_NOT_PERMITTED"
          : "SOURCE_UNAVAILABLE",
    );
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions.some((entry) => entry.versionId === v.id)).toBe(
      true,
    );
  });
it("H3 nonsynthetic reader cannot use a delegated read grant rooted in a synthetic seed", () => {
  const p = fixture(),
    g = p.grants.find((g) => g.id === "grant-3")!;
  const parent = {
    ...structuredClone(g),
    id: "read-parent",
    subjectMemberId: 90,
  };
  p.grants.push(parent);
  g.grantedByMemberId = g.verifiedByMemberId = 90;
  g.issuance = {
    kind: "DELEGATED",
    parentGrantId: parent.id,
    parentGrantRevision: 1,
    requestId: "synthetic-read",
  };
  expect(resolve(p, context, { ...actor(), synthetic: false }).state).toBe(
    "SCOPE_DENIED",
  );
});
