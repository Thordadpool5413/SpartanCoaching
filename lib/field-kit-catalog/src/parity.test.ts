/**
 * Web ↔ mobile membership inventory contract.
 * Fails if any tool is marked missing or lacks a delivery path.
 */
import { describe, it, expect } from "vitest";
import {
  FIELD_KIT_TOOLS,
  FIELD_KIT_DAILY_TOOL_IDS,
  FIELD_KIT_LEADER_TOOL_IDS,
  mobileParityDebt,
  getToolById,
  mobileDeliveryLabel,
  COMMAND_CENTER_CAPABILITIES,
  sharedCommandCenterFacts,
  mobileCommandCenterSupported,
  mobileCommandCenterGaps,
  CLASSIC_FIELD_TOOL_ROUTES,
  DISCOVERY_INTENTS,
  DISCOVERY_IA_VERSION,
  PRODUCT_SURFACE_PLACEMENT,
  assertIntentToolReferences,
  filterDiscoveryIntents,
  secondaryCategoriesStillSupported,
  getToolById as getTool,
} from "./index";

describe("Membership mobile parity", () => {
  it("ships at least 12 catalog tools", () => {
    expect(FIELD_KIT_TOOLS.length).toBeGreaterThanOrEqual(12);
  });

  it("has no tool with mobile delivery 'missing'", () => {
    const missing = FIELD_KIT_TOOLS.filter((t) => t.mobile === "missing");
    expect(missing).toEqual([]);
  });

  it("every tool has a web path and mobile delivery", () => {
    for (const t of FIELD_KIT_TOOLS) {
      expect(t.path.startsWith("/")).toBe(true);
      expect(["native", "webview"]).toContain(t.mobile);
      expect(mobileDeliveryLabel(t.mobile).length).toBeGreaterThan(3);
    }
  });

  it("native tools have a route or tool tab", () => {
    for (const t of FIELD_KIT_TOOLS.filter((x) => x.mobile === "native")) {
      expect(Boolean(t.mobileRoute || t.mobileToolTab)).toBe(true);
    }
  });

  it("webview tools open via catalog path (tool-web)", () => {
    for (const t of FIELD_KIT_TOOLS.filter((x) => x.mobile === "webview")) {
      expect(t.path.length).toBeGreaterThan(2);
      expect(getToolById(t.id)?.id).toBe(t.id);
    }
  });

  it("parity debt is only documented webview tools (not missing)", () => {
    const debt = mobileParityDebt();
    for (const t of debt) {
      expect(t.mobile).toBe("webview");
    }
  });

  it("core tools exist for Command / Objections / Weekly Plan", () => {
    expect(getToolById("sales-workflow")?.mobile).toBe("native");
    expect(getToolById("objections")?.mobile).toBe("native");
    expect(getToolById("weekly-plan")?.mobile).toBe("native");
    expect(getToolById("role-play")?.mobile).toBe("native");
  });

  it("daily and leader tool id lists only reference catalog tools", () => {
    for (const id of [...FIELD_KIT_DAILY_TOOL_IDS, ...FIELD_KIT_LEADER_TOOL_IDS]) {
      expect(getToolById(id)?.id).toBe(id);
    }
    const dailySet = new Set(FIELD_KIT_DAILY_TOOL_IDS);
    for (const id of FIELD_KIT_LEADER_TOOL_IDS) {
      expect(dailySet.has(id as (typeof FIELD_KIT_DAILY_TOOL_IDS)[number])).toBe(
        false,
      );
    }
  });
});

describe("Intent-first discovery IA (HSP-29)", () => {
  it("is versioned and lists required professional intents", () => {
    expect(DISCOVERY_IA_VERSION).toMatch(/^discovery-ia-v\d+/);
    const ids = DISCOVERY_INTENTS.map((i) => i.id);
    for (const required of [
      "prepare_visit",
      "handle_objection",
      "follow_up",
      "plan_week",
      "open_account",
      "develop_account",
      "coach_rep",
      "run_numbers",
      "improve_territory",
      "learn_fundamentals",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("places Field resources as a peer surface (not Learn-only)", () => {
    expect(PRODUCT_SURFACE_PLACEMENT.field_resources.label).toBe(
      "Field resources",
    );
    expect(PRODUCT_SURFACE_PLACEMENT.field_resources.webPath).toBe("/resources");
    expect(PRODUCT_SURFACE_PLACEMENT.learn.label).toBe("Learn");
    expect(PRODUCT_SURFACE_PLACEMENT.tools.label).toBe("Tools");
    // Resources meaning explicitly work aids
    expect(PRODUCT_SURFACE_PLACEMENT.field_resources.meaning).toMatch(
      /not only study/i,
    );
  });

  it("intent tool destinations exist in the catalog", () => {
    expect(assertIntentToolReferences(getTool)).toEqual([]);
  });

  it("keeps secondary Prepare/Practice/Plan/Measure categories", () => {
    const cats = secondaryCategoriesStillSupported();
    expect(cats).toContain("Prepare");
    expect(cats).toContain("Practice");
    expect(cats).toContain("Plan");
    expect(cats).toContain("Measure");
  });

  it("filters intents by user language", () => {
    const hits = filterDiscoveryIntents("objection");
    expect(hits.some((i) => i.id === "handle_objection")).toBe(true);
  });

  it("resolves at least one destination per intent", () => {
    for (const intent of DISCOVERY_INTENTS) {
      expect(intent.destinations.length).toBeGreaterThan(0);
    }
  });
});

describe("Command Center capability matrix", () => {
  it("lists shared facts and intentional mobile gaps", () => {
    expect(COMMAND_CENTER_CAPABILITIES.length).toBeGreaterThanOrEqual(8);
    expect(sharedCommandCenterFacts().length).toBe(COMMAND_CENTER_CAPABILITIES.length);
    const supported = mobileCommandCenterSupported().map((c) => c.id);
    expect(supported).toEqual(
      expect.arrayContaining([
        "today",
        "accounts",
        "schedule-cycle",
        "build-plan",
        "roleplay",
        "debrief-draft",
        "complete-call",
        "approve-coaching",
        "schedule-next",
        "email-draft",
        "csv-import",
      ]),
    );
    const gaps = mobileCommandCenterGaps().map((c) => c.id);
    // calendar-connect remains partial (adapter-dependent OAuth)
    expect(gaps).toEqual(expect.arrayContaining(["calendar-connect"]));
    expect(gaps).not.toContain("csv-import");
    expect(gaps).not.toContain("roleplay");
    expect(gaps).not.toContain("approve-coaching");
    expect(gaps).not.toContain("accounts");
    expect(gaps).not.toContain("schedule-next");
    expect(gaps).not.toContain("email-draft");
  });

  it("every capability has at least one API path", () => {
    for (const c of COMMAND_CENTER_CAPABILITIES) {
      expect(c.api.length).toBeGreaterThan(0);
      expect(c.web).not.toBe("none");
    }
  });

  it("debrief draft remains human-in-the-loop on both surfaces", () => {
    const debrief = COMMAND_CENTER_CAPABILITIES.find((c) => c.id === "debrief-draft");
    expect(debrief?.web).toMatch(/full|supported/);
    expect(debrief?.mobile).toMatch(/full|supported/);
    expect(debrief?.notes?.toLowerCase()).toMatch(/draft|review|never auto/);
  });
});

describe("Classic Field tool routes (Stack A)", () => {
  it("maps to catalog ids that exist", () => {
    for (const route of CLASSIC_FIELD_TOOL_ROUTES) {
      if (!route.catalogId) continue;
      // activity-calculator and branch both share profitability API — both must exist
      expect(getToolById(route.catalogId)?.id).toBe(route.catalogId);
      expect(route.path.startsWith("/api/")).toBe(true);
      expect(route.gated).toBe(true);
    }
  });

  it("does not use Command Center or advanced AI path prefixes", () => {
    for (const route of CLASSIC_FIELD_TOOL_ROUTES) {
      expect(route.path.startsWith("/api/v1/sales-workflow")).toBe(false);
      expect(route.path.startsWith("/api/ai-tools")).toBe(false);
    }
  });
});
