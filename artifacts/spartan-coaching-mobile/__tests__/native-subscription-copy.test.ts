import fs from "node:fs";
import path from "node:path";

describe("native iOS subscription messaging", () => {
  it("keeps Apple purchase and restore actions inside Account", () => {
    const home = fs.readFileSync(
      path.resolve(__dirname, "../app/(tabs)/index.tsx"),
      "utf8",
    );
    const account = fs.readFileSync(
      path.resolve(__dirname, "../app/(tabs)/account.tsx"),
      "utf8",
    );
    const appleActions = fs.readFileSync(
      path.resolve(__dirname, "../components/AppleSubscriptionActions.tsx"),
      "utf8",
    );

    expect(home).not.toContain("Subscribe with Stripe on the website");
    expect(home).not.toContain("Subscribe with Apple");
    expect(account).toContain("AppleSubscriptionActions");
    expect(appleActions).toContain("Subscribe with Apple");
    expect(appleActions).toContain("Restore Apple purchases");
  });
});
