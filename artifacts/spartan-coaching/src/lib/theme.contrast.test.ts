/**
 * Theme surface contract — every BG preset must keep high-contrast ink.
 * Phase E: expanded light-mode + primary-on-paper guards.
 */
import { describe, it, expect } from "vitest";
import {
  BG_PRESETS,
  ACCENT_PRESETS,
  getBgPreset,
  modeForBackground,
  type BgKey,
} from "./theme";

/** Parse HSL component string "H S% L%" → lightness 0–100 */
function lightness(hslComponents: string): number {
  const parts = hslComponents.trim().split(/\s+/);
  const L = parts[2]?.replace("%", "");
  const n = Number(L);
  if (!Number.isFinite(n)) throw new Error(`Bad HSL lightness: ${hslComponents}`);
  return n;
}

describe("BG_PRESETS contrast contract", () => {
  it("exports midnight as a dark preset", () => {
    const m = getBgPreset("midnight");
    expect(m.tone).toBe("dark");
    expect(lightness(m.bg)).toBeLessThan(30);
    expect(lightness(m.fg)).toBeGreaterThan(85);
  });

  it.each(BG_PRESETS.map((p) => [p.key, p] as const))(
    "preset %s: body text and card text contrast with their surfaces",
    (_key, preset) => {
      const bgL = lightness(preset.bg);
      const fgL = lightness(preset.fg);
      const cardL = lightness(preset.card);
      const cardFgL = lightness(preset.cardFg);
      const mutedFgL = lightness(preset.mutedFg);

      if (preset.tone === "dark") {
        // Dark surfaces: light ink
        expect(fgL - bgL).toBeGreaterThan(50);
        expect(cardFgL - cardL).toBeGreaterThan(45);
        expect(mutedFgL - bgL).toBeGreaterThan(35);
        expect(fgL).toBeGreaterThan(85);
        expect(mutedFgL).toBeGreaterThan(65);
      } else {
        // Light surfaces: dark ink
        expect(bgL - fgL).toBeGreaterThan(50);
        expect(cardL - cardFgL).toBeGreaterThan(45);
        expect(bgL - mutedFgL).toBeGreaterThan(40);
        expect(fgL).toBeLessThan(25);
        expect(mutedFgL).toBeLessThan(45);
      }
    },
  );

  it("all accent presets have light and dark primary strings", () => {
    for (const a of ACCENT_PRESETS) {
      expect(a.primaryLight.split(" ").length).toBeGreaterThanOrEqual(3);
      expect(a.primaryDark.split(" ").length).toBeGreaterThanOrEqual(3);
    }
  });

  it("defaultBgForMode-compatible keys exist", () => {
    const keys: BgKey[] = BG_PRESETS.map((p) => p.key);
    expect(keys).toContain("midnight");
    expect(keys).toContain("soft");
  });

  it("light marketing presets (soft/warm/cool) stay paper-bright", () => {
    for (const key of ["soft", "warm", "cool"] as const) {
      const p = getBgPreset(key);
      expect(p.tone).toBe("light");
      expect(modeForBackground(key)).toBe("light");
      expect(lightness(p.bg)).toBeGreaterThan(90);
      expect(lightness(p.card)).toBeGreaterThan(95);
      expect(lightness(p.border)).toBeLessThan(90);
    }
  });

  it("Spartan red primaryLight is dark enough for text on soft white", () => {
    const red = ACCENT_PRESETS.find((a) => a.key === "red")!;
    // ~48% L on paper needs to stay under ~55 for body-sized red labels
    expect(lightness(red.primaryLight)).toBeLessThan(55);
    expect(lightness(red.primaryLight)).toBeGreaterThan(35);
  });

  it("primaryDark stays vivid (not muddy) on midnight", () => {
    const red = ACCENT_PRESETS.find((a) => a.key === "red")!;
    expect(lightness(red.primaryDark)).toBeGreaterThan(50);
    expect(lightness(red.primaryDark)).toBeLessThan(70);
  });

  it("modeForBackground matches preset tone for every key", () => {
    for (const p of BG_PRESETS) {
      expect(modeForBackground(p.key)).toBe(p.tone);
    }
  });
});
