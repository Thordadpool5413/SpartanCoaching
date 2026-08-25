/**
 * Pure org-admin policy helpers (HSP-41 / pass 4).
 * Keep seat/role rules testable without DB or Express.
 */

export type SeatOrg = {
  seatLimit: number;
  billableSeats?: number | null;
};

export type AssignableOrgRole = "member" | "org_admin";

/** Prefer contract billable seats when set; else seatLimit. */
export function resolveSeatCap(org: SeatOrg): number {
  if (typeof org.billableSeats === "number" && org.billableSeats > 0) {
    return org.billableSeats;
  }
  return org.seatLimit;
}

export function seatLimitReached(activeCount: number, seatCap: number): boolean {
  return activeCount >= seatCap;
}

export function isAssignableOrgRole(role: string): role is AssignableOrgRole {
  return role === "member" || role === "org_admin";
}

export type RoleChangeInput = {
  targetId: number;
  targetRole: string;
  targetStatus: string;
  actorId: number;
  desiredRole: string;
  /** Active org_admin member ids in the same org (including target if admin). */
  activeOrgAdminIds: readonly number[];
};

export type RoleChangeResult =
  | { ok: true; role: AssignableOrgRole }
  | { ok: false; status: number; error: string; code?: string };

export function evaluateRoleChange(input: RoleChangeInput): RoleChangeResult {
  if (!isAssignableOrgRole(input.desiredRole)) {
    return { ok: false, status: 400, error: "role must be member or org_admin" };
  }
  if (input.targetRole === "platform_admin") {
    return { ok: false, status: 400, error: "Cannot change platform admin role" };
  }
  if (input.targetId === input.actorId && input.desiredRole === "member") {
    const otherAdmins = input.activeOrgAdminIds.filter((id) => id !== input.targetId);
    if (otherAdmins.length === 0) {
      return {
        ok: false,
        status: 400,
        error: "Cannot demote the last active org admin",
        code: "LAST_ORG_ADMIN",
      };
    }
  }
  return { ok: true, role: input.desiredRole };
}

export type DisableMemberInput = {
  targetId: number;
  actorId: number;
  targetRole: string;
};

export type DisableMemberResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function evaluateDisableMember(input: DisableMemberInput): DisableMemberResult {
  if (input.targetId === input.actorId) {
    return { ok: false, status: 400, error: "You cannot disable your own account" };
  }
  if (input.targetRole === "platform_admin") {
    return { ok: false, status: 400, error: "Cannot disable platform admin" };
  }
  return { ok: true };
}

/** Aggregate usage rows for org admin panel (email-scoped, no free text). */
export function aggregateOrgUsage(
  rows: readonly { email: string; toolName: string }[],
  memberEmailsLower: ReadonlySet<string>,
): {
  total: number;
  byTool: { toolName: string; count: number }[];
  byMember: { email: string; count: number }[];
} {
  const filtered = rows.filter((r) =>
    memberEmailsLower.has(String(r.email || "").toLowerCase()),
  );
  const byToolMap = new Map<string, number>();
  const byMemberMap = new Map<string, number>();
  for (const r of filtered) {
    byToolMap.set(r.toolName, (byToolMap.get(r.toolName) || 0) + 1);
    const key = String(r.email).toLowerCase();
    byMemberMap.set(key, (byMemberMap.get(key) || 0) + 1);
  }
  return {
    total: filtered.length,
    byTool: [...byToolMap.entries()]
      .map(([toolName, count]) => ({ toolName, count }))
      .sort((a, b) => b.count - a.count),
    byMember: [...byMemberMap.entries()]
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count),
  };
}

const COMPLETION_OUTCOMES = new Set([
  "workflow_completion",
  "next_action_confirmation",
  "tool_completion",
  "result_save",
  "resource_completion",
]);

export function aggregateCompletionTrend(
  rows: readonly { memberId: number | null; eventName: string; createdAt: number }[],
  memberIds: ReadonlySet<number>,
  now = new Date(),
): { total: number; trend: Array<{ date: string; count: number }> } {
  const countByDate = new Map<string, number>();
  let total = 0;
  for (const row of rows) {
    if (row.memberId == null || !memberIds.has(row.memberId) || !COMPLETION_OUTCOMES.has(row.eventName)) continue;
    const date = new Date(row.createdAt).toISOString().slice(0, 10);
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
    total += 1;
  }
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: countByDate.get(key) ?? 0 };
  });
  return { total, trend };
}
