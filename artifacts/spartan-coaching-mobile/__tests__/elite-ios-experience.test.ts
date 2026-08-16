import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("Elite iOS experience contract", () => {
  it("follows the system appearance with distinct light and dark palettes", () => {
    const config = require("../app.config.js");
    const paletteSource = read("constants/colors.ts");
    const appearanceSource = read("lib/AppearanceContext.tsx");
    const rootLayout = read("app/_layout.tsx");

    expect(config.expo.userInterfaceStyle).toBe("automatic");
    expect(paletteSource).toContain('const dark = {');
    expect(paletteSource).toContain('const light = {');
    expect(paletteSource).toContain('background: "#0B0A09"');
    expect(paletteSource).toContain('background: "#F3EFE7"');
    expect(appearanceSource).toContain('export type AppearancePreference = "system" | "light" | "dark"');
    expect(appearanceSource).toContain("Appearance.setColorScheme");
    expect(rootLayout).toContain("<AppearanceProvider>");
  });

  it("uses four primary destinations and keeps utility routes available", () => {
    const tabs = read("app/(tabs)/_layout.tsx");

    expect(tabs).toContain("<Label>Today</Label>");
    expect(tabs).toContain("<Label>Coach</Label>");
    expect(tabs).toContain("<Label>Practice</Label>");
    expect(tabs).toContain("<Label>Library</Label>");
    expect(tabs).toContain('name="command" hidden');
    expect(tabs).toContain('name="account" hidden');
  });

  it("keeps Coach private while making feedback and commitments functional", () => {
    const coach = read("app/(tabs)/coach.tsx");
    const api = read("lib/coachApi.ts");
    const today = read("app/(tabs)/index.tsx");

    expect(coach).toContain("Review with Coach");
    expect(coach).toContain('saveCoachMemory("commitment"');
    expect(coach).toContain("The rehearsal timer does not record audio");
    expect(api).toContain('apiPost<{ item: CoachMemoryItem }>("/api/v1/coach/memory"');
    expect(today).toContain("card-private-coach-commitment");
    expect(today).toContain("listCoachMemory");
  });
});
