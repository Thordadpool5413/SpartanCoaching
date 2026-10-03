import { z } from "zod";
import {
  actorSchema,
  applicabilitySchema,
  assignmentSchema,
  eventSchema,
  healthSchema,
  id,
  lifecycleStates,
  partitionSchema,
  revision,
  sourceSchema,
  stamp,
  versionSchema,
  day,
  useSet,
  hash,
  type Actor,
  type Assignment,
  type KnowledgeEvent,
  type KnowledgeSource,
  type KnowledgeVersion,
  type Partition,
} from "./contracts";
import {
  actorInScope,
  hasCurrentApproval,
  healthState,
  licenseAllows,
  requireCapability,
  requireQualification,
  reviewManifestDigest,
} from "./authority";
import {
  assertNoOverlaps,
  applicabilitySubset,
  intervalSubset,
  validateAssignment,
  validateLineage,
} from "./publication";
import {
  canonicalDigest,
  fail,
  ordinal,
  parseContract,
  sha256,
  sortedSet,
} from "./canonical";
const expected = {
  expectedScopeRevision: revision,
  expectedVersionRevisions: z.record(id, revision),
};
const target = { ...expected, versionId: id };
export const commandSchema = z.discriminatedUnion("operation", [
  z
    .object({
      ...expected,
      operation: z.literal("REGISTER"),
      source: sourceSchema,
      version: versionSchema,
    })
    .strict(),
  z
    .object({
      ...target,
      operation: z.literal("RECORD_STAGE"),
      stage: z.enum(lifecycleStates),
      evidenceRef: id,
    })
    .strict(),
  z.object({ ...target, operation: z.literal("SUBMIT") }).strict(),
  ...(["APPROVE", "REAPPROVE", "REJECT_REVIEW"] as const).map((operation) =>
    z
      .object({
        ...target,
        operation: z.literal(operation),
        reviewDueAt: stamp.nullable(),
      })
      .strict(),
  ),
  z
    .object({
      ...target,
      operation: z.literal("ACTIVATE"),
      approvalId: id,
      serviceFrom: day,
      serviceTo: day.nullable(),
      applicability: applicabilitySchema,
      enabledUses: useSet,
    })
    .strict(),
  ...(["SUPERSEDE", "ROLLBACK"] as const).map((operation) =>
    z
      .object({
        ...target,
        operation: z.literal(operation),
        assignmentId: id,
        approvalId: id,
        cutover: day,
      })
      .strict(),
  ),
  z
    .object({
      ...target,
      operation: z.literal("REFRESH_APPROVAL"),
      assignmentId: id,
      approvalId: id,
    })
    .strict(),
  z.object({ ...target, operation: z.literal("REVOKE") }).strict(),
  z
    .object({
      ...target,
      operation: z.literal("RECORD_HEALTH"),
      health: healthSchema,
    })
    .strict(),
  z
    .object({ ...target, operation: z.literal("APPROVE_LKG"), until: stamp })
    .strict(),
  z
    .object({
      ...target,
      operation: z.literal("REVOKE_RIGHTS"),
      expectedRightsRevision: revision,
    })
    .strict(),
  ...(["REVOKE_GRANT", "REVOKE_QUALIFICATION"] as const).map((operation) =>
    z
      .object({
        ...expected,
        operation: z.literal(operation),
        credentialId: id,
        expectedCredentialRevision: revision,
      })
      .strict(),
  ),
]);
// Server-only context is separate from the canonical client command.
const serverSchema = z
  .object({
    kind: z.enum(["HUMAN_SERVER", "PIPELINE"]),
    synthetic: z.boolean(),
    now: stamp,
    eventId: id,
    requestId: id,
    receiptRef: hash.nullable(),
  })
  .strict();
const childId = (parent: string, suffix: string) =>
  parent.length + suffix.length + 1 <= 128
    ? `${parent}:${suffix}`
    : `k1a:${sha256(`${parent}:${suffix}`)}`;
const versionIdentity = (s: KnowledgeSource, v: KnowledgeVersion) => {
  const manifest = structuredClone(
    (() => {
      const { registeredByMemberId, submittedByMemberId, ...artifact } = {
        ...v,
      };
      return artifact;
    })(),
  );
  const {
    state,
    revision,
    approvals,
    activatedAt,
    revokedAt,
    revocationReason,
    health,
    rightsOverlay,
    conflictsWith,
    ...identity
  } = manifest;
  return canonicalDigest({ source: s, artifact: identity });
};
function validateState(p: Partition): void {
  const unique = (values: readonly unknown[]) =>
    new Set(values).size === values.length;
  if (
    !unique(p.sources.map((s) => `${s.id}/${s.metadataRevision}`)) ||
    !unique(p.versions.map((v) => v.id)) ||
    !unique(p.grants.map((g) => g.id)) ||
    !unique(p.qualifications.map((q) => q.id)) ||
    !unique(p.members.map((m) => m.memberId))
  )
    fail("KNOWLEDGE_REFERENCE_INVALID");
  if (
    p.sources.some((s) => s.scope.id !== p.scope.id) ||
    p.versions.some(
      (v) =>
        v.scopeId !== p.scope.id ||
        !p.sources.some(
          (s) =>
            s.id === v.sourceId &&
            s.metadataRevision === v.sourceMetadataRevision,
        ),
    ) ||
    p.grants.some((g) => g.scopeId !== p.scope.id) ||
    p.qualifications.some((q) => q.scopeId !== p.scope.id)
  )
    fail("KNOWLEDGE_REFERENCE_INVALID");
  const rightsRecords = new Map<string, string>();
  for (const version of p.versions) {
    const key = `${version.rights.id}/${version.rights.revision}`;
    const digest = canonicalDigest({
      terms: version.rights,
      overlay: version.rightsOverlay,
    });
    if (rightsRecords.has(key) && rightsRecords.get(key) !== digest)
      fail("KNOWLEDGE_IDENTITY_CONFLICT");
    rightsRecords.set(key, digest);
  }
  for (const a of p.assignments) {
    const v = p.versions.find((v) => v.id === a.versionId);
    if (!v) fail("KNOWLEDGE_REFERENCE_INVALID");
    validateAssignment(p, a, v);
  }
  validateLineage(p);
  assertNoOverlaps(p);
}
export function transitionKnowledge(
  stateInput: unknown,
  actorInput: unknown,
  commandInput: unknown,
  serverInput: unknown,
) {
  const server = parseContract(serverSchema, serverInput);
  const actor =
    server.kind === "PIPELINE" ? null : parseContract(actorSchema, actorInput);
  // Scope authorization precedes validation of administrative payloads.
  const scopeDescriptor =
    stateInput && typeof stateInput === "object"
      ? Object.getOwnPropertyDescriptor(stateInput, "scope")
      : undefined;
  const rawScope =
    scopeDescriptor && "value" in scopeDescriptor
      ? scopeDescriptor.value
      : undefined;
  if (
    actor &&
    !actorInScope(actor, parseContract(partitionSchema.shape.scope, rawScope))
  )
    fail("KNOWLEDGE_SCOPE_DENIED");
  const p = parseContract(partitionSchema, stateInput),
    command = parseContract(commandSchema, commandInput);
  validateState(p);
  if (p.revision !== command.expectedScopeRevision)
    fail("KNOWLEDGE_REVISION_CONFLICT");
  if (
    server.kind === "PIPELINE"
      ? !server.synthetic ||
        actorInput !== null ||
        command.operation !== "RECORD_STAGE"
      : command.operation === "RECORD_STAGE"
  )
    fail("KNOWLEDGE_PIPELINE_REQUIRED");
  const next = structuredClone(p);
  let v =
    "versionId" in command
      ? next.versions.find((v) => v.id === command.versionId)
      : undefined;
  if ("versionId" in command && !v) fail("KNOWLEDGE_REFERENCE_INVALID");
  const touch = (version: KnowledgeVersion) => {
    if (command.expectedVersionRevisions[version.id] !== version.revision)
      fail("KNOWLEDGE_REVISION_CONFLICT");
  };
  if (v) touch(v);
  const sourceFor = (version: KnowledgeVersion) =>
    next.sources.find(
      (s) =>
        s.id === version.sourceId &&
        s.metadataRevision === version.sourceMetadataRevision,
    )!;
  let source = v ? sourceFor(v) : undefined;
  let grantId: string | null = null,
    qualificationId: string | null = null;
  let reason: KnowledgeEvent["reasonCode"] = "VALIDATION_RECORDED",
    invalidation: KnowledgeEvent["invalidation"] = "NONE",
    contentRemoval = false;
  let aggregateKind: KnowledgeEvent["aggregateKind"] = "VERSION",
    aggregateId = v?.id ?? server.eventId,
    previousRevision = v?.revision ?? p.revision;
  let assignmentId: string | null = null,
    previousAssignmentId: string | null = null,
    approvalId: string | null = null,
    previousApprovalId: string | null = null;
  const affected = new Set<string>();
  const authorize = (
    domain: KnowledgeSource["domain"],
    capability: Parameters<typeof requireCapability>[3],
  ) => {
    const g = requireCapability(next, actor!, domain, capability, server.now);
    grantId = g.id;
    return g;
  };
  const qualification = (s: KnowledgeSource, version: KnowledgeVersion) => {
    const q = requireQualification(next, actor!, s, version, server.now);
    qualificationId = q.id;
    return q;
  };
  const eligible = (version: KnowledgeVersion, pin: string) => {
    const s = sourceFor(version),
      a = version.approvals.find((a) => a.id === pin);
    if (version.state === "REVOKED" || version.revokedAt)
      fail("KNOWLEDGE_REVOKED");
    if (
      s.educationalOnly ||
      !a ||
      a.reviewerMemberId === actor!.memberId ||
      !hasCurrentApproval(next, s, version, a, server.now, actor!.synthetic) ||
      version.retrievedAt > server.now
    )
      fail("ACTIVATION_REVIEW_REQUIRED");
    if (
      healthState(next, s, version, server.now, actor!.synthetic, true) !==
      "APPLICABLE"
    )
      fail("ACTIVATION_HEALTH_REQUIRED");
    return a;
  };
  const createAssignment = (
    version: KnowledgeVersion,
    pin: string,
    from: string,
    to: string | null,
    app: Assignment["applicability"],
    uses: Assignment["enabledUses"],
    predecessor: string | null,
    suffix: string,
  ) => {
    const a = eligible(version, pin);
    const s = sourceFor(version);
    if (
      !intervalSubset(from, to, version.effectiveFrom, version.effectiveTo) ||
      !applicabilitySubset(app, version.applicability) ||
      !uses.includes("INTERNAL_STORAGE") ||
      !uses.every((use) =>
        licenseAllows(next, s, version, server.now, use, actor!.synthetic),
      )
    )
      fail("ACTIVATION_RIGHTS_OR_INTERVAL_REQUIRED");
    const result = parseContract(assignmentSchema, {
      id: childId(server.eventId, suffix),
      scopeId: next.scope.id,
      sourceId: version.sourceId,
      documentId: version.documentId,
      versionId: version.id,
      reviewManifestDigest: a.reviewManifestDigest,
      approvalId: pin,
      serviceFrom: from,
      serviceTo: to,
      applicability: app,
      enabledUses: uses,
      createdAt: server.now,
      createdByMemberId: actor!.memberId,
      eventId: server.eventId,
      predecessorAssignmentId: predecessor,
      revision: 1,
      retiredAt: null,
      retirementEventId: null,
    });
    next.assignments.push(result);
    affected.add(result.id);
    return result;
  };
  if (command.operation === "REGISTER") {
    source = command.source;
    authorize(source.domain, "knowledge.register");
    if (
      source.scope.id !== next.scope.id ||
      command.version.scopeId !== next.scope.id ||
      command.version.sourceId !== source.id ||
      command.version.sourceMetadataRevision !== source.metadataRevision
    )
      fail("KNOWLEDGE_REFERENCE_INVALID");
    const duplicate = next.versions.find(
      (v) =>
        v.sourceId === command.version.sourceId &&
        v.documentId === command.version.documentId &&
        v.upstreamEdition === command.version.upstreamEdition &&
        v.artifactRevision === command.version.artifactRevision,
    );
    if (duplicate) {
      if (
        versionIdentity(sourceFor(duplicate), duplicate) !==
        versionIdentity(source, command.version)
      )
        fail("KNOWLEDGE_IDENTITY_CONFLICT");
      return { state: next, eventIntents: [], existingVersionId: duplicate.id };
    }
    if (next.versions.some((v) => v.id === command.version.id))
      fail("KNOWLEDGE_IDENTITY_CONFLICT");
    const existingSource = next.sources.find(
      (s) =>
        s.id === source!.id && s.metadataRevision === source!.metadataRevision,
    );
    if (
      (existingSource &&
        canonicalDigest(existingSource) !== canonicalDigest(source)) ||
      next.versions.some(
        (v) =>
          v.rights.id === command.version.rights.id &&
          v.rights.revision === command.version.rights.revision &&
          canonicalDigest(v.rights) !== canonicalDigest(command.version.rights),
      )
    )
      fail("KNOWLEDGE_IDENTITY_CONFLICT");
    if (
      command.version.state !== "DETECTED" ||
      command.version.approvals.length ||
      command.version.submittedByMemberId !== null ||
      command.version.revokedAt ||
      command.version.rightsOverlay.revokedAt ||
      command.version.health.state !== "NOT_CHECKED" ||
      command.version.activatedAt
    )
      fail("KNOWLEDGE_REGISTRATION_INVALID");
    v = {
      ...command.version,
      registeredByMemberId: actor!.memberId,
      revision: 1,
    };
    if (!existingSource) next.sources.push(source);
    const existingRights = next.versions.find(
      (x) =>
        x.rights.id === v!.rights.id &&
        x.rights.revision === v!.rights.revision,
    );
    if (existingRights)
      v.rightsOverlay = structuredClone(existingRights.rightsOverlay);
    next.versions.push(v);
    aggregateId = v.id;
    previousRevision = 0;
    reason = "REGISTERED";
  } else if (
    command.operation === "REVOKE_GRANT" ||
    command.operation === "REVOKE_QUALIFICATION"
  ) {
    const target =
      command.operation === "REVOKE_GRANT"
        ? next.grants.find((g) => g.id === command.credentialId)
        : next.qualifications.find((q) => q.id === command.credentialId);
    if (!target || target.scopeId !== next.scope.id)
      fail("KNOWLEDGE_REFERENCE_INVALID");
    if (target.revision !== command.expectedCredentialRevision)
      fail("KNOWLEDGE_REVISION_CONFLICT");
    for (const domain of target.domains) authorize(domain, "knowledge.grants");
    if (
      "capabilities" in target &&
      !target.capabilities.every((c) =>
        next.grants.some(
          (g) =>
            g.subjectMemberId === actor!.memberId &&
            target.domains.every((d) => g.domains.includes(d)) &&
            g.scopeId === next.scope.id &&
            !g.revokedAt &&
            g.effectiveFrom <= server.now &&
            g.verifiedAt <= server.now &&
            server.now < g.expiresAt &&
            g.capabilities.includes(c),
        ),
      )
    )
      fail("KNOWLEDGE_DELEGATION_DENIED");
    if (target.revokedAt) fail("KNOWLEDGE_REVOKED");
    previousRevision = target.revision;
    target.revokedAt = server.now;
    target.revision++;
    aggregateKind =
      command.operation === "REVOKE_GRANT" ? "GRANT" : "QUALIFICATION";
    aggregateId = target.id;
    reason =
      command.operation === "REVOKE_GRANT"
        ? "GRANT_REVOKED"
        : "QUALIFICATION_REVOKED";
    invalidation = "ELIGIBILITY";
    for (const version of next.versions) {
      const refs = [
        ...version.approvals,
        ...(version.health.lkg ? [version.health.lkg] : []),
      ];
      const r = version.rights;
      if (
        refs.some((a) =>
          command.operation === "REVOKE_GRANT"
            ? a.reviewGrantId === target.id
            : a.qualificationId === target.id,
        ) ||
        (command.operation === "REVOKE_GRANT"
          ? r.verificationGrantId === target.id
          : r.verificationQualificationId === target.id)
      )
        for (const a of next.assignments.filter(
          (a) => !a.retiredAt && a.versionId === version.id,
        ))
          affected.add(a.id);
    }
  } else {
    if (!v || !source) fail("KNOWLEDGE_REFERENCE_INVALID");
    if (
      (v.state === "REVOKED" || v.revokedAt) &&
      command.operation !== "REVOKE_RIGHTS"
    )
      fail("KNOWLEDGE_REVOKED");
    if (command.operation === "RECORD_STAGE") {
      const stages = [
        "DETECTED",
        "FETCHED",
        "QUARANTINED",
        "PARSED",
        "DIFFED",
        "VALIDATED",
      ];
      if (
        stages.indexOf(v.state) < 0 ||
        stages[stages.indexOf(v.state) + 1] !== command.stage
      )
        fail("KNOWLEDGE_STAGE_INVALID");
      v.state = command.stage;
    } else if (command.operation === "SUBMIT") {
      authorize(source.domain, "knowledge.submit");
      if (
        v.state !== "VALIDATED" ||
        (v.submittedByMemberId !== null &&
          v.submittedByMemberId !== actor!.memberId)
      )
        fail("KNOWLEDGE_SUBMISSION_INVALID");
      v.submittedByMemberId ??= actor!.memberId;
      v.state = "REVIEW_PENDING";
      reason = "SUBMITTED";
    } else if (
      ["APPROVE", "REAPPROVE", "REJECT_REVIEW"].includes(command.operation)
    ) {
      const g = authorize(source.domain, "knowledge.review"),
        q = qualification(source, v);
      if (
        v.registeredByMemberId === actor!.memberId ||
        v.submittedByMemberId === actor!.memberId ||
        v.submittedByMemberId === null
      )
        fail("KNOWLEDGE_DUTY_CONFLICT");
      if (
        command.operation === "REAPPROVE"
          ? !["APPROVED", "ACTIVE", "SUPERSEDED"].includes(v.state)
          : v.state !== "REVIEW_PENDING"
      )
        fail("KNOWLEDGE_REVIEW_TRANSITION_INVALID");
      if (command.operation === "REJECT_REVIEW") {
        v.state = "VALIDATED";
        reason = "REVIEW_REJECTED";
      } else {
        const due = "reviewDueAt" in command ? command.reviewDueAt : null;
        if (
          !due ||
          due <= server.now ||
          due > g.expiresAt ||
          due > q.expiresAt ||
          due > q.reviewDueAt ||
          v.retrievedAt > server.now
        )
          fail("KNOWLEDGE_REVIEW_WINDOW_INVALID");
        approvalId = childId(server.eventId, "approval");
        v.approvals.push({
          id: approvalId,
          versionId: v.id,
          scopeId: next.scope.id,
          reviewManifestDigest: reviewManifestDigest(source, v),
          reviewerMemberId: actor!.memberId,
          reviewGrantId: g.id,
          qualificationId: q.id,
          reviewedAt: server.now,
          reviewDueAt: due,
        });
        if (command.operation === "APPROVE") v.state = "APPROVED";
        reason = "REVIEW_APPROVED";
      }
    } else if (command.operation === "REVOKE") {
      authorize(source.domain, "knowledge.revoke");
      v.state = "REVOKED";
      v.revokedAt = server.now;
      v.revocationReason = "SECURITY_REVOCATION";
      reason = "SECURITY_REVOCATION";
      invalidation = "PUBLICATION";
    } else if (command.operation === "REVOKE_RIGHTS") {
      authorize(source.domain, "knowledge.license");
      if (command.expectedRightsRevision !== v.rightsOverlay.revision)
        fail("KNOWLEDGE_REVISION_CONFLICT");
      if (v.rightsOverlay.revokedAt) fail("KNOWLEDGE_REVOKED");
      previousRevision = v.rightsOverlay.revision;
      aggregateKind = "RIGHTS";
      aggregateId = v.rights.id;
      for (const same of next.versions.filter(
        (x) =>
          x.rights.id === v!.rights.id &&
          x.rights.revision === v!.rights.revision,
      )) {
        touch(same);
        same.rightsOverlay.revokedAt = server.now;
        same.rightsOverlay.revision++;
        if (same !== v) same.revision++;
      }
      reason = "RIGHTS_REVOKED";
      invalidation = "ELIGIBILITY";
      contentRemoval = true;
    } else if (command.operation === "RECORD_HEALTH") {
      authorize(source.domain, "knowledge.health");
      if (
        command.health.state === "REVOKED" ||
        command.health.lkg !== null ||
        (command.health.checkedAt && command.health.checkedAt > server.now) ||
        (command.health.lastValidatedAt &&
          command.health.lastValidatedAt > server.now) ||
        (v.health.checkedAt &&
          (!command.health.checkedAt ||
            command.health.checkedAt < v.health.checkedAt))
      )
        fail("KNOWLEDGE_HEALTH_INVALID");
      v.health = command.health;
      if (
        healthState(next, source, v, server.now, actor!.synthetic) !==
        "APPLICABLE"
      ) {
        reason = "HEALTH_BLOCKED";
        invalidation = "ELIGIBILITY";
      }
    } else if (command.operation === "APPROVE_LKG") {
      authorize(source.domain, "knowledge.health");
      const g = authorize(source.domain, "knowledge.review");
      const q = qualification(source, v);
      if (
        !v.health.lastValidatedAt ||
        !v.health.hardExpiresAt ||
        ![
          "CURRENT",
          "STALE_ALLOWED_WITH_WARNING",
          "UPSTREAM_UNAVAILABLE",
        ].includes(v.health.state) ||
        command.until <= server.now ||
        command.until > v.health.hardExpiresAt ||
        command.until > g.expiresAt ||
        command.until > q.expiresAt ||
        command.until > q.reviewDueAt ||
        v.health.checkedAt! > server.now ||
        !v.approvals.some((a) =>
          hasCurrentApproval(
            next,
            source!,
            v!,
            a,
            server.now,
            actor!.synthetic,
          ),
        ) ||
        !licenseAllows(
          next,
          source,
          v,
          server.now,
          "INTERNAL_STORAGE",
          actor!.synthetic,
        )
      )
        fail("KNOWLEDGE_LKG_INVALID");
      v.health.lkg = {
        id: childId(server.eventId, "lkg"),
        reviewManifestDigest: reviewManifestDigest(source, v),
        reviewerMemberId: actor!.memberId,
        reviewGrantId: g.id,
        qualificationId: q.id,
        approvedAt: server.now,
        until: command.until,
      };
      reason = "REVIEW_APPROVED";
    } else {
      authorize(
        source.domain,
        command.operation === "ROLLBACK"
          ? "knowledge.rollback"
          : "knowledge.activate",
      );
      aggregateKind = "PUBLICATION";
      aggregateId = next.scope.id;
      previousRevision = p.revision;
      invalidation = "PUBLICATION";
      if (command.operation === "ACTIVATE") {
        if (
          v.state !== "APPROVED" ||
          next.assignments.some((a) => a.versionId === v!.id)
        )
          fail("KNOWLEDGE_ACTIVATION_INVALID");
        assignmentId = createAssignment(
          v,
          command.approvalId,
          command.serviceFrom,
          command.serviceTo,
          command.applicability,
          command.enabledUses,
          null,
          "assignment",
        ).id;
        approvalId = command.approvalId;
        reason = "PUBLISHED";
      } else if ("assignmentId" in command) {
        const old = next.assignments.find((a) => a.id === command.assignmentId);
        if (
          !old ||
          old.retiredAt ||
          old.scopeId !== next.scope.id ||
          old.sourceId !== v.sourceId ||
          old.documentId !== v.documentId
        )
          fail("KNOWLEDGE_REPLACEMENT_INVALID");
        const previous = next.versions.find((x) => x.id === old.versionId)!;
        touch(previous);
        if (command.operation === "REFRESH_APPROVAL") {
          if (old.versionId !== v.id || old.approvalId === command.approvalId)
            fail("KNOWLEDGE_REPLACEMENT_INVALID");
          assignmentId = createAssignment(
            v,
            command.approvalId,
            old.serviceFrom,
            old.serviceTo,
            old.applicability,
            old.enabledUses,
            old.id,
            "assignment",
          ).id;
          reason = "PUBLISHED";
        } else if ("cutover" in command) {
          if (
            v.id === previous.id ||
            command.cutover < old.serviceFrom ||
            (old.serviceTo && command.cutover >= old.serviceTo) ||
            (command.operation === "SUPERSEDE"
              ? v.state !== "APPROVED" ||
                next.assignments.some((a) => a.versionId === v!.id)
              : !next.assignments.some(
                  (a) =>
                    a.versionId === v!.id &&
                    a.sourceId === old.sourceId &&
                    a.documentId === old.documentId,
                ))
          )
            fail("KNOWLEDGE_REPLACEMENT_INVALID");
          if (command.cutover > old.serviceFrom) {
            const historical = {
              ...old,
              id: childId(server.eventId, "history"),
              serviceTo: command.cutover,
              createdAt: server.now,
              eventId: server.eventId,
              predecessorAssignmentId: old.id,
              revision: 1,
              retiredAt: null,
              retirementEventId: null,
            };
            next.assignments.push(historical);
            affected.add(historical.id);
          }
          assignmentId = createAssignment(
            v,
            command.approvalId,
            command.cutover,
            old.serviceTo,
            old.applicability,
            old.enabledUses,
            old.id,
            "assignment",
          ).id;
          if (previous.state !== "REVOKED") previous.state = "SUPERSEDED";
          if (previous !== v) previous.revision++;
          reason =
            command.operation === "SUPERSEDE"
              ? "SUPERSEDED"
              : "ROLLBACK_APPROVED";
        }
        old.retiredAt = server.now;
        old.retirementEventId = server.eventId;
        old.revision++;
        previousAssignmentId = old.id;
        previousApprovalId = old.approvalId;
        approvalId = command.approvalId;
        affected.add(old.id);
      } else fail("KNOWLEDGE_COMMAND_INVALID");
      v.state = "ACTIVE";
      v.activatedAt ??= server.now;
    }
    v.revision++;
  }
  if (v && ["PUBLICATION", "ELIGIBILITY"].includes(invalidation))
    for (const a of next.assignments.filter(
      (a) =>
        !a.retiredAt &&
        (a.versionId === v!.id ||
          (contentRemoval &&
            next.versions.find((x) => x.id === a.versionId)?.rights.id ===
              v!.rights.id &&
            next.versions.find((x) => x.id === a.versionId)?.rights.revision ===
              v!.rights.revision)),
    ))
      affected.add(a.id);
  next.revision++;
  validateState(next);
  const newRevision =
    aggregateKind === "PUBLICATION"
      ? next.revision
      : aggregateKind === "RIGHTS"
        ? v!.rightsOverlay.revision
        : aggregateKind === "GRANT"
          ? next.grants.find((g) => g.id === aggregateId)!.revision
          : aggregateKind === "QUALIFICATION"
            ? next.qualifications.find((q) => q.id === aggregateId)!.revision
            : v!.revision;
  const event = parseContract(eventSchema, {
    id: server.eventId,
    schemaVersion: "knowledge-event-v2",
    scopeId: next.scope.id,
    aggregateKind,
    aggregateId,
    sourceId: source?.id ?? null,
    versionId: v?.id ?? null,
    assignmentId,
    previousAssignmentId,
    approvalId,
    previousApprovalId,
    operation: command.operation,
    actorKind: server.kind === "PIPELINE" ? "PIPELINE" : "HUMAN",
    actorMemberId: actor?.memberId ?? null,
    systemActorId: server.kind === "PIPELINE" ? "synthetic-pipeline" : null,
    evidenceRef:
      command.operation === "RECORD_STAGE" ? command.evidenceRef : null,
    grantId,
    qualificationId,
    previousRevision,
    newRevision,
    occurredAt: server.now,
    requestId: server.requestId,
    receiptRef: server.receiptRef,
    reviewManifestDigest:
      v && v.submittedByMemberId !== null
        ? reviewManifestDigest(source!, v)
        : null,
    reasonCode: reason,
    invalidation,
    affectedAssignmentIds: [...affected],
    contentRemoval,
  });
  return { state: next, eventIntents: [event], existingVersionId: null };
}

/** Trusted pure expiry evaluation; it neither schedules nor persists delivery. */
export function evaluateExpiryIntents(stateInput: unknown, nowInput: unknown) {
  const p = parseContract(partitionSchema, stateInput),
    now = parseContract(stamp, nowInput);
  validateState(p);
  const intents = new Map<string, KnowledgeEvent>();
  const emit = (
    objectId: string,
    objectRevision: number,
    deadline: string | null,
    reason: KnowledgeEvent["reasonCode"],
    kind: KnowledgeEvent["aggregateKind"],
    v: KnowledgeVersion,
    assignment: Assignment,
    approvalId: string | null = null,
  ) => {
    if (!deadline || deadline > now) return;
    const key = canonicalDigest({
      scopeId: p.scope.id,
      objectId:
        kind === "RIGHTS"
          ? { id: objectId, rightsRevision: v.rights.revision }
          : objectId,
      revision: objectRevision,
      deadline,
      type: reason,
    });
    const existing = intents.get(key);
    if (existing) {
      existing.affectedAssignmentIds = sortedSet([
        ...existing.affectedAssignmentIds,
        assignment.id,
      ]);
      return;
    }
    intents.set(
      key,
      parseContract(eventSchema, {
        id: `expiry:${key}`,
        schemaVersion: "knowledge-event-v2",
        scopeId: p.scope.id,
        aggregateKind: kind,
        aggregateId: objectId,
        sourceId: kind === "VERSION" ? v.sourceId : null,
        versionId: kind === "VERSION" ? v.id : null,
        assignmentId: null,
        previousAssignmentId: null,
        approvalId,
        previousApprovalId: null,
        operation: "EVALUATE_EXPIRY",
        actorKind: "SYSTEM",
        actorMemberId: null,
        systemActorId: "expiry-evaluator",
        evidenceRef: null,
        grantId: kind === "GRANT" ? objectId : null,
        qualificationId: kind === "QUALIFICATION" ? objectId : null,
        previousRevision: objectRevision,
        newRevision: objectRevision,
        occurredAt: now,
        requestId: `expiry:${key}`,
        receiptRef: null,
        reviewManifestDigest: approvalId
          ? (v.approvals.find((a) => a.id === approvalId)
              ?.reviewManifestDigest ?? null)
          : null,
        reasonCode: reason,
        invalidation: "ELIGIBILITY",
        affectedAssignmentIds: [assignment.id],
        contentRemoval: reason === "RIGHTS_EXPIRED",
      }),
    );
  };
  for (const a of p.assignments.filter((a) => !a.retiredAt)) {
    const v = p.versions.find((v) => v.id === a.versionId)!;
    emit(
      v.rights.id,
      v.rightsOverlay.revision,
      v.rights.expiresAt,
      "RIGHTS_EXPIRED",
      "RIGHTS",
      v,
      a,
    );
    emit(
      v.id,
      v.revision,
      v.health.hardExpiresAt,
      "HEALTH_EXPIRED",
      "VERSION",
      v,
      a,
    );
    if (v.health.lkg)
      emit(
        v.id,
        v.revision,
        v.health.lkg.until,
        "HEALTH_EXPIRED",
        "VERSION",
        v,
        a,
      );
    else if (v.health.state === "CURRENT")
      emit(
        v.id,
        v.revision,
        v.health.warningAt,
        "HEALTH_EXPIRED",
        "VERSION",
        v,
        a,
      );
    const approval = v.approvals.find((x) => x.id === a.approvalId);
    if (approval)
      emit(
        approval.id,
        v.revision,
        approval.reviewDueAt,
        "APPROVAL_EXPIRED",
        "VERSION",
        v,
        a,
        approval.id,
      );
    const grantIds = [
      approval?.reviewGrantId,
      v.rights.verificationGrantId,
      v.health.lkg?.reviewGrantId,
    ];
    const qualificationIds = [
      approval?.qualificationId,
      v.rights.verificationQualificationId,
      v.health.lkg?.qualificationId,
    ];
    for (const g of p.grants.filter((g) => grantIds.includes(g.id)))
      emit(g.id, g.revision, g.expiresAt, "GRANT_EXPIRED", "GRANT", v, a);
    for (const q of p.qualifications.filter((q) =>
      qualificationIds.includes(q.id),
    ))
      emit(
        q.id,
        q.revision,
        q.reviewDueAt < q.expiresAt ? q.reviewDueAt : q.expiresAt,
        "QUALIFICATION_EXPIRED",
        "QUALIFICATION",
        v,
        a,
      );
  }
  return [...intents.values()].sort((a, b) => ordinal(a.id, b.id));
}
