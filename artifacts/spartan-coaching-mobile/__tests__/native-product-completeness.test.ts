import fs from "node:fs";
import path from "node:path";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SPARTAN_OFFERINGS } from "../lib/productExperience";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("native product completeness", () => {
  it("does not route a core catalog tool to the website", () => {
    expect(FIELD_KIT_TOOLS.filter((tool) => tool.mobile !== "native")).toEqual([]);
    expect(FIELD_KIT_TOOLS.filter((tool) => !tool.mobileRoute)).toEqual([]);
    expect(fs.existsSync(path.join(root, "app/tool-web.tsx"))).toBe(false);
    expect(read("app/_layout.tsx")).not.toContain('name="tool-web"');
  });

  it("opens Library items and Spartan Method content inside the app", () => {
    const library = read("app/(tabs)/learn.tsx");
    const reader = read("app/library-item.tsx");
    const method = read("app/method-guide.tsx");
    expect(library).not.toContain("Linking.openURL");
    expect(library).not.toContain('pathname: "/tool-web"');
    expect(library).toContain('pathname: "/library-item"');
    expect(library).toContain('pathname: "/method-guide"');
    expect(reader).toContain("library-native-reader");
    expect(method).toContain("Discipline. Empathy. Strategy.");
  });

  it("keeps account recovery and administrator work native", () => {
    const login = read("app/login.tsx");
    const admin = read("app/admin.tsx");
    const rootLayout = read("app/_layout.tsx");
    expect(login).toContain('router.push("/forgot-password" as Href)');
    expect(login).not.toContain('openWebsite("/forgot-password")');
    expect(admin).not.toContain("Linking.openURL");
    expect(admin).toContain("Admin visibility has a hard boundary");
    expect(admin).toContain("setOrganizationMemberRole");
    expect(admin).toContain("assignOrganizationMember");
    expect(admin).toContain("offboardOrganizationMember");
    expect(rootLayout).toContain('name="forgot-password"');
    expect(rootLayout).toContain('name="reset-password"');
  });

  it("makes product scope and purchasing visible before authentication", () => {
    const home = read("components/WelcomeExperience.tsx");
    const membership = read("app/membership.tsx");
    const access = read("app/access.tsx");
    expect(home).toContain("SEE THE SYSTEM BEFORE YOU PAY");
    expect(home).toContain("See everything in the app");
    expect(home).toContain("Compare and subscribe with Apple");
    expect(membership).toContain("Payment happens through Apple before Spartan account creation");
    expect(membership).toContain("Private Spartan Coach");
    expect(access).toContain("THE COMPLETE APP");
  });

  it("defines one app wide source of truth for every major offering", () => {
    expect(SPARTAN_OFFERINGS.map((offering) => offering.id)).toEqual([
      "home",
      "coach",
      "tools",
      "library",
      "consulting",
      "account",
      "admin",
    ]);
    for (const offering of SPARTAN_OFFERINGS) {
      expect(offering.promise.length).toBeGreaterThan(20);
      expect(offering.capabilities.length).toBeGreaterThanOrEqual(4);
      expect(offering.offline.length).toBeGreaterThan(20);
    }
  });

  it("renders advanced AI results as a semantic product experience", () => {
    const tool = read("components/ai-tool-screen.tsx");
    const result = read("components/PremiumAiResult.tsx");
    expect(tool).toContain("PremiumAiResult");
    expect(tool).toContain("formatAiResultForSharing");
    expect(tool).toContain("Readable output, not a JSON dump");
    expect(result).toContain("Executive answer");
    expect(result).toContain("Field ready language");
    expect(result).toContain("Next actions");
    expect(result).toContain("Evidence & review");
  });
});
