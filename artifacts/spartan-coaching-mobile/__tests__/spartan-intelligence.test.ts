import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

describe("Spartan Intelligence native workflow", () => {
  const screen = fs.readFileSync(path.join(root, "app/spartan-intelligence.tsx"), "utf8");

  it("uses guided provider fields instead of structured data inputs", () => {
    expect(screen).toContain("Turn a verified provider into an account strategy");
    expect(screen).toContain("Provider last name");
    expect(screen).toContain("ChoiceField label=\"Account type\"");
    expect(screen).not.toContain("Structured data is supported here");
    expect(screen).not.toContain("One item per line");
  });

  it("exposes a native command center as the default mobile workspace", () => {
    expect(screen).toContain('useState<Workspace>("platform")');
    expect(screen).toContain("Know what is true. Make the next move.");
    expect(screen).toContain("COMMAND CENTER");
    expect(screen).toContain("Verify identity and prepare the account");
    expect(screen).toContain("Explore Care Compare records and profiles");
    expect(screen).toContain("Build an evidence-backed next move");
    expect(screen).toContain("Explain sourced CMS guidance clearly");
    expect(screen).not.toContain("WebBrowser.openBrowserAsync");
    expect(screen).not.toContain("appdeploy.ai");
  });

  it("connects verified search to an Elite account brief", () => {
    expect(screen).toContain("/api/reference/npi");
    expect(screen).toContain("/api/intelligence/account-brief");
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

  it("includes an evidence-backed decision room with Coach handoff", () => {
    expect(screen).toContain("DECISION ROOM");
    expect(screen).toContain("/api/intelligence/market-decision");
    expect(screen).toContain("Missing evidence lowers coverage");
    expect(screen).toContain("Stop conditions");
    expect(screen).toContain("Ask Coach about this");
    expect(screen).toContain("saveCoachHandoff");
    expect(screen).toContain("Official sources");
    expect(screen).toContain("Linking.openURL");
  });

  it("uses the shared Medicare runtime contract for native operations", () => {
    expect(screen).toContain("buildMedicareRuntimePath");
    expect(screen).not.toContain('setResult(await apiGet(`/api/v1/medicare${path}`))');
  });

  it("distinguishes sourced facts, calculations, guidance, and missing evidence", () => {
    expect(screen).toContain("Verified fact");
    expect(screen).toContain("Calculated result");
    expect(screen).toContain("Coach guidance");
    expect(screen).toContain("Missing, not zero");
  });

  it("shows progress and makes every result portable", () => {
    expect(screen).toContain("This usually takes a few seconds");
    expect(screen).toContain("Clipboard.setStringAsync");
    expect(screen).toContain("Share.share");
    expect(screen).toContain("AsyncStorage.setItem");
    expect(screen).toContain("/api/v1/member-work");
    expect(screen).toContain("available on iPhone and web");
  });
});
