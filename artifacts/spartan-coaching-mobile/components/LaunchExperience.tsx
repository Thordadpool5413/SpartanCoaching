import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";
import { useColors } from "@/hooks/useColors";

const launchMark = require("@/assets/images/helmet-mark.png");

export function LaunchExperience({ onComplete }: { onComplete: () => void }) {
  const { reduceMotion } = useAccessibilityPrefs();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;
  const finishing = useRef(false);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;

    Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: true,
    }).start(onComplete);
  }, [onComplete, opacity, reduceMotion]);

  // Native media initialization is deliberately excluded from application
  // startup. A codec/player failure can terminate an iOS release before the
  // React error boundary mounts, producing the splash-loop crash seen in
  // TestFlight. The full brand film remains available after startup.
  useEffect(() => {
    const timer = setTimeout(finish, reduceMotion ? 450 : 1_250);
    return () => clearTimeout(timer);
  }, [finish, reduceMotion]);

  return (
    <Animated.View
      accessibilityViewIsModal
      pointerEvents="auto"
       style={[styles.root, { opacity, backgroundColor: colors.heroBackground }]}
      testID="launch-experience"
    >
      <View
        accessibilityLabel="Spartan Coaching introduction"
        accessible
        style={styles.brandStage}
      >
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={launchMark}
          style={styles.mark}
        />
        <Text style={[styles.brandTitle, { color: colors.heroForeground }]}>SPARTAN</Text>
        <Text style={[styles.brandSubtitle, { color: colors.heroMuted }]}>
          HOSPICE SALES PRO
        </Text>
      </View>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Pressable
          accessibilityHint="Opens the app immediately"
          accessibilityLabel="Skip introduction"
          accessibilityRole="button"
          hitSlop={12}
          onPress={finish}
          style={({ pressed }) => [
             styles.skip,
             { top: insets.top + 10, opacity: pressed ? 0.72 : 1, backgroundColor: colors.overlay, borderColor: colors.borderStrong },
          ]}
        >
           <Text style={[styles.skipText, { color: colors.heroForeground }]}>SKIP</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: "#07111F",
  },
  brandStage: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 112,
    height: 112,
  },
  brandTitle: {
    marginTop: 20,
    fontSize: 28,
    letterSpacing: 3,
    ...font("heavy"),
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 2.4,
    ...font("bold"),
  },
  skip: {
    position: "absolute",
    right: 18,
    minWidth: 62,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
     backgroundColor: "rgba(26, 26, 26, 0.88)",
    borderWidth: 1,
     borderColor: "rgba(212, 212, 212, 0.28)",
  },
  skipText: {
     color: "#D4D4D4",
    fontSize: 11,
    letterSpacing: 1.4,
    ...font("bold"),
  },
});
