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

  it("bakes the production API into private QA builds", () => {
    const eas = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../eas.json"), "utf8"),
    );

    expect(eas.build.preview.distribution).toBe("internal");
    expect(eas.build.preview.environment).toBe("production");
    expect(eas.build.preview.env.EXPO_PUBLIC_API_URL).toBe(
      "https://spartanhospicecoaching.com",
    );
    expect(eas.build.preview.env.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(eas.build["production-applinks"].env.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("0");
  });
});
