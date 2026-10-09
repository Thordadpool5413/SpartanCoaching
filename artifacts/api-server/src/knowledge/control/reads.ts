import { z } from "zod";
import type { Pool } from "pg";
import {
  domains,
  id,
  partitionSchema,
  type AuthorityDomain,
} from "../foundation/contracts";
import { canonicalBytes, parseContract } from "../foundation/canonical";
import {
  requireCapability,
  validateGrantAncestry,
} from "../foundation/authority";
import { preliminaryAuth, lockIdentity } from "./auth";
import {
  acquire,
  CommandDeadline,
  contention,
  infrastructureFailure,
  KnowledgeUnavailable,
} from "../persistence/deadline";
import { assertNonOwner } from "../persistence/commands";
import {
  type Row,
  number,
  text,
  scopeFromRow,
  grantFromRow,
  timestamp,
  date,
} from "../persistence/codec";
const querySchema = z
  .object({
    kind: z.enum(["sources", "versions", "assignments", "approvals"]),
    domain: z.enum(domains),
    versionId: id.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().max(512).optional(),
  })
  .strict();
const cursorSchema = z
  .object({
    scopeId: id,
    kind: querySchema.shape.kind,
    domain: z.enum(domains),
    versionId: id.nullable(),
    last: id,
    revision: z.number().int().safe().nonnegative().nullable(),
  })
  .strict();
export async function readKnowledge(
  pool: Pool,
  token: string | null,
  scopeKind: "global" | "tenant",
  query: unknown | null,
  options: { synthetic?: boolean; deadline?: CommandDeadline } = {},
) {
  if (!token) throw new Error("UNAUTHENTICATED");
  const c = await acquire(pool, options.deadline ?? new CommandDeadline());
  try {
    await assertNonOwner(c);
    const identity = await preliminaryAuth(c, token),
      scopeId =
        scopeKind === "global" ? "global" : `tenant:${identity.organizationId}`;
    await c.begin();
    const scopeRow = (
      await c.query<Row>(
        "SELECT * FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
        [scopeId],
      )
    ).rows[0];
    if (!scopeRow) throw new Error("KNOWLEDGE_SCOPE_DENIED");
    const scope = scopeFromRow(scopeRow);
    const grants = (
      await c.query<Row>(
        `WITH RECURSIVE selected AS (SELECT * FROM knowledge_grants WHERE scope_id=$1 AND subject_member_id=$2 UNION SELECT g.* FROM knowledge_grants g JOIN selected s ON g.scope_id=s.scope_id AND g.grant_id=s.parent_grant_id) SELECT * FROM selected ORDER BY grant_id COLLATE "C"`,
        [scopeId, identity.memberId],
      )
    ).rows;
    const memberIds = [
      ...new Set(
        grants.flatMap((g) => [
          number(g.subject_member_id),
          number(g.granted_by_member_id),
          number(g.verified_by_member_id),
        ]),
      ),
    ];
    const lockedIdentity = await lockIdentity(
      c,
      identity,
      memberIds,
      scope,
      options.synthetic === true,
    );
    const lockedGrants = (
      await c.query<Row>(
        'SELECT * FROM knowledge_grants WHERE scope_id=$1 AND grant_id=ANY($2::text[]) ORDER BY grant_id COLLATE "C" FOR UPDATE',
        [scopeId, grants.map((g) => text(g.grant_id))],
      )
    ).rows;
    const now = timestamp(
      (await c.query<Row>("SELECT clock_timestamp() AS now")).rows[0].now,
    );
    const p = parseContract(partitionSchema, {
      scope,
      revision: number(scopeRow.revision),
      sources: [],
      versions: [],
      assignments: [],
      grants: lockedGrants.map(grantFromRow),
      qualifications: [],
      members: lockedIdentity.members,
      configuration: {
        supportedPayers: scopeRow.supported_payers,
        supportedJurisdictions: scopeRow.supported_jurisdictions,
      },
    });
    validateGrantAncestry(p);
    const readableDomains = domains.filter((domain) => {
      try {
        requireCapability(
          p,
          lockedIdentity.actor,
          domain,
          "knowledge.read",
          now,
        );
        return true;
      } catch {
        return false;
      }
    });
    if (!readableDomains.length) throw new Error("KNOWLEDGE_PERMISSION_DENIED");
    if (query === null) {
      await c.finishRead();
      return {
        scope,
        revision: p.revision,
        configuration: p.configuration,
        readableDomains,
      };
    }
    const q = parseContract(querySchema, query);
    if (!readableDomains.includes(q.domain as AuthorityDomain))
      throw new Error("KNOWLEDGE_PERMISSION_DENIED");
    if (
      (q.kind === "approvals" && !q.versionId) ||
      (q.kind !== "approvals" && q.versionId)
    )
      throw new Error("KNOWLEDGE_CONTRACT_INVALID");
    let cursor: z.infer<typeof cursorSchema> | null = null;
    if (q.cursor) {
      try {
        const bytes = Buffer.from(q.cursor, "base64url").toString("utf8");
        const values = JSON.parse(bytes);
        if (!Array.isArray(values) || values.length !== 6)
          throw new Error("KNOWLEDGE_CONTRACT_INVALID");
        cursor = parseContract(cursorSchema, {
          scopeId: values[0],
          kind: values[1],
          domain: values[2],
          versionId: values[3],
          last: values[4],
          revision: values[5],
        });
      } catch {
        throw new Error("KNOWLEDGE_CONTRACT_INVALID");
      }
      if (
        cursor.scopeId !== scopeId ||
        cursor.kind !== q.kind ||
        cursor.domain !== q.domain ||
        cursor.versionId !== (q.versionId ?? null)
      )
        throw new Error("KNOWLEDGE_CONTRACT_INVALID");
    }
    const params: unknown[] = [
      scopeId,
      q.domain,
      cursor?.last ?? null,
      cursor?.revision ?? null,
      q.limit + 1,
      q.versionId ?? null,
    ];
    const queries = {
      sources: `SELECT s.source_id AS id,s.metadata_revision,s.publisher,s.title,s.domain,s.claim_types,s.official_url,s.educational_only FROM knowledge_source_revisions s WHERE s.scope_id=$1 AND s.domain=$2 AND ($3::text IS NULL OR (s.source_id COLLATE "C",s.metadata_revision)>($3 COLLATE "C",COALESCE($4::bigint,0))) ORDER BY s.source_id COLLATE "C",s.metadata_revision LIMIT $5`,
      versions: `SELECT v.version_id AS id,v.source_id,v.source_metadata_revision,v.document_id,v.upstream_edition,v.artifact_revision,v.state,v.revision,v.effective_from,v.effective_to,v.rights_revision_id FROM knowledge_versions v JOIN knowledge_source_revisions s ON s.scope_id=v.scope_id AND s.source_id=v.source_id AND s.metadata_revision=v.source_metadata_revision WHERE v.scope_id=$1 AND s.domain=$2 AND ($3::text IS NULL OR v.version_id COLLATE "C">$3 COLLATE "C") ORDER BY v.version_id COLLATE "C" LIMIT $5`,
      assignments: `SELECT p.assignment_id AS id,p.source_id,p.document_id,p.version_id,p.approval_id,p.review_manifest_digest,p.service_from,p.service_to,p.enabled_uses,p.revision,p.retired_at,p.predecessor_assignment_id FROM knowledge_publication_assignments p JOIN knowledge_versions v ON v.scope_id=p.scope_id AND v.version_id=p.version_id JOIN knowledge_source_revisions s ON s.scope_id=v.scope_id AND s.source_id=v.source_id AND s.metadata_revision=v.source_metadata_revision WHERE p.scope_id=$1 AND s.domain=$2 AND ($3::text IS NULL OR p.assignment_id COLLATE "C">$3 COLLATE "C") ORDER BY p.assignment_id COLLATE "C" LIMIT $5`,
      approvals: `SELECT a.approval_id AS id,a.version_id,a.review_manifest_digest,a.reviewed_at,a.review_due_at FROM knowledge_approvals a JOIN knowledge_versions v ON v.scope_id=a.scope_id AND v.version_id=a.version_id JOIN knowledge_source_revisions s ON s.scope_id=v.scope_id AND s.source_id=v.source_id AND s.metadata_revision=v.source_metadata_revision WHERE a.scope_id=$1 AND s.domain=$2 AND a.version_id=$6 AND ($3::text IS NULL OR a.approval_id COLLATE "C">$3 COLLATE "C") ORDER BY a.approval_id COLLATE "C" LIMIT $5`,
    };
    // Bind only placeholders used by the selected statement; no caller-controlled SQL.
    const sql =
      "WITH parameter_types AS (SELECT $4::bigint,$6::text) " + queries[q.kind];
    const values = params;
    const rows = (await c.query<Row>(sql, values)).rows,
      more = rows.length > q.limit,
      items = rows.slice(0, q.limit);
    const last = items.at(-1);
    const next =
      more && last
        ? Buffer.from(
            canonicalBytes([
              scopeId,
              q.kind,
              q.domain,
              q.versionId ?? null,
              last.id,
              q.kind === "sources" ? number(last.metadata_revision) : null,
            ]),
          ).toString("base64url")
        : null;
    await c.finishRead();
    if (next && next.length > 512) throw new Error("KNOWLEDGE_INTERNAL_ERROR");
    const serialized = items.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          value == null
            ? null
            : [
                  "metadata_revision",
                  "source_metadata_revision",
                  "artifact_revision",
                  "revision",
                ].includes(key)
              ? number(value)
              : [
                    "effective_from",
                    "effective_to",
                    "service_from",
                    "service_to",
                  ].includes(key)
                ? date(value)
                : key.endsWith("_at")
                  ? timestamp(value)
                  : value,
        ]),
      ),
    );
    return { items: serialized, nextCursor: next };
  } catch (e) {
    if (contention(e)) throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
    if (infrastructureFailure(e))
      throw new KnowledgeUnavailable("COMMAND_UNAVAILABLE");
    throw e;
  } finally {
    await c.close();
  }
}
