import Video from "expo-video";
import { View } from "react-native";

import { colors, radius, shadows } from "@/lib/theme";

type MediaPlayerProps = {
  uri?: string | null;
  title?: string;
};

export function MediaPlayer({ uri, title }: MediaPlayerProps) {
  if (!uri) return null;
  const lower = uri.toLowerCase();
  const isVideo = [".mp4", ".mov", ".m4v", ".webm", ".m3u8"].some((ext) => lower.includes(ext));
  if (!isVideo) return null;

  return (
    <View
      style={[
        {
          overflow: "hidden",
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.card as any,
      ]}
    >
      <Video
        source={{ uri }}
        paused={false}
        useNativeControls
        resizeMode="contain"
        style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.surface }}
        accessibilityLabel={title ?? "Video player"}
      />
    </View>
  );
}

