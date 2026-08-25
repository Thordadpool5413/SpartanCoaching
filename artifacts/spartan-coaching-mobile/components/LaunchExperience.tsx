import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";

export function LaunchExperience({ onComplete }: { onComplete: () => void }) {
  const { reduceMotion } = useAccessibilityPrefs();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.78)).current;
  const ringScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.62)).current;
  const ringOpacity = useRef(new Animated.Value(reduceMotion ? 0.25 : 0)).current;
  const promiseOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 18,
        stiffness: 145,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1,
          damping: 19,
          stiffness: 110,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0.25,
          duration: reduceMotion ? 1 : 500,
          useNativeDriver: true,
        }),
      ]),
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
      delay: reduceMotion ? 520 : 1180,
      useNativeDriver: true,
    });

    Animated.sequence([intro, exit]).start(({ finished }) => {
      if (finished) onComplete();
    });

    return () => {
      intro.stop();
      exit.stop();
    };
  }, [onComplete, opacity, promiseOpacity, reduceMotion, ringOpacity, ringScale, scale]);

  return (
    <Animated.View style={[styles.root, { opacity }]} pointerEvents="auto" testID="launch-experience">
      <LinearGradient colors={["#07111F", "#0D2239", "#07111F"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.topSignal} />
      <View style={styles.stageLabel}><Text style={styles.stageLabelText}>THE FIELD GUIDE</Text></View>
      <View style={styles.centerBlock}>
        <Animated.View style={[styles.ringOuter, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.ringInner, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.identity, { transform: [{ scale }] }]}>
          <View style={styles.helmetGlow}><HelmetMark size={154} /></View>
          <Text style={styles.brandName}>SPARTAN COACHING</Text>
        </Animated.View>
        <Animated.View style={[styles.promiseBlock, { opacity: promiseOpacity }]}>
          <Text style={styles.promise}>PREPARE THE MOMENT.</Text>
          <Text style={styles.subPromise}>Walk in clear. Speak with purpose. Leave with the next move.</Text>
        </Animated.View>
      </View>
      <View style={styles.bottomSignal}><View style={styles.redRule} /><Text style={styles.bottomText}>DISCIPLINE  •  EMPATHY  •  STRATEGY</Text></View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: "#07111F",
    paddingHorizontal: 28,
    paddingTop: 74,
    paddingBottom: 44,
  },
  topSignal: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "#B6192A" },
  stageLabel: { alignSelf: "center", borderWidth: 1, borderColor: "rgba(250,247,241,0.24)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  stageLabelText: { color: "#CBD7E6", fontSize: 9, letterSpacing: 2.3, ...font("bold") },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%" },
  ringOuter: { position: "absolute", width: 292, height: 292, borderRadius: 146, borderWidth: 1, borderColor: "#F34D59" },
  ringInner: { position: "absolute", width: 228, height: 228, borderRadius: 114, borderWidth: 1, borderColor: "#FAF7F1" },
  identity: { alignItems: "center" },
  helmetGlow: { shadowColor: "#F34D59", shadowOpacity: 0.42, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  brandName: { color: "#FAF7F1", fontSize: 20, letterSpacing: 2.1, marginTop: 16, ...font("heavy") },
  promiseBlock: { alignItems: "center", marginTop: 36, maxWidth: 330 },
  promise: { color: "#F34D59", fontSize: 11, lineHeight: 18, textAlign: "center", letterSpacing: 2.5, ...font("heavy") },
  subPromise: { color: "#C6CDD6", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 10, ...font("regular") },
  bottomSignal: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 10 },
  redRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: "#F34D59" },
  bottomText: { color: "#8FA4BC", fontSize: 9, letterSpacing: 2.1, ...font("bold") },
});
