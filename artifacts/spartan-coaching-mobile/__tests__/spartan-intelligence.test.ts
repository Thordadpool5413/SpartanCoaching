import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

describe("Spartan Intelligence native workflow", () => {
  const screen = fs.readFileSync(path.join(root, "app/spartan-intelligence.tsx"), "utf8");

  it("uses guided provider fields instead of structured data inputs", () => {
    expect(screen).toContain("Find a referral source");
    expect(screen).toContain("Provider last name");
    expect(screen).not.toContain("JSON.stringify");
    expect(screen).toContain("Turn a verified provider into an account strategy");
    expect(screen).toContain("Provider last name");
    expect(screen).toContain("ChoiceField label=\"Account type\"");
    expect(screen).not.toContain("Structured data is supported here");
    expect(screen).not.toContain("One item per line");
  });

  it("connects verified search to an Elite account brief", () => {
    expect(screen).toContain("/api/reference/npi");
    expect(screen).toContain("/api/intelligence/account-brief");
    expect(screen).toContain("READY FOR THE ROOM");
  });

  it("includes guided CMS policy and hospice market intelligence", () => {
    expect(screen).toContain("CMS POLICY NAVIGATOR");
    expect(screen).toContain("/api/intelligence/policy-brief");
    expect(screen).toContain("LIVE CMS MARKET EXPLORER");
    expect(screen).toContain("/api/intelligence/hospice-market");
    expect(screen).toContain("ACCOUNT STRATEGY");
    expect(screen).toContain("thirtyDayPlan");
    expect(screen).toContain("followUpMessage");
  });

  it("includes guided CMS policy and hospice market intelligence", () => {
    expect(screen).toContain("CMS POLICY INTELLIGENCE");
    expect(screen).toContain("/api/intelligence/policy-brief");
    expect(screen).toContain("HOSPICE MARKET INTELLIGENCE");
    expect(screen).toContain("/api/intelligence/hospice-market");
    expect(screen).toContain("/api/intelligence/hospice-profile");
    expect(screen).toContain("Family experience");
  });

  it("shows progress and makes every result portable", () => {
    expect(screen).toContain("This usually takes a few seconds");
    expect(screen).toContain("Clipboard.setStringAsync");
    expect(screen).toContain("Share.share");
    expect(screen).toContain("AsyncStorage.setItem");
  });
});
