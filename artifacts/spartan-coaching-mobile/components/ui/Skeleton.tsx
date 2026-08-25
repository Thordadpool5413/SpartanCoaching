import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { radius } from "@/lib/spacing";
import { layout } from "@/lib/spacing";

type SkeletonProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width, height, borderRadius = radius.md, style }: SkeletonProps) {
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.4;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      false
    );
  }, [reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <Skeleton height={14} width="60%" borderRadius={6} />
      <Skeleton height={10} width="90%" borderRadius={6} style={{ marginTop: 10 }} />
      <Skeleton height={10} width="75%" borderRadius={6} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonListRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listRow, style]}>
      <Skeleton width={40} height={40} borderRadius={12} />
      <View style={styles.listRowText}>
        <Skeleton height={13} width="55%" borderRadius={5} />
        <Skeleton height={10} width="40%" borderRadius={5} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonAiResult({ style }: { style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View style={[{ gap: 14 }, style]}>
      <View style={[styles.aiSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.aiHeader}>
          <Skeleton width={36} height={36} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton height={8} width="40%" borderRadius={4} />
            <Skeleton height={14} width="70%" borderRadius={6} />
          </View>
        </View>
        <Skeleton height={10} width="100%" borderRadius={5} />
        <Skeleton height={10} width="88%" borderRadius={5} style={{ marginTop: 6 }} />
        <Skeleton height={10} width="72%" borderRadius={5} style={{ marginTop: 6 }} />
      </View>
      <View style={[styles.aiSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.aiHeader}>
          <Skeleton width={36} height={36} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton height={8} width="35%" borderRadius={4} />
            <Skeleton height={14} width="60%" borderRadius={6} />
          </View>
        </View>
        <Skeleton height={10} width="100%" borderRadius={5} />
        <Skeleton height={10} width="95%" borderRadius={5} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonToolCatalog({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ gap: layout.cardGap }, style]}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  listRowText: {
    flex: 1,
    gap: 6,
  },
  aiSection: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 10,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
});
