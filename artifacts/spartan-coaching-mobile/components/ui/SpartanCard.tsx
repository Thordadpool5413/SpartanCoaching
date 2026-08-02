import React, { type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import { radius } from "@workspace/design-tokens";

export function SpartanCard({
  children,
  style,
  emphasized,
  elevated,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  emphasized?: boolean;
  elevated?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.cardElevated ?? colors.card : colors.card,
          borderColor: emphasized ? colors.primary : colors.border,
          borderWidth: emphasized ? 1.5 : StyleSheet.hairlineWidth * 2,
          ...(Platform.OS === "ios"
            ? {
                shadowColor: emphasized ? colors.primary : "#000",
                shadowOpacity: emphasized ? 0.35 : 0.4,
                shadowRadius: emphasized ? 18 : 14,
                shadowOffset: { width: 0, height: 8 },
              }
            : { elevation: emphasized ? 8 : 4 }),
        },
        style,
      ]}
    >
      {/* Top command rail — elite signature */}
      <View
        pointerEvents="none"
        style={[
          styles.topRail,
          {
            backgroundColor: emphasized ? colors.primary : `${colors.primary}99`,
            opacity: emphasized ? 1 : 0.65,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 18,
    overflow: "hidden",
  },
  topRail: {
    position: "absolute",
    top: 0,
    left: "12%",
    right: "12%",
    height: 2,
    borderRadius: 999,
  },
});
