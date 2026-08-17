import React from "react";
import { Image, StyleSheet, View, type ViewStyle } from "react-native";

type HelmetMarkProps = {
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * The supplied Spartan helmet is the only graphic brand mark used in app UI.
 * The source image intentionally stays untouched and is framed as a compact crest.
 */
export function HelmetMark({
  size = 52,
  style,
  accessibilityLabel = "Spartan Coaching helmet",
}: HelmetMarkProps) {
  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: Math.max(12, Math.round(size * 0.28)),
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={require("@/assets/images/logo.png")}
        resizeMode="contain"
        style={{ width: size * 1.42, height: size * 1.42 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
});
