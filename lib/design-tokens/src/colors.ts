/**
 * Spartan Field Kit visual tokens — shared by web and mobile.
 * Dark Field Kit authority palette (primary red on near-black).
 */

export const spartanDark = {
  text: "#f5f5f5",
  tint: "#e8291e",

  background: "#0a0a0a",
  foreground: "#f5f5f5",

  card: "#111111",
  cardForeground: "#f0f0f0",

  primary: "#e8291e",
  primaryForeground: "#ffffff",

  secondary: "#1e1e1e",
  secondaryForeground: "#f5f5f5",

  muted: "#161616",
  mutedForeground: "rgba(255,255,255,0.45)",

  accent: "#2a0808",
  accentForeground: "#f5a5a2",

  destructive: "#e8291e",
  destructiveForeground: "#ffffff",

  border: "rgba(255,255,255,0.08)",
  input: "#1a1a1a",

  heroBackground: "#050505",
  heroForeground: "#ffffff",
  heroMuted: "rgba(255,255,255,0.6)",
  heroBadgeBg: "rgba(255,255,255,0.08)",
  heroBadgeBorder: "rgba(255,255,255,0.2)",
  heroBadgeText: "rgba(255,255,255,0.85)",

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
  mutedForeground: "rgba(0,0,0,0.45)",

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

/** CSS custom property values (HSL components without hsl()) for web dark Field Kit */
export const cssDarkHsl = {
  background: "0 0% 4%",
  foreground: "0 0% 96%",
  card: "0 0% 7%",
  "card-foreground": "0 0% 94%",
  primary: "0 85% 58%",
  "primary-foreground": "0 0% 100%",
  muted: "0 0% 9%",
  "muted-foreground": "0 0% 55%",
  border: "0 0% 16%",
  input: "0 0% 10%",
  ring: "0 85% 58%",
} as const;
