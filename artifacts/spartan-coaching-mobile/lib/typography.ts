import { Platform, type TextStyle } from "react-native";

/**
 * Platform-native UI type stack.
 * iOS → SF Pro via system default (omit custom family, use fontWeight).
 * Android / web → Inter (loaded in root layout).
 */
export type FontWeight = "regular" | "medium" | "semibold" | "bold" | "heavy";

const INTER: Record<FontWeight, string> = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  heavy: "Inter_700Bold",
};

const WEIGHT: Record<FontWeight, NonNullable<TextStyle["fontWeight"]>> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
};

/** Spread into Text styles: `{ ...font("bold"), fontSize: 16 }`. */
export function font(weight: FontWeight = "regular"): TextStyle {
  if (Platform.OS === "ios") {
    return { fontWeight: WEIGHT[weight] };
  }
  return { fontFamily: INTER[weight], fontWeight: WEIGHT[weight] };
}
