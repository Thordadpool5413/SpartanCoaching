/**
 * Spartan Field Kit visual tokens — shared by web and mobile.
 * Default surface: Midnight Navy (readable light text on deep navy).
 * Elite craft: layered elevation, disciplined type, restrained Spartan red.
 */

export const spartanDark = {
  text: "#f4f7fd",
  tint: "#ff2d20",

  /** Midnight navy — deeper command surface */
  background: "#070b14",
  foreground: "#f7f9fd",

  card: "#121a2c",
  cardElevated: "#1a2540",
  cardForeground: "#f7f9fd",

  primary: "#ff2d20",
  primaryForeground: "#ffffff",
  primaryMuted: "rgba(255, 45, 32, 0.16)",

  secondary: "#1e2a42",
  secondaryForeground: "#f4f7fd",

  muted: "#172033",
  /** High-contrast secondary text (readable on navy) */
  mutedForeground: "rgba(230, 236, 248, 0.82)",

  accent: "#2a1020",
  accentForeground: "#f5b8b4",

  destructive: "#ff2d20",
  destructiveForeground: "#ffffff",

  border: "rgba(200, 214, 240, 0.16)",
  borderStrong: "rgba(200, 214, 240, 0.28)",
  input: "#141c2e",

  heroBackground: "#050912",
  heroForeground: "#ffffff",
  heroMuted: "rgba(226, 232, 245, 0.74)",
  heroBadgeBg: "rgba(255,45,32,0.14)",
  heroBadgeBorder: "rgba(255,45,32,0.5)",
  heroBadgeText: "rgba(255,255,255,0.96)",

  success: "#4ade80",
  warning: "#fbbf24",

  /** Tab / chrome */
  tabBar: "#080d18",
  tabInactive: "rgba(226, 232, 245, 0.48)",
  overlay: "rgba(5, 8, 16, 0.82)",
} as const;

/** Light marketing surfaces (web public); Field Kit prefers dark. */
export const spartanLight = {
  text: "#0c1220",
  tint: "#e8291e",

  background: "#f7f8fb",
  foreground: "#0c1220",

  card: "#ffffff",
  cardElevated: "#ffffff",
  cardForeground: "#0a0f18",

  primary: "#d91f16",
  primaryForeground: "#ffffff",
  primaryMuted: "rgba(232, 41, 30, 0.1)",

  secondary: "#eef1f6",
  secondaryForeground: "#151b28",

  muted: "#eef1f6",
  mutedForeground: "rgba(15, 23, 42, 0.68)",

  accent: "#fff5f5",
  accentForeground: "#b91c1c",

  destructive: "#d91f16",
  destructiveForeground: "#ffffff",

  border: "rgba(15, 23, 42, 0.1)",
  borderStrong: "rgba(15, 23, 42, 0.16)",
  input: "#e4e8ef",

  heroBackground: "#0a0e16",
  heroForeground: "#ffffff",
  heroMuted: "rgba(255,255,255,0.65)",
  heroBadgeBg: "rgba(255,255,255,0.08)",
  heroBadgeBorder: "rgba(255,255,255,0.18)",
  heroBadgeText: "rgba(255,255,255,0.88)",

  success: "#16a34a",
  warning: "#d97706",

  tabBar: "#ffffff",
  tabInactive: "rgba(15, 23, 42, 0.5)",
  overlay: "rgba(8, 12, 22, 0.5)",
} as const;

export type SpartanColorPalette = typeof spartanDark;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 22,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 48,
} as const;

/** Soft elevation — authority without cheap drop shadows */
export const elevation = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.24), 0 0 0 1px rgba(200,214,240,0.06)",
  md: "0 8px 24px -8px rgba(0,0,0,0.45), 0 0 0 1px rgba(200,214,240,0.08)",
  lg: "0 18px 48px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,41,30,0.08)",
  glow: "0 0 0 1px rgba(232,41,30,0.22), 0 12px 40px -10px rgba(232,41,30,0.28)",
} as const;

/** Type roles for RN StyleSheet / web utility mapping */
export const typeScale = {
  kicker: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  title: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.6, lineHeight: 36 },
  titleSm: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 23 },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 0.1 },
  button: { fontSize: 15, fontWeight: "700" as const, letterSpacing: 0.15 },
} as const;

/** CSS custom property values (HSL components without hsl()) — Midnight Navy default */
export const cssDarkHsl = {
  background: "222 42% 12%",
  foreground: "214 40% 97%",
  card: "222 38% 16%",
  "card-foreground": "214 30% 96%",
  primary: "0 85% 58%",
  "primary-foreground": "0 0% 100%",
  muted: "222 32% 18%",
  "muted-foreground": "214 18% 76%",
  border: "222 26% 26%",
  input: "222 32% 16%",
  ring: "0 85% 58%",
} as const;
