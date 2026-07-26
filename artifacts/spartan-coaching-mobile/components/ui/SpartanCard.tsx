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
                shadowOpacity: emphasized ? 0.22 : 0.28,
                shadowRadius: emphasized ? 14 : 12,
                shadowOffset: { width: 0, height: 6 },
              }
            : { elevation: emphasized ? 6 : 3 }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 18,
  },
});
