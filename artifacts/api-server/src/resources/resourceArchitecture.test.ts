import { describe, it, expect } from "vitest";
import {
  RESOURCE_CONTENT_ARCHITECTURE_VERSION,
  presentResource,
  presentResources,
  prepareResourceWrite,
  sanitizeArchitecture,
} from "./resourceArchitecture";

describe("resourceArchitecture (HSP-25)", () => {
  it("is versioned", () => {
    expect(RESOURCE_CONTENT_ARCHITECTURE_VERSION).toMatch(
      /^resource-content-architecture-v\d+/,
    );
  });

  it("presents legacy download-only rows without breaking required fields", () => {
    const presented = presentResource({
      id: 1,
      title: "Objection Talk Tracks",
      description: "Field objection aid",
      fileUrl: "/resources/files/objections.pdf",
      category: "script",
      contentArchitecture: null,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    expect(presented.id).toBe(1);
    expect(presented.fileUrl).toBe("/resources/files/objections.pdf");
    expect(presented.category).toBe("script");
    expect(presented.architecture.version).toBe(
      RESOURCE_CONTENT_ARCHITECTURE_VERSION,
    );
    expect(presented.architecture.presentationType).toBe("script");
    expect(presented.architecture.status).toBe("published");
    expect(presented.architecture.premiumRule).toBe("public");
    expect(presented.architecture.formats).toContain("pdf");
    expect(presented.architecture.relatedToolIds).toContain("objection");
    expect(presented.architecture.whenToUse).toBeTruthy();
    expect(presented.architecture.clinicalSensitivity).toBe("none");
    // Nested alias for clients
    expect(presented.contentArchitecture.resourceType).toBe("script");
  });

  it("merges stored architecture over legacy defaults", () => {
    const presented = presentResource({
      id: 2,
      title: "Weekly Planner",
      fileUrl: "/resources/files/week.pdf",
      category: "template",
      contentArchitecture: {
        whenToUse: "Sunday night territory planning",
        premiumRule: "field_kit",
        experienceLevel: "new_hire",
        author: "Field Ops",
      },
    });
    expect(presented.architecture.whenToUse).toBe(
      "Sunday night territory planning",
    );
    expect(presented.architecture.premiumRule).toBe("field_kit");
    expect(presented.architecture.experienceLevel).toBe("new_hire");
    expect(presented.architecture.author).toBe("Field Ops");
    expect(presented.architecture.presentationType).toBe("template");
  });

  it("marks eligibility-titled resources as educational sensitivity only", () => {
    const presented = presentResource({
      title: "Eligibility Quick Reference",
      fileUrl: "/resources/files/elig.pdf",
      category: "guide",
    });
    expect(presented.architecture.clinicalSensitivity).toBe("educational");
    expect(presented.architecture.sourceAuthority).toMatch(/Spartan/i);
  });

  it("sanitizes unknown enum values instead of inventing authority", () => {
    const a = sanitizeArchitecture({
      clinicalSensitivity: "hipaa_certified_magic",
      premiumRule: "super_admin_only",
      status: "live",
      sourceAuthority: "  CMS-looking claim  ",
    });
    expect(a.clinicalSensitivity).toBeUndefined();
    expect(a.premiumRule).toBeUndefined();
    expect(a.status).toBeUndefined();
    expect(a.sourceAuthority).toBe("CMS-looking claim");
  });

  it("prepareResourceWrite keeps legacy fields and stores architecture", () => {
    const prepared = prepareResourceWrite({
      title: "Cold Call Script",
      description: "Openers",
      fileUrl: "/resources/files/cold.pdf",
      category: "script",
      whenToUse: "Before first outreach",
      whyItMatters: "Consistency on the phone",
      expectedOutcome: "A practiced opener",
      role: ["rep", "director"],
      relatedToolIds: ["roleplay"],
      clinicalSensitivity: "none",
      premiumRule: "public",
    });
    expect(prepared.title).toBe("Cold Call Script");
    expect(prepared.fileUrl).toBe("/resources/files/cold.pdf");
    expect(prepared.contentArchitecture.whenToUse).toBe(
      "Before first outreach",
    );
    expect(prepared.contentArchitecture.role).toEqual(["rep", "director"]);
    expect(prepared.contentArchitecture.relatedToolIds).toEqual(["roleplay"]);
    expect(prepared.contentArchitecture.version).toBe(
      RESOURCE_CONTENT_ARCHITECTURE_VERSION,
    );
  });

  it("presentResources maps lists", () => {
    const list = presentResources([
      { id: 1, title: "A", fileUrl: "/a.pdf", category: "guide" },
      { id: 2, title: "B", fileUrl: "/b.pdf", category: "checklist" },
    ]);
    expect(list).toHaveLength(2);
    expect(list[1].architecture.presentationType).toBe("checklist");
  });
});
