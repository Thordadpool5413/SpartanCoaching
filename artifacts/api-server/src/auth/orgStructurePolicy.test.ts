import { describe, expect, it } from "vitest";
import {
  evaluateMemberAssignment,
  isValidStructureName,
  mergeAssignment,
  normalizeStructureName,
} from "./orgStructurePolicy";

describe("org structure policy", () => {
  it("normalizes and validates names", () => {
    expect(normalizeStructureName("  North  Clinic  ")).toBe("North Clinic");
    expect(isValidStructureName("AB")).toBe(true);
    expect(isValidStructureName("A")).toBe(false);
  });

  it("merges partial assignment patches", () => {
    expect(
      mergeAssignment(
        { branchId: 1, teamId: 2, managerMemberId: 3 },
        { teamId: null },
      ),
    ).toEqual({ branchId: 1, teamId: null, managerMemberId: 3 });
  });

  it("rejects cross-tenant branch/team/manager ids", () => {
    const base = {
      targetMemberId: 10,
      branchIdsInOrg: new Set([1]),
      teamIdsInOrg: new Set([5]),
      memberIdsInOrg: new Set([1, 10, 11]),
      teamBranchById: new Map<number, number | null>([[5, 1]]),
    };
    expect(
      evaluateMemberAssignment({
        ...base,
        assignment: { branchId: 99, teamId: null, managerMemberId: null },
      }).ok,
    ).toBe(false);
    expect(
      evaluateMemberAssignment({
        ...base,
        assignment: { branchId: null, teamId: null, managerMemberId: 10 },
      }).ok,
    ).toBe(false);
  });

  it("enforces team/branch coherence", () => {
    const r = evaluateMemberAssignment({
      targetMemberId: 10,
      assignment: { branchId: 2, teamId: 5, managerMemberId: null },
      branchIdsInOrg: new Set([1, 2]),
      teamIdsInOrg: new Set([5]),
      memberIdsInOrg: new Set([1, 10]),
      teamBranchById: new Map([[5, 1]]),
    });
    expect(r.ok).toBe(false);
  });

  it("accepts coherent assignment", () => {
    const r = evaluateMemberAssignment({
      targetMemberId: 10,
      assignment: { branchId: 1, teamId: 5, managerMemberId: 1 },
      branchIdsInOrg: new Set([1]),
      teamIdsInOrg: new Set([5]),
      memberIdsInOrg: new Set([1, 10]),
      teamBranchById: new Map([[5, 1]]),
    });
    expect(r).toEqual({
      ok: true,
      assignment: { branchId: 1, teamId: 5, managerMemberId: 1 },
    });
  });
});
