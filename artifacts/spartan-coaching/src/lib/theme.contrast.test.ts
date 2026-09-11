/**
 * Theme surface contract — every BG preset must keep high-contrast ink.
 * Phase E: expanded light-mode + primary-on-paper guards.
 */
import { describe, it, expect } from "vitest";
import {
  BG_PRESETS,
  ACCENT_PRESETS,
  MAMBA_COLORS,
  THEME_PRESETS,
  applyAppearance,
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
  it("exposes the complete Mamba Mentality palette as a named preset", () => {
    expect(THEME_PRESETS.find((preset) => preset.key === "mamba")?.label).toBe("Mamba Mentality");
    expect(MAMBA_COLORS).toEqual({
      purple: "#552583",
      gold: "#FDB927",
      black: "#1A1A1A",
      gray: "#6E6E6E",
      silver: "#D4D4D4",
    });
  });

  it("applies and persists the named Mamba preset across the document", () => {
    applyAppearance("dark", "gold", "charcoal", "mamba");

    expect(document.documentElement.dataset.themePreset).toBe("mamba");
    expect(document.documentElement.dataset.themeMode).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("42 98% 57%");
    expect(document.documentElement.style.getPropertyValue("--primary-foreground")).toBe("0 0% 10%");
    expect(document.documentElement.style.getPropertyValue("--secondary")).toBe("271 56% 28%");
    expect(document.documentElement.style.getPropertyValue("--secondary-foreground")).toBe("0 0% 96%");
    expect(document.documentElement.style.getPropertyValue("--mamba-purple")).toBe("#552583");
    expect(document.documentElement.style.getPropertyValue("--mamba-gold")).toBe("#FDB927");
    expect(localStorage.getItem("spartan_theme_preset")).toBe("mamba");
    expect(localStorage.getItem("spartan_theme")).toBe(JSON.stringify("dark"));
  });

  it("clears every Mamba-only variable when Spartan is restored", () => {
    applyAppearance("dark", "gold", "charcoal", "mamba");
    applyAppearance("dark", "red", "midnight", "spartan");

    const root = document.documentElement;
    expect(root.dataset.themePreset).toBe("spartan");
    expect(root.style.getPropertyValue("--primary")).toBe("357 82% 58%");
    expect(root.style.getPropertyValue("--background")).toBe("217 64% 7%");
    for (const variable of ["--mamba-purple", "--mamba-gold", "--mamba-black", "--mamba-silver"]) {
      expect(root.style.getPropertyValue(variable)).toBe("");
    }
  });

  it("survives Spartan → Mamba → Spartan and Mamba light → dark → light round trips", () => {
    applyAppearance("light", "red", "soft", "spartan");
    const spartanLight = document.documentElement.style.cssText;
    applyAppearance("light", "gold", "soft", "mamba");
    const mambaLight = document.documentElement.style.cssText;
    applyAppearance("dark", "gold", "charcoal", "mamba");
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("0 0% 8%");
    applyAppearance("light", "gold", "soft", "mamba");
    expect(document.documentElement.style.cssText).toBe(mambaLight);
    applyAppearance("light", "red", "soft", "spartan");
    expect(document.documentElement.style.cssText).toBe(spartanLight);
  });

  it("uses ink text on silver and light-gray Mamba surfaces", () => {
    applyAppearance("light", "gold", "soft", "mamba");

    const root = document.documentElement.style;
    expect(root.getPropertyValue("--background")).toBe("0 0% 96%");
    expect(root.getPropertyValue("--foreground")).toBe("0 0% 10%");
    expect(root.getPropertyValue("--card")).toBe("0 0% 100%");
    expect(root.getPropertyValue("--card-foreground")).toBe("0 0% 10%");
    expect(root.getPropertyValue("--muted")).toBe("0 0% 90%");
    expect(root.getPropertyValue("--muted-foreground")).toBe("0 0% 36%");
    expect(root.getPropertyValue("--sidebar")).toBe("0 0% 94%");
    expect(root.getPropertyValue("--sidebar-foreground")).toBe("0 0% 10%");
  });

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
