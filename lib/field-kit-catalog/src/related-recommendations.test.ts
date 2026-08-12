import { describe, it, expect } from "vitest";
import { FIELD_KIT_TOOLS, getToolById } from "./index";
import {
  RELATED_RECS_VERSION,
  RELATED_EDGES,
  REQUIRED_RELATED_SOURCES,
  recommendRelated,
  recommendRelatedIncludingUnavailable,
  relatedToAnatomyItems,
} from "./related-recommendations";

describe("related recommendations (HSP-31)", () => {
  it("is versioned and has edges for required product sources", () => {
    expect(RELATED_RECS_VERSION).toMatch(/^related-recs-v\d+/);
    expect(RELATED_EDGES.length).toBeGreaterThan(8);
    for (const src of REQUIRED_RELATED_SOURCES) {
      const edges = RELATED_EDGES.filter((e) => e.fromId === src);
      expect(edges.length, `edges for ${src}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("objections surfaces objection resources first when context is objection", () => {
    const recs = recommendRelated(
      "objections",
      { platform: "web", contextTags: ["objection"], limit: 4 },
      getToolById,
    );
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].id).toBe("objection-cards");
    expect(recs.some((r) => r.kind === "resource")).toBe(true);
    expect(recs.every((r) => r.available)).toBe(true);
  });

  it("weekly-plan surfaces territory resources", () => {
    const recs = recommendRelated(
      "weekly-plan",
      { platform: "web", contextTags: ["territory", "week"], limit: 4 },
      getToolById,
    );
    const ids = recs.map((r) => r.id);
    expect(ids).toContain("territory-template");
    expect(recs[0].id === "territory-template" || ids.includes("activity-tracker")).toBe(
      true,
    );
  });

  it("activity-calculator surfaces tracking tools/resources", () => {
    const recs = recommendRelated(
      "activity-calculator",
      { platform: "web", contextTags: ["tracking"], limit: 4 },
      getToolById,
    );
    const ids = recs.map((r) => r.id);
    expect(ids.some((id) => id === "weekly-plan" || id === "activity-tracker")).toBe(
      true,
    );
  });

  it("command center / sales-workflow surfaces prepare and follow-up", () => {
    const recs = recommendRelated(
      "sales-workflow",
      { platform: "web", contextTags: ["prepare", "follow_up"], limit: 4 },
      getToolById,
    );
    const ids = recs.map((r) => r.id);
    expect(ids).toContain("playbooks");
    expect(ids.some((id) => id === "email-templates" || id === "objections")).toBe(
      true,
    );
  });

  it("filters requiresFieldKit when user lacks access", () => {
    const open = recommendRelatedIncludingUnavailable(
      "objections",
      { platform: "web", canUseFieldKit: false, limit: 10 },
      getToolById,
    );
    const gated = open.filter((r) => r.id === "role-play");
    expect(gated.length).toBe(1);
    expect(gated[0].available).toBe(false);
    expect(gated[0].unavailableReason).toMatch(/Hospice Sales Pro/i);

    const visible = recommendRelated(
      "objections",
      { platform: "web", canUseFieldKit: false, limit: 4 },
      getToolById,
    );
    expect(visible.every((r) => r.id !== "role-play")).toBe(true);
    // Public resource still ok
    expect(visible.some((r) => r.id === "objection-cards")).toBe(true);
  });

  it("filters unavailable content ids", () => {
    const recs = recommendRelated(
      "objections",
      {
        platform: "web",
        unavailableIds: ["objection-cards"],
        limit: 4,
      },
      getToolById,
    );
    expect(recs.every((r) => r.id !== "objection-cards")).toBe(true);
  });

  it("resolves iOS mobile tool tabs from catalog (no hard-coded wrong slugs)", () => {
    const recs = recommendRelated(
      "objections",
      { platform: "ios", canUseFieldKit: true, limit: 4 },
      getToolById,
    );
    const role = recs.find((r) => r.id === "role-play");
    expect(role?.href).toBe("/tool/roleplay");
    const play = recs.find((r) => r.id === "playbooks");
    expect(play?.href).toBe("/tool/playbook");
  });

  it("hides web-only tools on iOS when no mobile path", () => {
    const recs = recommendRelatedIncludingUnavailable(
      "activity-calculator",
      { platform: "ios", canUseFieldKit: true, limit: 10 },
      getToolById,
    );
    // rep-cost is typically web-oriented — if mobile missing, unavailable
    const repCost = getToolById("rep-cost");
    if (repCost?.mobile === "missing") {
      const row = recs.find((r) => r.id === "rep-cost");
      if (row) expect(row.available).toBe(false);
    }
  });

  it("maps to anatomy items without self-links", () => {
    const recs = recommendRelated(
      "objections",
      { platform: "web", limit: 4 },
      getToolById,
    );
    const items = relatedToAnatomyItems(recs);
    expect(items.every((i) => i.href && i.label)).toBe(true);
    expect(items.every((i) => !i.href.includes("objections") || i.label !== "Objection Handler")).toBe(
      true,
    );
  });

  it("tool destinations in edges resolve in catalog when kind is tool", () => {
    for (const edge of RELATED_EDGES) {
      if (edge.toKind === "tool" || edge.toKind === "command") {
        expect(
          getToolById(edge.toId)?.id,
          `missing tool ${edge.toId}`,
        ).toBe(edge.toId);
      }
    }
    // sanity: catalog non-empty
    expect(FIELD_KIT_TOOLS.length).toBeGreaterThan(5);
  });
});
