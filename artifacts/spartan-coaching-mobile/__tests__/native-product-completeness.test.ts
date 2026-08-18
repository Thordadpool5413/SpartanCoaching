import fs from "node:fs";
import path from "node:path";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("native product completeness", () => {
  it("does not route a core catalog tool to the website", () => {
    expect(FIELD_KIT_TOOLS.filter((tool) => tool.mobile !== "native")).toEqual([]);
    expect(FIELD_KIT_TOOLS.filter((tool) => !tool.mobileRoute)).toEqual([]);
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
    expect(rootLayout).toContain('name="forgot-password"');
    expect(rootLayout).toContain('name="reset-password"');
  });

  it("makes access and pricing visible before authentication", () => {
    const home = read("components/WelcomeExperience.tsx");
    const membership = read("app/membership.tsx");
    expect(home).toContain("TWO INDIVIDUAL MEMBERSHIPS");
    expect(home).toContain("$14.99");
    expect(home).toContain("$19.99");
    expect(membership).toContain("No Spartan account is required before purchase");
    expect(membership).toContain("Private Spartan Coach");
  });
});
