import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";

export function LaunchExperience({ onComplete }: { onComplete: () => void }) {
  const { reduceMotion } = useAccessibilityPrefs();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.92)).current;
  const promiseOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 18,
        stiffness: 145,
        useNativeDriver: true,
      }),
      Animated.timing(promiseOpacity, {
        toValue: 1,
        duration: reduceMotion ? 1 : 340,
        delay: reduceMotion ? 0 : 180,
        useNativeDriver: true,
      }),
    ]);
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion ? 140 : 260,
      delay: reduceMotion ? 420 : 940,
      useNativeDriver: true,
    });

    Animated.sequence([intro, exit]).start(({ finished }) => {
      if (finished) onComplete();
    });

    return () => {
      intro.stop();
      exit.stop();
    };
  }, [onComplete, opacity, promiseOpacity, reduceMotion, scale]);

  return (
    <Animated.View style={[styles.root, { opacity }]} pointerEvents="auto" testID="launch-experience">
      <Animated.View style={[styles.identity, { transform: [{ scale }] }]}>
        <BrandStamp width={276} height={180} />
      </Animated.View>
      <Animated.View style={[styles.promiseBlock, { opacity: promiseOpacity }]}>
        <View style={styles.redRule} />
        <Text style={styles.promise}>KNOW THE NEXT MOVE</Text>
        <Text style={styles.subPromise}>Hospice sales preparation, practice, and follow through.</Text>
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
    backgroundColor: "#07111F",
    paddingHorizontal: 28,
  },
  identity: { alignItems: "center" },
  promiseBlock: { alignItems: "center", marginTop: 24 },
  redRule: { width: 38, height: 3, borderRadius: 2, backgroundColor: "#F0343C", marginBottom: 18 },
  promise: { color: "#FFFFFF", fontSize: 12, letterSpacing: 3.1, ...font("heavy") },
  subPromise: { color: "#AFC0D5", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 10, ...font("regular") },
});
