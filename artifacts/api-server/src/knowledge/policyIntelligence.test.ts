import { afterEach, describe, expect, it, vi } from "vitest";
import { POLICY_TOPICS, buildPolicyBrief } from "./policyIntelligence";
import { getCmsHospiceProfile, searchCmsHospices } from "./cmsHospiceLookup";

afterEach(() => vi.restoreAllMocks());

describe("buildPolicyBrief", () => {
  it("labels the educational baseline honestly", () => {
    const result = buildPolicyBrief("documentation", null);
    expect(result.source.liveCmsSnapshot).toBe(false);
    expect(result.sources).toHaveLength(2);
    expect(result.whatNotToSay).toHaveLength(2);
    expect(result.escalation).toContain("clinical reviewer");
  });

  it("covers the decisions field and clinical teams encounter", () => {
    expect(POLICY_TOPICS).toHaveLength(12);
    const result = buildPolicyBrief("continuous-home-care", null, {
      audience: "family",
      concern: "What happens during a crisis at home?",
    });
    expect(result.purpose).toContain("crisis at home");
    expect(result.talkTrack).toContain("clinical team");
    expect(result.reviewChecklist.length).toBeGreaterThanOrEqual(3);
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
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [{
        cms_certification_number_ccn: "101500", facility_name: "SPARTAN HOSPICE",
        citytown: "TAMPA", state: "FL", zip_code: "33601", ownership_type: "Voluntary nonprofit",
        certification_date: "01/01/1999",
      }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        NPI: "1234567890", CCN: "101500", "ORGANIZATION NAME": "SPARTAN HOSPICE",
        "DOING BUSINESS AS NAME": "SPARTAN", CITY: "TAMPA", STATE: "FL",
        "ZIP CODE": "33601", "ORGANIZATION TYPE STRUCTURE": "CORPORATION",
      }]), { status: 200 }));
    const result = await searchCmsHospices({ state: "fl", city: "tampa" });
    expect(result.results[0]).toMatchObject({ organizationName: "SPARTAN HOSPICE", ownership: "Voluntary nonprofit", state: "FL" });
    expect(result.summary.totalMatched).toBe(1);
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("filter%5BSTATE%5D=FL");
  });

  it("rejects invalid state input before calling CMS", async () => {
    await expect(searchCmsHospices({ state: "Florida" })).rejects.toThrow("two letter");
  });

  it("builds a quality profile with an honest state comparison", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [{ cms_certification_number_ccn: "451500", facility_name: "SPARTAN HOSPICE", state: "TX", citytown: "AUSTIN", ownership_type: "Nonprofit" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [{ measure_code: "H_008_01_OBSERVED", measure_name: "Composite", score: "98", measure_date_range: "2025" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [{ measure_code: "TEAM_COMM_TBV", measure_name: "Communicated well", score: "88", date: "2025" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [{ measure_code: "H_008_01_OBSERVED", measure_name: "Composite", score: "94", measure_date_range: "2025" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [{ measure_code: "TEAM_COMM_TBV", measure_name: "Communicated well", score: "80", date: "2025" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 2, results: [{ zip_code: "33601" }, { zip_code: "33602" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ NPI: "1234567890", CCN: "451500", "ORGANIZATION NAME": "SPARTAN HOSPICE" }]), { status: 200 }));
    const result = await getCmsHospiceProfile("451500");
    expect(result.quality[0]).toMatchObject({ favorable: true, differenceFromState: 4 });
    expect(result.familyExperience[0]).toMatchObject({ favorable: true, differenceFromState: 8 });
    expect(result.serviceArea.count).toBe(2);
    expect(result.interpretation).toContain("do not prove");
  });
});
