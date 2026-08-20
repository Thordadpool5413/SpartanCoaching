import fs from "node:fs";
import path from "node:path";

describe("native tool boundary", () => {
  it("removes the legacy authenticated tool WebView bridge", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../app/tool-web.tsx"))).toBe(false);
  });

  it("routes catalog tools to owned native destinations", () => {
    const links = fs.readFileSync(path.resolve(__dirname, "../lib/toolDeepLinks.ts"), "utf8");
    expect(links).not.toContain("tool-web");
    expect(links).not.toContain("Linking.openURL");
    expect(links).toContain("openToolHref");
  });
});
