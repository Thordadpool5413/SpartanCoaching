import { describe, expect, it } from "vitest";
import {
  aggregateOrgUsage,
  aggregateCompletionTrend,
  evaluateDisableMember,
  evaluateRoleChange,
  isAssignableOrgRole,
  resolveSeatCap,
  seatLimitReached,
} from "./orgAdminPolicy";

describe("resolveSeatCap", () => {
  it("prefers positive billableSeats over seatLimit", () => {
    expect(resolveSeatCap({ seatLimit: 10, billableSeats: 5 })).toBe(5);
  });

  it("falls back to seatLimit when billableSeats unset", () => {
    expect(resolveSeatCap({ seatLimit: 8, billableSeats: null })).toBe(8);
    expect(resolveSeatCap({ seatLimit: 3 })).toBe(3);
  });

  it("ignores zero/negative billableSeats", () => {
    expect(resolveSeatCap({ seatLimit: 4, billableSeats: 0 })).toBe(4);
  });
});

describe("aggregateCompletionTrend", () => {
  it("counts only safe completion outcomes for members in the organization", () => {
    const now = new Date("2026-08-18T16:00:00.000Z");
    const out = aggregateCompletionTrend([
      { memberId: 2, eventName: "tool_completion", createdAt: Date.parse("2026-08-18T10:00:00.000Z") },
      { memberId: 2, eventName: "next_action_confirmation", createdAt: Date.parse("2026-08-17T10:00:00.000Z") },
      { memberId: 9, eventName: "tool_completion", createdAt: Date.parse("2026-08-18T10:00:00.000Z") },
      { memberId: 2, eventName: "subscription_start", createdAt: Date.parse("2026-08-18T10:00:00.000Z") },
    ], new Set([2]), now);
    expect(out.total).toBe(2);
    expect(out.trend).toHaveLength(7);
    expect(out.trend.at(-1)).toEqual({ date: "2026-08-18", count: 1 });
  });
});

describe("seatLimitReached", () => {
  it("blocks when activeCount >= seatCap", () => {
    expect(seatLimitReached(5, 5)).toBe(true);
    expect(seatLimitReached(6, 5)).toBe(true);
    expect(seatLimitReached(4, 5)).toBe(false);
  });
});

describe("isAssignableOrgRole", () => {
  it("allows only member and org_admin", () => {
    expect(isAssignableOrgRole("member")).toBe(true);
    expect(isAssignableOrgRole("org_admin")).toBe(true);
    expect(isAssignableOrgRole("platform_admin")).toBe(false);
    expect(isAssignableOrgRole("admin")).toBe(false);
  });
});

describe("evaluateRoleChange", () => {
  it("rejects invalid roles", () => {
    const r = evaluateRoleChange({
      targetId: 2,
      targetRole: "member",
      targetStatus: "active",
      actorId: 1,
      desiredRole: "platform_admin",
      activeOrgAdminIds: [1],
    });
    expect(r.ok).toBe(false);
  });

  it("blocks demoting the last active org admin", () => {
    const r = evaluateRoleChange({
      targetId: 1,
      targetRole: "org_admin",
      targetStatus: "active",
      actorId: 1,
      desiredRole: "member",
      activeOrgAdminIds: [1],
    });
    expect(r).toEqual({
      ok: false,
      status: 400,
      error: "Cannot demote the last active org admin",
      code: "LAST_ORG_ADMIN",
    });
  });

  it("allows demotion when another admin remains", () => {
    const r = evaluateRoleChange({
      targetId: 1,
      targetRole: "org_admin",
      targetStatus: "active",
      actorId: 1,
      desiredRole: "member",
      activeOrgAdminIds: [1, 9],
    });
    expect(r).toEqual({ ok: true, role: "member" });
  });

  it("blocks changing platform_admin", () => {
    const r = evaluateRoleChange({
      targetId: 3,
      targetRole: "platform_admin",
      targetStatus: "active",
      actorId: 1,
      desiredRole: "member",
      activeOrgAdminIds: [1],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/platform admin/i);
  });
});

describe("evaluateDisableMember", () => {
  it("blocks self-disable", () => {
    expect(evaluateDisableMember({ targetId: 1, actorId: 1, targetRole: "member" })).toEqual({
      ok: false,
      status: 400,
      error: "You cannot disable your own account",
    });
  });

  it("blocks platform admin disable", () => {
    const r = evaluateDisableMember({
      targetId: 2,
      actorId: 1,
      targetRole: "platform_admin",
    });
    expect(r.ok).toBe(false);
  });

  it("allows peer disable", () => {
    expect(
      evaluateDisableMember({ targetId: 2, actorId: 1, targetRole: "member" }),
    ).toEqual({ ok: true });
  });
});

describe("aggregateOrgUsage", () => {
  it("filters to org emails and sorts by count", () => {
    const out = aggregateOrgUsage(
      [
        { email: "a@co.example", toolName: "playbook" },
        { email: "outsider@x.com", toolName: "chat" },
        { email: "A@co.example", toolName: "playbook" },
        { email: "b@co.example", toolName: "objection" },
      ],
      new Set(["a@co.example", "b@co.example"]),
    );
    expect(out.total).toBe(3);
    expect(out.byTool[0]).toEqual({ toolName: "playbook", count: 2 });
    expect(out.byMember.find((m) => m.email === "a@co.example")?.count).toBe(2);
  });
});
