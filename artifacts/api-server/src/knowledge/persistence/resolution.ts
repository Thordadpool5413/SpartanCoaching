import type { Pool } from "pg";
import {
  authorityMatrix,
  contextSchema,
  type Partition,
  type Actor,
} from "../foundation/contracts";
import { parseContract } from "../foundation/canonical";
import { createKnowledgeRegistry } from "../foundation/resolver";
import { requireCapability } from "../foundation/authority";
import { acquire, CommandDeadline } from "./deadline";
import { assertNonOwner } from "./commands";
import { preliminaryAuth } from "../control/auth";
import { projectCommand } from "./projection";
import { text, timestamp, type Row } from "./codec";
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
          "SELECT scope_id FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
          [scopeId],
        )
      ).rows[0];
      if (!scope) {
        await c.finishRead();
        continue;
      }
      const ids = (
        await c.query<Row>(
          `SELECT v.version_id FROM knowledge_versions v JOIN knowledge_source_revisions s ON s.scope_id=v.scope_id AND s.source_id=v.source_id AND s.metadata_revision=v.source_metadata_revision
        WHERE v.scope_id=$1 AND s.domain=ANY($2::text[]) ORDER BY v.version_id COLLATE "C" LIMIT 2001`,
          [scopeId, authorityMatrix[context.claimType]],
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
      );
      if (!p.actor) throw new Error("KNOWLEDGE_INTERNAL_ERROR");
      actor = p.actor;
      if (
        !authorityMatrix[context.claimType].some((domain) => {
          try {
            requireCapability(
              p.state,
              p.actor!,
              domain,
              "knowledge.read",
              p.now,
            );
            return true;
          } catch {
            return false;
          }
        })
      )
        throw new Error("KNOWLEDGE_PERMISSION_DENIED");
      // Materialized sources are authorized individually; roles never substitute for read grants.
      for (const source of p.state.sources)
        requireCapability(
          p.state,
          p.actor,
          source.domain,
          "knowledge.read",
          p.now,
        );
      partitions.push(p.state);
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
