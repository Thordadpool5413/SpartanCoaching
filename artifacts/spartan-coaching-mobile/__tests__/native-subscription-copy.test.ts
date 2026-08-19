import fs from "node:fs";
import path from "node:path";

describe("native iOS subscription messaging", () => {
  it("supports purchase before account creation and keeps restore in app", () => {
    const home = fs.readFileSync(
      path.resolve(__dirname, "../app/(tabs)/index.tsx"),
      "utf8",
    );
    const account = fs.readFileSync(
      path.resolve(__dirname, "../app/(tabs)/account.tsx"),
      "utf8",
    );
    const membership = fs.readFileSync(
      path.resolve(__dirname, "../app/membership.tsx"),
      "utf8",
    );
    const welcome = fs.readFileSync(
      path.resolve(__dirname, "../components/WelcomeExperience.tsx"),
      "utf8",
    );
    const appleActions = fs.readFileSync(
      path.resolve(__dirname, "../components/AppleSubscriptionActions.tsx"),
      "utf8",
    );

    expect(home).not.toContain("Subscribe with Stripe on the website");
    expect(welcome).toContain('open("/membership")');
    expect(account).toContain("AppleSubscriptionActions");
    expect(membership).toContain("<AppleSubscriptionActions");
    expect(membership).toContain("Payment happens through Apple before Spartan account creation");
    expect(membership).toContain("Apple confirmed your membership");
    expect(membership).toContain('router.push("/register" as any)');
    expect(appleActions).toContain("Subscribe with Apple");
    expect(appleActions).toContain("Restore Apple purchases");
  });
});
