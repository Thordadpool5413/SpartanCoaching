import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Associated Domains contract", () => {
  it("publishes a valid AASA file for the production app", () => {
    const file = path.resolve(import.meta.dirname, "../../../spartan-coaching/public/.well-known/apple-app-site-association");
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(value.applinks.details[0].appIDs).toContain("65C25YHCX9.com.spartancoaching.fieldkit");
    expect(value.applinks.details[0].components).toContainEqual({ "/": "/coach*" });
    expect(value.applinks.details[0].components).toContainEqual({ "/": "/app*" });
  });

  it("keeps the API fallback JSON and cache headers explicit", () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, "routes.ts"), "utf8");
    expect(source).toContain("/.well-known/apple-app-site-association");
    expect(source).toContain("application/json");
    expect(source).toContain("65C25YHCX9.com.spartancoaching.fieldkit");
    expect(source).toContain('{ "/": "/app*" }');
  });
});
