import fs from "node:fs";
import path from "node:path";

type BuildProfile = { env?: Record<string, string>; node?: string };

describe("iOS release associated-domains contract", () => {
  const easPath = path.resolve(__dirname, "../eas.json");
  const eas = JSON.parse(fs.readFileSync(easPath, "utf8")) as {
    build: Record<string, BuildProfile>;
  };
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"),
  ) as {
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const verifier = fs.readFileSync(
    path.resolve(__dirname, "../../../scripts/verify-testflight.sh"),
    "utf8",
  );
  const metroConfig = fs.readFileSync(
    path.resolve(__dirname, "../metro.config.js"),
    "utf8",
  );
  const easIgnore = fs.readFileSync(
    path.resolve(__dirname, "../../../.easignore"),
    "utf8",
  );

  it("keeps standard store builds compatible with profiles that lack Associated Domains", () => {
    expect(eas.build.testflight.env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(eas.build.production.env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(packageJson.scripts["build:ios:testflight"]).toContain(
      "--profile testflight",
    );
    expect(packageJson.scripts["build:ios:testflight"]).toContain(
      "--auto-submit-with-profile testflight",
    );
    expect(packageJson.scripts["submit:ios:testflight"]).toContain(
      "submit --platform ios --profile testflight --latest",
    );
    expect(packageJson.scripts["build:ios"]).toContain("--profile production");
  });

  it("keeps explicit no-applinks aliases for release operators", () => {
    expect(eas.build["testflight-no-applinks"].env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(eas.build["production-no-applinks"].env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("1");
    expect(packageJson.scripts["build:ios:testflight:no-applinks"]).toContain(
      "--profile testflight-no-applinks",
    );
  });

  it("only requests Universal Links through explicit applinks profiles", () => {
    expect(eas.build["testflight-applinks"].env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("0");
    expect(eas.build["production-applinks"].env?.EAS_SKIP_ASSOCIATED_DOMAINS).toBe("0");
    expect(packageJson.scripts["build:ios:testflight:with-applinks"]).toContain(
      "--profile testflight-applinks",
    );
    expect(packageJson.scripts["build:ios:with-applinks"]).toContain(
      "--profile production-applinks",
    );
  });

  it("verifies the actual EAS profile and rejects a checkout behind main", () => {
    expect(verifier).toContain("resolveProfile(profileName).env?.EAS_SKIP_ASSOCIATED_DOMAINS");
    expect(verifier).toContain("git rev-list --count HEAD..origin/main");
    expect(verifier).not.toContain('if [[ "$PROFILE" == *"-applinks" ]]');
    expect(verifier).toContain("/api/healthz/ai");
    expect(verifier).toContain('v.ok!==true || v.status!=="ready"');
  });

  it("uses one deterministic Metro and EAS runtime for store builds", () => {
    expect(eas.build.testflight.node).toBe("24.19.0");
    expect(eas.build.production.node).toBe("24.19.0");
    expect(metroConfig).toContain('require("expo/metro-config")');
    expect(metroConfig).not.toContain("watchFolders");
    expect(metroConfig).not.toContain("nodeModulesPaths");
    expect(verifier).toContain("expo export:embed");
    expect(packageJson.devDependencies["babel-preset-expo"]).toBe("~57.0.10");
    expect(fs.existsSync(path.resolve(__dirname, "../.easignore"))).toBe(false);
    expect(easIgnore).toContain("**/node_modules/");
    expect(easIgnore).toContain("attached_assets/");
  });
});
