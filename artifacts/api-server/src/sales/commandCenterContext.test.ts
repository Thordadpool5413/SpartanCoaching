import { describe, expect, it } from "vitest";
import {
  assembleCommandCenterContext,
  mergeCorrections,
  parseCorrectionsFromActivitySummary,
  projectContextForTool,
  sanitizeCorrections,
} from "./commandCenterContext";

const baseInput = {
  account: { id: "acc-1", name: "Sunrise SNF", accountType: "snf" },
  contacts: [
    {
      id: "c1",
      firstName: "Dana",
      lastName: "Lee",
      title: "DON",
      isPrimary: true,
    },
  ],
  recentActivities: [
    {
      id: "a1",
      type: "visit",
      summary: "Met DON about referral process",
      occurredAt: "2026-04-01T15:00:00.000Z",
    },
  ],
  cycles: [
    {
      id: "cy1",
      purpose: "Grow oncology referrals",
      status: "active",
      updatedAt: "2026-04-02T10:00:00.000Z",
    },
  ],
  calls: [
    {
      id: "call-1",
      accountId: "acc-1",
      purpose: "Education visit on hospice timing",
      status: "scheduled",
      schedule: { startsAt: "2026-04-10T16:00:00.000Z" },
      updatedAt: "2026-04-02T11:00:00.000Z",
    },
  ],
  plans: [
    {
      id: "p1",
      callId: "call-1",
      status: "ready",
      content: { objections: ["We already have a hospice"] },
    },
  ],
  outcomes: [
    {
      callId: "call-0",
      commitments: ["Send leave-behind"],
      updatedAt: "2026-03-20T12:00:00.000Z",
    },
  ],
  nextActions: [
    {
      id: "na1",
      callId: "call-1",
      title: "Email DON summary",
      type: "email",
      status: "accepted",
      dueAt: "2026-04-11T17:00:00.000Z",
    },
  ],
  nowIso: "2026-04-03T12:00:00.000Z",
};

describe("assembleCommandCenterContext", () => {
  it("assembles account, contact, objective, objections, meeting, actions", () => {
    const ctx = assembleCommandCenterContext(baseInput);
    expect(ctx.accountName).toBe("Sunrise SNF");
    expect(ctx.primaryContact?.name).toBe("Dana Lee");
    expect(ctx.currentObjective).toMatch(/Education visit/);
    expect(ctx.knownObjections).toContain("We already have a hospice");
    expect(ctx.upcomingMeeting?.callId).toBe("call-1");
    expect(ctx.nextActions).toHaveLength(1);
    expect(ctx.lastInteraction?.summary).toMatch(/DON/);
    expect(ctx.relevantTools.some((t) => t.id === "objection-coach")).toBe(
      true,
    );
    expect(ctx.reviewChecklist.length).toBeGreaterThanOrEqual(0);
  });

  it("applies user corrections over inferred fields", () => {
    const ctx = assembleCommandCenterContext({
      ...baseInput,
      corrections: {
        currentObjective: "Secure first referral path",
        knownObjections: ["Capacity concerns"],
        priority: "high",
        relationshipStage: "active_partner",
      },
    });
    expect(ctx.currentObjective).toBe("Secure first referral path");
    expect(ctx.knownObjections).toEqual(["Capacity concerns"]);
    expect(ctx.priority).toBe("high");
    expect(ctx.relationshipStage).toBe("active_partner");
  });
});

describe("projectContextForTool", () => {
  it("limits objection coach to allowlisted fields only", () => {
    const ctx = assembleCommandCenterContext(baseInput);
    const projected = projectContextForTool(ctx, "objection-coach");
    expect(projected.toolId).toBe("objection-coach");
    expect(projected.accountName).toBe("Sunrise SNF");
    expect(projected.knownObjections).toBeDefined();
    expect(projected.commitments).toBeUndefined();
    expect(projected.nextActions).toBeUndefined();
    expect(projected.sourceIds).toBeUndefined();
  });

  it("uses generic allowlist for unknown tools", () => {
    const ctx = assembleCommandCenterContext(baseInput);
    const projected = projectContextForTool(ctx, "unknown-tool");
    expect(projected.accountName).toBeDefined();
    expect(projected.knownObjections).toBeUndefined();
  });
});

describe("corrections helpers", () => {
  it("sanitizes and merges patches", () => {
    const merged = mergeCorrections(
      { currentObjective: "A", priority: "low" },
      { currentObjective: "B", knownObjections: ["x"] },
    );
    expect(merged.currentObjective).toBe("B");
    expect(merged.priority).toBe("low");
    expect(merged.knownObjections).toEqual(["x"]);
  });

  it("parses activity summary JSON", () => {
    const raw = JSON.stringify(
      sanitizeCorrections({ currentObjective: "Keep path warm" }),
    );
    expect(parseCorrectionsFromActivitySummary(raw)?.currentObjective).toBe(
      "Keep path warm",
    );
    expect(parseCorrectionsFromActivitySummary("not-json")).toBeNull();
  });
});
