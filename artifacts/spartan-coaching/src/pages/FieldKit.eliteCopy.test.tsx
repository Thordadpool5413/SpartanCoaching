/**
 * Legacy /field-kit page is now an alias of the membership lander.
 * Elite copy coverage lives in FieldKitMembership.eliteCopy.test.tsx.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("FieldKit legacy page", () => {
  it("defers elite copy coverage to FieldKitMembership.eliteCopy.test.tsx", () => {
    expect(true).toBe(true);
  });

  it("gives every priority generated result a concrete, privacy-safe field action", () => {
    const pages = [
      ["WeeklyPlanBuilder.tsx", "weekly-plan", "Open Sales Command Center"],
      ["Playbooks.tsx", "playbooks", "Practice in Role-Play"],
      ["ColdCallScript.tsx", "cold-call-script", "Practice Opening in Role-Play"],
      ["EmailTemplates.tsx", "email-templates", "Send this email"],
      ["RolePlay.tsx", "role-play", "Draft Follow-Up Email"],
    ] as const;

    for (const [file, toolId, actionLabel] of pages) {
      const source = readFileSync(resolve(import.meta.dirname, file), "utf8");
      expect(source).toContain("ToolResultActions");
      expect(source).toContain(`toolId="${toolId}"`);
      expect(source).toContain(actionLabel);
    }

    const objections = readFileSync(resolve(import.meta.dirname, "Objections.tsx"), "utf8");
    expect(objections).toContain("FieldTalkTrack");
    const talkTrack = readFileSync(
      resolve(import.meta.dirname, "..", "components", "FieldTalkTrack.tsx"),
      "utf8",
    );
    expect(talkTrack).toContain("Practice this in Role-Play");

    const resources = readFileSync(resolve(import.meta.dirname, "Resources.tsx"), "utf8");
    expect(resources).toContain('toolId="resources"');
    expect(resources).toContain("does not save it to My Work or sync it to iPhone");
  });
});
