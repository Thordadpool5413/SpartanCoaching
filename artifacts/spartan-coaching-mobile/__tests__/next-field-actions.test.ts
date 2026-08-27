import { MOBILE_FIELD_RESULT_ACTIONS } from "@workspace/field-kit-catalog";
import fs from "node:fs";
import path from "node:path";

describe("native generated-result next actions", () => {
  it("hands each field result to its real native destination", () => {
    expect(MOBILE_FIELD_RESULT_ACTIONS.playbooks.href).toBe("/tool/roleplay");
    expect(MOBILE_FIELD_RESULT_ACTIONS.objections.href).toBe("/tool/roleplay");
    expect(MOBILE_FIELD_RESULT_ACTIONS["role-play"].href).toBe("/sales-workflow");
    expect(MOBILE_FIELD_RESULT_ACTIONS["cold-call"].href).toBe("/tool/roleplay");
    expect(MOBILE_FIELD_RESULT_ACTIONS["weekly-plan"].href).toBe("/sales-workflow");
    expect(MOBILE_FIELD_RESULT_ACTIONS["email-templates"].href).toBe("/tool/roleplay");
    expect(MOBILE_FIELD_RESULT_ACTIONS.research.href).toBe("/tool/playbook");
    expect(MOBILE_FIELD_RESULT_ACTIONS.resources.href).toBe("/(tabs)/tools");
  });

  it("states the native persistence boundary without promising a save or send", () => {
    for (const action of Object.values(MOBILE_FIELD_RESULT_ACTIONS)) {
      expect(action.persistenceNote).toBeTruthy();
    }
    expect(MOBILE_FIELD_RESULT_ACTIONS["email-templates"].persistenceNote).toContain(
      "does not send email",
    );
    expect(MOBILE_FIELD_RESULT_ACTIONS.resources.persistenceNote).toContain(
      "downloaded file does not move",
    );
  });

  it("does not queue generated field input after an unavailable response", () => {
    const toolFiles = [
      "PlaybookTool.tsx",
      "ObjectionTool.tsx",
      "EmailTool.tsx",
      "WeeklyTool.tsx",
      "ColdCallTool.tsx",
      "ResearchTool.tsx",
    ];
    for (const file of toolFiles) {
      const source = fs.readFileSync(
        path.join(__dirname, "..", "components", "tools", file),
        "utf8",
      );
      expect(source).not.toContain("enqueueGenerate");
      expect(source).toContain("input was not saved");
    }
  });

  it("keeps role-play feedback on the current screen instead of loading history", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "..", "components", "RolePlayTool.tsx"),
      "utf8",
    );
    expect(source).not.toContain('apiGet<RoleplaySession[]>("/api/roleplay/sessions")');
    expect(source).not.toContain("Past Sessions");
    expect(MOBILE_FIELD_RESULT_ACTIONS["role-play"].persistenceNote).toContain(
      "stays on screen for this session",
    );
  });
});