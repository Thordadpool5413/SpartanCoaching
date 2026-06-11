import { DarkTheme, type Theme } from "@react-navigation/native";
import { Platform } from "react-native";

export const colors = {
  background: "#07111E",
  backgroundAlt: "#0C1728",
  surface: "#111E30",
  surfaceAlt: "#17273F",
  surfaceSoft: "rgba(255,255,255,0.06)",
  text: "#F6F8FB",
  muted: "#AAB6CB",
  border: "rgba(255,255,255,0.08)",
  accent: "#FF5A4F",
  accentWarm: "#F4B83A",
  accentCool: "#64C7FF",
  good: "#40D39A",
  warning: "#FFD166",
  danger: "#FF6B6B",
};

export const gradients = {
  hero: [colors.background, colors.backgroundAlt] as const,
  accent: [colors.accent, "#FF8960"] as const,
  soft: ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.02)"] as const,
  warm: [colors.accentWarm, "#FFD66E"] as const,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  card: Platform.select({
    ios: { boxShadow: "0 16px 36px rgba(0, 0, 0, 0.28)" },
    android: { elevation: 6 },
    default: {},
  }),
  inset: Platform.select({
    ios: { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" },
    android: {},
    default: {},
  }),
};

export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accentWarm,
  },
};

