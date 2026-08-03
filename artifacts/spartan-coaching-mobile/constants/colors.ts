import { spartanDark, radius as tokenRadius, elevation } from "@workspace/design-tokens";

/**
 * Mobile color map — sourced from shared @workspace/design-tokens.
 * Hospice Sales Pro ships dark authority only (matches product feel).
 */
const darkAuthority = {
  text: spartanDark.text,
  tint: spartanDark.tint,
  background: spartanDark.background,
  foreground: spartanDark.foreground,
  card: spartanDark.card,
  cardElevated: spartanDark.cardElevated,
  cardForeground: spartanDark.cardForeground,
  primary: spartanDark.primary,
  primaryForeground: spartanDark.primaryForeground,
  primaryMuted: spartanDark.primaryMuted,
  secondary: spartanDark.secondary,
  secondaryForeground: spartanDark.secondaryForeground,
  muted: spartanDark.muted,
  mutedForeground: spartanDark.mutedForeground,
  accent: spartanDark.accent,
  accentForeground: spartanDark.accentForeground,
  destructive: spartanDark.destructive,
  destructiveForeground: spartanDark.destructiveForeground,
  border: spartanDark.border,
  borderStrong: spartanDark.borderStrong,
  input: spartanDark.input,
  heroBackground: spartanDark.heroBackground,
  heroForeground: spartanDark.heroForeground,
  heroMuted: spartanDark.heroMuted,
  heroBadgeBg: spartanDark.heroBadgeBg,
  heroBadgeBorder: spartanDark.heroBadgeBorder,
  heroBadgeText: spartanDark.heroBadgeText,
  success: spartanDark.success,
  warning: spartanDark.warning,
  tabBar: spartanDark.tabBar,
  tabInactive: spartanDark.tabInactive,
  overlay: spartanDark.overlay,
};

const colors = {
  light: darkAuthority,
  dark: darkAuthority,
  radius: tokenRadius.lg,
  elevation,
};

export default colors;
