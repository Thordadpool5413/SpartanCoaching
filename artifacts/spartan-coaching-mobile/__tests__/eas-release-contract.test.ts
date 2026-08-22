import fs from "node:fs";
import path from "node:path";

type BuildProfile = { env?: Record<string, string> };

describe("iOS release associated-domains contract", () => {
  const easPath = path.resolve(__dirname, "../eas.json");
  const eas = JSON.parse(fs.readFileSync(easPath, "utf8")) as {
    build: Record<string, BuildProfile>;
  };
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"),
  ) as { scripts: Record<string, string> };

  it("ships Universal Links in the standard TestFlight and production profiles", () => {
    expect(eas.build.testflight.env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("0");
    expect(eas.build.production.env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("0");
    expect(packageJson.scripts["build:ios:testflight"]).toContain(
      "--profile testflight",
    );
    expect(packageJson.scripts["build:ios"]).toContain("--profile production");
  });

  it("keeps an explicit emergency profile instead of silently weakening a release", () => {
    expect(eas.build["testflight-no-applinks"].env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(eas.build["production-no-applinks"].env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(packageJson.scripts["build:ios:testflight:no-applinks"]).toContain(
      "--profile testflight-no-applinks",
    );
  });
});