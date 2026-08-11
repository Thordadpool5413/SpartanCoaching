import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { SpartanButton } from "./SpartanButton";
import { radius } from "@/lib/spacing";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

type Props = {
  title: string;
  body?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  ctaTitle?: string;
  onCta?: () => void;
  testID?: string;
};

/**
 * Empty / offline-adjacent system state — not marketing chrome.
 */
export function EmptyState({ title, body, icon = "inbox", ctaTitle, onCta, testID }: Props) {
  const colors = useColors();
  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      accessibilityLabel={body ? `${title}. ${body}` : title}
      style={[
        styles.box,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryMuted ?? "rgba(255,45,32,0.12)" }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.foreground, fontSize: 17, marginTop: 14, textAlign: "center" }, font("bold")]}
      >
        {title}
      </Text>
      {body ? (
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[
            { color: colors.mutedForeground, fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 19 },
            font("regular"),
          ]}
        >
          {body}
        </Text>
      ) : null}
      {ctaTitle && onCta ? (
        <SpartanButton title={ctaTitle} onPress={onCta} style={{ marginTop: 16, alignSelf: "stretch" }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
