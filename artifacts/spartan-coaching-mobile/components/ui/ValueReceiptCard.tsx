import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { radius } from "@/lib/spacing";
import { fetchValueReceipt, type ValueReceipt } from "@/lib/api";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

/**
 * “This week” proof for subscribers / trial — justifies renew.
 */
export function ValueReceiptCard({ testID = "value-receipt-card" }: { testID?: string }) {
  const colors = useColors();
  const [data, setData] = useState<ValueReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      void fetchValueReceipt().then((r) => {
        if (!alive) return;
        setData(r);
        setLoading(false);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.primary, fontSize: 10, letterSpacing: 1.2 }, font("bold")]}
      >
        THIS WEEK · VALUE RECEIPT
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[{ color: colors.foreground, fontSize: 17, marginTop: 6 }, font("heavy")]}
      >
        What you used
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : (
        <View style={{ marginTop: 12, gap: 8 }}>
          {(data?.highlights ?? ["No activity yet — open Command or a tool"]).map((line) => (
            <View key={line} style={styles.row}>
              <Feather name="check-circle" size={14} color={colors.success || colors.primary} />
              <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                style={[{ color: colors.foreground, fontSize: 13, flex: 1, lineHeight: 18 }, font("regular")]}
              >
                {line}
              </Text>
            </View>
          ))}
          <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[
              { color: colors.mutedForeground, fontSize: 11, marginTop: 6, lineHeight: 15 },
              font("regular"),
            ]}
          >
            Last {data?.days ?? 7} days · same account on web and iPhone
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
});
