import { describe, expect, it, beforeEach } from "vitest";
import {
  assertProviderOrgAccess,
  buildProviderAiContext,
  clearProviderCompanyConfigStore,
  companyConfigToProviderDocs,
  getProviderCompanyConfig,
  listProviderCompanyConfigVersions,
  PROVIDER_SOURCE_LABEL,
  upsertProviderCompanyConfig,
} from "./providerCompanyConfig";
import {
  clearProviderKnowledgeRegistry,
  getProviderKnowledgeForOrg,
  retrieveThreeLayerKnowledge,
} from "./threeLayerKnowledge";

beforeEach(() => {
  clearProviderCompanyConfigStore();
  clearProviderKnowledgeRegistry();
});

describe("tenant isolation", () => {
  it("stores configs per organization only", () => {
    upsertProviderCompanyConfig(10, {
      organizationDisplayName: "Hospice Alpha",
      serviceAreas: ["North county"],
      approvedClaims: ["24/7 RN line"],
    });
    upsertProviderCompanyConfig(20, {
      organizationDisplayName: "Hospice Beta",
      serviceAreas: ["South region"],
      approvedClaims: ["Inpatient unit"],
    });
    expect(getProviderCompanyConfig(10)?.organizationDisplayName).toBe(
      "Hospice Alpha",
    );
    expect(getProviderCompanyConfig(20)?.serviceAreas).toEqual([
      "South region",
    ]);
    expect(getProviderCompanyConfig(10)?.serviceAreas).not.toContain(
      "South region",
    );
  });

  it("rejects cross-org AI access requests", () => {
    expect(() => assertProviderOrgAccess(10, 20)).toThrow(/outside your organization/i);
    expect(assertProviderOrgAccess(10, 10)).toBe(10);
    expect(assertProviderOrgAccess(10, null)).toBe(10);
  });
});

describe("versioning", () => {
  it("increments version on each upsert and keeps history", () => {
    const v1 = upsertProviderCompanyConfig(5, {
      brandVoice: "Warm and clinical",
    });
    expect(v1.version).toBe(1);
    const v2 = upsertProviderCompanyConfig(5, {
      brandVoice: "Warm, clinical, concise",
      programs: ["Palliative partnership"],
    });
    expect(v2.version).toBe(2);
    expect(v2.programs).toContain("Palliative partnership");
    const versions = listProviderCompanyConfigVersions(5);
    expect(versions.map((v) => v.version).sort()).toEqual([1, 2]);
  });
});

describe("AI labeling and three-layer sync", () => {
  it("labels AI context as PROVIDER-SOURCED", () => {
    upsertProviderCompanyConfig(7, {
      organizationDisplayName: "Demo Hospice",
      afterHoursCapabilities: ["On-call RN 24/7"],
      prohibitedClaims: ["We guarantee eligibility"],
      preferredTerminology: [
        { term: "terminal", preferred: "serious illness" },
      ],
    });
    const pack = buildProviderAiContext(7);
    expect(pack).toBeTruthy();
    expect(pack!.sourceLabel).toBe(PROVIDER_SOURCE_LABEL);
    expect(pack!.promptBlock).toContain(PROVIDER_SOURCE_LABEL);
    expect(pack!.promptBlock).toContain("On-call RN 24/7");
    expect(pack!.promptBlock).toContain("Do not present as universal");
    expect(pack!.disclaimer.toLowerCase()).toMatch(/organization|provider/);
    expect(pack!.sections.every((s) => s.sourceLabel === PROVIDER_SOURCE_LABEL)).toBe(
      true,
    );
  });

  it("syncs into three-layer provider registry for org-only retrieval", () => {
    upsertProviderCompanyConfig(11, {
      serviceAreas: ["River valley"],
      admissionResponseStandards: ["Respond to referral within 1 hour"],
    });
    const docs = getProviderKnowledgeForOrg(11);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((d) => d.organizationId === 11)).toBe(true);

    const hit = retrieveThreeLayerKnowledge({
      query: "admission referral response hour",
      organizationId: 11,
    });
    const providerHits = hit.hits.filter((h) => h.layer === "provider");
    expect(providerHits.length).toBeGreaterThan(0);
    expect(providerHits.every((h) => h.organizationId === 11)).toBe(true);
    expect(providerHits.every((h) => h.layerLabel.includes("Provider"))).toBe(
      true,
    );

    const other = retrieveThreeLayerKnowledge({
      query: "admission referral response hour",
      organizationId: 99,
    });
    expect(
      other.hits.filter((h) => h.layer === "provider" && h.organizationId === 11)
        .length,
    ).toBe(0);
  });

  it("companyConfigToProviderDocs maps claims and prohibited claims", () => {
    const config = upsertProviderCompanyConfig(3, {
      approvedClaims: ["Same-day admit capability"],
      prohibitedClaims: ["Guarantee of six-month prognosis"],
    });
    const docs = companyConfigToProviderDocs(config);
    expect(docs.some((d) => d.id.includes("approved-claims"))).toBe(true);
    expect(
      docs.find((d) => d.id.includes("prohibited"))?.body.toLowerCase(),
    ).toMatch(/do not/);
  });
});
