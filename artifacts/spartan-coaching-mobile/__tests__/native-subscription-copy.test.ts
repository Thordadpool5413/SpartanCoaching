import fs from "node:fs";
import path from "node:path";

describe("native iOS subscription messaging", () => {
  it("does not steer a locked iPhone member to Stripe", () => {
    const home = fs.readFileSync(
      path.resolve(__dirname, "../app/(tabs)/index.tsx"),
      "utf8",
    );

    expect(home).not.toContain("Subscribe with Stripe on the website");
    expect(home).toContain("subscribe securely with Apple");
    expect(home).toContain("Existing Apple purchases can be restored");
  });
});
