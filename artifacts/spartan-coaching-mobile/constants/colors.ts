import { radius as tokenRadius, elevation } from "@workspace/design-tokens";

/**
 * Spartan Coaching mobile appearance.
 *
 * The app follows the iPhone system setting. Light and dark keep the same
 * mission hierarchy while using different surface and contrast decisions.
 */
const dark = {
  text: "#F7F7F5",
  tint: "#F0343C",
  background: "#08090A",
  foreground: "#F7F7F5",
  card: "#111315",
  cardElevated: "#181B1E",
  cardForeground: "#F7F7F5",
  primary: "#F0343C",
  primaryForeground: "#FFFFFF",
  primaryMuted: "rgba(240, 52, 60, 0.14)",
  secondary: "#1A1D20",
  secondaryForeground: "#F7F7F5",
  muted: "#1A1D20",
  mutedForeground: "#A8ADB3",
  accent: "#251315",
  accentForeground: "#FFB5B8",
  destructive: "#FF5D63",
  destructiveForeground: "#FFFFFF",
  border: "rgba(255, 255, 255, 0.09)",
  borderStrong: "rgba(255, 255, 255, 0.18)",
  input: "#141619",
  heroBackground: "#08090A",
  heroForeground: "#FFFFFF",
  heroMuted: "#A8ADB3",
  heroBadgeBg: "rgba(240, 52, 60, 0.14)",
  heroBadgeBorder: "rgba(240, 52, 60, 0.46)",
  heroBadgeText: "#FFFFFF",
  success: "#55C795",
  warning: "#E2AD5B",
  tabBar: "rgba(12, 13, 15, 0.96)",
  tabInactive: "#777D84",
  overlay: "rgba(0, 0, 0, 0.76)",
  mission: "#F0343C",
  time: "#E2AD5B",
  signal: "rgba(240, 52, 60, 0.26)",
  imageWash: "rgba(8, 9, 10, 0.42)",
};

const light = {
  text: "#111315",
  tint: "#B52028",
  background: "#F5F5F2",
  foreground: "#111315",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  cardForeground: "#111315",
  primary: "#B52028",
  primaryForeground: "#FFFFFF",
  primaryMuted: "rgba(158, 32, 37, 0.10)",
  secondary: "#E9E9E5",
  secondaryForeground: "#111315",
  muted: "#E9E9E5",
  mutedForeground: "#666B70",
  accent: "#F8E9E9",
  accentForeground: "#941C23",
  destructive: "#B52028",
  destructiveForeground: "#FFFFFF",
  border: "rgba(17, 19, 21, 0.10)",
  borderStrong: "rgba(17, 19, 21, 0.20)",
  input: "#FFFFFF",
  heroBackground: "#111315",
  heroForeground: "#FFFFFF",
  heroMuted: "#C7C9CC",
  heroBadgeBg: "rgba(158, 32, 37, 0.08)",
  heroBadgeBorder: "rgba(158, 32, 37, 0.30)",
  heroBadgeText: "#941C23",
  success: "#2F7654",
  warning: "#9A6B2E",
  tabBar: "rgba(255, 255, 255, 0.96)",
  tabInactive: "#777D84",
  overlay: "rgba(23, 20, 17, 0.42)",
  mission: "#9E2025",
  time: "#9A6B2E",
  signal: "rgba(158, 32, 37, 0.22)",
  imageWash: "rgba(17, 19, 21, 0.52)",
};

const colors = {
  light,
  dark,
  radius: tokenRadius.lg,
  elevation,
};

export default colors;
