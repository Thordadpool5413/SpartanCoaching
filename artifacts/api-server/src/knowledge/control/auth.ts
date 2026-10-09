import { hashToken } from "../../auth/crypto";
import {
  actorSchema,
  type Actor,
  type Partition,
} from "../foundation/contracts";
import { parseContract } from "../foundation/canonical";
import { number, timestamp, type Row } from "../persistence/codec";
import {
  CommandConnection,
  KnowledgeUnavailable,
} from "../persistence/deadline";

export function organizationEligible(org: Row, now: string): boolean {
  if (org.status === "trial")
    return org.trial_ends_at == null || timestamp(org.trial_ends_at) > now;
  if (org.status !== "active") return false;
  return !(
    org.billing_provider === "apple" &&
    org.current_period_end != null &&
    timestamp(org.current_period_end) <= now
  );
}
export function memberEligible(member: Row): boolean {
  return (
    member.status === "active" &&
    typeof member.password_hash === "string" &&
    member.password_hash.length > 0
  );
}
export interface SessionIdentity {
  memberId: number;
  organizationId: number;
  sessionId: number;
  tokenHash: string;
}
/** Re-read only identities already locked by this transaction; no late lock acquisition. */
export async function recheckIdentity(
  connection: CommandConnection,
  identity: SessionIdentity,
  state: Partition,
  synthetic: boolean,
) {
  const members = (
    await connection.query<Row>(
      "SELECT * FROM client_members WHERE id=ANY($1::int[]) ORDER BY id",
      [state.members.map((m) => m.memberId)],
    )
  ).rows;
  const orgIds = [...new Set(members.map((m) => number(m.organization_id)))];
  const orgs = (
    await connection.query<Row>(
      "SELECT * FROM client_organizations WHERE id=ANY($1::int[]) ORDER BY id",
      [orgIds],
    )
  ).rows;
  const session = (
    await connection.query<Row>(
      "SELECT * FROM client_sessions WHERE id=$1 AND member_id=$2 AND token_hash=$3",
      [identity.sessionId, identity.memberId, identity.tokenHash],
    )
  ).rows[0];
  const now = timestamp(
    (await connection.query<Row>("SELECT clock_timestamp() AS now")).rows[0]
      .now,
  );
  const member = members.find((m) => number(m.id) === identity.memberId),
    org = orgs.find((o) => number(o.id) === identity.organizationId);
  if (
    !member ||
    !session ||
    !memberEligible(member) ||
    number(member.organization_id) !== identity.organizationId ||
    timestamp(session.expires_at) <= now
  )
    throw new Error("UNAUTHENTICATED");
  if (!org || !organizationEligible(org, now))
    throw new Error("KNOWLEDGE_SCOPE_DENIED");
  const refreshed = {
    ...state,
    members: members.map((m) => {
      const actual = orgs.find(
        (o) => number(o.id) === number(m.organization_id),
      );
      return {
        memberId: number(m.id),
        organizationId:
          state.scope.kind === "TENANT"
            ? state.scope.organizationId!
            : number(m.organization_id),
        membershipActive:
          memberEligible(m) &&
          (state.scope.kind === "GLOBAL" ||
            number(m.organization_id) === state.scope.organizationId),
        organizationActive: !!actual && organizationEligible(actual, now),
      };
    }),
  };
  const actor = parseContract(actorSchema, {
    kind: "HUMAN",
    memberId: identity.memberId,
    organizationId: identity.organizationId,
    membershipActive: true,
    organizationActive: true,
    sessionVerified: true,
    synthetic,
  });
  return { state: refreshed, actor, now };
}
export async function lockReferences(
  connection: CommandConnection,
  projectedMemberIds: number[],
  scope: Partition["scope"],
) {
  const ids = [...new Set(projectedMemberIds)].sort((a, b) => a - b);
  const observed = (
    await connection.query<Row>(
      "SELECT id,organization_id FROM client_members WHERE id=ANY($1::int[]) ORDER BY id",
      [ids],
    )
  ).rows;
  if (observed.length !== ids.length)
    throw new Error("KNOWLEDGE_REFERENCE_INVALID");
  const organizations = [
    ...new Set(observed.map((m) => number(m.organization_id))),
  ].sort((a, b) => a - b);
  const orgs = (
    await connection.query<Row>(
      "SELECT * FROM client_organizations WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE",
      [organizations],
    )
  ).rows;
  const members = (
    await connection.query<Row>(
      "SELECT * FROM client_members WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE",
      [ids],
    )
  ).rows;
  if (members.some((m) => !organizations.includes(number(m.organization_id))))
    throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
  await connection.query(
    "SELECT id FROM client_sessions WHERE member_id=ANY($1::int[]) ORDER BY id FOR UPDATE",
    [ids],
  );
  const now = timestamp(
    (await connection.query<Row>("SELECT clock_timestamp() AS now")).rows[0]
      .now,
  );
  return {
    actor: null,
    members: members.map((m) => {
      const org = orgs.find((o) => number(o.id) === number(m.organization_id));
      return {
        memberId: number(m.id),
        organizationId:
          scope.kind === "TENANT"
            ? scope.organizationId!
            : number(m.organization_id),
        membershipActive:
          memberEligible(m) &&
          (scope.kind === "GLOBAL" ||
            number(m.organization_id) === scope.organizationId),
        organizationActive: !!org && organizationEligible(org, now),
      };
    }),
    now,
  };
}
export async function preliminaryAuth(
  connection: CommandConnection,
  token: string | null,
): Promise<SessionIdentity> {
  if (!token) throw new Error("UNAUTHENTICATED");
  const tokenHash = hashToken(token);
  await connection.begin(true);
  const row = (
    await connection.query<Row>(
      `SELECT s.id AS session_id,s.member_id,m.organization_id,s.expires_at,
    m.status,m.password_hash,o.status AS org_status,o.trial_ends_at,o.billing_provider,o.current_period_end,
    clock_timestamp() AS now FROM client_sessions s JOIN client_members m ON m.id=s.member_id
    JOIN client_organizations o ON o.id=m.organization_id WHERE s.token_hash=$1`,
      [tokenHash],
    )
  ).rows[0];
  if (
    !row ||
    timestamp(row.expires_at) <= timestamp(row.now) ||
    !memberEligible(row)
  )
    throw new Error("UNAUTHENTICATED");
  if (
    !organizationEligible(
      { ...row, status: row.org_status },
      timestamp(row.now),
    )
  )
    throw new Error("KNOWLEDGE_SCOPE_DENIED");
  await connection.finishRead();
  return {
    memberId: number(row.member_id),
    organizationId: number(row.organization_id),
    sessionId: number(row.session_id),
    tokenHash,
  };
}
export async function lockIdentity(
  connection: CommandConnection,
  identity: SessionIdentity,
  projectedMemberIds: number[],
  scope: Partition["scope"],
  synthetic: boolean,
) {
  const ids = [...new Set([identity.memberId, ...projectedMemberIds])].sort(
    (a, b) => a - b,
  );
  const observed = (
    await connection.query<Row>(
      "SELECT id,organization_id FROM client_members WHERE id=ANY($1::int[]) ORDER BY id",
      [ids],
    )
  ).rows;
  if (observed.length !== ids.length)
    throw new Error("KNOWLEDGE_REFERENCE_INVALID");
  const organizations = [
    ...new Set(observed.map((m) => number(m.organization_id))),
  ].sort((a, b) => a - b);
  const orgs = (
    await connection.query<Row>(
      "SELECT * FROM client_organizations WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE",
      [organizations],
    )
  ).rows;
  const members = (
    await connection.query<Row>(
      "SELECT * FROM client_members WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE",
      [ids],
    )
  ).rows;
  if (members.some((m) => !organizations.includes(number(m.organization_id))))
    throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
  const sessions = (
    await connection.query<Row>(
      "SELECT * FROM client_sessions WHERE member_id=ANY($1::int[]) ORDER BY id FOR UPDATE",
      [ids],
    )
  ).rows;
  const member = members.find((m) => number(m.id) === identity.memberId);
  const org = orgs.find((o) => number(o.id) === identity.organizationId);
  const session = sessions.find(
    (s) =>
      number(s.id) === identity.sessionId &&
      s.token_hash === identity.tokenHash,
  );
  const now = timestamp(
    (await connection.query<Row>("SELECT clock_timestamp() AS now")).rows[0]
      .now,
  );
  if (
    !member ||
    !session ||
    !memberEligible(member) ||
    number(member.organization_id) !== identity.organizationId ||
    timestamp(session.expires_at) <= now
  )
    throw new Error("UNAUTHENTICATED");
  if (
    !org ||
    !organizationEligible(org, now) ||
    (scope.kind === "TENANT" &&
      scope.organizationId !== identity.organizationId)
  )
    throw new Error("KNOWLEDGE_SCOPE_DENIED");
  const actor: Actor = parseContract(actorSchema, {
    kind: "HUMAN",
    memberId: identity.memberId,
    organizationId: identity.organizationId,
    membershipActive: true,
    organizationActive: true,
    sessionVerified: true,
    synthetic,
  });
  const projected = members.map((m) => {
    const actualOrg = orgs.find(
      (o) => number(o.id) === number(m.organization_id),
    );
    return {
      memberId: number(m.id),
      organizationId:
        scope.kind === "TENANT"
          ? scope.organizationId!
          : number(m.organization_id),
      membershipActive:
        memberEligible(m) &&
        (scope.kind === "GLOBAL" ||
          number(m.organization_id) === scope.organizationId),
      organizationActive: !!actualOrg && organizationEligible(actualOrg, now),
    };
  });
  return { actor, members: projected, now };
}
