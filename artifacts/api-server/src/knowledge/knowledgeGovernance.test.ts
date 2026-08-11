import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSourceDisplay,
  clearKnowledgeGovernanceStore,
  ensureCoreSeeded,
  filterOutNonCurrentIds,
  isRetrievableAsCurrent,
  listCurrentRetrievable,
  listReviewReminders,
  listVersionHistory,
  needsReview,
  retireKnowledgeItem,
  supersedeKnowledgeItem,
  upsertProviderGovernedItem,
  getGovernedItem,
} from "./knowledgeGovernance";

beforeEach(() => {
  clearKnowledgeGovernanceStore();
  ensureCoreSeeded();
});

describe("source authority and status", () => {
  it("seeds core corpus as current with source types", () => {
    const item = getGovernedItem("method-des");
    expect(item?.status).toBe("current");
    expect(item?.sourceType).toBe("spartan_methodology");
    expect(item?.sourceOrganizationId).toBeNull();
    const display = buildSourceDisplay(item!);
    expect(display.sourceTypeLabel).toMatch(/Spartan/i);
    expect(display.citationLine).toContain("v1");
  });

  it("does not retrieve retired knowledge as current", () => {
    retireKnowledgeItem("method-des");
    expect(isRetrievableAsCurrent(getGovernedItem("method-des")!)).toBe(false);
    const current = listCurrentRetrievable();
    expect(current.some((i) => i.id === "method-des")).toBe(false);
    expect(filterOutNonCurrentIds(["method-des", "ethics-phi"])).toEqual([
      "ethics-phi",
    ]);
  });

  it("does not retrieve superseded knowledge as current", () => {
    const { previous, next } = supersedeKnowledgeItem("method-des", {
      title: "Spartan Method triad (revised)",
      body: "Updated methodology text with clearer discipline language.",
      sourceType: "spartan_methodology",
      status: "current",
      reviewer: "editor",
    });
    expect(previous.status).toBe("superseded");
    expect(previous.supersededById).toBe(next.id);
    expect(isRetrievableAsCurrent(previous)).toBe(false);
    expect(isRetrievableAsCurrent(next)).toBe(true);
    const history = listVersionHistory(previous.lineageId);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});

describe("provider tenant isolation", () => {
  it("scopes provider_policy items by organization", () => {
    upsertProviderGovernedItem(10, {
      id: "prov-a",
      title: "Org A policy",
      body: "After hours for org A",
      status: "current",
      complianceReviewer: "comp-a",
      reviewedDate: "2026-01-01",
    });
    upsertProviderGovernedItem(20, {
      id: "prov-b",
      title: "Org B policy",
      body: "Secret for org B",
      status: "current",
      complianceReviewer: "comp-b",
      reviewedDate: "2026-01-01",
    });
    const forA = listCurrentRetrievable({ organizationId: 10 });
    expect(forA.some((i) => i.id === "prov-a")).toBe(true);
    expect(forA.some((i) => i.id === "prov-b")).toBe(false);
  });

  it("rejects cross-org overwrite", () => {
    upsertProviderGovernedItem(10, {
      id: "shared-id",
      title: "A",
      body: "A body",
      status: "current",
      complianceReviewer: "c",
      reviewedDate: "2026-01-01",
    });
    expect(() =>
      upsertProviderGovernedItem(20, {
        id: "shared-id",
        title: "B",
        body: "B body",
        status: "current",
        complianceReviewer: "c",
        reviewedDate: "2026-01-01",
      }),
    ).toThrow(/another organization/i);
  });
});

describe("review cadence", () => {
  it("flags overdue reviews", () => {
    upsertProviderGovernedItem(10, {
      id: "stale",
      title: "Stale policy",
      body: "Needs review",
      status: "current",
      complianceReviewer: "c",
      reviewedDate: "2020-01-01",
      reviewIntervalDays: 90,
    });
    const item = getGovernedItem("stale")!;
    expect(needsReview(item, "2026-08-10T00:00:00.000Z")).toBe(true);
    const reminders = listReviewReminders({
      organizationId: 10,
      nowIso: "2026-08-10T00:00:00.000Z",
      includeOverdueOnly: true,
    });
    expect(reminders.some((r) => r.id === "stale" && r.overdue)).toBe(true);
  });
});
