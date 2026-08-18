import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      <LinearGradient colors={["#07172D", "#102A49", "#071426"]} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.topRule} />
      <View style={styles.stageLabel}><Text style={styles.stageLabelText}>FIELD GUIDE</Text></View>
      <View style={styles.centerBlock}>
        <Animated.View style={[styles.identity, { transform: [{ scale }] }]}>
          <BrandStamp width={286} height={186} />
        </Animated.View>
        <Animated.View style={[styles.promiseBlock, { opacity: promiseOpacity }]}>
          <Text style={styles.promise}>PREPARE. PRACTICE. FOLLOW THROUGH.</Text>
          <Text style={styles.subPromise}>Know the next move before the conversation begins.</Text>
        </Animated.View>
      </View>
      <View style={styles.bottomSignal}><View style={styles.redRule} /><Text style={styles.bottomText}>SPARTAN COACHING</Text></View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: "#07172D",
    paddingHorizontal: 28,
    paddingTop: 74,
    paddingBottom: 44,
  },
  topRule: { position: "absolute", top: 0, left: 0, right: 0, height: 6, backgroundColor: "#C8102E" },
  stageLabel: { alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.26)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  stageLabelText: { color: "#CBD7E6", fontSize: 9, letterSpacing: 2.3, ...font("bold") },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%" },
  identity: { alignItems: "center" },
  promiseBlock: { alignItems: "center", marginTop: 18, maxWidth: 330 },
  promise: { color: "#FFFFFF", fontSize: 12, lineHeight: 19, textAlign: "center", letterSpacing: 2.2, ...font("heavy") },
  subPromise: { color: "#C0CDDD", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10, ...font("regular") },
  bottomSignal: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 10 },
  redRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: "#F0343C" },
  bottomText: { color: "#8FA4BC", fontSize: 9, letterSpacing: 2.1, ...font("bold") },
});
