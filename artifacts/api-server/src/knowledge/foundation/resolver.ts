import {
  actorSchema,
  resolverResultSchema,
  approvalSchema,
  assignmentSchema,
  authorityMatrix,
  configurationSchema,
  contextSchema,
  grantSchema,
  memberSchema,
  qualificationSchema,
  scopeSchema,
  sourceSchema,
  stamp,
  versionSchema,
  type Actor,
  type Assignment,
  type KnowledgeContext,
  type KnowledgeSource,
  type KnowledgeVersion,
  type Partition,
  type ApplicabilityState,
} from "./contracts";
import {
  actorInScope,
  validateGrantAncestry,
  grantEligible,
  hasCurrentApproval,
  healthState,
  licenseAllows,
  reviewManifestDigest,
} from "./authority";
import {
  applicabilityIntersects,
  assignmentsConflict,
  validateAssignment,
  validateLineage,
} from "./publication";
import {
  canonicalDigest,
  fail,
  metadataSnapshot,
  ordinal,
  parseContract,
  sortedSet,
} from "./canonical";
export { parseContract, hasCurrentApproval, licenseAllows };
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
function data(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) fail();
  return value;
}
function reference(
  values: unknown[],
  predicate: (v: unknown) => boolean,
): unknown {
  const matches = values.filter(predicate);
  if (matches.length !== 1) fail("KNOWLEDGE_REFERENCE_INVALID");
  return matches[0];
}
function project(
  raw: unknown,
  actor: Actor,
  context: KnowledgeContext,
  now: string,
): Partition[] {
  const projected: Partition[] = [];
  const seenScopes = new Set<string>();
  for (const rawPartition of array(data(raw, "partitions"))) {
    const rawScope = data(rawPartition, "scope");
    const rawScopeId = data(rawScope, "id");
    if (
      rawScopeId !== "global" &&
      rawScopeId !== `tenant:${actor.organizationId}`
    )
      continue;
    const scope = parseContract(scopeSchema, rawScope);
    if (!actorInScope(actor, scope)) continue;
    const rawGrants = array(data(rawPartition, "grants"));
    const reads = rawGrants
      .filter(
        (g) =>
          data(g, "subjectMemberId") === actor.memberId &&
          data(g, "scopeId") === scope.id &&
          Array.isArray(data(g, "capabilities")) &&
          (data(g, "capabilities") as unknown[]).includes("knowledge.read"),
      )
      .map((g) => parseContract(grantSchema, g))
      .filter((g) =>
        g.domains.some((d) =>
          grantEligible(g, scope, d, "knowledge.read", now, actor.synthetic),
        ),
      );
    if (!reads.length) continue;
    if (new Set(reads.map((g) => g.id)).size !== reads.length)
      fail("KNOWLEDGE_REFERENCE_INVALID");
    if (seenScopes.has(scope.id)) fail("KNOWLEDGE_REFERENCE_INVALID");
    seenScopes.add(scope.id);
    const allowed = new Set(
      reads
        .flatMap((g) => g.domains)
        .filter((d) => authorityMatrix[context.claimType].includes(d)),
    );
    if (!allowed.size) continue;
    const rawSources = array(data(rawPartition, "sources")),
      rawVersions = array(data(rawPartition, "versions")),
      rawAssignments = array(data(rawPartition, "assignments"));
    const assignments: Assignment[] = [];
    const sources: KnowledgeSource[] = [];
    const versions: KnowledgeVersion[] = [];
    const current = rawAssignments.filter((a) => {
      if (data(a, "retiredAt") !== null) return false;
      const linkedVersions = rawVersions.filter(
        (v) => data(v, "id") === data(a, "versionId"),
      );
      if (
        !linkedVersions.length ||
        linkedVersions.every(
          (v) => !Number.isSafeInteger(data(v, "sourceMetadataRevision")),
        )
      ) {
        // A visible broken reference must fail closed when parsed below.
        return rawSources.some(
          (s) =>
            data(s, "id") === data(a, "sourceId") &&
            allowed.has(data(s, "domain") as never),
        );
      }
      // Authorization uses the artifact's pinned metadata revision. A candidate
      // revision of the same stable source ID cannot confer visibility.
      return linkedVersions.some((v) =>
        rawSources.some(
          (s) =>
            data(s, "id") === data(v, "sourceId") &&
            data(s, "metadataRevision") === data(v, "sourceMetadataRevision") &&
            allowed.has(data(s, "domain") as never),
        ),
      );
    });
    for (const rawAssignment of current) {
      const a = parseContract(assignmentSchema, rawAssignment);
      const rawVersion = reference(
        rawVersions,
        (v) => data(v, "id") === a.versionId,
      );
      const pins = current
        .filter((x) => data(x, "versionId") === a.versionId)
        .map((x) => data(x, "approvalId"));
      // Candidate attestations which no publication adopted are not read authority.
      const descriptors = Object.getOwnPropertyDescriptors(
        rawVersion as object,
      );
      descriptors.approvals = {
        value: array(data(rawVersion, "approvals")).filter((x) =>
          pins.includes(data(x, "id")),
        ),
        enumerable: true,
        writable: true,
        configurable: true,
      };
      const v = parseContract(
        versionSchema,
        Object.defineProperties({}, descriptors),
      );
      const s = parseContract(
        sourceSchema,
        reference(
          rawSources,
          (s) =>
            data(s, "id") === v.sourceId &&
            data(s, "metadataRevision") === v.sourceMetadataRevision,
        ),
      );
      if (
        s.scope.id !== scope.id ||
        v.scopeId !== scope.id ||
        !allowed.has(s.domain)
      )
        fail("KNOWLEDGE_REFERENCE_INVALID");
      validateAssignment({ scope } as Partition, a, v, now);
      if (
        !sources.some(
          (x) => x.id === s.id && x.metadataRevision === s.metadataRevision,
        )
      )
        sources.push(s);
      if (!versions.some((x) => x.id === v.id)) versions.push(v);
      assignments.push(a);
    }
    // Only referenced predecessors are needed to validate lineage, never unrelated audit history.
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      if (
        a.predecessorAssignmentId &&
        !assignments.some((x) => x.id === a.predecessorAssignmentId)
      )
        assignments.push(
          parseContract(
            assignmentSchema,
            reference(
              rawAssignments,
              (x) => data(x, "id") === a.predecessorAssignmentId,
            ),
          ),
        );
      if (assignments.length > 4000) fail();
    }
    if (sources.length > 500 || versions.length > 2000) fail();
    const rightsRecords = new Map<string, string>();
    for (const v of versions) {
      const key = `${v.rights.id}/${v.rights.revision}`;
      const digest = canonicalDigest({
        terms: v.rights,
        overlay: v.rightsOverlay,
      });
      if (rightsRecords.has(key) && rightsRecords.get(key) !== digest)
        fail("KNOWLEDGE_IDENTITY_CONFLICT");
      rightsRecords.set(key, digest);
    }
    const grantIds = new Set<string>(reads.map((g) => g.id));
    const qualificationIds = new Set<string>();
    const memberIds = new Set<number>();
    for (const v of versions) {
      for (const a of v.approvals) {
        grantIds.add(a.reviewGrantId);
        qualificationIds.add(a.qualificationId);
        memberIds.add(a.reviewerMemberId);
      }
      const r = v.rights;
      if (r.verificationGrantId) grantIds.add(r.verificationGrantId);
      if (r.verificationQualificationId)
        qualificationIds.add(r.verificationQualificationId);
      if (r.verifiedByMemberId) memberIds.add(r.verifiedByMemberId);
      const l = v.health.lkg;
      if (l) {
        grantIds.add(l.reviewGrantId);
        grantIds.add(l.healthGrantId);
        qualificationIds.add(l.qualificationId);
        memberIds.add(l.reviewerMemberId);
      }
    }
    const grants = [...grantIds].map((id) =>
      parseContract(
        grantSchema,
        reference(rawGrants, (g) => data(g, "id") === id),
      ),
    );
    // Include only referenced immutable ancestry; later ancestor status never grants or revokes a child.
    for (let i = 0; i < grants.length; i++) {
      const g = grants[i];
      if (g.issuance.kind === "DELEGATED") {
        const parentId = g.issuance.parentGrantId;
        if (grants.some((x) => x.id === parentId)) continue;
        grants.push(
          parseContract(
            grantSchema,
            reference(rawGrants, (x) => data(x, "id") === parentId),
          ),
        );
      }
      if (grants.length > 2000) fail();
    }
    validateGrantAncestry({ scope, grants });
    if (
      !actor.synthetic &&
      grants.some((g) => g.issuance.kind === "SYNTHETIC_SEED")
    )
      fail("KNOWLEDGE_DELEGATION_DENIED");
    const qualifications = [...qualificationIds].map((id) =>
      parseContract(
        qualificationSchema,
        reference(
          array(data(rawPartition, "qualifications")),
          (q) => data(q, "id") === id,
        ),
      ),
    );
    const members = [...memberIds].map((id) =>
      parseContract(
        memberSchema,
        reference(
          array(data(rawPartition, "members")),
          (m) => data(m, "memberId") === id,
        ),
      ),
    );
    if (
      grants.some((g) => g.scopeId !== scope.id) ||
      qualifications.some((q) => q.scopeId !== scope.id)
    )
      fail("KNOWLEDGE_REFERENCE_INVALID");
    if (qualifications.length > 2000 || members.length > 2000) fail();
    const p = {
      scope,
      revision: 0,
      sources,
      versions,
      assignments,
      grants,
      qualifications,
      members,
      configuration: parseContract(
        configurationSchema,
        data(rawPartition, "configuration"),
      ),
    };
    validateLineage(p);
    projected.push(p);
  }
  return projected.sort((a, b) => ordinal(a.scope.id, b.scope.id));
}
const contextDimensions = [
  ["macs", "mac"],
  ["providerTypes", "providerType"],
  ["settings", "setting"],
  ["benefitPeriods", "benefitPeriod"],
  ["codeEditions", "codeEdition"],
  ["products", "product"],
  ["populations", "population"],
] as const;
function applicability(
  a: Assignment,
  c: KnowledgeContext,
): "MATCH" | "MISMATCH" | "MISSING" {
  if (
    (c.serviceDate &&
      (c.serviceDate < a.serviceFrom ||
        (a.serviceTo && c.serviceDate >= a.serviceTo))) ||
    (c.payer && !a.applicability.payers.includes(c.payer as never)) ||
    (c.jurisdiction && !a.applicability.jurisdictions.includes(c.jurisdiction))
  )
    return "MISMATCH";
  let missing = false;
  for (const [dimension, key] of contextDimensions)
    if (a.applicability[dimension] !== null) {
      if (!c[key]) missing = true;
      else if (!a.applicability[dimension]!.includes(c[key]!))
        return "MISMATCH";
    }
  return missing ? "MISSING" : "MATCH";
}
export function evaluateApplicability(
  p: Partition,
  s: KnowledgeSource,
  v: KnowledgeVersion,
  a: Assignment,
  c: KnowledgeContext,
  actor: Actor,
  now: string,
): ApplicabilityState {
  const match = applicability(a, c);
  if (
    match === "MISMATCH" ||
    s.educationalOnly ||
    !s.claimTypes.includes(c.claimType)
  )
    return "NOT_APPLICABLE";
  if (v.state === "REVOKED" || v.revokedAt) return "SOURCE_REVOKED";
  if (
    !a.enabledUses.includes(c.purpose) ||
    !licenseAllows(p, s, v, now, c.purpose, actor.synthetic)
  )
    return "LICENSE_NOT_PERMITTED";
  const health = healthState(p, s, v, now, actor.synthetic);
  if (health === "SOURCE_EXPIRED") return health;
  const approval = v.approvals.find((x) => x.id === a.approvalId);
  if (
    v.publishedAt > v.retrievedAt ||
    v.retrievedAt > now ||
    a.createdAt > now ||
    !approval ||
    a.createdByMemberId === approval.reviewerMemberId ||
    a.reviewManifestDigest !== reviewManifestDigest(s, v) ||
    !hasCurrentApproval(p, s, v, approval, now, actor.synthetic)
  )
    return "NOT_APPROVED";
  if (health !== "APPLICABLE") return health;
  if (match === "MISSING") return "INSUFFICIENT_CONTEXT";
  return ["ACTIVE", "SUPERSEDED"].includes(v.state)
    ? "APPLICABLE"
    : "NOT_ACTIVE";
}
export function createKnowledgeRegistry(input: unknown) {
  if (
    data(input, "contractVersion") !== "knowledge-foundation-v3" ||
    !Array.isArray(data(input, "partitions")) ||
    !input ||
    Object.keys(input).some(
      (k) => !["contractVersion", "partitions"].includes(k),
    )
  )
    fail();
  const inventory = metadataSnapshot(input);
  return Object.freeze({
    resolve(contextInput: unknown, actorInput: unknown, nowInput: unknown) {
      const actor = parseContract(actorSchema, actorInput),
        context = parseContract(contextSchema, contextInput),
        now = parseContract(stamp, nowInput);
      const partitions = project(inventory, actor, context, now);
      const entries = partitions
        .flatMap((p) =>
          p.assignments
            .filter((a) => !a.retiredAt)
            .map((a) => {
              const v = p.versions.find((v) => v.id === a.versionId)!;
              const s = p.sources.find(
                (s) =>
                  s.id === v.sourceId &&
                  s.metadataRevision === v.sourceMetadataRevision,
              )!;
              const state = evaluateApplicability(
                p,
                s,
                v,
                a,
                context,
                actor,
                now,
              );
              return {
                scope: p.scope,
                sourceId: s.id,
                documentId: a.documentId,
                assignmentId: a.id,
                assignmentRevision: a.revision,
                serviceFrom: a.serviceFrom,
                serviceTo: a.serviceTo,
                applicability: a.applicability,
                enabledUses: a.enabledUses,
                versionId: v.id,
                reviewManifestDigest: a.reviewManifestDigest,
                state,
                reasonCodes: [state],
                warningCodes:
                  state === "APPLICABLE" &&
                  !(v.health.state === "CURRENT" && v.health.warningAt! > now)
                    ? ["STALE_ALLOWED_WITH_WARNING"]
                    : [],
              };
            }),
        )
        .sort((a, b) =>
          ordinal(
            `${a.scope.id}/${a.sourceId}/${a.documentId}/${a.assignmentId}`,
            `${b.scope.id}/${b.sourceId}/${b.documentId}/${b.assignmentId}`,
          ),
        );
      const relevant = entries.map(
        (e) => !["NOT_APPLICABLE"].includes(e.state),
      );
      for (let i = 0; i < entries.length; i++)
        for (let j = i + 1; j < entries.length; j++)
          if (
            relevant[i] &&
            relevant[j] &&
            entries[i].scope.id === entries[j].scope.id
          ) {
            const p = partitions.find(
              (p) => p.scope.id === entries[i].scope.id,
            )!;
            const a = p.assignments.find(
                (a) => a.id === entries[i].assignmentId,
              )!,
              b = p.assignments.find((a) => a.id === entries[j].assignmentId)!;
            const v = p.versions.find((v) => v.id === a.versionId)!,
              w = p.versions.find((v) => v.id === b.versionId)!;
            if (
              assignmentsConflict(a, b) ||
              v.conflictsWith.includes(w.id) ||
              w.conflictsWith.includes(v.id)
            ) {
              for (const index of [i, j])
                if (
                  ["APPLICABLE", "INSUFFICIENT_CONTEXT"].includes(
                    entries[index].state,
                  )
                ) {
                  entries[index].state = "CONFLICT_REQUIRES_REVIEW";
                  entries[index].reasonCodes = ["CONFLICT_REQUIRES_REVIEW"];
                  entries[index].warningCodes = [];
                }
            }
          }
      const configuration = partitions.map((p) => ({
        scopeId: p.scope.id,
        ...p.configuration,
      }));
      let state: string;
      if (
        !actor.sessionVerified ||
        !actor.membershipActive ||
        !actor.organizationActive ||
        !partitions.length
      )
        state = "SCOPE_DENIED";
      else if (
        !context.serviceDate ||
        !context.jurisdiction ||
        !context.payer ||
        context.payer === "UNKNOWN"
      )
        state = "INSUFFICIENT_CONTEXT";
      else if (
        !configuration.some((c) =>
          c.supportedPayers.includes(context.payer as never),
        )
      )
        state = "PAYER_KNOWLEDGE_NOT_CONFIGURED";
      else if (
        !configuration.some((c) =>
          c.supportedJurisdictions.includes(context.jurisdiction!),
        )
      )
        state = "JURISDICTION_NOT_SUPPORTED";
      else
        state =
          blockingPrecedence.find((s) => entries.some((e) => e.state === s)) ??
          (entries.some((e) => e.state === "APPLICABLE")
            ? "APPLICABLE"
            : entries.length
              ? "NOT_APPLICABLE"
              : "SOURCE_UNAVAILABLE");
      const normalizedContext = Object.fromEntries(
        Object.keys(contextSchema.shape).map((key) => [
          key,
          (context as Record<string, unknown>)[key] ?? null,
        ]),
      );
      const manifest = {
        schemaVersion: "knowledge-runtime-manifest-v2",
        canonicalizationVersion: "k1a-c14n-v1",
        authorizedScopeIds: partitions.map((p) => p.scope.id),
        context: normalizedContext,
        configuration,
        publishedEntries: entries,
      };
      const bundleHash = canonicalDigest(manifest);
      return parseContract(resolverResultSchema, {
        state,
        bundleHash,
        bundleId: `kb2:${bundleHash}`,
        humanReviewRequired: true,
        configuration,
        decisions: entries,
        selected:
          state === "APPLICABLE"
            ? entries.filter((e) => e.state === "APPLICABLE")
            : [],
        warnings: sortedSet(entries.flatMap((e) => e.warningCodes)),
        manifest,
      });
    },
  });
}
