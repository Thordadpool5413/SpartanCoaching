/**
 * Spartan Field Kit visual tokens — shared by web and mobile.
 * Default surface: Midnight Navy (readable light text on deep navy).
 */

export const spartanDark = {
  text: "#f0f4fc",
  tint: "#e8291e",

  /** Midnight navy — matches web BG preset "midnight" */
  background: "#151e33",
  foreground: "#f0f4fc",

  card: "#1c2740",
  cardForeground: "#f0f4fc",

  primary: "#e8291e",
  primaryForeground: "#ffffff",

  secondary: "#243049",
  secondaryForeground: "#f0f4fc",

  muted: "#1f2a42",
  /** High-contrast secondary text (readable on navy) */
  mutedForeground: "rgba(226, 232, 245, 0.82)",

  accent: "#2a1020",
  accentForeground: "#f5b8b4",

  destructive: "#e8291e",
  destructiveForeground: "#ffffff",

  border: "rgba(200, 214, 240, 0.18)",
  input: "#1a2438",

  heroBackground: "#10182b",
  heroForeground: "#ffffff",
  heroMuted: "rgba(226, 232, 245, 0.75)",
  heroBadgeBg: "rgba(255,255,255,0.1)",
  heroBadgeBorder: "rgba(255,255,255,0.22)",
  heroBadgeText: "rgba(255,255,255,0.9)",

  success: "#4ade80",
  warning: "#fbbf24",
} as const;

/** Light marketing surfaces (web public); Field Kit prefers dark. */
export const spartanLight = {
  text: "#0f0f0f",
  tint: "#e8291e",

  background: "#fcfcfc",
  foreground: "#0f0f0f",

  card: "#ffffff",
  cardForeground: "#0a0a0a",

  primary: "#e8291e",
  primaryForeground: "#ffffff",

  secondary: "#ededed",
  secondaryForeground: "#1a1a1a",

  muted: "#f2f2f2",
  /** Stronger than 0.45 black so body copy stays legible on light cards */
  mutedForeground: "rgba(15, 23, 42, 0.72)",

  accent: "#fff5f5",
  accentForeground: "#b91c1c",

  destructive: "#e8291e",
  destructiveForeground: "#ffffff",

  border: "rgba(0,0,0,0.1)",
  input: "#e0e0e0",

  heroBackground: "#050505",
  heroForeground: "#ffffff",
  heroMuted: "rgba(255,255,255,0.6)",
  heroBadgeBg: "rgba(255,255,255,0.08)",
  heroBadgeBorder: "rgba(255,255,255,0.2)",
  heroBadgeText: "rgba(255,255,255,0.85)",

  success: "#16a34a",
  warning: "#d97706",
} as const;

export type SpartanColorPalette = typeof spartanDark;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Type roles for RN StyleSheet / web utility mapping */
export const typeScale = {
  kicker: { fontSize: 10, letterSpacing: 1.6, fontWeight: "700" as const, textTransform: "uppercase" as const },
  title: { fontSize: 28, fontWeight: "900" as const, letterSpacing: -0.4 },
  titleSm: { fontSize: 20, fontWeight: "800" as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "600" as const },
  button: { fontSize: 15, fontWeight: "700" as const },
} as const;

/** CSS custom property values (HSL components without hsl()) — Midnight Navy default */
export const cssDarkHsl = {
  background: "222 42% 14%",
  foreground: "214 35% 96%",
  card: "222 38% 18%",
  "card-foreground": "214 30% 96%",
  primary: "0 85% 58%",
  "primary-foreground": "0 0% 100%",
  muted: "222 32% 20%",
  "muted-foreground": "214 18% 78%",
  border: "222 26% 28%",
  input: "222 32% 18%",
  ring: "0 85% 58%",
} as const;
