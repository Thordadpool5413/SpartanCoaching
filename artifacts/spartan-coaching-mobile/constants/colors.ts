import { radius as tokenRadius, elevation } from "@workspace/design-tokens";

/**
 * Spartan Coaching mobile appearance.
 *
 * The app follows the iPhone system setting. Light and dark keep the same
 * mission hierarchy while using different surface and contrast decisions.
 */
const dark = {
  text: "#F8F3EA",
  tint: "#D52B32",
  background: "#0B0A09",
  foreground: "#F8F3EA",
  card: "#13110F",
  cardElevated: "#1C1815",
  cardForeground: "#F8F3EA",
  primary: "#D52B32",
  primaryForeground: "#FFFFFF",
  primaryMuted: "rgba(213, 43, 50, 0.16)",
  secondary: "#1C1815",
  secondaryForeground: "#F8F3EA",
  muted: "#1C1815",
  mutedForeground: "rgba(231, 224, 213, 0.72)",
  accent: "#2B1514",
  accentForeground: "#F4BBB8",
  destructive: "#D52B32",
  destructiveForeground: "#FFFFFF",
  border: "rgba(216, 208, 196, 0.16)",
  borderStrong: "rgba(216, 208, 196, 0.30)",
  input: "#171411",
  heroBackground: "#090807",
  heroForeground: "#FFFFFF",
  heroMuted: "rgba(248, 243, 234, 0.72)",
  heroBadgeBg: "rgba(213, 43, 50, 0.14)",
  heroBadgeBorder: "rgba(213, 43, 50, 0.52)",
  heroBadgeText: "#FFFFFF",
  success: "#3B8B65",
  warning: "#C6954B",
  tabBar: "rgba(11, 10, 9, 0.92)",
  tabInactive: "rgba(231, 224, 213, 0.56)",
  overlay: "rgba(8, 7, 6, 0.78)",
  mission: "#D52B32",
  time: "#C6954B",
  signal: "rgba(213, 43, 50, 0.30)",
  imageWash: "rgba(8, 7, 6, 0.32)",
};

const light = {
  text: "#171411",
  tint: "#9E2025",
  background: "#F3EFE7",
  foreground: "#171411",
  card: "#FBF8F2",
  cardElevated: "#FFFFFF",
  cardForeground: "#171411",
  primary: "#9E2025",
  primaryForeground: "#FFFFFF",
  primaryMuted: "rgba(158, 32, 37, 0.10)",
  secondary: "#E7E0D5",
  secondaryForeground: "#171411",
  muted: "#E7E0D5",
  mutedForeground: "rgba(58, 51, 44, 0.72)",
  accent: "#F6E9E6",
  accentForeground: "#8C1D22",
  destructive: "#9E2025",
  destructiveForeground: "#FFFFFF",
  border: "rgba(49, 43, 38, 0.14)",
  borderStrong: "rgba(49, 43, 38, 0.28)",
  input: "#FFFFFF",
  heroBackground: "#F3EFE7",
  heroForeground: "#171411",
  heroMuted: "rgba(58, 51, 44, 0.70)",
  heroBadgeBg: "rgba(158, 32, 37, 0.08)",
  heroBadgeBorder: "rgba(158, 32, 37, 0.30)",
  heroBadgeText: "#171411",
  success: "#2F7654",
  warning: "#9A6B2E",
  tabBar: "rgba(251, 248, 242, 0.94)",
  tabInactive: "rgba(58, 51, 44, 0.58)",
  overlay: "rgba(23, 20, 17, 0.42)",
  mission: "#9E2025",
  time: "#9A6B2E",
  signal: "rgba(158, 32, 37, 0.22)",
  imageWash: "rgba(243, 239, 231, 0.76)",
};

const colors = {
  light,
  dark,
  radius: tokenRadius.lg,
  elevation,
};

export default colors;
