import colors from "../constants/colors";

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)) as Rgb;
}

function luminance(hex: string) {
  const [red, green, blue] = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("appearance contrast", () => {
  for (const mode of ["light", "dark", "mamba"] as const) {
    it(`${mode} keeps semantic text at readable contrast`, () => {
      const palette = colors[mode];
      const pairs = [
        [palette.foreground, palette.background],
        [palette.cardForeground, palette.card],
        [palette.primaryForeground, palette.primary],
        [palette.secondaryForeground, palette.secondary],
        [palette.mutedForeground, palette.background],
        [palette.accentForeground, palette.accent],
        [palette.destructiveForeground, palette.destructive],
        [palette.heroForeground, palette.heroBackground],
        [palette.heroMuted, palette.heroBackground],
        [palette.tabInactive, palette.tabBar],
      ];

      for (const [foreground, background] of pairs) {
        expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
      }

      const readableAccent = mode === "mamba" ? palette.accent : mode === "dark" ? palette.tint : palette.primary;
      expect(contrast(readableAccent, palette.background)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
