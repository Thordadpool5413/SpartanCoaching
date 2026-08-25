import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPolicyBrief } from "./policyIntelligence";
import { searchCmsHospices } from "./cmsHospiceLookup";

afterEach(() => vi.restoreAllMocks());

describe("buildPolicyBrief", () => {
  it("labels the educational baseline honestly", () => {
    const result = buildPolicyBrief("documentation", null);
    expect(result.source.liveCmsSnapshot).toBe(false);
    expect(result.boundary).toContain("live CMS coverage snapshot is not currently attached");
  });

  it("presents a live CMS snapshot with provenance", () => {
    const result = buildPolicyBrief("election", {
      source: "CMS_MCD",
      documentId: "LCD-1",
      title: "Hospice policy",
      sourceUrl: "https://www.cms.gov/example",
      fetchedAt: "2026-08-25T12:00:00.000Z",
    });
    expect(result.source.liveCmsSnapshot).toBe(true);
    expect(result.source.documentId).toBe("LCD-1");
  });
});

describe("searchCmsHospices", () => {
  it("maps a CMS enrollment row into customer ready fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([{
      NPI: "1234567890", CCN: "101500", "ORGANIZATION NAME": "SPARTAN HOSPICE",
      "DOING BUSINESS AS NAME": "SPARTAN", CITY: "TAMPA", STATE: "FL",
      "ZIP CODE": "33601", PROPRIETARY_NONPROFIT: "N", "ORGANIZATION TYPE STRUCTURE": "CORPORATION",
    }]), { status: 200 }));
    const result = await searchCmsHospices({ state: "fl", city: "tampa" });
    expect(result[0]).toMatchObject({ organizationName: "SPARTAN HOSPICE", ownership: "Nonprofit", state: "FL" });
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("filter%5BSTATE%5D=FL");
  });

  it("rejects invalid state input before calling CMS", async () => {
    await expect(searchCmsHospices({ state: "Florida" })).rejects.toThrow("two letter");
  });
});
