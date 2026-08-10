import { describe, expect, it } from "vitest";
import {
  assembleAccountIntelligence,
  filterAccountIntelligence,
  findDuplicateCandidates,
  mergeIntelligenceFields,
  normalizeAccountName,
  projectAccountForConsumer,
  sanitizeIntelligencePatch,
  sanitizeSafeNotes,
} from "./accountIntelligence";

const base = {
  account: {
    id: "acc-1",
    organizationId: "org-1",
    name: "Sunrise SNF",
    accountType: "snf",
    address: "100 Main St",
    territoryId: "north",
    ownerUserId: "user-1",
    externalId: "ext-1",
    version: 2,
    updatedAt: "2026-04-01T12:00:00.000Z",
    branch: "West",
    relationshipStage: "cultivating",
    priority: "high" as const,
    referralPotential: "medium" as const,
    notes: "Prefers morning visits",
  },
  contacts: [
    {
      id: "c1",
      accountId: "acc-1",
      firstName: "Dana",
      lastName: "Lee",
      title: "DON",
      isPrimary: true,
    },
  ],
  activities: [
    {
      id: "a1",
      accountId: "acc-1",
      type: "call_completed",
      summary: "Discussed referral process",
      occurredAt: "2026-03-28T15:00:00.000Z",
    },
  ],
  nextActions: [
    {
      id: "na1",
      callId: "call-1",
      title: "Send education packet",
      status: "accepted",
      dueAt: "2026-04-05T12:00:00.000Z",
    },
  ],
  accountCallIds: ["call-1"],
  outcomes: [
    {
      callId: "call-1",
      commitments: ["Bring sample packet"],
      updatedAt: "2026-03-28T16:00:00.000Z",
    },
  ],
};

describe("assembleAccountIntelligence", () => {
  it("builds territory relationship card with contacts and workflow signals", () => {
    const view = assembleAccountIntelligence(base);
    expect(view.accountId).toBe("acc-1");
    expect(view.primaryContact?.name).toBe("Dana Lee");
    expect(view.relationshipStage).toBe("cultivating");
    expect(view.priority).toBe("high");
    expect(view.referralPotential).toBe("medium");
    expect(view.lastInteraction?.type).toBe("call_completed");
    expect(view.nextAction?.title).toContain("education");
    expect(view.commitments).toEqual(["Bring sample packet"]);
    expect(view.branch).toBe("West");
    expect(view.organizationContext.territoryId).toBe("north");
  });

  it("infers stage from active cycle when field unset", () => {
    const view = assembleAccountIntelligence({
      ...base,
      account: {
        ...base.account,
        relationshipStage: null,
        priority: null,
      },
      activeCyclePurpose: "Grow oncology referrals",
    });
    expect(view.relationshipStage).toMatch(/Grow oncology/);
  });
});

describe("filter and duplicates", () => {
  it("filters by territory and query", () => {
    const a = assembleAccountIntelligence(base);
    const b = assembleAccountIntelligence({
      ...base,
      account: {
        ...base.account,
        id: "acc-2",
        name: "Other Clinic",
        territoryId: "south",
      },
      contacts: [],
      accountCallIds: [],
      nextActions: [],
      outcomes: [],
    });
    const filtered = filterAccountIntelligence([a, b], {
      territoryId: "north",
      q: "sunrise",
    });
    expect(filtered.map((r) => r.accountId)).toEqual(["acc-1"]);
  });

  it("detects exact name and externalId duplicates", () => {
    const pairs = findDuplicateCandidates([
      { id: "1", name: "Sunrise SNF", externalId: "X1" },
      { id: "2", name: "Sunrise SNF", externalId: "X1" },
      { id: "3", name: "Different", externalId: "Y" },
    ]);
    expect(pairs.length).toBeGreaterThanOrEqual(1);
    expect(pairs[0].reasons).toEqual(
      expect.arrayContaining(["externalId", "exact_name"]),
    );
  });
});

describe("sanitize and merge", () => {
  it("rejects PHI-looking notes", () => {
    expect(() => sanitizeSafeNotes("Patient SSN 123-45-6789")).toThrow(
      /patient-identifying/i,
    );
  });

  it("accepts product-safe notes", () => {
    expect(sanitizeSafeNotes("  Prefers Tuesday AM  ")).toBe(
      "Prefers Tuesday AM",
    );
  });

  it("sanitizes intelligence patch", () => {
    const p = sanitizeIntelligencePatch({
      branch: " East ",
      priority: "low",
      notes: "No PHI",
    });
    expect(p.branch).toBe("East");
    expect(p.priority).toBe("low");
  });

  it("merges fill-blank intelligence", () => {
    const m = mergeIntelligenceFields(
      { name: "Keep", accountType: "snf", territoryId: null, notes: null },
      {
        name: "Loser",
        accountType: "clinic",
        territoryId: "north",
        notes: "Bring packet",
        branch: "West",
      },
    );
    expect(m.name).toBe("Keep");
    expect(m.territoryId).toBe("north");
    expect(m.notes).toBe("Bring packet");
    expect(m.branch).toBe("West");
  });

  it("normalizes names for matching", () => {
    expect(normalizeAccountName("Sunrise, SNF!")).toBe("sunrise snf");
  });
});

describe("projectAccountForConsumer", () => {
  it("limits analytics projection", () => {
    const view = assembleAccountIntelligence(base);
    const p = projectAccountForConsumer(view, "analytics");
    expect(p.consumer).toBe("analytics");
    expect(p).toHaveProperty("territoryId");
    expect(p).not.toHaveProperty("notes");
    expect(p).not.toHaveProperty("primaryContact");
  });
});
