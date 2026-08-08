import { describe, expect, it } from "vitest";
import {
  memberIdToWorkflowUuid,
  organizationIdToWorkflowUuid,
  parseWorkflowTenantUuid,
  sameWorkflowOrganization,
  toWorkflowUuid,
  workflowIdentityFromMember,
  workflowUuidToMemberId,
  workflowUuidToOrganizationId,
} from "./index";

describe("tenant-ids workflow mapping", () => {
  it("matches last-known-green organization encoding", () => {
    // Historical formula: 00000000-0000-5000-8000-{12 hex}
    expect(organizationIdToWorkflowUuid(1)).toBe(
      "00000000-0000-5000-8000-000000000001",
    );
    expect(organizationIdToWorkflowUuid(255)).toBe(
      "00000000-0000-5000-8000-0000000000ff",
    );
    expect(organizationIdToWorkflowUuid(4096)).toBe(
      "00000000-0000-5000-8000-000000001000",
    );
  });

  it("matches last-known-green member encoding", () => {
    expect(memberIdToWorkflowUuid(1)).toBe(
      "00000000-0000-5000-9000-000000000001",
    );
    expect(memberIdToWorkflowUuid(42)).toBe(
      "00000000-0000-5000-9000-00000000002a",
    );
  });

  it("toWorkflowUuid delegates by kind", () => {
    expect(toWorkflowUuid("organization", 7)).toBe(
      organizationIdToWorkflowUuid(7),
    );
    expect(toWorkflowUuid("member", 7)).toBe(memberIdToWorkflowUuid(7));
  });

  it("round-trips organization and member ids", () => {
    for (const id of [1, 2, 99, 10_000, 1_000_000]) {
      const orgUuid = organizationIdToWorkflowUuid(id);
      const memberUuid = memberIdToWorkflowUuid(id);
      expect(workflowUuidToOrganizationId(orgUuid)).toBe(id);
      expect(workflowUuidToMemberId(memberUuid)).toBe(id);
      expect(parseWorkflowTenantUuid(orgUuid)).toEqual({
        kind: "organization",
        id,
        uuid: orgUuid,
      });
      expect(parseWorkflowTenantUuid(memberUuid)).toEqual({
        kind: "member",
        id,
        uuid: memberUuid,
      });
    }
  });

  it("rejects non-positive ids", () => {
    expect(() => organizationIdToWorkflowUuid(0)).toThrow(/positive integer/);
    expect(() => memberIdToWorkflowUuid(-1)).toThrow(/positive integer/);
    expect(() => organizationIdToWorkflowUuid(1.5)).toThrow(/positive integer/);
  });

  it("does not parse random entity UUIDs as tenants", () => {
    expect(
      parseWorkflowTenantUuid("a1b2c3d4-e5f6-4789-a012-3456789abcde"),
    ).toBeNull();
    expect(workflowUuidToOrganizationId("not-a-uuid")).toBeNull();
  });

  it("sameWorkflowOrganization is case-insensitive", () => {
    const a = organizationIdToWorkflowUuid(3);
    expect(sameWorkflowOrganization(a, a.toUpperCase())).toBe(true);
    expect(sameWorkflowOrganization(a, organizationIdToWorkflowUuid(4))).toBe(
      false,
    );
    expect(sameWorkflowOrganization(null, a)).toBe(false);
  });

  it("workflowIdentityFromMember pairs org + member", () => {
    expect(workflowIdentityFromMember({ memberId: 5, organizationId: 9 })).toEqual({
      organizationId: organizationIdToWorkflowUuid(9),
      userId: memberIdToWorkflowUuid(5),
    });
  });

  it("organization and member uuids never collide for same numeric id", () => {
    expect(organizationIdToWorkflowUuid(1)).not.toBe(memberIdToWorkflowUuid(1));
  });
});
