import React, { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

export function SpartanCard({
  children,
  style,
  emphasized,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  emphasized?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: emphasized ? colors.primary : colors.border,
          borderWidth: emphasized ? 1.5 : 1,
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
    borderRadius: 12,
    padding: 16,
  },
});
