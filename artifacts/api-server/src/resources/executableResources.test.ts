import { describe, it, expect } from "vitest";
import {
  EXECUTABLE_RESOURCES_VERSION,
  getExecutableDefinition,
  listExecutableResources,
  resourceDetailFromExecutable,
  sanitizeFormData,
  validateResourceWorkSave,
} from "./executableResources";

describe("executable resources (HSP-26)", () => {
  it("is versioned and lists weekly-plan", () => {
    expect(EXECUTABLE_RESOURCES_VERSION).toMatch(/^executable-resources-v\d+/);
    const list = listExecutableResources();
    expect(list.some((r) => r.resourceKey === "weekly-plan")).toBe(true);
    const detail = resourceDetailFromExecutable("weekly-plan");
    expect(detail?.whenToUse).toBeTruthy();
    expect(detail?.formats).toContain("interactive");
    expect(detail?.expectedOutcome).toBeTruthy();
  });

  it("sanitizes form data and truncates long strings", () => {
    const s = sanitizeFormData({
      weekOf: "  Jan 12  ",
      bad: { nested: "ok", deep: { x: 1 } },
      n: 3,
      long: "x".repeat(5000),
    });
    expect(s.weekOf).toBe("Jan 12");
    expect(s.n).toBe(3);
    expect(String(s.long).length).toBe(2000);
    expect((s.bad as Record<string, unknown>).nested).toBe("ok");
  });

  it("rejects unknown resource keys", () => {
    const r = validateResourceWorkSave("not-a-thing", {
      formData: { weekOf: "x" },
      status: "draft",
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("UNKNOWN_RESOURCE_KEY");
  });

  it("keeps draft when complete requirements missing", () => {
    const r = validateResourceWorkSave("weekly-plan", {
      formData: { territory: "North" },
      status: "completed",
    });
    expect(r.status).toBe("draft");
    expect(r.errors.some((e) => e.startsWith("REQUIRED_"))).toBe(true);
    expect(r.ok).toBe(true);
  });

  it("accepts completed weekly plan with required fields", () => {
    const r = validateResourceWorkSave("weekly-plan", {
      formData: {
        weekOf: "Mar 2–6",
        primaryObjective: "Re-engage 3 Tier A accounts",
        territory: "North",
      },
      status: "completed",
    });
    expect(r.status).toBe("completed");
    expect(r.errors).toHaveLength(0);
    expect(r.sanitizedFormData.weekOf).toBe("Mar 2–6");
  });

  it("resolves weekly-plan definition", () => {
    const def = getExecutableDefinition("weekly-plan");
    expect(def?.webPath).toBe("/resources/weekly-plan");
    expect(def?.relatedToolIds.length).toBeGreaterThan(0);
  });
});
