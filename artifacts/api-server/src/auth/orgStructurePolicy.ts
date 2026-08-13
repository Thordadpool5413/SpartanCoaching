/**
 * Pure org structure rules (HSP-41 Slice C / pass 9).
 */

export function normalizeStructureName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidStructureName(name: string): boolean {
  const n = normalizeStructureName(name);
  return n.length >= 2 && n.length <= 255;
}

export type AssignmentInput = {
  branchId?: number | null;
  teamId?: number | null;
  managerMemberId?: number | null;
};

export type ResolvedAssignment = {
  branchId: number | null;
  teamId: number | null;
  managerMemberId: number | null;
};

export type AssignmentValidation =
  | { ok: true; assignment: ResolvedAssignment }
  | { ok: false; status: number; error: string };

/**
 * Validate a fully merged assignment against tenant-owned ids.
 * Call mergeAssignment first for partial patches.
 */
export function evaluateMemberAssignment(input: {
  targetMemberId: number;
  assignment: ResolvedAssignment;
  branchIdsInOrg: ReadonlySet<number>;
  teamIdsInOrg: ReadonlySet<number>;
  memberIdsInOrg: ReadonlySet<number>;
  teamBranchById: ReadonlyMap<number, number | null>;
}): AssignmentValidation {
  const { branchId, teamId, managerMemberId } = input.assignment;

  if (branchId !== null && !input.branchIdsInOrg.has(branchId)) {
    return { ok: false, status: 400, error: "Branch not found in this organization" };
  }
  if (teamId !== null && !input.teamIdsInOrg.has(teamId)) {
    return { ok: false, status: 400, error: "Team not found in this organization" };
  }
  if (managerMemberId !== null && !input.memberIdsInOrg.has(managerMemberId)) {
    return { ok: false, status: 400, error: "Manager must be a member of this organization" };
  }
  if (managerMemberId === input.targetMemberId) {
    return { ok: false, status: 400, error: "A member cannot be their own manager" };
  }

  if (teamId !== null) {
    const teamBranch = input.teamBranchById.get(teamId) ?? null;
    if (teamBranch != null && branchId === null) {
      return {
        ok: false,
        status: 400,
        error:
          "Cannot clear branch while team is attached to a branch — clear team first or set matching branch",
      };
    }
    if (teamBranch != null && branchId !== null && branchId !== teamBranch) {
      return {
        ok: false,
        status: 400,
        error: "Member branch must match the team's branch",
      };
    }
  }

  return {
    ok: true,
    assignment: { branchId, teamId, managerMemberId },
  };
}

/** Merge partial assignment with current row (undefined = keep). */
export function mergeAssignment(
  current: { branchId: number | null; teamId: number | null; managerMemberId: number | null },
  desired: AssignmentInput,
): { branchId: number | null; teamId: number | null; managerMemberId: number | null } {
  return {
    branchId: desired.branchId === undefined ? current.branchId : desired.branchId,
    teamId: desired.teamId === undefined ? current.teamId : desired.teamId,
    managerMemberId:
      desired.managerMemberId === undefined
        ? current.managerMemberId
        : desired.managerMemberId,
  };
}
