import { Image } from "expo-image";
import React from "react";
import { type ImageStyle, type StyleProp } from "react-native";

type HelmetMarkProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * Transparent helmet mark used for compact native identity and navigation.
 * It must never be placed inside a black tile or cropped by a decorative shell.
 */
export function HelmetMark({
  size = 52,
  style,
  accessibilityLabel = "Spartan Coaching helmet",
}: HelmetMarkProps) {
  return (
    <Image
      source={require("@/assets/images/helmet-mark.png")}
      contentFit="contain"
      style={[{ width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
