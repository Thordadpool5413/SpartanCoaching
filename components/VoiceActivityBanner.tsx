import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useCoachSession } from "@/lib/CoachSessionContext";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";
import { haptics } from "@/lib/haptics";
import { MAX_FONT_SIZE_MULTIPLIER } from "@/lib/iosProductQuality";

function WaveBar({ delay, reduceMotion }: { delay: number; reduceMotion: boolean }) {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) {
      scaleY.value = 0.5;
      return;
    }
    scaleY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 + delay * 40 }),
        withTiming(0.2, { duration: 300 + delay * 40 })
      ),
      -1,
      true
    );
  }, [reduceMotion, delay, scaleY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return <Animated.View style={[styles.bar, animStyle]} />;
}

export function VoiceActivityBanner() {
  const { isVoiceActive } = useCoachSession();
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();

  if (!isVoiceActive) return null;

  return (
    <Pressable
      onPress={() => {
        haptics.tap(reduceMotion);
        router.push("/(tabs)/coach" as any);
      }}
      accessibilityRole="button"
      accessibilityLabel="Spartan Coach is listening. Tap to return."
      style={[styles.banner, { backgroundColor: colors.primary }]}
    >
      <View style={styles.waveform}>
        {[0, 1, 2, 3, 4].map((i) => (
          <WaveBar key={i} delay={i} reduceMotion={reduceMotion} />
        ))}
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[styles.label, { color: colors.primaryForeground }]}
      >
        Coach is listening
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[styles.cta, { color: colors.primaryForeground }]}
      >
        Tap to return →
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 20,
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  label: {
    flex: 1,
    fontSize: 12,
    ...font("semibold"),
  },
  cta: {
    fontSize: 11,
    opacity: 0.82,
    ...font("medium"),
  },
});
