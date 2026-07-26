/**
 * Ensures every tool listed in PRIMARY_TOOL_IDS on the Field Kit marketing
 * page has a corresponding catalog entry with scenario + outcome copy.
 *
 * When a new primary tool is added to PRIMARY_TOOL_IDS, this test will fail
 * until the catalog entry also carries scenario and outcome — preventing
 * silent fallback to a blank card.
 */
import { describe, it, expect } from "vitest";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";

// Keep this list in sync with FieldKit.tsx PRIMARY_TOOL_IDS.
// The test is the contract: every id here must exist in the catalog with
// both scenario and outcome populated.
const PRIMARY_TOOL_IDS = [
  "objections",
  "playbooks",
  "role-play",
  "sales-workflow",
  "weekly-plan",
  "cold-call",
  "email-templates",
];

describe("FieldKit primary tool scenarios", () => {
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
