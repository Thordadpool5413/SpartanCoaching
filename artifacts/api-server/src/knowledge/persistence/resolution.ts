import type { Pool } from "pg";
import {
  authorityMatrix,
  contextSchema,
  type Partition,
  type Actor,
} from "../foundation/contracts";
import { parseContract } from "../foundation/canonical";
import { createKnowledgeRegistry } from "../foundation/resolver";
import {
  grantEligible,
  grantContextEligible,
  validateGrantAncestry,
} from "../foundation/authority";
import { acquire, CommandDeadline } from "./deadline";
import { assertNonOwner } from "./commands";
import { preliminaryAuth, recheckIdentity } from "../control/auth";
import { projectCommand } from "./projection";
import { text, timestamp, scopeFromRow, grantFromRow, type Row } from "./codec";
/** Internal read-only adapter. GLOBAL and exact TENANT are sequential projections, not an atomic cross-scope snapshot. */
export async function resolvePersistedKnowledge(
  pool: Pool,
  token: string | null,
  input: unknown,
  synthetic = false,
) {
  const deadline = new CommandDeadline();
  if (!token) throw new Error("UNAUTHENTICATED");
  const context = parseContract(contextSchema, input),
    c = await acquire(pool, deadline);
  try {
    await assertNonOwner(c);
    const identity = await preliminaryAuth(c, token),
      partitions: Partition[] = [];
    let actor: Actor | null = null;
    for (const scopeId of ["global", `tenant:${identity.organizationId}`]) {
      await c.begin();
      const scope = (
        await c.query(
          "SELECT * FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
          [scopeId],
        )
      ).rows[0];
      if (!scope) {
        await c.finishRead();
        continue;
      }
      // Discovery is a hint under the scope lock, not Actor authority. Identity
      // and credentials are still locked in the canonical order by projectCommand
      // and rechecked before the canonical resolver makes the final decision.
      const scopeContract = scopeFromRow(scope);
      const discoveryNow = timestamp(
        (await c.query<Row>("SELECT clock_timestamp() AS now")).rows[0].now,
      );
      const grants = (
        await c.query<Row>(
          `WITH RECURSIVE selected AS (
        SELECT g.* FROM knowledge_grants g WHERE g.scope_id=$1 AND g.subject_member_id=$2 AND 'knowledge.read'=ANY(g.capabilities)
        UNION SELECT g.* FROM knowledge_grants g JOIN selected s ON g.scope_id=s.scope_id AND g.grant_id=s.parent_grant_id
      ) SELECT * FROM selected ORDER BY grant_id COLLATE "C"`,
          [scopeId, identity.memberId],
        )
      ).rows.map(grantFromRow);
      const roots = grants.filter(
        (g) =>
          g.subjectMemberId === identity.memberId &&
          g.domains.some((domain) =>
            grantEligible(
              g,
              scopeContract,
              domain,
              "knowledge.read",
              discoveryNow,
              synthetic,
            ),
          ),
      );
      const ancestry = [...roots];
      for (let i = 0; i < ancestry.length; i++) {
        const grant = ancestry[i];
        if (grant.issuance.kind === "DELEGATED") {
          const parentId = grant.issuance.parentGrantId;
          if (!ancestry.some((g) => g.id === parentId)) {
            const parent = grants.find((g) => g.id === parentId);
            if (!parent) throw new Error("KNOWLEDGE_REFERENCE_INVALID");
            ancestry.push(parent);
          }
        }
        if (ancestry.length > 2000)
          throw new Error("KNOWLEDGE_CAPACITY_EXCEEDED");
      }
      validateGrantAncestry({ scope: scopeContract, grants: ancestry });
      const allowed = [
        ...new Set(
          roots
            .filter((g) =>
              grantContextEligible(
                { scope: scopeContract, grants: ancestry },
                g,
                synthetic,
              ),
            )
            .flatMap((g) => g.domains),
        ),
      ].filter((domain) => authorityMatrix[context.claimType].includes(domain));
      const ids = (
        await c.query<Row>(
          `SELECT v.version_id FROM knowledge_versions v JOIN knowledge_source_revisions s ON s.scope_id=v.scope_id AND s.source_id=v.source_id AND s.metadata_revision=v.source_metadata_revision
        WHERE v.scope_id=$1 AND s.domain=ANY($2::text[]) AND EXISTS(SELECT 1 FROM knowledge_publication_assignments p WHERE p.scope_id=v.scope_id AND p.version_id=v.version_id AND p.retired_at IS NULL) ORDER BY v.version_id COLLATE "C" LIMIT 2001`,
          [scopeId, allowed],
        )
      ).rows.map((r) => text(r.version_id));
      if (ids.length > 2000) throw new Error("KNOWLEDGE_CAPACITY_EXCEEDED");
      const command = ids.length
        ? {
            operation: "REVOKE" as const,
            versionId: ids[0],
            expectedScopeRevision: 0,
            expectedVersionRevisions: {},
          }
        : {
            operation: "REVOKE_GRANT" as const,
            credentialId: "internal-read-projection",
            expectedScopeRevision: 0,
            expectedVersionRevisions: {},
            expectedCredentialRevision: 0,
          };
      const p = await projectCommand(
        c,
        identity,
        scopeId,
        command,
        synthetic,
        ids,
        true,
      );
      if (!p.actor) throw new Error("KNOWLEDGE_INTERNAL_ERROR");
      const fresh = await recheckIdentity(c, identity, p.state, synthetic);
      actor = fresh.actor;
      partitions.push(fresh.state);
      await c.finishRead();
    }
    if (!actor) throw new Error("KNOWLEDGE_SCOPE_DENIED");
    const now = timestamp(
      (await c.raw<Row>("SELECT clock_timestamp() AS now")).rows[0].now,
    );
    return createKnowledgeRegistry({
      contractVersion: "knowledge-foundation-v3",
      partitions,
    }).resolve(context, actor, now);
  } finally {
    await c.close();
  }
}
