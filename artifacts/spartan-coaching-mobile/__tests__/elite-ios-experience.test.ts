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
    expect(paletteSource).toContain('background: "#08090A"');
    expect(paletteSource).toContain('background: "#F5F5F2"');
    expect(appearanceSource).toContain('export type AppearancePreference = "system" | "light" | "dark"');
    expect(appearanceSource).toContain("Appearance.setColorScheme");
    expect(rootLayout).toContain("<AppearanceProvider>");
  });

  it("uses four primary destinations and keeps utility routes available", () => {
    const tabs = read("app/(tabs)/_layout.tsx");

    expect(tabs).toContain('title: "Today"');
    expect(tabs).toContain('title: "Coach"');
    expect(tabs).toContain('title: "Practice"');
    expect(tabs).toContain('title: "Library"');
    expect(tabs).toContain('name="command" options={{ href: null }}');
    expect(tabs).toContain('name="account" options={{ href: null }}');
  });

  it("keeps Coach private while making feedback and commitments functional", () => {
    const coach = read("app/(tabs)/coach.tsx");
    const api = read("lib/coachApi.ts");
    const today = read("app/(tabs)/index.tsx");

    expect(coach).toContain("Get private feedback");
    expect(coach).toContain('saveCoachMemory("commitment"');
    expect(coach).toContain("useAudioRecorder");
    expect(coach).toContain("transcribeAudio");
    expect(coach).toContain("canUseElite");
    expect(api).toContain('apiPost<{ item: CoachMemoryItem }>("/api/v1/coach/memory"');
    expect(today).toContain("card-private-coach-commitment");
    expect(today).toContain("listCoachMemory");
  });
});
