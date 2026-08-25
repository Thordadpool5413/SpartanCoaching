import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("complete native member journeys", () => {
  it("keeps support, privacy, terms, and trust inside the app", () => {
    const account = read("app/(tabs)/account.tsx");
    const register = read("app/register.tsx");
    const subscription = read("components/AppleSubscriptionActions.tsx");
    const layout = read("app/_layout.tsx");

    expect(layout).toContain('name="support"');
    expect(layout).toContain('name="legal"');
    expect(account).toContain('router.push("/support"');
    expect(account).toContain('pathname: "/legal"');
    expect(account).not.toContain("Linking.openURL");
    expect(register).not.toContain("Linking.openURL");
    expect(subscription).not.toContain("Linking.openURL");
  });

  it("provides useful native support and legal recovery states", () => {
    const support = read("app/support.tsx");
    const legal = read("app/legal.tsx");

    expect(support).toContain('apiPost("/api/inquiries"');
    expect(support).toContain("Never include patient names");
    expect(support).toContain('testID="support-confirmation"');
    expect(legal).toContain("You are still inside Spartan Coaching");
    expect(legal).toContain("This document could not load");
    expect(legal).toContain("onShouldStartLoadWithRequest");
  });

  it("removes website escape actions from native field results", () => {
    const result = read("components/FieldResultPanel.tsx");
    expect(result).not.toContain("webPath");
    expect(result).not.toContain("Linking.openURL");
    expect(result).not.toContain("Open on website");
    expect(result).toContain("Saved to your Spartan account");
  });

  it("uses an in app authentication session for calendar connections", () => {
    const workflow = read("app/sales-workflow.tsx");
    expect(workflow).toContain("WebBrowser.openAuthSessionAsync");
    expect(workflow).not.toContain("Linking.openURL(res.authorizationUrl)");
  });
});
