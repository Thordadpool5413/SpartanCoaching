import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { SpartanButton } from "./SpartanButton";
import { radius } from "@/lib/spacing";

type Props = {
  title: string;
  body?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  ctaTitle?: string;
  onCta?: () => void;
  testID?: string;
};

export function EmptyState({ title, body, icon = "inbox", ctaTitle, onCta, testID }: Props) {
  const colors = useColors();
  return (
    <View
      testID={testID}
      style={[
        styles.box,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted ?? "rgba(255,45,32,0.12)" }]}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[{ color: colors.foreground, fontSize: 17, marginTop: 14, textAlign: "center" }, font("bold")]}>
        {title}
      </Text>
      {body ? (
        <Text
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
