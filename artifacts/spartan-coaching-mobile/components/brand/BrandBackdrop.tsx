import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { tokens } from "@/src/design/tokens";

export function BrandBackdrop() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.shell}
      testID="brand-backdrop"
    >
      <Image
        source={require("@/assets/images/spartan-stamp.png")}
        contentFit="contain"
        accessibilityLabel=""
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { ...StyleSheet.absoluteFillObject, alignItems: "flex-end", overflow: "hidden" },
  image: {
    width: tokens.brandBackdrop.size,
    height: tokens.brandBackdrop.size,
    right: tokens.brandBackdrop.right,
    top: tokens.brandBackdrop.top,
    opacity: tokens.brandBackdrop.opacity,
  },
});
