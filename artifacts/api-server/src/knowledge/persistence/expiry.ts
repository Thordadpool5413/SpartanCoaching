import type { Pool } from "pg";
import { z } from "zod";
import {
  aggregateKinds,
  id,
  expiryIntentsSchema,
} from "../foundation/contracts";
import { canonicalDigest, parseContract } from "../foundation/canonical";
import { acquire, CommandDeadline } from "./deadline";
import { assertNonOwner } from "./commands";
import { projectCommand } from "./projection";
import { evaluate } from "./evaluation";
import { persistEvent } from "./writes";
import { timestamp, text, type Row } from "./codec";
const targetSchema = z
  .object({
    scopeId: id,
    aggregateKind: z.enum(aggregateKinds).exclude(["PUBLICATION"]),
    aggregateId: id,
  })
  .strict();
/** Internal primitive only. One canonical expiry event per transaction; no scheduler is activated. */
export async function persistDueExpiry(pool: Pool, input: unknown) {
  const deadline = new CommandDeadline(),
    target = parseContract(targetSchema, input),
    c = await acquire(pool, deadline);
  try {
    await assertNonOwner(c);
    await c.begin();
    const scope = (
      await c.query(
        "SELECT scope_id FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
        [target.scopeId],
      )
    ).rows[0];
    if (!scope) throw new Error("KNOWLEDGE_SCOPE_DENIED");
    const row = (
      await c.query<Row>(
        `SELECT v.version_id FROM knowledge_versions v JOIN knowledge_rights_terms r ON r.scope_id=v.scope_id AND r.rights_revision_id=v.rights_revision_id
      JOIN knowledge_health_observations h ON h.scope_id=v.scope_id AND h.version_id=v.version_id AND h.version_revision=v.current_health_revision
      LEFT JOIN knowledge_lkg_attestations l ON l.scope_id=h.scope_id AND l.version_id=h.version_id AND l.lkg_id=h.lkg_id
      WHERE v.scope_id=$1 AND EXISTS(SELECT 1 FROM knowledge_publication_assignments p WHERE p.scope_id=v.scope_id AND p.version_id=v.version_id AND p.retired_at IS NULL)
      AND (($2='VERSION' AND v.version_id=$3) OR ($2='RIGHTS_REVISION' AND r.rights_revision_id=$3)
      OR ($2='GRANT' AND (r.verification_grant_id=$3 OR l.health_grant_id=$3 OR l.review_grant_id=$3 OR EXISTS(SELECT 1 FROM knowledge_approvals a WHERE a.scope_id=v.scope_id AND a.version_id=v.version_id AND a.review_grant_id=$3)))
      OR ($2='QUALIFICATION' AND (r.verification_qualification_id=$3 OR l.qualification_id=$3 OR EXISTS(SELECT 1 FROM knowledge_approvals a WHERE a.scope_id=v.scope_id AND a.version_id=v.version_id AND a.qualification_id=$3)))) ORDER BY v.version_id COLLATE "C" LIMIT 1`,
        [target.scopeId, target.aggregateKind, target.aggregateId],
      )
    ).rows[0];
    if (!row) {
      await c.finishRead();
      return { eventId: null };
    }
    const p = await projectCommand(
      c,
      null,
      target.scopeId,
      {
        operation: "REVOKE",
        versionId: text(row.version_id),
        expectedScopeRevision: 0,
        expectedVersionRevisions: {},
      },
      false,
    );
    const now = timestamp(
      (await c.query<Row>("SELECT clock_timestamp() AS now")).rows[0].now,
    );
    const intents = parseContract(
      expiryIntentsSchema,
      await evaluate({ task: "expiry", state: p.state, now }, deadline),
    );
    const candidates = intents.filter(
      (e) =>
        e.aggregateKind === target.aggregateKind &&
        e.aggregateId === target.aggregateId,
    );
    const previous = (
      await c.query<Row>(
        "SELECT event_id,body_hash FROM knowledge_audit_events WHERE scope_id=$1 AND event_id=ANY($2::text[])",
        [target.scopeId, candidates.map((e) => e.id)],
      )
    ).rows;
    for (const event of candidates) {
      const row = previous.find((r) => r.event_id === event.id);
      if (row && row.body_hash !== canonicalDigest(event))
        throw new Error("KNOWLEDGE_EVENT_INTEGRITY_ERROR");
    }
    const event = candidates.find(
      (e) => !previous.some((r) => r.event_id === e.id),
    );
    if (!event) {
      await c.finishRead();
      return { eventId: candidates[0]?.id ?? null };
    }
    await persistEvent(c, event, now);
    deadline.remaining();
    await c.commit();
    return { eventId: event.id };
  } finally {
    await c.close();
  }
}
