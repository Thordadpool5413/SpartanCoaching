import { useColorScheme } from "react-native";
import colors from "@/constants/colors";
import { useAppearancePreference } from "@/lib/AppearanceContext";

export function useColors() {
  const scheme = useColorScheme();
  const { preference } = useAppearancePreference();
  const palette = preference === "mamba" ? colors.mamba : scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
