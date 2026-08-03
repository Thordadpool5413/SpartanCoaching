/**
 * Ensures primary membership tools have scenario + outcome copy in the catalog.
 * Contract used by membership marketing and portal tool hierarchy.
 */
import { describe, it, expect } from "vitest";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";

const PRIMARY_TOOL_IDS = [
  "objections",
  "playbooks",
  "role-play",
  "sales-workflow",
  "weekly-plan",
  "cold-call",
  "email-templates",
];

describe("Membership primary tool scenarios", () => {
  it("every PRIMARY_TOOL_ID resolves to a catalog entry", () => {
    const missing = PRIMARY_TOOL_IDS.filter(
      (id) => !FIELD_KIT_TOOLS.find((t) => t.id === id),
    );
    expect(missing, `Tools not found in catalog: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("every PRIMARY_TOOL_ID has scenario copy in the catalog", () => {
    const noScenario = PRIMARY_TOOL_IDS.filter((id) => {
      const tool = FIELD_KIT_TOOLS.find((t) => t.id === id);
      return !tool?.scenario;
    });
    expect(
      noScenario,
      `Tools missing scenario in catalog: ${noScenario.join(", ")}`,
    ).toHaveLength(0);
  });

  it("every PRIMARY_TOOL_ID has outcome copy in the catalog", () => {
    const noOutcome = PRIMARY_TOOL_IDS.filter((id) => {
      const tool = FIELD_KIT_TOOLS.find((t) => t.id === id);
      return !tool?.outcome;
    });
    expect(
      noOutcome,
      `Tools missing outcome in catalog: ${noOutcome.join(", ")}`,
    ).toHaveLength(0);
  });
});
