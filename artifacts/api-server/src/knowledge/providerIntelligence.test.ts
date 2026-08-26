import { describe, expect, it } from "vitest";
import { buildAccountBrief } from "./providerIntelligence";

const provider = {
  npi: "1234567890",
  name: "David Ortiz",
  credential: "MD",
  taxonomy: "Family Medicine",
  taxonomies: ["Family Medicine"],
  city: "Melbourne",
  state: "FL",
  enumerationType: "NPI-1",
  status: "A",
  source: {
    label: "CMS NPPES NPI Registry" as const,
    url: "https://npiregistry.cms.hhs.gov/provider-view/1234567890",
    checkedAt: "2026-08-25T00:00:00.000Z",
  },
};

describe("provider intelligence account brief", () => {
  it("separates verified facts from coaching guidance", () => {
    const brief = buildAccountBrief({ provider, relationshipStage: "new" });
    expect(brief.verifiedFacts).toContainEqual({ label: "NPI", value: "1234567890" });
    expect(brief.discoveryQuestions.length).toBeGreaterThanOrEqual(5);
    expect(brief.limitations[0]).toContain("does not show referral volume");
    expect(brief.valueHypotheses).toHaveLength(3);
    expect(brief.thirtyDayPlan).toHaveLength(3);
  });

  it("uses a setting specific playbook and produces a ready follow up", () => {
    const brief = buildAccountBrief({
      provider,
      accountType: "snf",
      knownBarrier: "families hear about hospice too late",
      desiredCommitment: "Schedule a fifteen minute staff education",
    });
    expect(brief.accountLens).toContain("family readiness");
    expect(brief.discoveryQuestions.join(" ")).toContain("after hours");
    expect(brief.followUpMessage).toContain("families hear about hospice too late");
    expect(brief.nextMove).toBe("Schedule a fifteen minute staff education");
  });

  it("removes long dash characters from user supplied context", () => {
    const brief = buildAccountBrief({
      provider,
      knownContext: "Lunch meeting — asked for a follow up",
    });
    expect(JSON.stringify(brief)).not.toMatch(/[\u2013\u2014]/);
  });

  it("changes the opening for a reconnect relationship", () => {
    const brief = buildAccountBrief({ provider, relationshipStage: "reengage" });
    expect(brief.opening).toContain("It has been a while");
  });
});
