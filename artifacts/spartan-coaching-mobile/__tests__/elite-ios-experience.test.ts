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
    expect(paletteSource).toContain('background: "#07111F"');
    expect(paletteSource).toContain('background: "#FCFAF6"');
    expect(paletteSource).not.toContain('background: "#171513"');
    expect(appearanceSource).toContain('export type AppearancePreference = "system" | "light" | "dark"');
    expect(appearanceSource).toContain("Appearance.setColorScheme");
    expect(rootLayout).toContain("<AppearanceProvider>");
  });

  it("uses five clear destinations and lets visitors understand the app before purchase", () => {
    const tabs = read("app/(tabs)/_layout.tsx");

    expect(tabs).toContain('title: "Home"');
    expect(tabs).toContain('title: "Coach"');
    expect(tabs).toContain('title: "Explore"');
    expect(tabs).toContain('title: "My Work"');
    expect(tabs).toContain('title: "Account"');
    expect(tabs).toContain('display: "flex"');
    expect(tabs).toContain('name="command" options={{ href: null }}');
  });

  it("provides a launch experience and native administrator hub", () => {
    const root = read("app/_layout.tsx");
    const admin = read("app/admin.tsx");
    const account = read("app/(tabs)/account.tsx");

    expect(root).toContain("<LaunchExperience");
    expect(root).toContain('name="admin"');
    expect(account).toContain('router.push("/admin" as any)');
    expect(admin).toContain("fetchPlatformAdminOverview");
    expect(admin).toContain("fetchOrganizationAdminOverview");
    expect(admin).toContain("inviteOrganizationMember");
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
    expect(today).toContain("Your current commitment");
    expect(today).toContain("listCoachMemory");
  });
});
