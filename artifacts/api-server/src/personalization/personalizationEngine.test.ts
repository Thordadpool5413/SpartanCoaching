import { describe, it, expect } from "vitest";
import {
  PERSONALIZATION_VERSION,
  normalizePayload,
  pushRecent,
  toggleList,
  buildPersonalizationView,
} from "./personalizationEngine";
import { emptyPersonalizationPayload } from "@workspace/db";

describe("personalization engine (HSP-37)", () => {
  it("is versioned", () => {
    expect(PERSONALIZATION_VERSION).toMatch(/^personalization-v\d+/);
  });

  it("normalizes empty / corrupt payload for new users", () => {
    const p = normalizePayload(null);
    expect(p.schemaVersion).toBe(1);
    expect(p.recent).toEqual([]);
    expect(p.favorites.tools).toEqual([]);
    expect(buildPersonalizationView({ payload: p }).emptyHistory).toBe(true);
  });

  it("pushRecent de-dupes and keeps newest first", () => {
    let p = emptyPersonalizationPayload();
    p = pushRecent(p, {
      kind: "tool",
      id: "objections",
      title: "Objection Handler",
      href: "/tools/objections",
      at: "2026-01-01T00:00:00.000Z",
    });
    p = pushRecent(p, {
      kind: "tool",
      id: "objections",
      title: "Objection Handler",
      href: "/tools/objections",
      at: "2026-01-02T00:00:00.000Z",
    });
    expect(p.recent).toHaveLength(1);
    expect(p.recent[0]!.at).toContain("2026-01-02");
  });

  it("toggleList supports favorite add/remove", () => {
    expect(toggleList([], "objections", true)).toEqual(["objections"]);
    expect(toggleList(["objections", "research"], "objections", false)).toEqual([
      "research",
    ]);
  });

  it("recommended today explains favorites and pins", () => {
    const payload = normalizePayload({
      schemaVersion: 1,
      favorites: { tools: ["objections"], resources: [] },
      pinnedTools: ["sales-workflow"],
      pinnedResources: [],
      recent: [],
      dismissedRecommendationIds: [],
    });
    const view = buildPersonalizationView({
      payload,
      toolTitleById: {
        objections: "Objection Handler",
        "sales-workflow": "Command Center",
      },
    });
    expect(view.emptyHistory).toBe(false);
    const whys = view.recommendedToday.map((r) => r.why);
    expect(whys.some((w) => /Pinned by you/i.test(w))).toBe(true);
    expect(whys.some((w) => /Favorite/i.test(w))).toBe(true);
  });

  it("continue includes drafts with explainable why", () => {
    const view = buildPersonalizationView({
      payload: emptyPersonalizationPayload(),
      drafts: [
        {
          resourceKey: "weekly-plan",
          title: "Week of May 1",
          href: "/resources/weekly-plan",
          status: "draft",
        },
      ],
    });
    expect(view.continueItems[0]!.why).toMatch(/Continue draft/i);
    expect(view.emptyHistory).toBe(false);
  });

  it("starters for new users include role-aware why", () => {
    const view = buildPersonalizationView({
      payload: emptyPersonalizationPayload(),
      jobRole: "rep",
    });
    expect(view.emptyHistory).toBe(true);
    expect(view.recommendedToday.length).toBeGreaterThan(0);
    expect(view.recommendedToday.every((r) => r.why.length > 10)).toBe(true);
  });

  it("dismissed recommendations are excluded", () => {
    const payload = normalizePayload({
      schemaVersion: 1,
      favorites: { tools: ["objections"], resources: [] },
      pinnedTools: [],
      pinnedResources: [],
      recent: [],
      dismissedRecommendationIds: ["fav-tool:objections"],
    });
    const view = buildPersonalizationView({
      payload,
      toolTitleById: { objections: "Objection Handler" },
    });
    expect(view.recommendedToday.every((r) => r.id !== "fav-tool:objections")).toBe(
      true,
    );
  });
});
