import {
  type Actor,
  type Capability,
  type Partition,
} from "../foundation/contracts";
import {
  requireCapability,
  requireQualification,
  grantContextEligible,
  grantEligible,
  actorInScope,
  memberCurrent,
} from "../foundation/authority";
import { validateState } from "../foundation/stateValidation";
import { fail } from "../foundation/canonical";
import type { Command } from "../persistence/projection";
/** Replay checks current operation authority, excluding old CAS, transition and publication eligibility. */
export function requireCommandAuthority(
  p: Partition,
  actor: Actor,
  command: Command,
  now: string,
) {
  validateState(p, now);
  if (!actorInScope(actor, p.scope) || !memberCurrent(p, actor.memberId))
    fail("KNOWLEDGE_SCOPE_DENIED");
  if (command.operation === "REGISTER") {
    requireCapability(
      p,
      actor,
      command.source.domain,
      "knowledge.register",
      now,
    );
    return;
  }
  if (
    command.operation === "REVOKE_GRANT" ||
    command.operation === "REVOKE_QUALIFICATION"
  ) {
    const target =
      command.operation === "REVOKE_GRANT"
        ? p.grants.find((g) => g.id === command.credentialId)
        : p.qualifications.find((q) => q.id === command.credentialId);
    if (!target) fail("KNOWLEDGE_REFERENCE_INVALID");
    if (
      !("capabilities" in target) ||
      !target.capabilities.includes("knowledge.grants")
    )
      for (const domain of target.domains)
        requireCapability(p, actor, domain, "knowledge.grants", now);
    if ("capabilities" in target)
      for (const capability of target.capabilities) {
        if (
          !p.grants.some(
            (g) =>
              g.subjectMemberId === actor.memberId &&
              grantContextEligible(p, g, actor.synthetic) &&
              target.domains.every((d) =>
                grantEligible(g, p.scope, d, capability, now, actor.synthetic),
              ),
          )
        )
          fail("KNOWLEDGE_DELEGATION_DENIED");
      }
    return;
  }
  if (command.operation === "RECORD_STAGE") fail("KNOWLEDGE_PIPELINE_REQUIRED");
  if (!("versionId" in command)) fail("KNOWLEDGE_REFERENCE_INVALID");
  const version = p.versions.find((v) => v.id === command.versionId);
  if (!version) fail("KNOWLEDGE_REFERENCE_INVALID");
  const source = p.sources.find(
    (s) =>
      s.id === version.sourceId &&
      s.metadataRevision === version.sourceMetadataRevision,
  );
  if (!source) fail("KNOWLEDGE_REFERENCE_INVALID");
  const capability: Partial<Record<Command["operation"], Capability>> = {
    SUBMIT: "knowledge.submit",
    APPROVE: "knowledge.review",
    REAPPROVE: "knowledge.review",
    REJECT_REVIEW: "knowledge.review",
    ACTIVATE: "knowledge.activate",
    SUPERSEDE: "knowledge.activate",
    ROLLBACK: "knowledge.rollback",
    REFRESH_APPROVAL: "knowledge.activate",
    REVOKE: "knowledge.revoke",
    RECORD_HEALTH: "knowledge.health",
    APPROVE_LKG: "knowledge.health",
    REVOKE_RIGHTS: "knowledge.license",
  };
  requireCapability(
    p,
    actor,
    source.domain,
    capability[command.operation]!,
    now,
  );
  if (command.operation === "REVOKE_RIGHTS")
    for (const other of p.versions.filter(
      (v) =>
        v.rightsOverlay.rightsRevisionId ===
        version.rightsOverlay.rightsRevisionId,
    )) {
      const s = p.sources.find(
        (s) =>
          s.id === other.sourceId &&
          s.metadataRevision === other.sourceMetadataRevision,
      )!;
      requireCapability(p, actor, s.domain, "knowledge.license", now);
    }
  if (
    ["APPROVE", "REAPPROVE", "REJECT_REVIEW", "APPROVE_LKG"].includes(
      command.operation,
    )
  ) {
    if (command.operation === "APPROVE_LKG")
      requireCapability(p, actor, source.domain, "knowledge.review", now);
    requireQualification(p, actor, source, version, now);
  }
}
