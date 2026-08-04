import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { layout, radius } from "@/lib/spacing";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Feather icon name */
  icon?: React.ComponentProps<typeof Feather>["name"];
  emphasized?: boolean;
  chevron?: boolean;
  testID?: string;
  trailing?: React.ReactNode;
};

/**
 * Quiet catalog / settings row — 44pt touch, one primary line + meta.
 */
export function ListRow({
  title,
  subtitle,
  onPress,
  icon,
  emphasized,
  chevron = true,
  testID,
  trailing,
}: Props) {
  const colors = useColors();

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (!onPress) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: emphasized ? colors.primary : colors.border,
          borderWidth: emphasized ? 1.5 : StyleSheet.hairlineWidth * 2,
          opacity: pressed && onPress ? 0.92 : 1,
          transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
        },
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.primaryMuted ?? "rgba(255,45,32,0.12)" },
          ]}
        >
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[{ color: colors.foreground, fontSize: 15 }, font("bold")]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 3, lineHeight: 16 }, font("regular")]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron && onPress ? (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.touchMin + 8,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
