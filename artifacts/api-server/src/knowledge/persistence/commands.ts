import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import {
  canonicalDigest,
  parseContract,
  sortedSet,
} from "../foundation/canonical";
import { transitionResultSchema, scopeSchema } from "../foundation/contracts";
import {
  receiptSchema,
  receiptKey,
  requestFingerprint,
} from "../foundation/future";
import { preliminaryAuth, recheckIdentity } from "../control/auth";
import { hydrateCommand } from "../control/contracts";
import { requireCommandAuthority } from "../control/authority";
import {
  CommandDeadline,
  acquire,
  contention,
  infrastructureFailure,
  KnowledgeUnavailable,
} from "./deadline";
import { projectCommand } from "./projection";
import { evaluate } from "./evaluation";
import { insert, persistDelta } from "./writes";
import { number, timestamp, type Row } from "./codec";
import type { z } from "zod";
import { recordKnowledgeMetric } from "../../observability/knowledgeMetrics";

export function receiptFromRow(row: Row) {
  return parseContract(receiptSchema, {
    scopeId: row.scope_id,
    actorMemberId: number(row.actor_member_id),
    operation: row.operation,
    keyHash: row.key_hash,
    fingerprint: row.fingerprint,
    committedAt: timestamp(row.committed_at),
    response: {
      scopeRevision: number(row.scope_revision),
      versionIds: row.version_ids,
      assignmentIds: row.assignment_ids,
      eventIds: row.event_id ? [row.event_id] : [],
    },
  });
}
export async function executeCommand(
  pool: Pool,
  token: string | null,
  scopeKind: "global" | "tenant",
  wire: unknown,
  key: unknown,
  options: { synthetic?: boolean; deadline?: CommandDeadline } = {},
) {
  if (!token) throw new Error("UNAUTHENTICATED");
  const started = performance.now();
  const deadline = options.deadline ?? new CommandDeadline(),
    c = await acquire(pool, deadline);
  try {
    await assertNonOwner(c);
    const identity = await preliminaryAuth(c, token),
      scope = parseContract(
        scopeSchema,
        scopeKind === "global"
          ? { id: "global", kind: "GLOBAL", organizationId: null }
          : {
              id: `tenant:${identity.organizationId}`,
              kind: "TENANT",
              organizationId: identity.organizationId,
            },
      );
    await c.begin();
    await c.query(
      "SELECT set_config('app.knowledge_scope_id',$1,true),set_config('app.actor_member_id',$2,true),set_config('app.request_id',$3,true)",
      [scope.id, String(identity.memberId), randomUUID()],
    );
    // Hydration reads immutable terms; scope acquisition precedes every authority lock.
    const lockedScope = (
      await c.query(
        "SELECT scope_id FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
        [scope.id],
      )
    ).rows[0];
    if (!lockedScope) throw new Error("KNOWLEDGE_SCOPE_DENIED");
    const command = await hydrateCommand(c, wire, scope, identity.memberId);
    const projection = await projectCommand(
      c,
      identity,
      scope.id,
      command,
      options.synthetic === true,
    );
    if (!projection.actor) throw new Error("KNOWLEDGE_INTERNAL_ERROR");
    requireCommandAuthority(
      projection.state,
      projection.actor,
      command,
      projection.now,
    );
    const canonicalKey = receiptKey(
        scope.id,
        identity.memberId,
        command.operation,
        key,
      ),
      fingerprint = requestFingerprint(command);
    const existing = (
      await c.query<Row>(
        "SELECT * FROM knowledge_command_receipts WHERE scope_id=$1 AND actor_member_id=$2 AND operation=$3 AND key_hash=$4",
        [scope.id, identity.memberId, command.operation, canonicalKey.keyHash],
      )
    ).rows[0];
    if (existing) {
      if (existing.fingerprint !== fingerprint)
        throw new Error("IDEMPOTENCY_CONFLICT");
      const receipt = receiptFromRow(existing);
      recordKnowledgeMetric("replay");
      await c.finishRead();
      return receipt.response;
    }
    const receiptRef = canonicalDigest({
      schemaVersion: "knowledge-receipt-ref-v1",
      ...canonicalKey,
    });
    const eventId = `command:${randomUUID()}`,
      requestId = `request:${randomUUID()}`;
    const server = {
      kind: "HUMAN_SERVER",
      synthetic: options.synthetic === true,
      now: projection.now,
      eventId,
      requestId,
      receiptRef,
    };
    const decision = await recheckIdentity(
      c,
      identity,
      projection.state,
      options.synthetic === true,
    );
    const result = parseContract(
      transitionResultSchema,
      await evaluate<z.infer<typeof transitionResultSchema>>(
        {
          task: "transition",
          state: decision.state,
          actor: decision.actor,
          command,
          server: { ...server, now: decision.now },
        },
        deadline,
      ),
    );
    for (const [collection, maximum] of [
      ["sources", 500],
      ["versions", 2000],
      ["assignments", 4000],
      ["grants", 2000],
      ["qualifications", 2000],
      ["members", 2000],
    ] as const) {
      const growth =
        result.state[collection].length - projection.state[collection].length;
      if (growth > 0 && projection.counts[collection] + growth > maximum)
        throw new Error("KNOWLEDGE_CAPACITY_EXCEEDED");
    }
    const now = decision.now;
    const event = result.eventIntents[0] ?? null;
    const delta = await persistDelta(
      c,
      projection.state,
      result.state,
      event,
      now,
    );
    const receipt = parseContract(receiptSchema, {
      ...canonicalKey,
      fingerprint,
      committedAt: now,
      response: {
        scopeRevision: result.state.revision,
        versionIds: result.existingVersionId
          ? [result.existingVersionId]
          : sortedSet(delta.versionIds),
        assignmentIds: sortedSet(delta.assignmentIds),
        eventIds: event ? [event.id] : [],
      },
    });
    await insert(c, "command_receipts", {
      scope_id: scope.id,
      actor_member_id: identity.memberId,
      operation: command.operation,
      key_hash: canonicalKey.keyHash,
      receipt_ref: receiptRef,
      fingerprint,
      committed_at: now,
      scope_revision: receipt.response.scopeRevision,
      version_ids: receipt.response.versionIds,
      assignment_ids: receipt.response.assignmentIds,
      event_id: event?.id ?? null,
    });
    const commit = await recheckIdentity(
      c,
      identity,
      projection.state,
      options.synthetic === true,
    );
    // Expiring authority cannot be replaced silently after its witness was persisted.
    const current = parseContract(
      transitionResultSchema,
      await evaluate(
        {
          task: "transition",
          state: commit.state,
          actor: commit.actor,
          command,
          server: { ...server, now: commit.now },
        },
        deadline,
      ),
    );
    if (
      canonicalDigest(
        current.eventIntents.map((e) => e.authorizationWitnesses),
      ) !==
      canonicalDigest(result.eventIntents.map((e) => e.authorizationWitnesses))
    )
      throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
    deadline.remaining();
    await c.commit();
    return receipt.response;
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (["KNOWLEDGE_REVISION_CONFLICT", "IDEMPOTENCY_CONFLICT"].includes(code))
      recordKnowledgeMetric("conflict");
    if (code === "COMMAND_OUTCOME_UNKNOWN")
      recordKnowledgeMetric("outcome_unknown");
    if (code === "COMMAND_UNAVAILABLE") recordKnowledgeMetric("unavailable");
    if (contention(e)) throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
    if (infrastructureFailure(e))
      throw new KnowledgeUnavailable("COMMAND_UNAVAILABLE");
    throw e;
  } finally {
    recordKnowledgeMetric("command_ms", performance.now() - started);
    await c.close();
  }
}
export async function assertNonOwner(c: Awaited<ReturnType<typeof acquire>>) {
  const row = (
    await c.raw<Row>(
      `SELECT r.rolsuper,r.rolbypassrls,(SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname=session_user) AS session_privileged,EXISTS(SELECT 1 FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname LIKE 'knowledge_%' AND (pg_has_role(r.oid,t.relowner,'MEMBER') OR pg_has_role(session_user,t.relowner,'MEMBER'))) AS owns FROM pg_roles r WHERE r.rolname=current_user`,
    )
  ).rows[0];
  if (
    !row ||
    row.rolsuper ||
    row.rolbypassrls ||
    row.session_privileged ||
    row.owns
  )
    throw new KnowledgeUnavailable("COMMAND_UNAVAILABLE");
}
