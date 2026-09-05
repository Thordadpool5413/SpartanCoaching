import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { font } from "@/lib/typography";

const launchFilm = require("@/assets/videos/spartan-launch-film.mp4");

export function LaunchExperience({ onComplete }: { onComplete: () => void }) {
  const { reduceMotion } = useAccessibilityPrefs();
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

  const player = useVideoPlayer(launchFilm, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = false;
    videoPlayer.play();
  });

  useEffect(() => {
    if (reduceMotion) {
      const reducedMotionTimer = setTimeout(finish, 450);
      return () => clearTimeout(reducedMotionTimer);
    }

    const ended = player.addListener("playToEnd", finish);
    const status = player.addListener("statusChange", ({ status: nextStatus }) => {
      if (nextStatus === "error") finish();
    });
    const safetyTimer = setTimeout(finish, 12_000);

    return () => {
      ended.remove();
      status.remove();
      clearTimeout(safetyTimer);
    };
  }, [finish, player, reduceMotion]);

  return (
    <Animated.View
      accessibilityViewIsModal
      pointerEvents="auto"
      style={[styles.root, { opacity }]}
      testID="launch-experience"
    >
      <VideoView
        accessibilityLabel="Spartan Coaching introduction"
        allowsPictureInPicture={false}
        contentFit="contain"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Pressable
          accessibilityHint="Opens the app immediately"
          accessibilityLabel="Skip introduction"
          accessibilityRole="button"
          hitSlop={12}
          onPress={finish}
          style={({ pressed }) => [
            styles.skip,
            { top: insets.top + 10, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: "#FFFFFF",
  },
  skip: {
    position: "absolute",
    right: 18,
    minWidth: 62,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(7, 17, 31, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 1.4,
    ...font("bold"),
  },
});
