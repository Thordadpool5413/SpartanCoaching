import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export function LaunchExperience({ onComplete }: { onComplete: () => void }) {
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      const exit = Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        delay: 420,
        useNativeDriver: true,
      });
      exit.start(({ finished }) => {
        if (finished) onComplete();
      });
      return () => exit.stop();
    }

    const intro = Animated.spring(scale, {
      toValue: 1,
      damping: 18,
      stiffness: 150,
      useNativeDriver: true,
    });
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: 260,
      delay: 720,
      useNativeDriver: true,
    });
    Animated.sequence([intro, exit]).start(({ finished }) => {
      if (finished) onComplete();
    });
    return () => {
      intro.stop();
      exit.stop();
    };
  }, [onComplete, opacity, reduceMotion, scale]);

  return (
    <Animated.View
      style={[styles.root, { backgroundColor: colors.background, opacity }]}
      pointerEvents="auto"
      testID="launch-experience"
    >
      <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
        <View style={[styles.glow, { backgroundColor: colors.primaryMuted }]}>
          <HelmetMark size={112} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }, font("heavy")]}>SPARTAN COACHING</Text>
        <Text style={[styles.promise, { color: colors.mutedForeground }, font("medium")]}>Prepare with purpose.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    width: 144,
    height: 144,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 17, letterSpacing: 3.2, marginTop: 28 },
  promise: { fontSize: 14, marginTop: 9, letterSpacing: 0.2 },
});
