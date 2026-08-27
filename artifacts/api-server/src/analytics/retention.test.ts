import { describe, expect, it, vi } from "vitest";

const deleteCalls = vi.hoisted(() => [] as string[]);

vi.mock("../db", () => ({
  db: {
    delete: (table: string) => {
      deleteCalls.push(table);
      return { where: () => Promise.resolve() };
    },
  },
}));

vi.mock("@workspace/db", () => ({
  visitors: { visitedAt: "visited_at" },
  eventTracking: { createdAt: "created_at" },
}));

import { analyticsRetentionCutoff, runAnalyticsRetentionSweep } from "./retention";

describe("analytics retention", () => {
  it("sets the cutoff 400 days before the scheduler run", () => {
    const now = Date.UTC(2026, 0, 1);
    expect(analyticsRetentionCutoff(now)).toBe(now - 400 * 24 * 60 * 60 * 1000);
  });

  it("deletes aged visitor and event rows", async () => {
    deleteCalls.length = 0;
    await runAnalyticsRetentionSweep(Date.UTC(2026, 0, 1));
    expect(deleteCalls).toEqual([
      { visitedAt: "visited_at" },
      { createdAt: "created_at" },
    ]);
  });
});