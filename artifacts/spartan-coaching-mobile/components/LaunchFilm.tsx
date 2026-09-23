import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { StyleSheet, View } from "react-native";

const launchFilm = require("@/assets/videos/spartan-launch-film.mp4");

type LaunchFilmProps = {
  onComplete: () => void;
  onError: () => void;
};

/**
 * Kept in its own lazily loaded module so expo-video never participates in the
 * first recoverable React frame. LaunchExperience owns the static fallback and
 * the hard timeout that opens the app if native playback is unavailable.
 */
export default function LaunchFilm({ onComplete, onError }: LaunchFilmProps) {
  const player = useVideoPlayer(launchFilm, (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.play();
  });

  useEventListener(player, "playToEnd", onComplete);
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") onError();
  });

  return (
    <View pointerEvents="none" style={styles.stage} testID="launch-film">
      <VideoView
        accessibilityIgnoresInvertColors
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={styles.video}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
});
