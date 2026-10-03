import { z } from "zod";
import {
  sourceSchema,
  versionSchema,
  roles,
  requiredReviewer,
  type KnowledgeVersion,
} from "./contracts";
import { hasCurrentApproval, licenseAllows, parseContract } from "./resolver";
const actorSchema = z
  .object({
    kind: z.literal("HUMAN"),
    id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
    roles: z.array(z.enum(roles)),
    permissions: z.array(
      z.enum(["KNOWLEDGE_REVIEW", "KNOWLEDGE_ACTIVATE", "KNOWLEDGE_REVOKE"]),
    ),
    organizationId: z.string().optional(),
    publicKnowledgeSteward: z.boolean(),
  })
  .strict();
const commandSchema = z
  .object({
    action: z.enum(["APPROVE", "ACTIVATE", "SUPERSEDE", "REVOKE", "ROLLBACK"]),
    expectedRevision: z.number().int().nonnegative(),
    now: z
      .string()
      .datetime()
      .transform((v) => new Date(v).toISOString()),
    reasonCode: z.string().regex(/^[A-Z][A-Z0-9_]{0,95}$/),
    reviewDueAt: z.string().datetime().optional(),
    supersededBy: z.string().optional(),
  })
  .strict();
// Pure reducer only. Actor MUST come from trusted server auth, never a request/model
// body. Durable CAS, audit/outbox and authentication adapter are a later packet.
export function transitionKnowledge(
  sourceInput: unknown,
  versionInput: unknown,
  actorInput: unknown,
  commandInput: unknown,
) {
  const source = parseContract(sourceSchema, sourceInput);
  const current = parseContract(versionSchema, versionInput);
  const actor = parseContract(actorSchema, actorInput);
  const command = parseContract(commandSchema, commandInput);
  const fail = (code: string): never => {
    throw new Error(code);
  };
  if (source.id !== current.sourceId) fail("SOURCE_ID_MISMATCH");
  if (
    source.scope.kind === "PUBLIC"
      ? !actor.publicKnowledgeSteward
      : source.scope.organizationId !== actor.organizationId
  )
    fail("KNOWLEDGE_SCOPE_DENIED");
  if (current.revision !== command.expectedRevision)
    fail("KNOWLEDGE_REVISION_CONFLICT");
  if (
    current.state === "REVOKED" ||
    current.revokedAt ||
    current.health.state === "REVOKED"
  )
    fail("KNOWLEDGE_REVOKED");
  const permission =
    command.action === "APPROVE"
      ? "KNOWLEDGE_REVIEW"
      : command.action === "REVOKE"
        ? "KNOWLEDGE_REVOKE"
        : "KNOWLEDGE_ACTIVATE";
  if (!actor.permissions.includes(permission))
    fail("KNOWLEDGE_PERMISSION_DENIED");
  const next: KnowledgeVersion = structuredClone(current);
  if (command.action === "APPROVE") {
    if (
      current.state !== "REVIEW_PENDING" ||
      !actor.roles.includes(requiredReviewer(source.domain))
    )
      fail("QUALIFIED_REVIEW_REQUIRED");
    if (
      !command.reviewDueAt ||
      Date.parse(command.reviewDueAt) <= Date.parse(command.now)
    )
      fail("REVIEW_EXPIRY_REQUIRED");
    next.approvals.push({
      reviewerId: actor.id,
      reviewerRole: requiredReviewer(source.domain),
      versionId: current.id,
      normalizedHash: current.normalizedHash,
      reviewedAt: command.now,
      reviewDueAt: new Date(command.reviewDueAt!).toISOString(),
    });
    next.state = "APPROVED";
  } else if (command.action === "REVOKE") {
    next.state = "REVOKED";
    next.revokedAt = command.now;
    next.revocationReason = command.reasonCode;
  } else if (command.action === "SUPERSEDE") {
    if (
      current.state !== "ACTIVE" ||
      !command.supersededBy ||
      command.supersededBy === current.id
    )
      fail("INVALID_SUPERSESSION");
    next.state = "SUPERSEDED";
    next.supersededBy = command.supersededBy!;
  } else {
    if (
      current.state !==
      (command.action === "ROLLBACK" ? "SUPERSEDED" : "APPROVED")
    )
      fail("INVALID_ACTIVATION_TRANSITION");
    if (
      source.educationalOnly ||
      !hasCurrentApproval(source, current, command.now) ||
      !licenseAllows(current, command.now, "INTERNAL_STORAGE")
    )
      fail("ACTIVATION_REVIEW_OR_RIGHTS_REQUIRED");
    if (
      current.health.state !== "CURRENT" ||
      current.health.checkedAt > command.now ||
      current.health.warningAt <= command.now ||
      current.health.hardExpiresAt <= command.now ||
      current.retrievedAt > command.now
    )
      fail("ACTIVATION_HEALTH_REQUIRED");
    next.state = "ACTIVE";
    next.activatedAt = command.now;
    next.supersededBy = null;
  }
  next.revision++;
  return {
    version: parseContract(versionSchema, next),
    event: {
      versionId: current.id,
      revision: next.revision,
      actorId: actor.id,
      action: command.action,
      from: current.state,
      to: next.state,
      at: command.now,
      reasonCode: command.reasonCode,
      normalizedHash: current.normalizedHash,
      invalidatesOpenReviews: ["REVOKE", "SUPERSEDE", "ROLLBACK"].includes(
        command.action,
      ),
    },
  };
}
