import { Image } from "expo-image";
import React from "react";
import { type ImageStyle, type StyleProp } from "react-native";

export function BrandStamp({
  width = 230,
  height = 132,
  style,
  accessibilityLabel = "Spartan Coaching",
}: {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Image
      source={require("@/assets/images/brand-stamp.png")}
      contentFit="contain"
      accessibilityLabel={accessibilityLabel}
      style={[{ width, height }, style]}
    />
  );
}
