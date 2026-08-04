import React, { type ReactNode } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { layout } from "@/lib/spacing";
import { font } from "@/lib/typography";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  bottomExtra?: number;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Shared page shell — safe area + tab bar clearance + brand background.
 */
export function Screen({
  children,
  scroll = true,
  bottomExtra = 24,
  contentStyle,
  style,
  testID,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad =
    (Platform.OS === "web" ? 34 : insets.bottom) + layout.tabBarClearance + bottomExtra;

  if (!scroll) {
    return (
      <View
        testID={testID}
        style={[{ flex: 1, backgroundColor: colors.background, paddingTop: topPad }, style]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      testID={testID}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        { paddingTop: topPad + 12, paddingBottom: bottomPad, paddingHorizontal: layout.screenX },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.foreground, fontSize: 24, letterSpacing: -0.3 }, font("heavy")]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginTop: 4 },
              font("regular"),
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
});
