import colors from "@/constants/colors";
import { useAppearancePreference } from "@/lib/AppearanceContext";

export function useColors() {
  const { preference, effectiveScheme } = useAppearancePreference();
  const palette = preference === "mamba" ? colors.mamba : effectiveScheme === "dark" ? colors.dark : colors.light;
  return {
    ...palette,
    radius: colors.radius,
    // Purple remains the Mamba surface/fill color; gold is the readable
    // foreground accent on dark and purple surfaces.
    readablePrimary: preference === "mamba" ? colors.mamba.accent : palette.primary,
  };
}
