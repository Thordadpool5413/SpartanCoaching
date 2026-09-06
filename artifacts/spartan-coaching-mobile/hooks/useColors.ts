import colors from "@/constants/colors";
import { useAppearancePreference } from "@/lib/AppearanceContext";

export function useColors() {
  const { preference, effectiveScheme } = useAppearancePreference();
  const palette = preference === "mamba" ? colors.mamba : effectiveScheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
