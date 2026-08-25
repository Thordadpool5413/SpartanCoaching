import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";

export function LaunchExperience({ onComplete }: { onComplete: () => void }) {
  const { reduceMotion } = useAccessibilityPrefs();

  const rootOpacity = useSharedValue(1);
  const helmetScale = useSharedValue(reduceMotion ? 1 : 0.7);
  const helmetOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const wordmarkOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const taglineOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const ringScale = useSharedValue(reduceMotion ? 1 : 0.6);
  const ringOpacity = useSharedValue(reduceMotion ? 0.25 : 0);
  const bottomOpacity = useSharedValue(reduceMotion ? 1 : 0);

  function finish() {
    onComplete();
  }

  useEffect(() => {
    if (reduceMotion) {
      const timer = setTimeout(finish, 600);
      return () => clearTimeout(timer);
    }

    helmetOpacity.value = withTiming(1, { duration: 300 });
    helmetScale.value = withSpring(1, { damping: 18, stiffness: 145 });

    ringOpacity.value = withTiming(0.25, { duration: 500 });
    ringScale.value = withSpring(1, { damping: 19, stiffness: 110 });

    wordmarkOpacity.value = withDelay(300, withTiming(1, { duration: 320 }));
    taglineOpacity.value = withDelay(580, withTiming(1, { duration: 380 }));
    bottomOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));

    rootOpacity.value = withDelay(
      1400,
      withSequence(
        withTiming(0, { duration: 280 })
      )
    );

    const exitTimer = setTimeout(finish, 1700);
    return () => clearTimeout(exitTimer);
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));
  const helmetStyle = useAnimatedStyle(() => ({
    opacity: helmetOpacity.value,
    transform: [{ scale: helmetScale.value }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const ringOuterStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const ringInnerStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomOpacity.value }));

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="auto" testID="launch-experience">
      <LinearGradient
        colors={["#07111F", "#0D2239", "#07111F"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topSignal} />
      <View style={styles.stageLabel}>
        <Text style={styles.stageLabelText}>THE FIELD GUIDE</Text>
      </View>
      <View style={styles.centerBlock}>
        <Animated.View style={[styles.ringOuter, ringOuterStyle]} />
        <Animated.View style={[styles.ringInner, ringInnerStyle]} />
        <Animated.View style={[styles.identity, helmetStyle]}>
          <View style={styles.helmetGlow}>
            <HelmetMark size={154} />
          </View>
          <Animated.Text style={[styles.brandName, wordmarkStyle]}>
            SPARTAN COACHING
          </Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.promiseBlock, taglineStyle]}>
          <Text style={styles.power}>Built for the ones who outwork everyone.</Text>
          <Text style={styles.promise}>PREPARE THE MOMENT.</Text>
          <Text style={styles.subPromise}>
            Walk in clear. Speak with purpose. Leave with the next move.
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.bottomSignal, bottomStyle]}>
        <View style={styles.redRule} />
        <Text style={styles.bottomText}>DISCIPLINE  •  EMPATHY  •  STRATEGY</Text>
      </Animated.View>
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
  topSignal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#B6192A",
  },
  stageLabel: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(250,247,241,0.24)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stageLabelText: {
    color: "#CBD7E6",
    fontSize: 9,
    letterSpacing: 2.3,
    ...font("bold"),
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  ringOuter: {
    position: "absolute",
    width: 292,
    height: 292,
    borderRadius: 146,
    borderWidth: 1,
    borderColor: "#F34D59",
  },
  ringInner: {
    position: "absolute",
    width: 228,
    height: 228,
    borderRadius: 114,
    borderWidth: 1,
    borderColor: "#FAF7F1",
  },
  identity: { alignItems: "center" },
  helmetGlow: {
    shadowColor: "#F34D59",
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  brandName: {
    color: "#FAF7F1",
    fontSize: 20,
    letterSpacing: 2.1,
    marginTop: 16,
    ...font("heavy"),
  },
  promiseBlock: {
    alignItems: "center",
    marginTop: 32,
    maxWidth: 330,
    gap: 6,
  },
  power: {
    color: "#FAF7F1",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
    ...font("heavy"),
  },
  promise: {
    color: "#F34D59",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    letterSpacing: 2.5,
    ...font("heavy"),
  },
  subPromise: {
    color: "#C6CDD6",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 6,
    ...font("regular"),
  },
  bottomSignal: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  redRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: "#F34D59" },
  bottomText: {
    color: "#8FA4BC",
    fontSize: 9,
    letterSpacing: 2.1,
    ...font("bold"),
  },
});
