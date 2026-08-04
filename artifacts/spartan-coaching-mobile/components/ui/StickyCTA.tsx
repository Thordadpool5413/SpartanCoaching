import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { layout } from "@/lib/spacing";
import { SpartanButton } from "./SpartanButton";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

/**
 * Thumb-zone primary action bar (Generate / Subscribe / Save).
 */
export function StickyCTA({ title, onPress, loading, disabled, testID }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 10);

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: bottom,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      <SpartanButton
        title={title}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        testID={testID}
        style={{ minHeight: layout.stickyCtaHeight }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screenX,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
