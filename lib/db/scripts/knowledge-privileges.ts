/** Owner-only provisioning primitive; never creates roles or changes production config. */
import type { PoolClient } from "pg";

export const knowledgeTables = [
  "scopes",
  "scope_members",
  "sources",
  "source_revisions",
  "documents",
  "rights_terms",
  "rights_state",
  "versions",
  "grants",
  "qualifications",
  "approvals",
  "lkg_attestations",
  "health_observations",
  "publication_assignments",
  "command_receipts",
  "audit_events",
  "outbox",
  "consumer_receipts",
] as const;
const mutable: Record<string, string[]> = {
  scopes: ["revision"],
  versions: [
    "state",
    "revision",
    "activated_at",
    "revoked_at",
    "revocation_reason",
    "submitted_by_member_id",
    "current_health_revision",
  ],
  rights_state: ["revision", "revoked_at"],
  grants: ["revision", "revoked_at"],
  qualifications: ["revision", "revoked_at"],
  publication_assignments: ["revision", "retired_at", "retirement_event_id"],
  outbox: [
    "available_at",
    "attempts",
    "lease_token",
    "lease_expires_at",
    "delivered_at",
    "dead_lettered_at",
    "last_error_code",
  ],
};
const lockColumns: Record<string, string> = {
  scopes: "scope_id",
  scope_members: "scope_id",
  sources: "source_id",
  source_revisions: "source_id",
  documents: "document_id",
  versions: "version_id",
  grants: "grant_id",
  qualifications: "qualification_id",
  rights_terms: "rights_revision_id",
  rights_state: "rights_revision_id",
  health_observations: "version_id",
};
export async function installKnowledgePrivileges(
  owner: PoolClient,
  role: string,
): Promise<void> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(role))
    throw new Error("KNOWLEDGE_ROLE_INVALID");
  const check = await owner.query(
    `SELECT r.rolsuper,r.rolbypassrls,
    EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname LIKE 'knowledge_%' AND pg_has_role(r.oid,c.relowner,'MEMBER')) AS owns
    FROM pg_roles r WHERE r.rolname=$1`,
    [role],
  );
  if (
    check.rows.length !== 1 ||
    check.rows[0].rolsuper ||
    check.rows[0].rolbypassrls ||
    check.rows[0].owns
  )
    throw new Error("KNOWLEDGE_NONOWNER_ROLE_REQUIRED");
  await owner.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);
  for (const suffix of knowledgeTables) {
    const table = `"knowledge_${suffix}"`;
    await owner.query(`REVOKE ALL ON ${table} FROM "${role}"`);
    await owner.query(`GRANT SELECT, INSERT ON ${table} TO "${role}"`);
    const columns = [
      ...new Set([
        ...(mutable[suffix] ?? []),
        ...(lockColumns[suffix] ? [lockColumns[suffix]] : []),
      ]),
    ];
    if (columns.length)
      await owner.query(
        `GRANT UPDATE (${columns.map((c) => `"${c}"`).join(",")}) ON ${table} TO "${role}"`,
      );
  }
  // Identity reads/locks use canonical tables; mutation grants are never added here.
  for (const [table, key] of [
    ["client_organizations", "id"],
    ["client_members", "id"],
    ["client_sessions", "id"],
  ]) {
    await owner.query(
      `GRANT SELECT, UPDATE ("${key}") ON "${table}" TO "${role}"`,
    );
  }
}
