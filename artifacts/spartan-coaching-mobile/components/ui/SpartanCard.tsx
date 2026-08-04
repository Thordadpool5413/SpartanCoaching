import React, { type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import { radius } from "@workspace/design-tokens";

export type CardVariant = "quiet" | "default" | "emphasis";

/**
 * Surface tiers (MASTER):
 * - quiet: dense lists / secondary — no rail, light border
 * - default: standard content — no rail
 * - emphasis: ONE mission card per viewport — rail + stronger border
 */
export function SpartanCard({
  children,
  style,
  emphasized,
  elevated,
  variant,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** @deprecated use variant="emphasis" */
  emphasized?: boolean;
  elevated?: boolean;
  variant?: CardVariant;
  testID?: string;
}) {
  const colors = useColors();
  const tier: CardVariant = variant ?? (emphasized ? "emphasis" : "default");
  const isEmphasis = tier === "emphasis";
  const isQuiet = tier === "quiet";

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: elevated
            ? colors.cardElevated ?? colors.card
            : isQuiet
              ? colors.card
              : colors.card,
          borderColor: isEmphasis ? colors.primary : colors.border,
          borderWidth: isEmphasis ? 1.5 : StyleSheet.hairlineWidth * 2,
          ...(Platform.OS === "ios"
            ? {
                shadowColor: isEmphasis ? colors.primary : "#000",
                shadowOpacity: isEmphasis ? 0.28 : isQuiet ? 0.12 : 0.22,
                shadowRadius: isEmphasis ? 16 : isQuiet ? 6 : 12,
                shadowOffset: { width: 0, height: isQuiet ? 2 : 6 },
              }
            : { elevation: isEmphasis ? 6 : isQuiet ? 1 : 3 }),
        },
        style,
      ]}
    >
      {isEmphasis ? (
        <View
          pointerEvents="none"
          style={[styles.topRail, { backgroundColor: colors.primary }]}
        />
      ) : null}
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
